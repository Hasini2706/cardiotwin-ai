export interface PatientSummary {
  patient_id: string;
  age: number;
  sex: string;
  bmi: number;
  hypertension: boolean;
  diabetes: boolean;
  prior_cardiac_event: boolean;
  baseline_systolic_bp: number;
  latest_reading?: {
    heart_rate_bpm: number;
    hrv_rmssd_ms: number;
    estimated_systolic_bp: number;
    timestamp: string;
  };
  latest_prediction?: {
    rf_deterioration_prob: number;
    lr_deterioration_prob: number;
    risk_category: string;
    risk_color: string;
    confidence_interval: [number, number];
  };
}

export interface PatientEHR {
  patient_id: string;
  age: number;
  sex: string;
  bmi: number;
  smoking_status: string;
  hypertension: number;
  diabetes: number;
  prior_cardiac_event: number;
  baseline_systolic_bp: number;
  baseline_diastolic_bp: number;
  total_cholesterol_mg_dl: number;
  hdl_mg_dl: number;
  ldl_mg_dl: number;
  fasting_glucose_mg_dl: number;
  serum_creatinine_mg_dl: number;
  egfr_ml_min: number;
  data_provenance: string;
  created_at: string;
}

export interface WearableReading {
  reading_id: string;
  patient_id: string;
  timestamp: string;
  hour_of_day: number;
  heart_rate_bpm: number | null;
  hrv_rmssd_ms: number | null;
  sleep_hours: number | null;
  sleep_quality_score: number | null;
  steps_interval: number;
  estimated_systolic_bp: number | null;
  is_missing: number | boolean;
  is_simulated: number | boolean;
}

export interface ContributingFeature {
  feature: string;
  label: string;
  current_value: number;
  impact_score: number;
  direction: string;
}

export interface PredictionRecord {
  prediction_id: string;
  patient_id: string;
  reading_id: string;
  timestamp: string;
  rf_deterioration_prob: number;
  lr_deterioration_prob: number;
  risk_category: string;
  risk_color?: string;
  confidence_interval?: [number, number];
  top_contributing_features?: ContributingFeature[];
}

export interface ModelMetricDetails {
  roc_auc: number;
  average_precision: number;
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  brier_score: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  friendly_name: string;
  importance: number;
}

export interface EvaluationReport {
  metadata: {
    evaluation_date: string;
    target_horizon: string;
    train_samples: number;
    test_samples: number;
    train_patient_count: number;
    test_patient_count: number;
    test_patients: string[];
    test_class_prevalence: number;
  };
  models: {
    "Logistic Regression (Baseline)": ModelMetricDetails;
    "Random Forest (Comparison)": ModelMetricDetails;
  };
  feature_importances: FeatureImportanceItem[];
  disclosures: {
    synthetic_label_disclaimer: string;
    calibration_status: string;
    evaluation_protocol: string;
  };
}

export interface WhatIfResponse {
  patient_id: string;
  baseline: {
    rf_probability: number;
    risk_category: string;
  };
  counterfactual: {
    rf_probability: number;
    risk_category: string;
    confidence_interval: [number, number];
  };
  impact: {
    risk_difference: number;
    direction: string;
    clinical_interpretation: string;
  };
}

export interface SimulateUpdateResponse {
  status: string;
  patient_id: string;
  new_reading: {
    reading_id: string;
    timestamp: string;
    heart_rate_bpm: number;
    hrv_rmssd_ms: number;
    sleep_hours: number;
    estimated_systolic_bp: number;
    steps_interval: number;
  };
  comparison: {
    before_score: number;
    after_score: number;
    delta: number;
    trend: string;
  };
  updated_prediction: PredictionRecord;
}
