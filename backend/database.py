"""
CardioTwin AI - SQLite Database & Persistence Layer
Digital Twin Challenge 2026 - Happiest Health
"""

import sqlite3
import os
import json
import pandas as pd
from datetime import datetime

DB_PATH = os.path.join("data", "cardiotwin.db")


def get_db_connection():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(force_reinit: bool = False):
    """
    Initialize SQLite schema and populate with synthetic baseline data if not already present.
    """
    if force_reinit and os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        age INTEGER,
        sex TEXT,
        bmi REAL,
        smoking_status TEXT,
        hypertension INTEGER,
        diabetes INTEGER,
        prior_cardiac_event INTEGER,
        baseline_systolic_bp INTEGER,
        baseline_diastolic_bp INTEGER,
        total_cholesterol_mg_dl REAL,
        hdl_mg_dl REAL,
        ldl_mg_dl REAL,
        fasting_glucose_mg_dl REAL,
        serum_creatinine_mg_dl REAL,
        egfr_ml_min REAL,
        data_provenance TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wearable_readings (
        reading_id TEXT PRIMARY KEY,
        patient_id TEXT,
        timestamp TEXT,
        hour_of_day INTEGER,
        heart_rate_bpm REAL,
        hrv_rmssd_ms REAL,
        sleep_hours REAL,
        sleep_quality_score REAL,
        steps_interval INTEGER,
        estimated_systolic_bp REAL,
        is_missing INTEGER,
        is_simulated INTEGER,
        created_at TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions_audit (
        prediction_id TEXT PRIMARY KEY,
        patient_id TEXT,
        reading_id TEXT,
        timestamp TEXT,
        rf_deterioration_prob REAL,
        lr_deterioration_prob REAL,
        risk_category TEXT,
        top_contributing_features TEXT,
        created_at TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_events (
        event_id TEXT PRIMARY KEY,
        patient_id TEXT,
        event_type TEXT,
        payload TEXT,
        timestamp TEXT
    )
    """)

    conn.commit()

    # Check if patients table is empty, seed from CSV
    cursor.execute("SELECT COUNT(*) FROM patients")
    pt_count = cursor.fetchone()[0]

    if pt_count == 0:
        seed_initial_data(conn)

    conn.close()


def seed_initial_data(conn):
    """
    Populate database from synthetic CSVs if available.
    """
    pts_file = os.path.join("data", "synthetic_patients.csv")
    wear_file = os.path.join("data", "synthetic_wearables.csv")

    if not os.path.exists(pts_file) or not os.path.exists(wear_file):
        from ml.synthetic_generator import generate_synthetic_patients, generate_synthetic_wearables
        df_pts = generate_synthetic_patients(50)
        df_wear = generate_synthetic_wearables(df_pts)
        df_pts.to_csv(pts_file, index=False)
        df_wear.to_csv(wear_file, index=False)
    else:
        df_pts = pd.read_csv(pts_file)
        df_wear = pd.read_csv(wear_file)

    cursor = conn.cursor()

    for _, row in df_pts.iterrows():
        cursor.execute("""
        INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(row["patient_id"]),
            int(row["age"]),
            str(row["sex"]),
            float(row["bmi"]),
            str(row["smoking_status"]),
            int(row["hypertension"]),
            int(row["diabetes"]),
            int(row["prior_cardiac_event"]),
            int(row["baseline_systolic_bp"]),
            int(row["baseline_diastolic_bp"]),
            float(row["total_cholesterol_mg_dl"]),
            float(row["hdl_mg_dl"]),
            float(row["ldl_mg_dl"]),
            float(row["fasting_glucose_mg_dl"]),
            float(row["serum_creatinine_mg_dl"]),
            float(row["egfr_ml_min"]),
            str(row["data_provenance"]),
            str(row["created_at"])
        ))

    for _, row in df_wear.iterrows():
        cursor.execute("""
        INSERT INTO wearable_readings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(row["reading_id"]),
            str(row["patient_id"]),
            str(row["timestamp"]),
            int(row["hour_of_day"]),
            float(row["heart_rate_bpm"]) if pd.notnull(row["heart_rate_bpm"]) else None,
            float(row["hrv_rmssd_ms"]) if pd.notnull(row["hrv_rmssd_ms"]) else None,
            float(row["sleep_hours"]) if pd.notnull(row["sleep_hours"]) else None,
            float(row["sleep_quality_score"]) if pd.notnull(row["sleep_quality_score"]) else None,
            int(row["steps_interval"]) if pd.notnull(row["steps_interval"]) else 0,
            float(row["estimated_systolic_bp"]) if pd.notnull(row["estimated_systolic_bp"]) else None,
            1 if row["is_missing"] else 0,
            1 if row["is_simulated"] else 0,
            datetime.now().isoformat()
        ))

    conn.commit()
    print(f"[OK] Seeded {len(df_pts)} patients and {len(df_wear)} wearable readings into SQLite.")
