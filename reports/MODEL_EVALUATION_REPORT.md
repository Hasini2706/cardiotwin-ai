# CardioTwin AI: Empirical Model Evaluation Report
**Project:** CardioTwin AI  
**Challenge:** Digital Twin Challenge 2026 (Happiest Health)  
**Author:** Madabattula Tejo Hasini (Aditya University, Andhra Pradesh, India)  
**Generated:** 2026-10-20T19:06:50.175234  

---

## 1. Study Design & Evaluation Protocol

- **Prediction Target:** Synthetic Cardiovascular Deterioration Proxy over a future 24-hour window ($t+1\text{h}$ to $t+24\text{h}$).
- **Target Definition:** Occurrence of sustained tachycardia ($\ge 95$ bpm), severe parasympathetic autonomic collapse (HRV RMSSD $\le 18$ ms), or acute hypertensive surge ($\text{SBP} \ge 165$ mmHg with HRV $\le 22$ ms).
- **Leakage Prevention:** 
  - Strictly past-and-current temporal features at inference timestamp $T$.
  - **GroupShuffleSplit on Patient IDs:** Zero patient overlap between training and testing.
  - Scaler parameters fitted **strictly** on the training fold.
- **Dataset Partition:**
  - Training Patients: 40 patients (4440 longitudinal observations).
  - Held-Out Test Patients: 10 patients (1110 longitudinal observations).
  - Test Cohort IDs: `PT-1014, PT-1018, PT-1020, PT-1026, PT-1027, PT-1031, PT-1033, PT-1040, PT-1046, PT-1049`
  - Positive Label Prevalence in Test Set: **42.97%**

---

## 2. Quantitative Model Performance Summary

| Metric | Logistic Regression (Baseline) | Random Forest (Comparison) |
| :--- | :---: | :---: |
| **ROC-AUC** | **0.8217** | **0.9367** |
| **Average Precision (PR-AUC)** | **0.8233** | **0.8939** |
| **F1-Score** | 0.6733 | 0.8295 |
| **Precision** | 0.5551 | 0.7466 |
| **Recall (Sensitivity)** | 0.8553 | 0.9329 |
| **Accuracy** | 0.6432 | 0.8351 |
| **Brier Score (Calibration)** | 0.2373 | 0.1221 |

---

## 3. Confusion Matrix Breakdown (Held-Out Test Cohort)

### Logistic Regression Baseline
- True Negatives (TN): **306**
- False Positives (FP): **327**
- False Negatives (FN): **69**
- True Positives (TP): **408**

### Random Forest Comparison
- True Negatives (TN): **482**
- False Positives (FP): **151**
- False Negatives (FN): **32**
- True Positives (TP): **445**

---

## 4. Key Feature Importance (Gini Impurity Ranking)

The top physiological and baseline variables driving the 24-hour deterioration proxy:

| Rank | Feature | Description | Importance |
| :---: | :--- | :--- | :---: |
| 1 | `roll_hrv_min_24h` | Rolling 24h Min HRV (ms) | 0.2049 |
| 2 | `roll_hrv_mean_24h` | Rolling 24h Mean HRV (ms) | 0.1985 |
| 3 | `roll_hrv_mean_6h` | Rolling 6h Mean HRV (ms) | 0.1122 |
| 4 | `hrv_filled` | Current HRV RMSSD (ms) | 0.1054 |
| 5 | `age` | Patient Age (years) | 0.0727 |
| 6 | `egfr_ml_min` | eGFR Renal Filtration (mL/min) | 0.0535 |
| 7 | `sleep_hours` | Nocturnal Sleep (hours) | 0.0421 |
| 8 | `sleep_deficit` | Cumulative Sleep Deficit (hours) | 0.0373 |

---

## 5. Critical Research & Clinical Disclaimer

1. **Synthetic Nature of Targets:** The labels used in this study were programmatically generated under physiological stress assumptions. They do **NOT** represent confirmed clinical myocardial infarctions, arrhythmias, or real patient outcomes.
2. **Correlation vs Causation:** High feature importance reflects algorithmic association within the synthetic cohort, not biological causality.
3. **No Clinical Utility:** CardioTwin AI is purely a proof-of-concept software prototype for the Digital Twin Challenge 2026. It must not be deployed in real patient care or used to dictate medical therapies.
