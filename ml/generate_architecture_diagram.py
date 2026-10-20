"""
CardioTwin AI - Architecture Diagram Generator
Digital Twin Challenge 2026 - Happiest Health

Generates crisp, high-resolution architecture diagrams in both PDF (vector) and PNG formats.
Visualizes the end-to-end data pipeline, feature engineering, ML inference, persistence,
API routes, and frontend research dashboard.
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_diagrams():
    os.makedirs("artifacts", exist_ok=True)
    
    fig, ax = plt.subplots(figsize=(16, 9), dpi=150)
    fig.patch.set_facecolor("#070D1B")
    ax.set_facecolor("#070D1B")
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis("off")

    # Title Banner
    ax.text(8.0, 8.55, "CardioTwin AI: System Architecture & Data Flow", 
            fontsize=19, fontweight="bold", color="#FFFFFF", ha="center")
    ax.text(8.0, 8.2, "Digital Twin Challenge 2026 (Happiest Health) • Aditya University • Madabattula Tejo Hasini", 
            fontsize=11, color="#2DD4BF", ha="center")

    def draw_box(x, y, w, h, title, subtitle, items, bg_color, border_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                      facecolor=bg_color, edgecolor=border_color, linewidth=1.5)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.32, title, fontsize=10.5, fontweight="bold", color="#FFFFFF", ha="center")
        if subtitle:
            ax.text(x + w/2, y + h - 0.55, subtitle, fontsize=8, color="#94A3B8", ha="center")
        
        y_offset = y + h - 0.88
        for item in items:
            ax.text(x + 0.22, y_offset, f"• {item}", fontsize=7.8, color="#E2E8F0", ha="left")
            y_offset -= 0.26

    # 1. Static EHR Data Ingestion
    draw_box(0.5, 4.6, 3.4, 2.9, 
             "1. Static Baseline EHR", 
             "Longitudinal Clinical Profile",
             [
                 "Patient Demographics (Age, Sex, BMI)",
                 "Hypertension & Type 2 Diabetes",
                 "Prior Cardiac Event / MI History",
                 "Baseline SBP / DBP (mmHg)",
                 "Lipids (Total Chol, HDL, LDL mg/dL)",
                 "Renal Labs (Creatinine, eGFR mL/min)",
                 "Audit Stamp & Provenance Seed=42"
             ],
             "#0F172A", "#38BDF8")

    # 2. Dynamic Wearable Streams
    draw_box(0.5, 1.3, 3.4, 3.0, 
             "2. Dynamic Wearable Telemetry", 
             "Time-Indexed Sensor Streams",
             [
                 "Continuous Heart Rate (bpm)",
                 "HRV RMSSD (Parasympathetic ms)",
                 "Nocturnal Sleep Duration (hours)",
                 "Sleep Quality Actigraphy Index (0-100)",
                 "Interval Physical Activity (Steps)",
                 "Estimated Ambulatory SBP (mmHg)",
                 "Simulated Packet Loss Dropout Flags",
                 "Strict Monotonic Timestamp Ordering"
             ],
             "#0F172A", "#2DD4BF")

    # 3. Preprocessing & Leakage-Free Feature Engineering
    draw_box(4.3, 2.2, 3.5, 5.3, 
             "3. Feature Engineering & Fusion", 
             "Strictly Causal Lookback Window",
             [
                 "Zero Future Lookahead at Prediction Time T",
                 "Rolling 6h & 24h Mean Heart Rate",
                 "Rolling 6h Mean & 24h Min HRV (RMSSD)",
                 "Autonomic Drift (Current HRV - 24h Mean)",
                 "Cumulative Nocturnal Sleep Deficit",
                 "Rolling 24h Total Steps & Cadence",
                 "Myocardial Rate-Pressure Product",
                 "Static EHR Non-Linear Risk Interaction",
                 "Patient-Level GroupShuffleSplit (Train/Test)",
                 "StandardScaler Fitted Strictly on Train Fold",
                 "Zero Cross-Patient Observation Overlap"
             ],
             "#1E293B", "#818CF8")

    # 4. ML Inference Engine & Models
    draw_box(8.2, 2.2, 3.6, 5.3, 
             "4. ML Modeling & Calibration", 
             "24-Hour Deterioration Forecasting",
             [
                 "Random Forest Comparison Classifier",
                 "  - 150 Trees, max_depth=6, leaf=4",
                 "  - ROC-AUC: 0.9367 | PR-AUC: 0.8939",
                 "  - Balanced F1-Score: 0.8295",
                 "Logistic Regression Baseline Model",
                 "  - L2 Regularization, Balanced Weights",
                 "  - ROC-AUC: 0.8217 | PR-AUC: 0.8233",
                 "Brier Calibration Loss: 0.1221 (RF)",
                 "Feature Importances (Gini Impurity)",
                 "Local Confidence Intervals & Uncertainty",
                 "What-If Counterfactual Inference Engine"
             ],
             "#1E293B", "#F43F5E")

    # 5. Persistence & SQLite Audit Trail
    draw_box(12.2, 4.8, 3.3, 2.7, 
             "5. SQLite Persistence", 
             "Audit Trail & Event Journal",
             [
                 "patients Table (Static Baseline)",
                 "wearable_readings (Time-Series)",
                 "predictions_audit (Score History)",
                 "simulation_events (Ingest Log)",
                 "Atomic State Reset Endpoint",
                 "Zero External Cloud / DB Needed"
             ],
             "#0F172A", "#FBBF24")

    # 6. FastAPI Backend & REST Endpoints
    draw_box(12.2, 1.3, 3.3, 3.2, 
             "6. FastAPI Backend Service", 
             "High-Performance Python REST",
             [
                 "GET /health",
                 "GET /api/patients & /{id}/ehr",
                 "GET /api/patients/{id}/wearables",
                 "GET /api/patients/{id}/predictions",
                 "POST /api/patients/{id}/simulate-update",
                 "POST /api/simulation/what-if",
                 "POST /api/simulation/reset",
                 "GET /api/evaluation (Genuine Metrics)",
                 "CORS Restricted to Local Origin"
             ],
             "#0F172A", "#34D399")

    # Bottom Banner: Research Dashboard (Frontend)
    draw_box(0.5, 0.15, 15.0, 0.9,
             "7. React + TypeScript Clinical Research Dashboard (Vite • Tailwind CSS • Recharts • Lucide)",
             "",
             [
                 "Screens: [A] Overview Dashboard  |  [B] Patient Digital Twin  |  [C] Live Simulation & What-If Studio  |  [D] Model Evaluation  |  [E] Explainability  |  [F] About & Methodology"
             ],
             "#0B132B", "#2DD4BF")

    # Draw Arrows
    arrow_props = dict(facecolor="#2DD4BF", edgecolor="#2DD4BF", width=1.5, headwidth=6, shrink=0.08)
    
    # 1 -> 3
    ax.annotate("", xy=(4.3, 5.8), xytext=(3.9, 5.8), arrowprops=arrow_props)
    # 2 -> 3
    ax.annotate("", xy=(4.3, 3.0), xytext=(3.9, 3.0), arrowprops=arrow_props)
    # 3 -> 4
    ax.annotate("", xy=(8.2, 4.8), xytext=(7.8, 4.8), arrowprops=arrow_props)
    # 4 -> 5
    ax.annotate("", xy=(12.2, 5.8), xytext=(11.8, 5.8), arrowprops=arrow_props)
    # 4 -> 6
    ax.annotate("", xy=(12.2, 3.0), xytext=(11.8, 3.0), arrowprops=arrow_props)
    # 6 -> 7
    ax.annotate("", xy=(8.0, 1.05), xytext=(8.0, 1.3), arrowprops=arrow_props)

    # Export PNG
    png_path = "artifacts/architecture_diagram.png"
    plt.savefig(png_path, facecolor=fig.get_facecolor(), dpi=150)
    print(f"[OK] Saved {png_path}")

    # Export Native Vector PDF
    pdf_path = "artifacts/architecture_diagram.pdf"
    plt.savefig(pdf_path, facecolor=fig.get_facecolor(), format="pdf")
    print(f"[OK] Saved {pdf_path}")
    
    plt.close()

if __name__ == "__main__":
    generate_diagrams()
