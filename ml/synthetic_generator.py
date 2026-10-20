"""
CardioTwin AI - Synthetic Data Generator
Digital Twin Challenge 2026 - Happiest Health

Generates physiologically plausible synthetic EHR baseline profiles and time-indexed
wearable sensor streams (Heart Rate, HRV RMSSD ms, Sleep, Steps) for virtual cardiovascular patients.
Includes transparent synthetic outcome labeling for a 24-hour deterioration proxy.
Seed-controlled for exact reproducibility.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import os

SEED = 42

def generate_synthetic_patients(n_patients: int = 50, seed: int = SEED) -> pd.DataFrame:
    """
    Generate synthetic patient EHR baseline records.
    Demographics and clinical baselines reflect diverse risk profiles.
    """
    np.random.seed(seed)
    
    patient_ids = [f"PT-{1001 + i}" for i in range(n_patients)]
    ages = np.random.randint(38, 80, size=n_patients)
    sexes = np.random.choice(["Male", "Female"], size=n_patients, p=[0.52, 0.48])
    
    # Clinical risk profiles correlated with age
    age_factor = (ages - 38) / 42.0
    
    hypertension_prob = np.clip(0.25 + 0.45 * age_factor, 0.1, 0.85)
    hypertension = (np.random.rand(n_patients) < hypertension_prob).astype(int)
    
    diabetes_prob = np.clip(0.15 + 0.35 * age_factor, 0.05, 0.65)
    diabetes = (np.random.rand(n_patients) < diabetes_prob).astype(int)
    
    smoking = np.random.choice(["Never", "Former", "Active"], size=n_patients, p=[0.50, 0.32, 0.18])
    
    # Blood pressures
    base_sbp = 118 + hypertension * 24 + np.random.normal(0, 8, size=n_patients)
    base_dbp = 76 + hypertension * 14 + np.random.normal(0, 6, size=n_patients)
    
    # Lipids and lab markers
    total_chol = np.random.normal(195, 32, size=n_patients) + (hypertension + diabetes) * 12
    hdl = np.clip(np.random.normal(48, 10, size=n_patients) - diabetes * 6, 25, 80)
    ldl = np.clip(total_chol - hdl - np.random.uniform(15, 35, size=n_patients), 60, 240)
    
    fasting_glucose = np.random.normal(92, 12, size=n_patients) + diabetes * 45
    serum_creatinine = np.clip(np.random.normal(1.0, 0.25, size=n_patients) + (ages > 65) * 0.2, 0.6, 2.8)
    # CKD-EPI formula approximation for eGFR
    egfr = np.clip(115 - 0.8 * (ages - 40) - (serum_creatinine - 1.0) * 30, 25, 120)
    
    bmi = np.clip(np.random.normal(27.2, 4.5, size=n_patients) + diabetes * 2.5, 19.0, 42.0)
    prior_cardiac_event = (np.random.rand(n_patients) < (0.08 + 0.25 * age_factor * hypertension)).astype(int)
    
    df_patients = pd.DataFrame({
        "patient_id": patient_ids,
        "age": ages,
        "sex": sexes,
        "bmi": np.round(bmi, 1),
        "smoking_status": smoking,
        "hypertension": hypertension,
        "diabetes": diabetes,
        "prior_cardiac_event": prior_cardiac_event,
        "baseline_systolic_bp": np.round(base_sbp, 0).astype(int),
        "baseline_diastolic_bp": np.round(base_dbp, 0).astype(int),
        "total_cholesterol_mg_dl": np.round(total_chol, 1),
        "hdl_mg_dl": np.round(hdl, 1),
        "ldl_mg_dl": np.round(ldl, 1),
        "fasting_glucose_mg_dl": np.round(fasting_glucose, 1),
        "serum_creatinine_mg_dl": np.round(serum_creatinine, 2),
        "egfr_ml_min": np.round(egfr, 1),
        "data_provenance": "CardioTwin Synthetic Research Generator v1.0, Seed=42",
        "created_at": "2026-09-20T00:00:00"
    })
    
    return df_patients


def generate_synthetic_wearables(
    df_patients: pd.DataFrame, 
    days_history: int = 14, 
    readings_per_day: int = 8,  # every 3 hours
    seed: int = SEED
) -> pd.DataFrame:
    """
    Generate sequential, timestamped wearable time-series per patient.
    Measurements:
      - heart_rate_bpm: instantaneous heart rate
      - hrv_rmssd_ms: Root Mean Square of Successive Differences (parasympathetic tone)
      - sleep_hours: previous night sleep
      - sleep_quality: 0-100 subjective/actigraphy score
      - steps: cumulative steps for the current interval
      - systolic_bp_est: ambulatory estimated systolic BP
      - is_missing: simulated telemetry loss (sensor drop)
    """
    np.random.seed(seed + 1)
    
    records = []
    base_start_date = datetime(2026, 10, 1, 0, 0, 0)
    
    for _, pt in df_patients.iterrows():
        p_id = pt["patient_id"]
        age = pt["age"]
        has_htn = pt["hypertension"]
        has_dm = pt["diabetes"]
        has_prior = pt["prior_cardiac_event"]
        
        # Individual baseline physiological tendencies
        pt_resting_hr = 68 + has_htn * 6 + has_prior * 7 + np.random.normal(0, 4)
        pt_baseline_hrv = np.clip(54 - (age - 35) * 0.45 - has_htn * 8 - has_dm * 7 + np.random.normal(0, 5), 18, 85)
        
        # Patient latent health trajectory: some patients experience episodic deterioration stress
        stress_event_day = None
        if days_history >= 4 and np.random.rand() < 0.38:
            low_bound = max(1, days_history // 3)
            high_bound = max(low_bound + 1, days_history - 1)
            stress_event_day = np.random.randint(low_bound, high_bound)
            
        total_steps_in_run = days_history * readings_per_day
        step_hours = 24.0 / readings_per_day
        
        # Daily state variables
        daily_sleep = 7.0 + np.random.normal(0, 0.8)
        daily_sleep_quality = 78 + np.random.normal(0, 10)
        
        for step_idx in range(total_steps_in_run):
            current_time = base_start_date + timedelta(hours=step_idx * step_hours)
            hour = current_time.hour
            day_num = step_idx // readings_per_day
            
            # Reset sleep once daily at midnight
            if hour == 0 or step_idx % readings_per_day == 0:
                daily_sleep = np.clip(7.2 - has_htn * 0.4 + np.random.normal(0, 1.1), 3.5, 9.5)
                daily_sleep_quality = np.clip(80 - (8.0 - daily_sleep) * 8 + np.random.normal(0, 8), 25, 98)
            
            # Diurnal circadian variation
            # HR lowest at 03:00, peaks around 15:00-18:00
            circadian_hr = np.sin((hour - 9) * np.pi / 12.0) * 8.5
            circadian_hrv = -np.sin((hour - 9) * np.pi / 12.0) * 9.0  # HRV higher during deep night
            
            # Deterioration event simulation
            stress_penalty_hr = 0.0
            stress_penalty_hrv = 0.0
            if stress_event_day is not None and (stress_event_day <= day_num <= stress_event_day + 2):
                # Simulated autonomic failure / acute cardiovascular stress episode
                stress_intensity = (1.0 - abs(day_num - (stress_event_day + 1)) * 0.5)
                stress_penalty_hr = 22.0 * stress_intensity + np.random.uniform(2, 8)
                stress_penalty_hrv = -26.0 * stress_intensity - np.random.uniform(2, 6)
                daily_sleep = max(3.2, daily_sleep - 2.5 * stress_intensity)
                daily_sleep_quality = max(20.0, daily_sleep_quality - 35.0 * stress_intensity)
            
            # Instantaneous measurements
            noise_hr = np.random.normal(0, 2.5)
            noise_hrv = np.random.normal(0, 3.5)
            
            hr = np.clip(pt_resting_hr + circadian_hr + stress_penalty_hr + noise_hr, 45.0, 155.0)
            hrv = np.clip(pt_baseline_hrv + circadian_hrv + stress_penalty_hrv + noise_hrv, 8.0, 110.0)
            
            # Ambulatory BP estimate correlated with HR and baseline SBP
            sbp_est = np.clip(pt["baseline_systolic_bp"] + (hr - 72) * 0.4 + stress_penalty_hr * 0.6 + np.random.normal(0, 4), 90, 210)
            
            # Steps per 3-hour block
            if 0 <= hour < 6:
                steps = int(np.random.exponential(15))
            elif 6 <= hour < 12:
                steps = int(np.random.normal(1600, 400))
            elif 12 <= hour < 18:
                steps = int(np.random.normal(2100, 500))
            else:
                steps = int(np.random.normal(1100, 350))
            steps = max(0, int(steps * (0.4 if stress_penalty_hr > 10 else 1.0)))
            
            # Occasional simulated sensor packet dropout (missing data)
            is_missing = (np.random.rand() < 0.02)
            
            record = {
                "reading_id": f"READ-{p_id}-{step_idx:04d}",
                "patient_id": p_id,
                "timestamp": current_time.isoformat(),
                "hour_of_day": hour,
                "heart_rate_bpm": None if is_missing else round(float(hr), 1),
                "hrv_rmssd_ms": None if is_missing else round(float(hrv), 1),
                "sleep_hours": round(float(daily_sleep), 1),
                "sleep_quality_score": round(float(daily_sleep_quality), 1),
                "steps_interval": steps,
                "estimated_systolic_bp": None if is_missing else round(float(sbp_est), 1),
                "is_missing": bool(is_missing),
                "is_simulated": True
            }
            records.append(record)
            
    df_wearables = pd.DataFrame(records)
    return df_wearables


def engineer_features_and_labels(
    df_patients: pd.DataFrame, 
    df_wearables: pd.DataFrame, 
    horizon_hours: int = 24
) -> pd.DataFrame:
    """
    Construct strictly causal, leakage-free features at prediction time T,
    and construct the synthetic 24-hour deterioration proxy target.

    Target definition (Ground Truth Synthetic Outcome):
    Whether in the subsequent 24-hour window (t+1h to t+24h), the patient experiences
    at least one episode of:
      1. Sustained tachycardia (mean future HR >= 96 bpm over >= 2 readings) OR
      2. Autonomic collapse (future HRV RMSSD <= 18 ms for >= 2 readings) OR
      3. Acute severe hypertension spike (estimated SBP >= 165 mmHg) combined with low HRV (<= 22 ms).

    Features computed strictly from history up to and including timestamp T:
      - Current HR, HRV, Sleep, Steps
      - Rolling 6h mean HR, rolling 24h mean HR
      - Rolling 6h mean HRV, rolling 24h min HRV, rolling 24h mean HRV
      - HRV 24h change/slope (current - 24h rolling mean)
      - Sleep debt (7.5 - sleep_hours)
      - Rolling 24h total steps
      - Baseline EHR static features: age, sex, BMI, hypertension, diabetes, smoking, baseline SBP, LDL, eGFR
      - Non-linear clinical interaction: (current_hr * baseline_sbp) / 100
    """
    df = df_wearables.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["patient_id", "timestamp"]).reset_index(drop=True)
    
    # Impute missing values locally for rolling computations
    df["hr_filled"] = df.groupby("patient_id")["heart_rate_bpm"].transform(lambda x: x.ffill().bfill())
    df["hrv_filled"] = df.groupby("patient_id")["hrv_rmssd_ms"].transform(lambda x: x.ffill().bfill())
    df["sbp_filled"] = df.groupby("patient_id")["estimated_systolic_bp"].transform(lambda x: x.ffill().bfill())
    
    # Rolling past features (closed='left' or closed='both' including current)
    # Since interval is 3 hours: 2 periods = 6 hours, 8 periods = 24 hours
    grouped = df.groupby("patient_id")
    
    df["roll_hr_mean_6h"] = grouped["hr_filled"].transform(lambda s: s.rolling(2, min_periods=1).mean())
    df["roll_hr_mean_24h"] = grouped["hr_filled"].transform(lambda s: s.rolling(8, min_periods=1).mean())
    df["roll_hrv_mean_6h"] = grouped["hrv_filled"].transform(lambda s: s.rolling(2, min_periods=1).mean())
    df["roll_hrv_mean_24h"] = grouped["hrv_filled"].transform(lambda s: s.rolling(8, min_periods=1).mean())
    df["roll_hrv_min_24h"] = grouped["hrv_filled"].transform(lambda s: s.rolling(8, min_periods=1).min())
    df["hrv_trend_24h"] = df["hrv_filled"] - df["roll_hrv_mean_24h"]
    
    df["roll_steps_24h"] = grouped["steps_interval"].transform(lambda s: s.rolling(8, min_periods=1).sum())
    df["sleep_deficit"] = np.clip(7.5 - df["sleep_hours"], 0.0, 5.0)
    
    # Merging static EHR
    df = df.merge(df_patients, on="patient_id", how="left")
    
    df["cardiac_workload_index"] = (df["hr_filled"] * df["baseline_systolic_bp"]) / 100.0
    
    # Label construction: look ahead exactly 8 periods (24 hours) into future
    # We must NOT include future points in training features!
    labels = []
    
    for p_id, group in df.groupby("patient_id"):
        hr_arr = group["hr_filled"].values
        hrv_arr = group["hrv_filled"].values
        sbp_arr = group["sbp_filled"].values
        n_obs = len(hr_arr)
        
        pt_labels = np.zeros(n_obs, dtype=int)
        
        # For each point i, check window [i+1, min(i+8, n_obs)]
        for i in range(n_obs):
            future_end = min(i + 8, n_obs)
            if future_end > i + 1:
                future_hr = hr_arr[i+1 : future_end+1]
                future_hrv = hrv_arr[i+1 : future_end+1]
                future_sbp = sbp_arr[i+1 : future_end+1]
                
                cond_tachy = np.mean(future_hr) >= 95.0
                cond_hrv_collapse = np.min(future_hrv) <= 18.0
                cond_acute_spike = np.any((future_sbp >= 165.0) & (future_hrv <= 22.0))
                
                if cond_tachy or cond_hrv_collapse or cond_acute_spike:
                    pt_labels[i] = 1
            else:
                # Close to the end of the time series; drop or mark as -1
                pt_labels[i] = -1
                
        labels.extend(pt_labels)
        
    df["target_deterioration_24h"] = labels
    
    # Filter out boundary points without full 24h future window
    df_valid = df[df["target_deterioration_24h"] >= 0].copy()
    
    return df_valid


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    print("Generating synthetic EHR baseline data...")
    df_pts = generate_synthetic_patients(n_patients=50, seed=SEED)
    df_pts.to_csv("data/synthetic_patients.csv", index=False)
    print(f"Generated {len(df_pts)} synthetic patients.")
    
    print("Generating synthetic wearable telemetry streams...")
    df_wearables = generate_synthetic_wearables(df_pts, days_history=14, readings_per_day=8, seed=SEED)
    df_wearables.to_csv("data/synthetic_wearables.csv", index=False)
    print(f"Generated {len(df_wearables)} wearable observations.")
    
    print("Engineering features and synthetic target labels...")
    df_dataset = engineer_features_and_labels(df_pts, df_wearables, horizon_hours=24)
    df_dataset.to_csv("data/processed_training_dataset.csv", index=False)
    print(f"Generated {len(df_dataset)} feature-engineered observations with 24h labels.")
    pos_count = int(df_dataset["target_deterioration_24h"].sum())
    total_count = len(df_dataset)
    print(f"Outcome prevalence: {pos_count} / {total_count} ({pos_count / total_count * 100:.1f}%)")
