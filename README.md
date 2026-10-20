# CardioTwin AI: Virtual Cardiovascular Patient Laboratory

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Python: 3.13+](https://img.shields.io/badge/Python-3.13%2B-blue.svg)](https://www.python.org/)
[![FastAPI: 0.110+](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React: 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Vite: 8](https://img.shields.io/badge/Vite-8.0-646CFF.svg)](https://vite.dev/)
[![Tailwind CSS: 4](https://img.shields.io/badge/Tailwind-4.0-38BDF8.svg)](https://tailwindcss.com/)
[![Test Suite: 11 Passed](https://img.shields.io/badge/pytest-11%20passed-brightgreen.svg)](tests/test_backend_and_ml.py)

> **Official Submission for the Digital Twin Challenge 2026**  
> **Organizer:** Happiest Health  
> **Student Researcher:** Madabattula Tejo Hasini (Solo Student Entry)  
> **Institution:** Aditya University, Department of Artificial Intelligence, Andhra Pradesh, India  
> **Contact Email:** [24b11ai223@adityauniversity.in](mailto:24b11ai223@adityauniversity.in)  

---

## Important Medical & Research Disclaimer

> [!CAUTION]
> **RESEARCH & PROOF-OF-CONCEPT ONLY:** CardioTwin AI is an academic demonstration developed solely for the *Digital Twin Challenge 2026* organized by *Happiest Health*. It utilizes **100% synthetic physiological and electronic health record (EHR) data**.
> 
> - **It does NOT diagnose medical conditions, predict heart attacks, or prescribe medications.**
> - **It does NOT replace medical professionals or clinical decision-making.**
> - **Feature importance and model associations reflect statistical correlations within synthetic training distributions, NOT medical causality.**

---

## 1. Executive Summary & Problem Statement

Cardiovascular diseases (CVDs) remain the leading contributor to global mortality. In standard clinical practice, patient evaluations are restricted to sporadic 15-minute consultations conducted every 3 to 6 months. Acute hemodynamic and autonomic destabilization frequently develops in the post-discharge home setting without warning.

While commercial consumer wearables capture millions of heart rate, HRV, and sleep readings, **wearable data in isolation lacks baseline clinical context** (such as baseline blood pressure, prior myocardial infarction, lipid profiles, and renal filtration). 

**CardioTwin AI** solves this critical gap by creating an in-silico **Cardiovascular Digital Twin** that continuously fuses:
1. **Static Baseline Electronic Health Records (EHR):** Demographics, baseline blood pressure, diabetes, hypertension, lipid panels, and renal lab markers.
2. **Dynamic Time-Series Wearable Telemetry:** Continuous heart rate, parasympathetic heart-rate variability (HRV RMSSD in milliseconds), nocturnal sleep duration, and actigraphy steps.
3. **Continuous Algorithmic Deterioration Forecasting:** A leak-free machine learning pipeline predicting a synthetic 24-hour deterioration proxy.
4. **Counterfactual 'What-If' Simulation Studio:** Allowing clinical researchers to simulate the physiological consequences of interventions (e.g., blood pressure control, sleep recovery) without real patient risk.

---

## 2. Key Features & Dashboard Screens

| Screen | Purpose & Capabilities |
| :--- | :--- |
| **Screen A: Overview Dashboard** | Real-time cohort health metrics, synthetic deterioration prevalence (29.0%), cohort mean HRV (39 ms), risk distribution spectrum, and instant digital-twin patient selector. |
| **Screen B: Patient Digital Twin** | Detailed twin instance displaying static EHR baselines side-by-side with synchronized Recharts time-series (Heart Rate, HRV RMSSD ms, Sleep, Steps), 24h deterioration proxy gauge, and 95% confidence intervals. |
| **Screen C: Live Simulation & What-If** | Deterministic timeline advancement (+3h step), stress surge injection, before-and-after score differentials, and an interactive **What-If Counterfactual Lab** with parameter sliders. |
| **Screen D: Model Evaluation** | Genuine empirical metrics loaded from saved artifacts comparing Tuned Random Forest (ROC-AUC 0.9367) against Baseline Logistic Regression (0.8217), with full confusion matrices and calibration disclosures. |
| **Screen E: Explainability & Data Quality** | Gini feature importance bar chart, clinical rationales for autonomic drift and myocardial rate-pressure index, simulated 2.0% packet loss handling, and correlation vs. causation warnings. |
| **Screen F: About & Methodology** | Competition details, Aditya University affiliation, digital-twin mathematical definitions, ethical safeguards, and the clinical translation roadmap. |

---

## 3. System Architecture & Technical Flow

```mermaid
flowchart TD
    subgraph Data Sources [1. Data Ingestion]
        EHR[Static Baseline EHR<br/>Age, Sex, BMI, BP, Lipids, eGFR]
        Wearables[Dynamic Wearables<br/>HR, HRV RMSSD, Sleep, Steps]
    end

    subgraph Feature Pipeline [2. Leakage-Free Preprocessing]
        Temporal[Rolling Temporal Lookback<br/>6h & 24h Mean HR, 24h Min HRV, Sleep Deficit]
        Fusion[Rate-Pressure Workload Product<br/>HR x Baseline SBP / 100]
        Split[GroupShuffleSplit on Patient ID<br/>40 Train Patients : 10 Held-Out Test Patients]
    end

    subgraph Modeling Engine [3. Dual Machine Learning Models]
        RF[Random Forest Classifier<br/>ROC-AUC: 0.9367 | PR-AUC: 0.8939]
        LR[Logistic Regression Baseline<br/>ROC-AUC: 0.8217 | PR-AUC: 0.8233]
        WhatIf[Counterfactual Simulation Engine<br/>Hypothetical Interventions]
    end

    subgraph Persistence [4. Embedded Persistence]
        DB[(SQLite Embedded DB<br/>cardiotwin.db)]
    end

    subgraph REST API [5. FastAPI Backend]
        API[FastAPI REST Service<br/>Port 8000]
    end

    subgraph Frontend [6. Clinical Dashboard]
        UI[React 19 + TypeScript + Vite<br/>Tailwind CSS v4 + Recharts]
    end

    EHR --> Temporal
    Wearables --> Temporal
    Temporal --> Fusion
    Fusion --> Split
    Split --> RF
    Split --> LR
    RF --> DB
    LR --> DB
    WhatIf --> API
    DB --> API
    API --> UI
```

- **Architecture Diagram Source & PDF:**
  - Native Vector PDF: [`artifacts/architecture_diagram.pdf`](artifacts/architecture_diagram.pdf)
  - High-Resolution PNG: [`artifacts/architecture_diagram.png`](artifacts/architecture_diagram.png)

---

## 4. Empirical Model Performance & Evaluation

All metrics reported below were computed on **10 held-out synthetic test patients** (1,110 longitudinal observations) with **zero patient-level overlap** between training and testing.

| Metric | Logistic Regression (Baseline) | Random Forest (Comparison) | Relative Gain (Δ) |
| :--- | :---: | :---: | :---: |
| **ROC-AUC** | 0.8217 | **0.9367** | **+11.5%** |
| **Average Precision (PR-AUC)** | 0.8233 | **0.8939** | **+7.1%** |
| **Balanced F1-Score** | 0.6733 | **0.8295** | **+15.6%** |
| **Precision (PPV)** | 0.5551 | **0.7466** | **+19.1%** |
| **Recall (Sensitivity)** | 0.8553 | **0.9329** | **+7.8%** |
| **Brier Score (Lower is Better)** | 0.2373 | **0.1221** | **-0.1152 (Superior Calibration)** |

### Confusion Matrix Breakdown (Held-Out Test Set: N = 1,110)

```
Random Forest Comparison:
                 Predicted Negative    Predicted Positive
Actual Negative         482 (TN)              151 (FP)
Actual Positive          32 (FN)              445 (TP)
```

- Complete Evaluation Report: [`reports/MODEL_EVALUATION_REPORT.md`](reports/MODEL_EVALUATION_REPORT.md)
- QA Test Execution Audit: [`reports/QA_TEST_REPORT.md`](reports/QA_TEST_REPORT.md)

---

## 5. Technology Stack

- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn, SQLite3.
- **Machine Learning:** scikit-learn, pandas, NumPy, scipy, joblib.
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Lucide React icons.
- **Reporting & Visuals:** Matplotlib, ReportLab, python-pptx.
- **Testing:** pytest, FastAPI TestClient, httpx.

---

## 6. Quickstart: Installation & Local Reproduction

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Option 1: Unified Single-Command Demonstration (Recommended)
Clone the repository and run the automated Python launcher:

```bash
git clone https://github.com/Hasini2706/cardiotwin-ai.git
cd cardiotwin-ai

# Install Python backend dependencies
python -m pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..

# Launch unified demonstrator (starts backend, frontend, and opens browser)
python run_demo.py
```

*On Windows, you can also simply double-click [`run_all.bat`](run_all.bat).*

### Option 2: Manual Step-by-Step Startup

#### Terminal 1 — Backend Service
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: `http://127.0.0.1:8000/health`
- OpenAPI Swagger Docs: `http://127.0.0.1:8000/docs`

#### Terminal 2 — Frontend Dev Server
```bash
cd frontend
npm run dev
```
- Dashboard Access: `http://localhost:5173`

#### Run Automated Test Suite
```bash
python -m pytest tests/test_backend_and_ml.py -v
```

---

## 7. Project Structure

```
cardiotwin-ai/
├── artifacts/                  # Exported models, JSON metrics, and diagram assets
│   ├── architecture_diagram.pdf # Native vector architecture diagram
│   ├── architecture_diagram.png # High-res diagram
│   ├── evaluation_report.json  # Genuine executed evaluation metrics
│   ├── evaluation_summary_plot.png # ROC, PR, Calibration, and Importance charts
│   ├── model_random_forest.joblib # Serialized Random Forest model
│   ├── model_baseline_lr.joblib   # Serialized Logistic Regression baseline
│   ├── scaler.joblib           # Preprocessing scaler fitted strictly on train fold
│   └── screenshots/            # Verified dashboard interface screenshots
├── backend/                    # FastAPI application and SQLite persistence
│   ├── database.py             # SQLite schema, CRUD, and atomic reset routines
│   ├── inference.py            # Feature assembler, model inference, and what-if logic
│   └── main.py                 # REST API routes and Pydantic validation
├── data/                       # Synthetic EHR and wearable timeseries datasets
│   ├── synthetic_patients.csv  # 50 synthetic baseline patient EHR records
│   ├── synthetic_wearables.csv # 5,600 longitudinal wearable telemetry readings
│   └── cardiotwin.db           # SQLite database
├── demo/                       # Demonstration video package
│   └── DEMO_SCRIPT.md          # 20-minute minute-by-minute video narration script
├── docs/                       # Supplemental competition documentation
├── frontend/                   # Modern React + TypeScript + Tailwind CSS application
│   ├── src/
│   │   ├── components/         # Modular dashboard screens (A through F)
│   │   ├── services/           # Typed API communication client
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # Root dashboard controller
│   │   └── index.css           # Clinical dark navy design system
│   ├── package.json
│   └── vite.config.ts
├── ml/                         # Machine learning and data generation pipelines
│   ├── generate_architecture_diagram.py # Vector diagram generator
│   ├── generate_presentation.py # PPTX & PDF presentation builder
│   ├── synthetic_generator.py  # Seed-controlled synthetic data & feature pipeline
│   └── train_models.py         # Leakage-free training, evaluation, and plotting
├── presentation/               # Official competition slide deck
│   ├── CardioTwin_AI_Presentation.pptx # Editable 12-slide PowerPoint presentation
│   └── CardioTwin_AI_Presentation.pdf  # PDF presentation export
├── reports/                    # Quality assurance and evaluation reports
│   ├── MODEL_EVALUATION_REPORT.md      # Detailed scientific model report
│   └── QA_TEST_REPORT.md       # 11-point testing and static build audit
├── tests/                      # Automated pytest validation suite
│   └── test_backend_and_ml.py  # 11 automated unit and integration tests
├── .env.example                # Safe environment configuration template
├── .gitignore                  # Git exclusion rules
├── LICENSE                     # MIT Open-Source License with Medical Disclaimer
├── README.md                   # Primary project submission documentation
├── requirements.txt            # Pinned Python package dependencies
├── run_all.bat                 # Windows one-click startup launcher
└── run_demo.py                 # Unified demonstration launcher
```

---

## 8. Demonstration Video & Slide Deck

- **20-Minute Video Demonstration Script:** [`demo/DEMO_SCRIPT.md`](demo/DEMO_SCRIPT.md)  
  *Contains minute-by-minute screen directions, spoken narration, and recording verification checklist.*
- **Demonstration Video URL (Placeholder):** `https://youtu.be/PLACEHOLDER_CARDIOTWIN_AI_DEMO`
- **Competition Slide Deck (12 Slides):**
  - PowerPoint (.pptx): [`presentation/CardioTwin_AI_Presentation.pptx`](presentation/CardioTwin_AI_Presentation.pptx)
  - PDF Export (.pdf): [`presentation/CardioTwin_AI_Presentation.pdf`](presentation/CardioTwin_AI_Presentation.pdf)

---

## 9. Ethical Architecture & Clinical Translation Roadmap

1. **Synthetic Data Sovereignty:** 100% of patient profiles and telemetry streams were deterministically synthesized (Seed 42). Zero Protected Health Information (PHI) was acquired or exposed.
2. **Local Execution Guarantee:** CardioTwin AI operates entirely on local computational hardware without paid APIs, third-party LLMs, or cloud transmission.
3. **Clinical Translation Requirements:** Moving from this academic digital twin to clinical bedside deployment requires:
   - Multi-center prospective observational trials with Institutional Review Board (IRB) ethical approval.
   - Cross-calibrating photoplethysmography (PPG) wearable sensors against gold-standard 12-lead Holter electrocardiograms.
   - Population-specific calibration against Indian Council of Medical Research (ICMR) epidemiological cohorts.
   - Software as a Medical Device (SaMD) documentation compliant with CDSCO and FDA 510(k) guidance.

---

## 10. License & Author Details

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete terms and medical disclaimers.

- **Author:** Madabattula Tejo Hasini
- **Institution:** Aditya University, Department of Artificial Intelligence, Andhra Pradesh, India
- **Email:** [24b11ai223@adityauniversity.in](mailto:24b11ai223@adityauniversity.in)
- **Challenge:** Digital Twin Challenge 2026 organized by Happiest Health
