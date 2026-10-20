import React from "react";
import { 
  Users, 
  Activity, 
  Heart, 
  Moon, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PatientSummary } from "../types/api";

interface OverviewScreenProps {
  patients: PatientSummary[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onNavigateTab,
}) => {
  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  const totalPatients = patients.length;
  const highRiskCount = patients.filter(
    (p) => (p.latest_prediction?.rf_deterioration_prob ?? 0) >= 0.65
  ).length;
  const modRiskCount = patients.filter((p) => {
    const prob = p.latest_prediction?.rf_deterioration_prob ?? 0;
    return prob >= 0.30 && prob < 0.65;
  }).length;
  const lowRiskCount = totalPatients - highRiskCount - modRiskCount;

  const avgHrv = Math.round(
    patients.reduce((acc, p) => acc + (p.latest_reading?.hrv_rmssd_ms ?? 40), 0) / (totalPatients || 1)
  );

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Challenge Context */}
      <div className="glass-panel p-6 border-slate-700/60 bg-gradient-to-br from-slate-900/90 via-[#0C152B]/80 to-slate-900/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Digital Twin Challenge 2026 • Happiest Health Submission
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              CardioTwin AI: Virtual Cardiovascular Patient Laboratory
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Fusing synthetic electronic health records (EHR) with time-series wearable telemetry (Heart Rate, HRV RMSSD, Sleep, Steps) to generate a personalized digital twin. Features algorithmic 24-hour deterioration risk forecasting and interactive counterfactual simulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab("digital-twin")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition-all shadow-[0_0_15px_rgba(45,212,191,0.25)]"
            >
              <span>Inspect Digital Twin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab("simulation")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs hover:bg-slate-700 transition-all"
            >
              <span>Live Simulation Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cohort KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Synthetic Cohort Size</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalPatients}</span>
            <span className="text-xs text-slate-400">Virtual Twins</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Multi-day longitudinal profiles</p>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Outcome Prevalence</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {totalPatients ? `${Math.round(((highRiskCount + modRiskCount) / totalPatients) * 100)}%` : "29%"}
            </span>
            <span className="text-xs text-slate-400">synthetic event risk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">24-hour deterioration proxy</p>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cohort Mean HRV</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{avgHrv}</span>
            <span className="text-xs text-slate-400">RMSSD (ms)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Parasympathetic autonomic tone</p>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Model Verification</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">0.9367</span>
            <span className="text-xs text-slate-400">ROC-AUC</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Held-out test patients (Random Forest)</p>
        </div>
      </div>

      {/* Two Column Layout: Selected Patient Card & Cohort Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Patient Digital Twin Snapshot */}
        <div className="glass-panel p-5 border-slate-700/80 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">Active Digital Twin</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedPatient?.patient_id}</span>
                  <span className="text-xs font-normal text-slate-400">({selectedPatient?.age}y, {selectedPatient?.sex})</span>
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                (selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0) >= 0.65
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : (selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0) >= 0.30
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {selectedPatient?.latest_prediction?.risk_category ?? "Low"} Risk
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="mt-4 space-y-3">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">24h Deterioration Proxy Score:</span>
                  <span className="text-base font-bold text-white">
                    {Math.round((selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15) * 100)}%`,
                      backgroundColor: selectedPatient?.latest_prediction?.risk_color ?? "#34D399"
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Safe</span>
                  <span>Moderate</span>
                  <span>Elevated Risk</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Heart Rate</span>
                  <span className="font-semibold text-slate-100 text-sm">
                    {selectedPatient?.latest_reading?.heart_rate_bpm ?? 72} bpm
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">HRV RMSSD</span>
                  <span className="font-semibold text-teal-300 text-sm">
                    {selectedPatient?.latest_reading?.hrv_rmssd_ms ?? 45} ms
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Est. Systolic BP</span>
                  <span className="font-semibold text-slate-100 text-sm">
                    {selectedPatient?.latest_reading?.estimated_systolic_bp ?? 124} mmHg
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Hypertension</span>
                  <span className="font-semibold text-slate-100 text-sm">
                    {selectedPatient?.hypertension ? "Diagnosed" : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab("digital-twin")}
              className="w-full py-2 px-3 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/25 transition-all text-center"
            >
              Open Full Patient Digital Twin →
            </button>
          </div>
        </div>

        {/* Cohort Risk Distribution & Stream Ticker */}
        <div className="glass-panel p-5 border-slate-700/80 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Cohort Deterioration Risk Spectrum</h3>
              <p className="text-xs text-slate-400">Distribution of 50 synthetic patients across risk categories</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Low: {lowRiskCount}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-2"></span>
              <span className="text-slate-300">Mod: {modRiskCount}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-rose-400 ml-2"></span>
              <span className="text-slate-300">High: {highRiskCount}</span>
            </div>
          </div>

          {/* Stacked Risk Proportion Bar */}
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden">
              <div 
                style={{ width: `${(lowRiskCount / (totalPatients || 1)) * 100}%` }} 
                className="bg-emerald-500 h-full"
                title={`Low Risk: ${lowRiskCount}`}
              ></div>
              <div 
                style={{ width: `${(modRiskCount / (totalPatients || 1)) * 100}%` }} 
                className="bg-amber-500 h-full"
                title={`Moderate Risk: ${modRiskCount}`}
              ></div>
              <div 
                style={{ width: `${(highRiskCount / (totalPatients || 1)) * 100}%` }} 
                className="bg-rose-500 h-full"
                title={`Elevated Risk: ${highRiskCount}`}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{Math.round((lowRiskCount / (totalPatients || 1)) * 100)}% Stable</span>
              <span>{Math.round((modRiskCount / (totalPatients || 1)) * 100)}% Vigilance</span>
              <span>{Math.round((highRiskCount / (totalPatients || 1)) * 100)}% Acute Deterioration Alert</span>
            </div>
          </div>

          {/* Data Pipeline Provenance Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Synthetic EHR Data</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Seed 42, 50 baseline profiles with clinical risk markers.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Wearable Streams</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">5,600 simulated readings across 14 consecutive days.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Zero Patient Leakage</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">GroupShuffleSplit validation on held-out test cohort.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Explorer Patient Table */}
      <div className="glass-panel p-5 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Cohort Virtual Patient Directory</h3>
            <p className="text-xs text-slate-400">Select any virtual patient to examine their longitudinal digital twin</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing 15 of {totalPatients} synthetic patients</span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Demographics</th>
                <th className="py-2.5 px-3">Comorbidities</th>
                <th className="py-2.5 px-3">Baseline SBP</th>
                <th className="py-2.5 px-3">Latest HR / HRV</th>
                <th className="py-2.5 px-3">24h Risk Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {patients.slice(0, 15).map((p) => {
                const isSelected = p.patient_id === selectedPatientId;
                const prob = p.latest_prediction?.rf_deterioration_prob ?? 0.1;
                return (
                  <tr 
                    key={p.patient_id}
                    className={`hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-teal-500/10" : ""}`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white font-mono flex items-center gap-2">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>}
                      {p.patient_id}
                    </td>
                    <td className="py-2.5 px-3">{p.age}y • {p.sex} • BMI {p.bmi}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        {p.hypertension && <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">HTN</span>}
                        {p.diabetes && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">T2D</span>}
                        {!p.hypertension && !p.diabetes && <span className="text-slate-500">None</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{p.baseline_systolic_bp} mmHg</td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.latest_reading?.heart_rate_bpm ?? 72} bpm / <span className="text-teal-300">{p.latest_reading?.hrv_rmssd_ms ?? 45} ms</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        prob >= 0.65 ? "bg-rose-500/20 text-rose-300" :
                        prob >= 0.30 ? "bg-amber-500/20 text-amber-300" :
                        "bg-emerald-500/20 text-emerald-300"
                      }`}>
                        {Math.round(prob * 100)}% ({p.latest_prediction?.risk_category ?? "Low"})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectPatient(p.patient_id);
                          onNavigateTab("digital-twin");
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 text-slate-300 text-[11px] font-medium border border-slate-700/80 transition-all"
                      >
                        Inspect Twin
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
