"""
CardioTwin AI - FastAPI Backend Server
Digital Twin Challenge 2026 - Happiest Health
Organizer: Happiest Health
Author: Madabattula Tejo Hasini (Aditya University)
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.database import get_db_connection, init_db
from backend.inference import (
    compute_patient_features, 
    predict_deterioration, 
    get_ml_artifacts
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INIT] Initializing CardioTwin AI SQLite database...")
    init_db(force_reinit=False)
    # Warm up ML models
    try:
        get_ml_artifacts()
        print("[INIT] ML inference pipeline ready.")
    except Exception as e:
        print(f"[WARN] ML artifacts not yet loaded or need training: {e}")
    yield

app = FastAPI(
    title="CardioTwin AI - Healthcare Digital Twin API",
    description="Research prototype backend for cardiovascular digital twin simulation and 24-hour deterioration risk prediction.",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Schemas ---

class WearableReadingCreate(BaseModel):
    heart_rate_bpm: Optional[float] = Field(None, ge=30.0, le=220.0, description="Instantaneous heart rate in bpm")
    hrv_rmssd_ms: Optional[float] = Field(None, ge=2.0, le=250.0, description="HRV RMSSD in milliseconds")
    sleep_hours: Optional[float] = Field(None, ge=0.0, le=18.0, description="Nocturnal sleep duration in hours")
    sleep_quality_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Sleep quality score (0-100)")
    steps_interval: Optional[int] = Field(None, ge=0, le=50000, description="Steps during the 3h interval")
    estimated_systolic_bp: Optional[float] = Field(None, ge=60.0, le=250.0, description="Ambulatory systolic BP estimate in mmHg")
    is_simulated: bool = Field(True, description="Flag indicating simulated data")


class WhatIfSimulationRequest(BaseModel):
    patient_id: str
    target_hr: Optional[float] = Field(None, ge=40.0, le=180.0)
    target_hrv: Optional[float] = Field(None, ge=5.0, le=150.0)
    target_sleep: Optional[float] = Field(None, ge=2.0, le=12.0)
    target_systolic_bp: Optional[float] = Field(None, ge=80.0, le=220.0)


# --- Helper Database Functions ---

def fetch_patient_dict(conn, patient_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def fetch_recent_readings(conn, patient_id: str, limit: int = 40) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM wearable_readings 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (patient_id, limit))
    rows = cursor.fetchall()
    # Return chronologically ascending
    return [dict(r) for r in reversed(rows)]


def fetch_latest_prediction(conn, patient_id: str) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions_audit 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
    """, (patient_id,))
    row = cursor.fetchone()
    if row:
        res = dict(row)
        if res.get("top_contributing_features"):
            try:
                res["top_contributing_features"] = json.loads(res["top_contributing_features"])
            except Exception:
                pass
        return res
    return None


# --- API Routes ---

@app.get("/health", tags=["System"])
def health_check():
    """System health check and runtime status."""
    return {
        "status": "healthy",
        "service": "CardioTwin AI Backend",
        "environment": "research-prototype",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "disclaimer": "Academic research prototype. Not for clinical decision-making."
    }


@app.get("/api/patients", tags=["Patients"])
def list_patients():
    """List all synthetic patient digital twin summaries."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY patient_id ASC")
    rows = cursor.fetchall()

    patients_summary = []
    for r in rows:
        p_dict = dict(r)
        p_id = p_dict["patient_id"]
        
        # Latest reading
        cursor.execute("""
            SELECT heart_rate_bpm, hrv_rmssd_ms, estimated_systolic_bp, timestamp 
            FROM wearable_readings 
            WHERE patient_id = ? 
            ORDER BY timestamp DESC LIMIT 1
        """, (p_id,))
        latest_wear = cursor.fetchone()

        # Latest prediction
        latest_pred = fetch_latest_prediction(conn, p_id)
        
        # If no prediction recorded yet, compute on the fly
        if not latest_pred:
            readings = fetch_recent_readings(conn, p_id, limit=20)
            if readings:
                feat_df = compute_patient_features(p_dict, readings)
                pred_out = predict_deterioration(feat_df)
                latest_pred = {
                    "rf_deterioration_prob": pred_out["rf_probability"],
                    "lr_deterioration_prob": pred_out["lr_probability"],
                    "risk_category": pred_out["risk_category"],
                    "risk_color": pred_out["risk_color"],
                    "confidence_interval": pred_out["confidence_interval"]
                }

        patients_summary.append({
            "patient_id": p_id,
            "age": p_dict["age"],
            "sex": p_dict["sex"],
            "bmi": p_dict["bmi"],
            "hypertension": bool(p_dict["hypertension"]),
            "diabetes": bool(p_dict["diabetes"]),
            "prior_cardiac_event": bool(p_dict["prior_cardiac_event"]),
            "baseline_systolic_bp": p_dict["baseline_systolic_bp"],
            "latest_reading": dict(latest_wear) if latest_wear else None,
            "latest_prediction": latest_pred
        })

    conn.close()
    return {"count": len(patients_summary), "patients": patients_summary}


@app.get("/api/patients/{patient_id}", tags=["Patients"])
def get_patient_profile(patient_id: str):
    """Retrieve complete digital twin profile for a synthetic patient."""
    conn = get_db_connection()
    p_dict = fetch_patient_dict(conn, patient_id)
    if not p_dict:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    readings = fetch_recent_readings(conn, patient_id, limit=40)
    latest_pred = fetch_latest_prediction(conn, patient_id)

    if not latest_pred and readings:
        feat_df = compute_patient_features(p_dict, readings)
        pred_out = predict_deterioration(feat_df)
        latest_pred = {
            "prediction_id": f"PRED-INIT-{uuid.uuid4().hex[:8]}",
            "patient_id": patient_id,
            "reading_id": readings[-1]["reading_id"] if readings else "READ-INIT",
            "timestamp": readings[-1]["timestamp"] if readings else datetime.now().isoformat(),
            "rf_deterioration_prob": pred_out["rf_probability"],
            "lr_deterioration_prob": pred_out["lr_probability"],
            "risk_category": pred_out["risk_category"],
            "risk_color": pred_out["risk_color"],
            "confidence_interval": pred_out["confidence_interval"],
            "top_contributing_features": pred_out["top_contributions"]
        }

    conn.close()
    return {
        "patient": p_dict,
        "latest_prediction": latest_pred,
        "recent_readings_count": len(readings)
    }


@app.get("/api/patients/{patient_id}/ehr", tags=["Patients"])
def get_patient_ehr(patient_id: str):
    """Retrieve static EHR and baseline clinical measurements."""
    conn = get_db_connection()
    p_dict = fetch_patient_dict(conn, patient_id)
    conn.close()
    if not p_dict:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")
    return p_dict


@app.get("/api/patients/{patient_id}/wearables", tags=["Wearables"])
def get_patient_wearables(patient_id: str, limit: int = Query(60, ge=5, le=200)):
    """Retrieve chronological wearable time-series stream."""
    conn = get_db_connection()
    p_dict = fetch_patient_dict(conn, patient_id)
    if not p_dict:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    readings = fetch_recent_readings(conn, patient_id, limit=limit)
    conn.close()
    return {
        "patient_id": patient_id,
        "count": len(readings),
        "readings": readings
    }


@app.get("/api/patients/{patient_id}/predictions", tags=["Predictions"])
def get_patient_predictions(patient_id: str, limit: int = Query(25, ge=1, le=100)):
    """Retrieve chronological risk prediction audit trail."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions_audit 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (patient_id, limit))
    rows = cursor.fetchall()
    conn.close()

    predictions = []
    for r in reversed(rows):
        item = dict(r)
        if item.get("top_contributing_features"):
            try:
                item["top_contributing_features"] = json.loads(item["top_contributing_features"])
            except Exception:
                pass
        predictions.append(item)

    return {
        "patient_id": patient_id,
        "count": len(predictions),
        "predictions": predictions
    }


@app.post("/api/patients/{patient_id}/simulate-update", tags=["Simulation"])
def simulate_telemetry_update(patient_id: str, reading_in: Optional[WearableReadingCreate] = None):
    """
    Ingest a new wearable telemetry reading for a synthetic patient:
    1. Persist the reading in SQLite.
    2. Recompute rolling temporal features without future leakage.
    3. Run Random Forest and Baseline Logistic Regression inference.
    4. Save prediction to audit trail with timestamp.
    5. Return before-and-after scores and feature explanations.
    """
    conn = get_db_connection()
    p_dict = fetch_patient_dict(conn, patient_id)
    if not p_dict:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")

    # Prior prediction for before/after comparison
    prior_pred = fetch_latest_prediction(conn, patient_id)
    past_readings = fetch_recent_readings(conn, patient_id, limit=30)

    # Determine timestamp for new reading
    last_timestamp = datetime.fromisoformat(past_readings[-1]["timestamp"]) if past_readings else datetime.now()
    new_timestamp = (last_timestamp + timedelta(hours=3)).isoformat()
    new_hour = (last_timestamp + timedelta(hours=3)).hour

    # Auto-generate physiologically correlated values if not fully supplied
    if reading_in is None or reading_in.heart_rate_bpm is None:
        last_hr = past_readings[-1].get("heart_rate_bpm", 72.0) if past_readings else 72.0
        last_hrv = past_readings[-1].get("hrv_rmssd_ms", 45.0) if past_readings else 45.0
        # Simulated perturbation
        hr_val = round(float(last_hr + (12.0 if p_dict["hypertension"] else 4.0)), 1)
        hrv_val = round(max(10.0, float(last_hrv - 8.0)), 1)
        sleep_val = past_readings[-1].get("sleep_hours", 6.8) if past_readings else 6.8
        sleep_qual = past_readings[-1].get("sleep_quality_score", 75.0) if past_readings else 75.0
        steps_val = 1450
        sbp_val = round(float(p_dict["baseline_systolic_bp"] + (hr_val - 70) * 0.3), 1)
    else:
        hr_val = reading_in.heart_rate_bpm
        hrv_val = reading_in.hrv_rmssd_ms
        sleep_val = reading_in.sleep_hours or 7.0
        sleep_qual = reading_in.sleep_quality_score or 75.0
        steps_val = reading_in.steps_interval or 1200
        sbp_val = reading_in.estimated_systolic_bp or round(float(p_dict["baseline_systolic_bp"] + 4.0), 1)

    new_reading_id = f"READ-SIM-{uuid.uuid4().hex[:8]}"

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO wearable_readings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_reading_id,
        patient_id,
        new_timestamp,
        new_hour,
        hr_val,
        hrv_val,
        sleep_val,
        sleep_qual,
        steps_val,
        sbp_val,
        0,  # is_missing
        1,  # is_simulated
        datetime.now().isoformat()
    ))

    # Re-fetch updated readings including the newly inserted one
    updated_readings = past_readings + [{
        "reading_id": new_reading_id,
        "patient_id": patient_id,
        "timestamp": new_timestamp,
        "hour_of_day": new_hour,
        "heart_rate_bpm": hr_val,
        "hrv_rmssd_ms": hrv_val,
        "sleep_hours": sleep_val,
        "sleep_quality_score": sleep_qual,
        "steps_interval": steps_val,
        "estimated_systolic_bp": sbp_val,
        "is_missing": 0,
        "is_simulated": 1
    }]

    # Recompute features and run ML inference
    df_features = compute_patient_features(p_dict, updated_readings)
    pred_result = predict_deterioration(df_features)

    # Save to predictions_audit
    pred_id = f"PRED-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO predictions_audit VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        pred_id,
        patient_id,
        new_reading_id,
        new_timestamp,
        pred_result["rf_probability"],
        pred_result["lr_probability"],
        pred_result["risk_category"],
        json.dumps(pred_result["top_contributions"]),
        datetime.now().isoformat()
    ))

    # Record simulation event
    event_id = f"EVT-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO simulation_events VALUES (?, ?, ?, ?, ?)
    """, (
        event_id,
        patient_id,
        "TELEMETRY_UPDATE_INFERENCE",
        json.dumps({"reading_id": new_reading_id, "rf_prob": pred_result["rf_probability"]}),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    before_score = prior_pred["rf_deterioration_prob"] if prior_pred else pred_result["rf_probability"]
    after_score = pred_result["rf_probability"]
    score_delta = round(after_score - before_score, 4)

    return {
        "status": "success",
        "patient_id": patient_id,
        "new_reading": {
            "reading_id": new_reading_id,
            "timestamp": new_timestamp,
            "heart_rate_bpm": hr_val,
            "hrv_rmssd_ms": hrv_val,
            "sleep_hours": sleep_val,
            "estimated_systolic_bp": sbp_val,
            "steps_interval": steps_val
        },
        "comparison": {
            "before_score": before_score,
            "after_score": after_score,
            "delta": score_delta,
            "trend": "Escalated" if score_delta > 0.02 else ("Decreased" if score_delta < -0.02 else "Stable")
        },
        "updated_prediction": {
            "prediction_id": pred_id,
            "timestamp": new_timestamp,
            "rf_deterioration_prob": pred_result["rf_probability"],
            "lr_deterioration_prob": pred_result["lr_probability"],
            "risk_category": pred_result["risk_category"],
            "risk_color": pred_result["risk_color"],
            "confidence_interval": pred_result["confidence_interval"],
            "top_contributing_features": pred_result["top_contributions"]
        }
    }


@app.post("/api/simulation/what-if", tags=["Simulation"])
def simulate_what_if_scenario(req: WhatIfSimulationRequest):
    """
    Counterfactual 'What-If' Simulation:
    Evaluates how hypothetical interventions or physiological shifts (e.g. lowering BP,
    increasing sleep, recovering HRV) immediately impact the virtual twin's deterioration risk.
    Does not modify database persistence.
    """
    conn = get_db_connection()
    p_dict = fetch_patient_dict(conn, req.patient_id)
    if not p_dict:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient {req.patient_id} not found.")

    readings = fetch_recent_readings(conn, req.patient_id, limit=30)
    conn.close()

    # Baseline prediction before intervention
    baseline_df = compute_patient_features(p_dict, readings)
    baseline_pred = predict_deterioration(baseline_df)

    # Clone recent readings and modify the latest hypothetical reading
    modified_readings = [dict(r) for r in readings]
    if modified_readings:
        last_r = modified_readings[-1]
        if req.target_hr is not None:
            last_r["heart_rate_bpm"] = req.target_hr
        if req.target_hrv is not None:
            last_r["hrv_rmssd_ms"] = req.target_hrv
        if req.target_sleep is not None:
            last_r["sleep_hours"] = req.target_sleep
        if req.target_systolic_bp is not None:
            last_r["estimated_systolic_bp"] = req.target_systolic_bp

    # Compute counterfactual features
    counterfactual_df = compute_patient_features(p_dict, modified_readings)
    counterfactual_pred = predict_deterioration(counterfactual_df)

    diff = round(counterfactual_pred["rf_probability"] - baseline_pred["rf_probability"], 4)

    return {
        "patient_id": req.patient_id,
        "baseline": {
            "rf_probability": baseline_pred["rf_probability"],
            "risk_category": baseline_pred["risk_category"]
        },
        "counterfactual": {
            "rf_probability": counterfactual_pred["rf_probability"],
            "risk_category": counterfactual_pred["risk_category"],
            "confidence_interval": counterfactual_pred["confidence_interval"]
        },
        "impact": {
            "risk_difference": diff,
            "direction": "Risk Escalation" if diff > 0.01 else ("Risk Mitigation" if diff < -0.01 else "Neutral"),
            "clinical_interpretation": (
                "Hypothetical parasympathetic recovery and pressure reduction substantially mitigates 24h deterioration probability."
                if diff < -0.05 else (
                    "Autonomic strain or sleep debt significantly elevates short-term vulnerability."
                    if diff > 0.05 else "Perturbation yielded minimal change within model tolerance."
                )
            )
        }
    }


@app.post("/api/simulation/reset", tags=["Simulation"])
def reset_simulation():
    """Reset database and restore pristine synthetic baseline state."""
    init_db(force_reinit=True)
    return {
        "status": "success",
        "message": "Simulation database cleanly reset to default synthetic baseline.",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/evaluation", tags=["Evaluation"])
def get_model_evaluation_metrics():
    """Retrieve genuine evaluated model metrics, calibration scores, and comparison tables."""
    report_path = os.path.join("artifacts", "evaluation_report.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Model evaluation report not found. Please train models first.")

    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Include provenance and limitation disclosure
    data["disclosures"] = {
        "synthetic_label_disclaimer": "Ground truth outcome was synthesized using clinical rule assumptions over a 24h horizon. It does not represent real medical emergencies.",
        "calibration_status": "Brier score and reliability curves evaluated on 10 held-out synthetic patients with zero patient-level overlap.",
        "evaluation_protocol": "Patient-grouped holdout (GroupShuffleSplit). No cross-patient observation leakage."
    }
    return data
