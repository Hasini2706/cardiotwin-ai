# CardioTwin AI: Official 20-Minute Demonstration Video Script
**Competition:** Digital Twin Challenge 2026  
**Organizer:** Happiest Health  
**Participant:** Madabattula Tejo Hasini (Solo Student Entry)  
**Institution:** Aditya University, Andhra Pradesh, India  
**Target Video Duration:** 20 Minutes (1,200 Seconds)  
**Video Resolution Target:** 1080p 60fps (1920x1080)  
**Audio Target:** Clear voiceover with noise cancellation  

---

## Recording Verification Checklist
Before starting the video recording, verify the following:
- [ ] Backend is running on `http://127.0.0.1:8000` (`python -m uvicorn backend.main:app --port 8000`).
- [ ] Frontend is running on `http://localhost:5173` (`npm run dev` in `frontend/`).
- [ ] Database contains seeded baseline patients (`data/cardiotwin.db`).
- [ ] Trained model artifacts exist in `artifacts/`.
- [ ] Full screen browser window with clean URL bar and no extraneous notifications.
- [ ] Microphone input levels tested and background noise minimized.

---

## Minute-by-Minute Demonstration Schedule

### Act 1: Introduction & Competition Context (00:00 – 03:00)
- **Timestamp 00:00 – 01:15**
  - **Screen:** Title Slide from [CardioTwin_AI_Presentation.pdf](file:///c:/Users/mtejo/OneDrive/Desktop/DigitalTwin/presentation/CardioTwin_AI_Presentation.pdf) / Desktop Terminal.
  - **Narration:** "Hello judges, evaluation committee, and healthcare technology innovators. My name is Madabattula Tejo Hasini from Aditya University in Andhra Pradesh, India. I am presenting CardioTwin AI, an end-to-end, reproducible in-silico cardiovascular digital-twin laboratory built for the Digital Twin Challenge 2026 organized by Happiest Health."
  - **Visual Action:** Show title slide with student name, university affiliation, and project name.
- **Timestamp 01:15 – 03:00**
  - **Screen:** Problem Statement & Architecture Diagram ([architecture_diagram.pdf](file:///c:/Users/mtejo/OneDrive/Desktop/DigitalTwin/artifacts/architecture_diagram.pdf)).
  - **Narration:** "Cardiovascular disease remains the leading cause of global mortality. While traditional clinical medicine relies on sporadic 15-minute visits every 3 to 6 months, cardiovascular instability frequently emerges suddenly at home. Consumer wearables record millions of datapoints, but lack clinical context from baseline electronic health records. CardioTwin AI solves this by continuously fusing static EHR clinical records with high-frequency wearable telemetry to build a personalized, auditable digital twin."

### Act 2: System Architecture & Data Engineering (03:00 – 06:30)
- **Timestamp 03:00 – 04:30**
  - **Screen:** Architecture Diagram ([architecture_diagram.png](file:///c:/Users/mtejo/OneDrive/Desktop/DigitalTwin/artifacts/architecture_diagram.png)).
  - **Narration:** "Let us examine the six core technical pillars of CardioTwin AI. First, our static EHR baseline ingestion, covering age, sex, BMI, hypertension, diabetes, lipids, and renal filtration labs. Second, dynamic wearable streams capturing continuous heart rate, parasympathetic HRV RMSSD in milliseconds, nocturnal sleep duration, and actigraphy steps. Third, our causal lookback feature engineering engine, strictly preventing lookahead target leakage. Fourth, our dual-model inference pipeline contrasting tuned Random Forest models against standardized Logistic Regression baselines. Fifth, our local SQLite audit trail ensuring complete decision reproducibility. And sixth, our modern clinical research dashboard built with React, TypeScript, and Tailwind CSS."
- **Timestamp 04:30 – 06:30**
  - **Screen:** Terminal executing synthetic data generation and test suites.
  - **Visual Action:** Open terminal, run `python ml/synthetic_generator.py` and `python -m pytest tests/test_backend_and_ml.py -v`.
  - **Narration:** "Notice the complete transparency and reproducibility of our data pipeline. All 11 automated unit and integration tests pass with 100% compliance. Our data generator runs with fixed random seeds, and our train/test split enforces a strict patient-grouped holdout with zero cross-patient observation leakage."

### Act 3: Live Application Walkthrough - Screens A & B (06:30 – 11:00)
- **Timestamp 06:30 – 08:30**
  - **Screen:** CardioTwin AI Frontend Dashboard - Screen A: Overview.
  - **Visual Action:** Navigate to `http://localhost:5173`. Scroll through the Overview Screen.
  - **Narration:** "Here is the CardioTwin AI research dashboard. At the very top, we present a prominent, unmissable medical research disclaimer: CardioTwin AI is an academic proof-of-concept that does not replace clinicians or claim to predict heart attacks. The Overview screen provides immediate cohort intelligence: 50 synthetic patients, an empirical outcome prevalence of 29.0%, cohort mean HRV of 39 ms, and real-time distribution across Safe, Vigilance, and Acute Deterioration alert tiers."
- **Timestamp 08:30 – 11:00**
  - **Screen:** Screen B: Patient Digital Twin.
  - **Visual Action:** Click 'Patient Digital Twin' tab. Switch between patients (e.g. `PT-1001` and `PT-1014`). Inspect the static baseline EHR card and the four synchronized Recharts time-series charts.
  - **Narration:** "On Screen B, we inspect the individual Digital Twin instance for Patient PT-1001. On the left card, we view the immutable clinical baseline: baseline blood pressure 138/88 mmHg, BMI 26.8, LDL cholesterol, and comorbidities. On the right, our dynamic 24-hour deterioration proxy gauge displays an algorithmic risk score accompanied by a 95% confidence interval uncertainty band and local feature contribution rankings. Below, we observe multi-day telemetry: continuous heart rate with tachycardia thresholds at 100 bpm, parasympathetic HRV RMSSD in milliseconds with autonomic distress indicators at 18 ms, nocturnal sleep duration, and step intensity."

### Act 4: Live Simulation Playback & What-If Counterfactuals (11:00 – 15:00)
- **Timestamp 11:00 – 13:00**
  - **Screen:** Screen C: Live Simulation & What-If Studio.
  - **Visual Action:** Click 'Advance (+3h)' button. Then click 'Autonomic Spike' button. Observe live network requests in DevTools and the before-and-after score diff card updating dynamically.
  - **Narration:** "Screen C delivers our interactive simulation laboratory. When I click 'Advance Timeline (+3 Hours)', a real POST request is dispatched to `/api/patients/{id}/simulate-update`. The backend persists the reading to SQLite, updates rolling temporal features, re-executes model inference, and returns an auditable before-and-after score diff. Watch what happens when I inject an 'Autonomic Spike' event: heart rate accelerates to 112 bpm and HRV collapses to 13.5 ms. The model immediately detects this acute trajectory shift, escalating the deterioration proxy score and updating the chronological risk trend."
- **Timestamp 13:00 – 15:00**
  - **Screen:** Screen C: What-If Counterfactual Sliders.
  - **Visual Action:** Adjust the Heart Rate, HRV, Sleep, and Systolic BP sliders. Click 'Calculate What-If Impact'.
  - **Narration:** "Next, we explore our counterfactual What-If Studio. Clinical researchers frequently need to hypothesize how therapeutic or lifestyle interventions would shift patient risk before issuing guidance. By dragging the HRV slider to 65 ms and sleep to 8.5 hours, we simulate restorative parasympathetic recovery. The counterfactual engine recalculates the feature vector on the fly, demonstrating a substantial risk mitigation diff without permanently altering stored patient data."

### Act 5: Empirical Model Evaluation & Explainability (15:00 – 18:00)
- **Timestamp 15:00 – 16:30**
  - **Screen:** Screen D: Model Evaluation & Benchmarks.
  - **Visual Action:** Review the comparative evaluation table and confusion matrices for Random Forest vs Logistic Regression.
  - **Narration:** "On Screen D, we present our empirical evaluation metrics directly loaded from executed test artifacts. On 10 held-out synthetic test patients comprising 1,110 observations, our Random Forest classifier achieved a ROC-AUC of 0.9367, an Average Precision PR-AUC of 0.8939, and an F1-Score of 0.8295, outperforming our Logistic Regression baseline. Our Brier calibration score was 0.1221, demonstrating reliable probability alignment. We also display the full confusion matrix: 482 True Negatives, 445 True Positives, and 32 False Negatives."
- **Timestamp 16:30 – 18:00**
  - **Screen:** Screen E: Explainability & Data Quality.
  - **Visual Action:** Hover over the Gini feature importance bar chart and review data quality metrics.
  - **Narration:** "On Screen E, we explain the model's predictive hierarchy. The top predictive variables driving the 24-hour deterioration proxy are Autonomic Drift in HRV RMSSD, Myocardial Rate-Pressure Product, and Cumulative Sleep Debt. We also clearly document our telemetry quality assurance: handling simulated 2.0% packet dropout using causal forward-fill. Crucially, we enforce a strict scientific boundary: feature importance weights demonstrate statistical correlation, never biological causation."

### Act 6: Ethics, Clinical Roadmap, and Submission Summary (18:00 – 20:00)
- **Timestamp 18:00 – 19:30**
  - **Screen:** Screen F: About & Methodology.
  - **Visual Action:** Review institutional affiliation, ethical safeguards, and clinical validation roadmap.
  - **Narration:** "Finally, Screen F highlights our ethical architecture and clinical translation roadmap. CardioTwin AI operates entirely on synthetic data with zero protected health information and runs 100% locally with no paid APIs. Moving from this proof-of-concept to clinical utility will require multi-center prospective trials with IRB approval, sensor cross-calibration against 12-lead Holter monitors, and regulatory clearance under SaMD guidelines."
- **Timestamp 19:30 – 20:00**
  - **Screen:** GitHub Repository & Submission Files overview.
  - **Narration:** "In conclusion, CardioTwin AI delivers a technically sound, fully reproducible, and honest digital-twin prototype for the Digital Twin Challenge 2026. All source code, tests, presentation decks, architecture PDFs, and evaluation reports are fully available under the open-source MIT license. Thank you to Happiest Health and the evaluation committee for this opportunity."

---

## Demonstration Video URL Placeholder
Once recorded using the above 20-minute script, upload to YouTube / Google Drive / Vimeo and insert the permanent link here:
- **Demonstration Video URL:** `https://youtu.be/PLACEHOLDER_CARDIOTWIN_AI_DEMO`
- **Video Backup Mirror:** `https://drive.google.com/drive/folders/PLACEHOLDER_CARDIOTWIN_AI`
