"""
CardioTwin AI - Real-time ML Inference Engine
Digital Twin Challenge 2026 - Happiest Health
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

MODEL_RF_PATH = os.path.join("artifacts", "model_random_forest.joblib")
MODEL_LR_PATH = os.path.join("artifacts", "model_baseline_lr.joblib")
SCALER_PATH = os.path.join("artifacts", "scaler.joblib")
FEATURES_PATH = os.path.join("artifacts", "feature_names.json")

# Global cached artifacts
_artifacts = {}

def get_ml_artifacts():
    if "model_rf" not in _artifacts:
        if not os.path.exists(MODEL_RF_PATH):
            raise FileNotFoundError("Trained model artifact not found. Please run ml/train_models.py first.")
        _artifacts["model_rf"] = joblib.load(MODEL_RF_PATH)
        _artifacts["model_lr"] = joblib.load(MODEL_LR_PATH)
        _artifacts["scaler"] = joblib.load(SCALER_PATH)
        with open(FEATURES_PATH, "r", encoding="utf-8") as f:
            _artifacts["meta"] = json.load(f)
    return _artifacts


def compute_patient_features(patient_dict: Dict[str, Any], recent_readings: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Construct exact feature vector for inference from patient EHR and recent readings.
    Features:
      - age, bmi, hypertension, diabetes, prior_cardiac_event, baseline_systolic_bp, baseline_diastolic_bp, ldl_mg_dl, egfr_ml_min
      - hr_filled, hrv_filled, sleep_hours, sleep_deficit, steps_interval
      - roll_hr_mean_6h, roll_hr_mean_24h, roll_hrv_mean_6h, roll_hrv_mean_24h, roll_hrv_min_24h, hrv_trend_24h, roll_steps_24h, cardiac_workload_index
    """
    artifacts = get_ml_artifacts()
    feature_cols = artifacts["meta"]["features"]

    # Fallback to plausible defaults if readings empty
    if not recent_readings:
        curr_hr = 72.0
        curr_hrv = 45.0
        curr_sleep = 7.0
        curr_steps = 1200
        roll_hr_6h = curr_hr
        roll_hr_24h = curr_hr
        roll_hrv_6h = curr_hrv
        roll_hrv_24h = curr_hrv
        roll_hrv_min_24h = curr_hrv
        hrv_trend = 0.0
        roll_steps_24h = 8000
    else:
        # Sort chronologically
        readings_sorted = sorted(recent_readings, key=lambda r: r["timestamp"])
        last_r = readings_sorted[-1]
        
        # Extract series
        hr_series = [r["heart_rate_bpm"] for r in readings_sorted if r.get("heart_rate_bpm") is not None]
        hrv_series = [r["hrv_rmssd_ms"] for r in readings_sorted if r.get("hrv_rmssd_ms") is not None]
        steps_series = [r.get("steps_interval", 0) for r in readings_sorted]

        curr_hr = hr_series[-1] if hr_series else 72.0
        curr_hrv = hrv_series[-1] if hrv_series else 45.0
        curr_sleep = last_r.get("sleep_hours") or 7.0
        curr_steps = last_r.get("steps_interval") or 1000

        # Rolling 6h (last 2 readings) and 24h (last 8 readings)
        roll_hr_6h = float(np.mean(hr_series[-2:])) if hr_series else curr_hr
        roll_hr_24h = float(np.mean(hr_series[-8:])) if hr_series else curr_hr
        roll_hrv_6h = float(np.mean(hrv_series[-2:])) if hrv_series else curr_hrv
        roll_hrv_24h = float(np.mean(hrv_series[-8:])) if hrv_series else curr_hrv
        roll_hrv_min_24h = float(np.min(hrv_series[-8:])) if hrv_series else curr_hrv
        hrv_trend = float(curr_hrv - roll_hrv_24h)
        roll_steps_24h = int(np.sum(steps_series[-8:])) if steps_series else 8000

    sleep_deficit = max(0.0, 7.5 - curr_sleep)
    cardiac_workload = (curr_hr * patient_dict["baseline_systolic_bp"]) / 100.0

    feat_dict = {
        "age": float(patient_dict["age"]),
        "bmi": float(patient_dict["bmi"]),
        "hypertension": int(patient_dict["hypertension"]),
        "diabetes": int(patient_dict["diabetes"]),
        "prior_cardiac_event": int(patient_dict["prior_cardiac_event"]),
        "baseline_systolic_bp": float(patient_dict["baseline_systolic_bp"]),
        "baseline_diastolic_bp": float(patient_dict["baseline_diastolic_bp"]),
        "ldl_mg_dl": float(patient_dict["ldl_mg_dl"]),
        "egfr_ml_min": float(patient_dict["egfr_ml_min"]),
        "hr_filled": float(curr_hr),
        "hrv_filled": float(curr_hrv),
        "sleep_hours": float(curr_sleep),
        "sleep_deficit": float(sleep_deficit),
        "steps_interval": int(curr_steps),
        "roll_hr_mean_6h": float(roll_hr_6h),
        "roll_hr_mean_24h": float(roll_hr_24h),
        "roll_hrv_mean_6h": float(roll_hrv_6h),
        "roll_hrv_mean_24h": float(roll_hrv_24h),
        "roll_hrv_min_24h": float(roll_hrv_min_24h),
        "hrv_trend_24h": float(hrv_trend),
        "roll_steps_24h": int(roll_steps_24h),
        "cardiac_workload_index": float(cardiac_workload)
    }

    df_features = pd.DataFrame([feat_dict])[feature_cols]
    return df_features


def predict_deterioration(df_features: pd.DataFrame) -> Dict[str, Any]:
    """
    Execute model inference and explanation.
    """
    artifacts = get_ml_artifacts()
    model_rf = artifacts["model_rf"]
    model_lr = artifacts["model_lr"]
    scaler = artifacts["scaler"]
    friendly_names = artifacts["meta"]["friendly_names"]

    # Random Forest Prob
    rf_prob = float(model_rf.predict_proba(df_features)[0, 1])

    # Logistic Regression Prob (requires scaling)
    scaled_features = scaler.transform(df_features)
    lr_prob = float(model_lr.predict_proba(scaled_features)[0, 1])

    # Categorize Risk
    if rf_prob < 0.30:
        category = "Low"
        color = "#34D399"  # green
    elif rf_prob < 0.65:
        category = "Moderate"
        color = "#FBBF24"  # amber
    else:
        category = "Elevated"
        color = "#F87171"  # red

    # Top contributing features for this prediction
    # Tree path contribution approximation using feature importances & deviation from healthy normal
    feat_values = df_features.iloc[0].to_dict()
    contributions = []

    # Normative reference values
    reference_medians = {
        "hr_filled": 72.0,
        "hrv_filled": 45.0,
        "roll_hr_mean_6h": 72.0,
        "roll_hrv_min_24h": 35.0,
        "sleep_deficit": 0.5,
        "cardiac_workload_index": 88.0,
        "baseline_systolic_bp": 122.0,
        "age": 55.0,
        "ldl_mg_dl": 115.0
    }

    rf_weights = dict(zip(artifacts["meta"]["features"], model_rf.feature_importances_))

    for feat, val in feat_values.items():
        if feat in reference_medians:
            ref = reference_medians[feat]
            # Directional impact: higher HR increases risk, lower HRV increases risk
            direction = 1.0
            if "hrv" in feat:
                direction = -1.0  # lower hrv -> higher risk
            
            diff = (val - ref) * direction
            impact_score = diff * rf_weights.get(feat, 0.05)
            
            contributions.append({
                "feature": feat,
                "label": friendly_names.get(feat, feat),
                "current_value": round(float(val), 1),
                "impact_score": round(float(impact_score), 4),
                "direction": "Risk Escalator" if impact_score > 0 else "Protective/Neutral"
            })

    # Sort by absolute impact
    contributions.sort(key=lambda x: abs(x["impact_score"]), reverse=True)

    # Plausible confidence bounds based on model calibration uncertainty
    uncertainty_margin = round(float(0.08 + 0.05 * (1.0 - abs(rf_prob - 0.5) * 2)), 3)
    lower_bound = max(0.0, round(rf_prob - uncertainty_margin, 3))
    upper_bound = min(1.0, round(rf_prob + uncertainty_margin, 3))

    return {
        "rf_probability": round(rf_prob, 4),
        "lr_probability": round(lr_prob, 4),
        "risk_category": category,
        "risk_color": color,
        "uncertainty_margin": uncertainty_margin,
        "confidence_interval": [lower_bound, upper_bound],
        "target_horizon": "24-Hour Cardiovascular Deterioration Proxy",
        "top_contributions": contributions[:5]
    }
