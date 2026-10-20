"""
CardioTwin AI - Machine Learning Training & Evaluation Pipeline
Digital Twin Challenge 2026 - Happiest Health

Trains baseline (Logistic Regression) and comparison (Random Forest) models
using patient-level GroupShuffleSplit to prevent cross-patient data leakage.
Computes genuine evaluation metrics, calibration, Brier score, and saves
portable joblib artifacts and visual plots.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    confusion_matrix,
    brier_score_loss,
)
from sklearn.calibration import calibration_curve
from sklearn.inspection import permutation_importance

SEED = 42

FEATURE_COLS = [
    # Static EHR Features
    "age",
    "bmi",
    "hypertension",
    "diabetes",
    "prior_cardiac_event",
    "baseline_systolic_bp",
    "baseline_diastolic_bp",
    "ldl_mg_dl",
    "egfr_ml_min",
    # Dynamic Telemetry & Rolling Engineering
    "hr_filled",
    "hrv_filled",
    "sleep_hours",
    "sleep_deficit",
    "steps_interval",
    "roll_hr_mean_6h",
    "roll_hr_mean_24h",
    "roll_hrv_mean_6h",
    "roll_hrv_mean_24h",
    "roll_hrv_min_24h",
    "hrv_trend_24h",
    "roll_steps_24h",
    "cardiac_workload_index"
]

FRIENDLY_FEATURE_NAMES = {
    "age": "Patient Age (years)",
    "bmi": "Body Mass Index (BMI)",
    "hypertension": "Hypertension History",
    "diabetes": "Type 2 Diabetes History",
    "prior_cardiac_event": "Prior Cardiac Event",
    "baseline_systolic_bp": "Baseline Systolic BP (mmHg)",
    "baseline_diastolic_bp": "Baseline Diastolic BP (mmHg)",
    "ldl_mg_dl": "Serum LDL Cholesterol (mg/dL)",
    "egfr_ml_min": "eGFR Renal Filtration (mL/min)",
    "hr_filled": "Current Heart Rate (bpm)",
    "hrv_filled": "Current HRV RMSSD (ms)",
    "sleep_hours": "Nocturnal Sleep (hours)",
    "sleep_deficit": "Cumulative Sleep Deficit (hours)",
    "steps_interval": "Recent Steps (3h block)",
    "roll_hr_mean_6h": "Rolling 6h Mean HR (bpm)",
    "roll_hr_mean_24h": "Rolling 24h Mean HR (bpm)",
    "roll_hrv_mean_6h": "Rolling 6h Mean HRV (ms)",
    "roll_hrv_mean_24h": "Rolling 24h Mean HRV (ms)",
    "roll_hrv_min_24h": "Rolling 24h Min HRV (ms)",
    "hrv_trend_24h": "24h Autonomic Drift (HRV delta)",
    "roll_steps_24h": "Rolling 24h Total Steps",
    "cardiac_workload_index": "Myocardial Rate-Pressure Index"
}


def train_and_evaluate(dataset_path: str = "data/processed_training_dataset.csv"):
    os.makedirs("artifacts", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    print(f"Loading processed dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    
    # Verify required columns
    for col in FEATURE_COLS:
        if col not in df.columns:
            raise ValueError(f"Missing required feature column: {col}")
    if "target_deterioration_24h" not in df.columns or "patient_id" not in df.columns:
        raise ValueError("Missing target or patient_id column.")
        
    X = df[FEATURE_COLS].copy()
    y = df["target_deterioration_24h"].astype(int).values
    groups = df["patient_id"].values
    
    print(f"Total dataset: {len(df)} samples across {len(np.unique(groups))} unique synthetic patients.")
    print(f"Positive target prevalence: {y.sum()} / {len(y)} ({y.mean() * 100:.2f}%)")
    
    # Patient-level GroupShuffleSplit (80% train patients, 20% test patients)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=SEED)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))
    
    train_pts = np.unique(groups[train_idx])
    test_pts = np.unique(groups[test_idx])
    
    print(f"Training split: {len(train_idx)} samples across {len(train_pts)} patients: {list(train_pts)[:5]}...")
    print(f"Testing split:  {len(test_idx)} samples across {len(test_pts)} held-out patients: {list(test_pts)}")
    
    # Ensure zero patient overlap
    overlap = set(train_pts).intersection(set(test_pts))
    assert len(overlap) == 0, f"DATA LEAKAGE DETECTED: Overlapping patients {overlap}!"
    print("[OK] Zero-leakage patient-grouped holdout verified.")
    
    X_train, y_train = X.iloc[train_idx], y[train_idx]
    X_test, y_test = X.iloc[test_idx], y[test_idx]
    
    # Preprocessing: StandardScaler fitted ONLY on training split
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    joblib.dump(scaler, "artifacts/scaler.joblib")
    with open("artifacts/feature_names.json", "w", encoding="utf-8") as f:
        json.dump({
            "features": FEATURE_COLS, 
            "friendly_names": FRIENDLY_FEATURE_NAMES,
            "train_patients": list(train_pts),
            "test_patients": list(test_pts)
        }, f, indent=2)
        
    # Model 1: Baseline Logistic Regression (with balanced class weights)
    print("\n--- Training Model 1: Logistic Regression Baseline ---")
    model_lr = LogisticRegression(
        penalty="l2", 
        C=0.5, 
        class_weight="balanced", 
        max_iter=1000, 
        random_state=SEED
    )
    model_lr.fit(X_train_scaled, y_train)
    joblib.dump(model_lr, "artifacts/model_baseline_lr.joblib")
    
    # Model 2: Random Forest Comparison
    print("--- Training Model 2: Random Forest Classifier ---")
    model_rf = RandomForestClassifier(
        n_estimators=150, 
        max_depth=6, 
        min_samples_leaf=4, 
        class_weight="balanced_subsample", 
        random_state=SEED, 
        n_jobs=-1
    )
    model_rf.fit(X_train, y_train)
    joblib.dump(model_rf, "artifacts/model_random_forest.joblib")
    
    # Evaluation on Held-Out Test Patients
    models = {
        "Logistic Regression (Baseline)": {
            "model": model_lr,
            "X_test": X_test_scaled,
            "is_scaled": True
        },
        "Random Forest (Comparison)": {
            "model": model_rf,
            "X_test": X_test,
            "is_scaled": False
        }
    }
    
    eval_results = {
        "metadata": {
            "evaluation_date": pd.Timestamp.now().isoformat(),
            "target_horizon": "24 hours synthetic cardiovascular deterioration proxy",
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "train_patient_count": int(len(train_pts)),
            "test_patient_count": int(len(test_pts)),
            "test_patients": [str(p) for p in test_pts],
            "test_class_prevalence": float(np.mean(y_test))
        },
        "models": {}
    }
    
    curve_data = {}
    
    for name, m_info in models.items():
        clf = m_info["model"]
        x_eval = m_info["X_test"]
        
        y_prob = clf.predict_proba(x_eval)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        roc_auc = float(roc_auc_score(y_test, y_prob))
        avg_prec = float(average_precision_score(y_test, y_prob))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        acc = float(accuracy_score(y_test, y_pred))
        brier = float(brier_score_loss(y_test, y_prob))
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # ROC and PR curves
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        p_curve, r_curve, _ = precision_recall_curve(y_test, y_prob)
        prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=8, strategy="uniform")
        
        curve_data[name] = {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
            "precision_curve": p_curve.tolist(),
            "recall_curve": r_curve.tolist(),
            "calib_prob_true": prob_true.tolist(),
            "calib_prob_pred": prob_pred.tolist(),
            "y_prob": y_prob
        }
        
        eval_results["models"][name] = {
            "roc_auc": round(roc_auc, 4),
            "average_precision": round(avg_prec, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(acc, 4),
            "brier_score": round(brier, 4),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            }
        }
        
        print(f"\n{name} Results on Held-Out Test Patients:")
        print(f"  ROC-AUC:           {roc_auc:.4f}")
        print(f"  Average Precision: {avg_prec:.4f}")
        print(f"  Precision:         {prec:.4f}")
        print(f"  Recall:            {rec:.4f}")
        print(f"  F1 Score:          {f1:.4f}")
        print(f"  Brier Score:       {brier:.4f}")
        print(f"  Confusion Matrix:  TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    # Feature Importance for Random Forest
    rf_feat_imp = model_rf.feature_importances_
    sorted_idx = np.argsort(rf_feat_imp)[::-1]
    
    feature_importance_list = []
    for idx in sorted_idx:
        feature_importance_list.append({
            "feature": FEATURE_COLS[idx],
            "friendly_name": FRIENDLY_FEATURE_NAMES[FEATURE_COLS[idx]],
            "importance": round(float(rf_feat_imp[idx]), 4)
        })
    eval_results["feature_importances"] = feature_importance_list
    
    # Save JSON report
    with open("artifacts/evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)
    print("\n[OK] Saved evaluation metrics to artifacts/evaluation_report.json")
    
    # Generate Publication-Quality Evaluation Figures
    generate_evaluation_figures(eval_results, curve_data, feature_importance_list, y_test)
    
    # Generate Markdown Report
    generate_markdown_report(eval_results)
    
    return eval_results


def generate_evaluation_figures(eval_results, curve_data, feature_importances, y_test):
    """
    Produce crisp, scientific visualization charts for research documentation.
    """
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 11), dpi=200)
    fig.patch.set_facecolor("#0F172A")
    for ax in axes.flat:
        ax.set_facecolor("#1E293B")
        ax.grid(color="#334155", linestyle="--", alpha=0.5)
        ax.tick_params(colors="#E2E8F0")
        for spine in ax.spines.values():
            spine.set_color("#475569")

    # 1. ROC Curves
    ax1 = axes[0, 0]
    for name, col in [("Logistic Regression (Baseline)", "#38BDF8"), ("Random Forest (Comparison)", "#34D399")]:
        d = curve_data[name]
        auc_val = eval_results["models"][name]["roc_auc"]
        ax1.plot(d["fpr"], d["tpr"], color=col, lw=2.2, label=f"{name} (AUC={auc_val:.3f})")
    ax1.plot([0, 1], [0, 1], color="#94A3B8", linestyle=":", lw=1.5, label="Random Chance (0.50)")
    ax1.set_title("Receiver Operating Characteristic (ROC)", color="#F8FAFC", fontsize=12, fontweight="bold")
    ax1.set_xlabel("False Positive Rate", color="#CBD5E1", fontsize=10)
    ax1.set_ylabel("True Positive Rate (Sensitivity)", color="#CBD5E1", fontsize=10)
    ax1.legend(loc="lower right", facecolor="#0F172A", edgecolor="#334155", labelcolor="#F8FAFC", fontsize=9)
    
    # 2. Precision-Recall Curves
    ax2 = axes[0, 1]
    prevalence = np.mean(y_test)
    for name, col in [("Logistic Regression (Baseline)", "#38BDF8"), ("Random Forest (Comparison)", "#34D399")]:
        d = curve_data[name]
        ap_val = eval_results["models"][name]["average_precision"]
        ax2.plot(d["recall_curve"], d["precision_curve"], color=col, lw=2.2, label=f"{name} (AP={ap_val:.3f})")
    ax2.axhline(prevalence, color="#F87171", linestyle="--", lw=1.5, label=f"Baseline Prevalence ({prevalence*100:.1f}%)")
    ax2.set_title("Precision-Recall Curve (PR)", color="#F8FAFC", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Recall (Sensitivity)", color="#CBD5E1", fontsize=10)
    ax2.set_ylabel("Precision (Positive Predictive Value)", color="#CBD5E1", fontsize=10)
    ax2.legend(loc="lower left", facecolor="#0F172A", edgecolor="#334155", labelcolor="#F8FAFC", fontsize=9)
    
    # 3. Calibration Curves (Reliability Diagram)
    ax3 = axes[1, 0]
    ax3.plot([0, 1], [0, 1], color="#94A3B8", linestyle=":", lw=1.5, label="Perfect Calibration")
    for name, col in [("Logistic Regression (Baseline)", "#38BDF8"), ("Random Forest (Comparison)", "#34D399")]:
        d = curve_data[name]
        brier = eval_results["models"][name]["brier_score"]
        ax3.plot(d["calib_prob_pred"], d["calib_prob_true"], "s-", color=col, lw=2, ms=6, label=f"{name} (Brier={brier:.3f})")
    ax3.set_title("Probability Calibration (Reliability Diagram)", color="#F8FAFC", fontsize=12, fontweight="bold")
    ax3.set_xlabel("Mean Predicted Probability", color="#CBD5E1", fontsize=10)
    ax3.set_ylabel("Empirical Fraction of Positives", color="#CBD5E1", fontsize=10)
    ax3.legend(loc="upper left", facecolor="#0F172A", edgecolor="#334155", labelcolor="#F8FAFC", fontsize=9)
    
    # 4. Top Feature Importances (Random Forest)
    ax4 = axes[1, 1]
    top10 = feature_importances[:10][::-1]
    names = [item["friendly_name"] for item in top10]
    vals = [item["importance"] for item in top10]
    bars = ax4.barh(names, vals, color="#2DD4BF", edgecolor="#0D9488", alpha=0.85, height=0.65)
    ax4.set_title("Top 10 Feature Importances (Gini - Random Forest)", color="#F8FAFC", fontsize=12, fontweight="bold")
    ax4.set_xlabel("Relative Importance Weight", color="#CBD5E1", fontsize=10)
    for bar in bars:
        w = bar.get_width()
        ax4.text(w + 0.003, bar.get_y() + bar.get_height()/2, f"{w:.3f}", 
                 va="center", ha="left", color="#E2E8F0", fontsize=8)
    
    plt.tight_layout(pad=3.0)
    fig.suptitle("CardioTwin AI - Model Validation & Calibration Suite (Held-Out Patient Cohort)", 
                 fontsize=14, color="#FFFFFF", fontweight="bold", y=0.995)
    plt.savefig("artifacts/evaluation_summary_plot.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print("[OK] Saved comprehensive visualization suite to artifacts/evaluation_summary_plot.png")


def generate_markdown_report(eval_results):
    """
    Write detailed research and model evaluation report.
    """
    m = eval_results["models"]
    meta = eval_results["metadata"]
    top_feats = eval_results["feature_importances"][:8]
    
    lr = m["Logistic Regression (Baseline)"]
    rf = m["Random Forest (Comparison)"]
    
    md_content = f"""# CardioTwin AI: Empirical Model Evaluation Report
**Project:** CardioTwin AI  
**Challenge:** Digital Twin Challenge 2026 (Happiest Health)  
**Author:** Madabattula Tejo Hasini (Aditya University, Andhra Pradesh, India)  
**Generated:** {meta['evaluation_date']}  

---

## 1. Study Design & Evaluation Protocol

- **Prediction Target:** Synthetic Cardiovascular Deterioration Proxy over a future 24-hour window ($t+1\\text{{h}}$ to $t+24\\text{{h}}$).
- **Target Definition:** Occurrence of sustained tachycardia ($\\ge 95$ bpm), severe parasympathetic autonomic collapse (HRV RMSSD $\\le 18$ ms), or acute hypertensive surge ($\\text{{SBP}} \\ge 165$ mmHg with HRV $\\le 22$ ms).
- **Leakage Prevention:** 
  - Strictly past-and-current temporal features at inference timestamp $T$.
  - **GroupShuffleSplit on Patient IDs:** Zero patient overlap between training and testing.
  - Scaler parameters fitted **strictly** on the training fold.
- **Dataset Partition:**
  - Training Patients: {meta['train_patient_count']} patients ({meta['train_samples']} longitudinal observations).
  - Held-Out Test Patients: {meta['test_patient_count']} patients ({meta['test_samples']} longitudinal observations).
  - Test Cohort IDs: `{', '.join(meta['test_patients'])}`
  - Positive Label Prevalence in Test Set: **{meta['test_class_prevalence'] * 100:.2f}%**

---

## 2. Quantitative Model Performance Summary

| Metric | Logistic Regression (Baseline) | Random Forest (Comparison) |
| :--- | :---: | :---: |
| **ROC-AUC** | **{lr['roc_auc']:.4f}** | **{rf['roc_auc']:.4f}** |
| **Average Precision (PR-AUC)** | **{lr['average_precision']:.4f}** | **{rf['average_precision']:.4f}** |
| **F1-Score** | {lr['f1_score']:.4f} | {rf['f1_score']:.4f} |
| **Precision** | {lr['precision']:.4f} | {rf['precision']:.4f} |
| **Recall (Sensitivity)** | {lr['recall']:.4f} | {rf['recall']:.4f} |
| **Accuracy** | {lr['accuracy']:.4f} | {rf['accuracy']:.4f} |
| **Brier Score (Calibration)** | {lr['brier_score']:.4f} | {rf['brier_score']:.4f} |

---

## 3. Confusion Matrix Breakdown (Held-Out Test Cohort)

### Logistic Regression Baseline
- True Negatives (TN): **{lr['confusion_matrix']['true_negative']}**
- False Positives (FP): **{lr['confusion_matrix']['false_positive']}**
- False Negatives (FN): **{lr['confusion_matrix']['false_negative']}**
- True Positives (TP): **{lr['confusion_matrix']['true_positive']}**

### Random Forest Comparison
- True Negatives (TN): **{rf['confusion_matrix']['true_negative']}**
- False Positives (FP): **{rf['confusion_matrix']['false_positive']}**
- False Negatives (FN): **{rf['confusion_matrix']['false_negative']}**
- True Positives (TP): **{rf['confusion_matrix']['true_positive']}**

---

## 4. Key Feature Importance (Gini Impurity Ranking)

The top physiological and baseline variables driving the 24-hour deterioration proxy:

| Rank | Feature | Description | Importance |
| :---: | :--- | :--- | :---: |
"""
    for i, f_info in enumerate(top_feats, start=1):
        md_content += f"| {i} | `{f_info['feature']}` | {f_info['friendly_name']} | {f_info['importance']:.4f} |\n"
        
    md_content += """
---

## 5. Critical Research & Clinical Disclaimer

1. **Synthetic Nature of Targets:** The labels used in this study were programmatically generated under physiological stress assumptions. They do **NOT** represent confirmed clinical myocardial infarctions, arrhythmias, or real patient outcomes.
2. **Correlation vs Causation:** High feature importance reflects algorithmic association within the synthetic cohort, not biological causality.
3. **No Clinical Utility:** CardioTwin AI is purely a proof-of-concept software prototype for the Digital Twin Challenge 2026. It must not be deployed in real patient care or used to dictate medical therapies.
"""
    with open("reports/MODEL_EVALUATION_REPORT.md", "w", encoding="utf-8") as f:
        f.write(md_content)
    print("[OK] Saved comprehensive report to reports/MODEL_EVALUATION_REPORT.md")


if __name__ == "__main__":
    train_and_evaluate()
