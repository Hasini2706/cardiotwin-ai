"""
CardioTwin AI - Backend & Machine Learning Test Suite
Digital Twin Challenge 2026 - Happiest Health
"""

import os
import json
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import init_db, get_db_connection
from ml.synthetic_generator import (
    generate_synthetic_patients, 
    generate_synthetic_wearables, 
    engineer_features_and_labels
)
from backend.inference import get_ml_artifacts, compute_patient_features, predict_deterioration

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Ensure database and artifacts are initialized for tests."""
    init_db(force_reinit=False)
    yield


def test_synthetic_data_schema_and_reproducibility():
    """Verify synthetic generator generates reproducible schemas and ranges."""
    df_pts1 = generate_synthetic_patients(10, seed=42)
    df_pts2 = generate_synthetic_patients(10, seed=42)
    
    assert len(df_pts1) == 10
    pd.testing.assert_frame_equal(df_pts1, df_pts2)
    
    # Range validations
    assert (df_pts1["age"] >= 35).all() and (df_pts1["age"] <= 85).all()
    assert (df_pts1["baseline_systolic_bp"] >= 80).all() and (df_pts1["baseline_systolic_bp"] <= 240).all()
    assert set(df_pts1["sex"].unique()).issubset({"Male", "Female"})


def test_wearable_generation_and_leakage_free_engineering():
    """Verify feature engineering produces expected rolling columns without future leakage."""
    df_pts = generate_synthetic_patients(5, seed=123)
    df_wearables = generate_synthetic_wearables(df_pts, days_history=3, readings_per_day=8, seed=123)
    
    assert len(df_wearables) == 5 * 3 * 8
    df_features = engineer_features_and_labels(df_pts, df_wearables, horizon_hours=24)
    
    assert "target_deterioration_24h" in df_features.columns
    assert "roll_hr_mean_6h" in df_features.columns
    assert "roll_hrv_mean_24h" in df_features.columns
    assert (df_features["roll_steps_24h"] >= 0).all()


def test_ml_artifacts_loaded():
    """Verify trained model artifacts exist and are loadable."""
    artifacts = get_ml_artifacts()
    assert "model_rf" in artifacts
    assert "model_lr" in artifacts
    assert "scaler" in artifacts
    assert "meta" in artifacts
    assert len(artifacts["meta"]["features"]) == 22


def test_api_health_endpoint():
    """Test GET /health returns 200 OK and valid metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data


def test_api_patients_list():
    """Test GET /api/patients returns patient summaries."""
    response = client.get("/api/patients")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0
    first_pt = data["patients"][0]
    assert "patient_id" in first_pt
    assert "baseline_systolic_bp" in first_pt


def test_api_patient_detail():
    """Test GET /api/patients/{patient_id} returns detailed digital twin."""
    response = client.get("/api/patients/PT-1001")
    assert response.status_code == 200
    data = response.json()
    assert data["patient"]["patient_id"] == "PT-1001"
    assert "latest_prediction" in data


def test_api_patient_wearables_stream():
    """Test GET /api/patients/{patient_id}/wearables returns time series."""
    response = client.get("/api/patients/PT-1001/wearables?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "PT-1001"
    assert len(data["readings"]) <= 20
    assert "heart_rate_bpm" in data["readings"][0]


def test_api_simulate_update_and_persistence():
    """Test POST /api/patients/{patient_id}/simulate-update stores reading and produces prediction."""
    payload = {
        "heart_rate_bpm": 108.5,
        "hrv_rmssd_ms": 14.2,
        "sleep_hours": 4.0,
        "sleep_quality_score": 42.0,
        "steps_interval": 320,
        "estimated_systolic_bp": 158.0
    }
    response = client.post("/api/patients/PT-1001/simulate-update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["new_reading"]["heart_rate_bpm"] == 108.5
    assert "comparison" in data
    assert "updated_prediction" in data
    assert data["updated_prediction"]["rf_deterioration_prob"] >= 0.0


def test_api_what_if_counterfactual():
    """Test POST /api/simulation/what-if returns hypothetical risk differences."""
    payload = {
        "patient_id": "PT-1001",
        "target_hr": 64.0,
        "target_hrv": 68.0,
        "target_sleep": 8.5,
        "target_systolic_bp": 115.0
    }
    response = client.post("/api/simulation/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "counterfactual" in data
    assert "impact" in data


def test_api_model_evaluation_metrics():
    """Test GET /api/evaluation returns genuine metrics."""
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "Random Forest (Comparison)" in data["models"]
    assert "Logistic Regression (Baseline)" in data["models"]
    rf = data["models"]["Random Forest (Comparison)"]
    assert rf["roc_auc"] > 0.70
    assert "confusion_matrix" in rf
    assert "feature_importances" in data


def test_simulation_reset():
    """Test POST /api/simulation/reset cleanly restores baseline."""
    response = client.post("/api/simulation/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
