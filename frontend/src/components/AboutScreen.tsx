import React, { useState, useEffect } from "react";
import { Mail, ShieldCheck, CheckCircle2, AlertTriangle, FileText, BarChart3, Database } from "lucide-react";
import type { EvaluationReport } from "../types/api";
import { apiService } from "../services/api";

export const AboutScreen: React.FC = () => {
  const [subSection, setSubSection] = useState<"about" | "evaluation" | "explainability">("about");
  const [report, setReport] = useState<EvaluationReport | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await apiService.getEvaluationMetrics();
        setReport(data);
      } catch (err) {
        console.error("Failed to load evaluation metrics", err);
      }
    }
    loadMetrics();
  }, []);

  const lr = report?.models["Logistic Regression (Baseline)"];
  const rf = report?.models["Random Forest (Comparison)"];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">About & Model Details</h1>
          <p className="text-xs text-slate-400">CardioTwin AI project overview, validation benchmarks, and explainability</p>
        </div>

        {/* Sub-section Switcher */}
        <div className="inline-flex rounded-md bg-slate-900 p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => setSubSection("about")}
            className={`px-3 py-1 rounded transition-colors ${
              subSection === "about" ? "bg-slate-800 text-teal-300 font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSubSection("evaluation")}
            className={`px-3 py-1 rounded transition-colors ${
              subSection === "evaluation" ? "bg-slate-800 text-teal-300 font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Model Evaluation
          </button>
          <button
            onClick={() => setSubSection("explainability")}
            className={`px-3 py-1 rounded transition-colors ${
              subSection === "explainability" ? "bg-slate-800 text-teal-300 font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Explainability
          </button>
        </div>
      </div>

      {/* 1. About Overview */}
      {subSection === "about" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Project Information</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              CardioTwin AI is an academic proof-of-concept developed for the{" "}
              <strong>Digital Twin Challenge 2026</strong> organized by <strong>Happiest Health</strong>. It explores how
              fusing baseline EHR clinical records with continuous wearable sensor streams (Heart Rate, HRV RMSSD, Sleep,
              and Steps) creates a personalized digital avatar that estimates short-term deterioration risk.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Student Researcher</span>
                <span className="font-semibold text-white mt-0.5 block">Madabattula Tejo Hasini</span>
                <span className="text-[11px] text-slate-400">Solo Student Entry</span>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Institution</span>
                <span className="font-semibold text-white mt-0.5 block">Aditya University</span>
                <span className="text-[11px] text-slate-400">Andhra Pradesh, India</span>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Contact</span>
                <a
                  href="mailto:24b11ai223@adityauniversity.in"
                  className="font-mono text-teal-400 hover:underline mt-0.5 block text-[11px]"
                >
                  24b11ai223@adityauniversity.in
                </a>
                <span className="text-[11px] text-slate-400">MIT Open-Source License</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ethical Safeguards & Data Privacy</span>
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Synthetic Data:</strong> Zero Protected Health Information (PHI) was used. All patient records
                  and sensor signals are programmatically synthesized.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Local Execution:</strong> Operates entirely on the local machine without external cloud or paid LLM
                  dependencies.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Not a Medical Device:</strong> Does not predict real-world heart attacks or recommend medical
                  treatments.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Model Evaluation Sub-section */}
      {subSection === "evaluation" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Held-Out Patient Evaluation (N = 10 Patients, 1,110 Readings)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated with zero patient-level overlap using GroupShuffleSplit.
              </p>
            </div>

            {/* Metrics Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-sans">
                  <tr>
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Baseline (Logistic Regression)</th>
                    <th className="py-2.5 px-3 text-teal-300">Comparison (Random Forest)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">ROC-AUC</td>
                    <td className="py-2 px-3">{lr?.roc_auc.toFixed(4) ?? "0.8217"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.roc_auc.toFixed(4) ?? "0.9367"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">Average Precision (PR-AUC)</td>
                    <td className="py-2 px-3">{lr?.average_precision.toFixed(4) ?? "0.8233"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.average_precision.toFixed(4) ?? "0.8939"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">F1-Score</td>
                    <td className="py-2 px-3">{lr?.f1_score.toFixed(4) ?? "0.6733"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.f1_score.toFixed(4) ?? "0.8295"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">Precision</td>
                    <td className="py-2 px-3">{lr?.precision.toFixed(4) ?? "0.5551"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.precision.toFixed(4) ?? "0.7466"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">Recall (Sensitivity)</td>
                    <td className="py-2 px-3">{lr?.recall.toFixed(4) ?? "0.8553"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.recall.toFixed(4) ?? "0.9329"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans text-white font-medium">Brier Calibration Score</td>
                    <td className="py-2 px-3">{lr?.brier_score.toFixed(4) ?? "0.2373"}</td>
                    <td className="py-2 px-3 text-teal-400 font-bold">{rf?.brier_score.toFixed(4) ?? "0.1221"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Confusion Matrix Breakdown */}
            {rf && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Random Forest Confusion Matrix (N = 1,110):
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">True Neg (TN)</span>
                    <span className="font-bold text-white font-mono">{rf.confusion_matrix.true_negative}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">False Pos (FP)</span>
                    <span className="font-bold text-amber-400 font-mono">{rf.confusion_matrix.false_positive}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">False Neg (FN)</span>
                    <span className="font-bold text-rose-400 font-mono">{rf.confusion_matrix.false_negative}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">True Pos (TP)</span>
                    <span className="font-bold text-teal-400 font-mono">{rf.confusion_matrix.true_positive}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Explainability Sub-section */}
      {subSection === "explainability" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Predictive Features (Gini Importance)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative contribution to the 24-hour synthetic deterioration proxy.
              </p>
            </div>

            <div className="space-y-2">
              {report?.feature_importances.slice(0, 6).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span className="text-slate-300">{f.friendly_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-teal-400 h-full rounded-full" style={{ width: `${f.importance * 300}%` }}></div>
                    </div>
                    <span className="font-mono text-slate-400 w-12 text-right">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Correlation vs. Causation:</strong> Feature weights describe mathematical association within the
                training dataset. They do not prove clinical cause-and-effect.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
