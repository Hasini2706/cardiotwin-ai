import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Activity, RefreshCw, Heart, Zap, FileText, ArrowRight, ShieldAlert, Cpu } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { PatientEHR, WearableReading, PredictionRecord, PatientSummary } from "../types/api";
import { apiService } from "../services/api";

interface PatientTwinScreenProps {
  selectedPatientId: string;
  patients: PatientSummary[];
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

type MetricType = "heartRate" | "hrv" | "sleep" | "steps";

export const PatientTwinScreen: React.FC<PatientTwinScreenProps> = ({
  selectedPatientId,
  patients,
  onSelectPatient,
  onNavigateTab,
}) => {
  const [ehr, setEhr] = useState<PatientEHR | null>(null);
  const [readings, setReadings] = useState<WearableReading[]>([]);
  const [prediction, setPrediction] = useState<PredictionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("heartRate");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [profileRes, wearRes] = await Promise.all([
          apiService.getPatientProfile(selectedPatientId),
          apiService.getPatientWearables(selectedPatientId, 25),
        ]);
        if (isMounted) {
          setEhr(profileRes.patient);
          setPrediction(profileRes.latest_prediction);
          setReadings(wearRes.readings);
        }
      } catch (err) {
        console.error("Failed to load patient twin", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  const rfProb = prediction?.rf_deterioration_prob ?? 0.15;
  const riskCategory = prediction?.risk_category ?? "Low";
  const isHighRisk = rfProb >= 0.65;
  const isModerateRisk = rfProb >= 0.30 && rfProb < 0.65;
  const riskColor = isHighRisk ? "#FF2E63" : isModerateRisk ? "#FBBF24" : "#21D4C2";

  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    return {
      time: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`,
      heartRate: r.heart_rate_bpm,
      hrv: r.hrv_rmssd_ms,
      sleep: r.sleep_hours,
      steps: r.steps_interval,
    };
  });

  const metricConfigs = {
    heartRate: { name: "Heart Rate", unit: "bpm", color: "#FF2E63" },
    hrv: { name: "HRV (RMSSD)", unit: "ms", color: "#21D4C2" },
    sleep: { name: "Sleep", unit: "hrs", color: "#A78BFA" },
    steps: { name: "Steps", unit: "steps", color: "#38BDF8" },
  };

  const activeConf = metricConfigs[selectedMetric];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Patient Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 twin-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Active Twin Dossier</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {selectedPatientId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {ehr?.age} yrs • {ehr?.sex} • BMI {ehr?.bmi} • {ehr?.smoking_status}
            </p>
          </div>
        </div>

        {/* Quick Select & Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="appearance-none bg-[#090b1c] border border-white/15 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-white focus:outline-none focus:border-rose-500 cursor-pointer shadow-sm"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} (Age {p.age})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => onNavigateTab("simulation")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs transition-all shadow-md shrink-0"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Launch Simulation</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 twin-card rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-3" />
          Synchronizing Digital Twin telemetry & multi-modal EHR records...
        </div>
      ) : (
        <>
          {/* Risk Prediction Banner */}
          <div className="twin-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
                  Algorithmic Deterioration Prediction (24-Hour Horizon)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black font-mono tracking-tight" style={{ color: riskColor }}>
                    {Math.round(rfProb * 100)}%
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border"
                    style={{
                      color: riskColor,
                      borderColor: `${riskColor}50`,
                      backgroundColor: `${riskColor}15`
                    }}
                  >
                    {riskCategory} Risk
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Calibrated Random Forest model evaluating non-linear interactions across resting autonomic tone, nocturnal heart rate elevation, and baseline cardiovascular comorbidities.
              </p>
            </div>

            {/* Contributing Features / Explainability */}
            <div>
              <span className="text-xs font-bold text-white block mb-2.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Primary Drivers of Model Output:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {prediction?.top_contributing_features?.slice(0, 4).map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#090b1c] border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                  >
                    <div>
                      <span className="text-slate-200 block text-xs font-semibold">{f.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono">Current: {f.current_value}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold border ${
                        f.direction === "Risk Escalator"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : "bg-teal-500/10 text-teal-300 border-teal-500/30"
                      }`}
                    >
                      {f.direction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Health Record & Clinical Biomarkers */}
          <div className="twin-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Clinical EHR Phenotype & Biomarkers</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">SQLite Verified</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Resting Blood Pressure</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  {ehr?.baseline_systolic_bp} / {ehr?.baseline_diastolic_bp} <span className="text-[10px] text-slate-500 font-normal">mmHg</span>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Hypertension History</span>
                <span className={`text-sm font-semibold mt-0.5 block ${ehr?.hypertension ? "text-rose-400" : "text-slate-300"}`}>
                  {ehr?.hypertension ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Type 2 Diabetes</span>
                <span className={`text-sm font-semibold mt-0.5 block ${ehr?.diabetes ? "text-rose-400" : "text-slate-300"}`}>
                  {ehr?.diabetes ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/5">
                <span className="text-slate-400 block text-[11px]">Smoking Status</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">
                  {ehr?.smoking_status}
                </span>
              </div>
            </div>

            {/* Expandable Labs */}
            <details className="group pt-2 border-t border-white/5">
              <summary className="cursor-pointer text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                <span>View Full Serum Lab Biomarkers (LDL, HDL, Fasting Glucose, eGFR)</span>
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#090b1c] border border-white/5">
                  <span className="text-slate-400 block text-[10px]">LDL Cholesterol</span>
                  <span className="font-mono font-bold text-slate-200">{ehr?.ldl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#090b1c] border border-white/5">
                  <span className="text-slate-400 block text-[10px]">HDL Cholesterol</span>
                  <span className="font-mono font-bold text-slate-200">{ehr?.hdl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#090b1c] border border-white/5">
                  <span className="text-slate-400 block text-[10px]">eGFR Filtration</span>
                  <span className="font-mono font-bold text-slate-200">{ehr?.egfr_ml_min} mL/min</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#090b1c] border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Fasting Glucose</span>
                  <span className="font-mono font-bold text-slate-200">{ehr?.fasting_glucose_mg_dl} mg/dL</span>
                </div>
              </div>
            </details>
          </div>

          {/* Wearable Trend Chart */}
          <div className="twin-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Wearable Telemetry Time-Series</h3>
                <p className="text-[11px] text-slate-400">Continuous ambulatory telemetry observations</p>
              </div>

              <div className="inline-flex rounded-xl bg-[#070914] p-1 border border-white/10 text-xs">
                {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
                  const conf = metricConfigs[m];
                  const isSelected = selectedMetric === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMetric(m)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#181d38] text-white font-semibold shadow-sm border border-white/15"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {conf.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`gradient-twin-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeConf.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={activeConf.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#171b30" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c0f22",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
                    }}
                    formatter={(val: any) => [`${val} ${activeConf.unit}`, activeConf.name]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={activeConf.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#gradient-twin-${selectedMetric})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
