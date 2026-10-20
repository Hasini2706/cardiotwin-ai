import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Activity, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
          apiService.getPatientWearables(selectedPatientId, 30),
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
  const riskColor = rfProb >= 0.65 ? "#F87171" : rfProb >= 0.30 ? "#FBBF24" : "#34D399";
  const badgeClass =
    rfProb >= 0.65
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : rfProb >= 0.30
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`;
    return {
      time: timeStr,
      heartRate: r.heart_rate_bpm,
      hrv: r.hrv_rmssd_ms,
      sleep: r.sleep_hours,
      steps: r.steps_interval,
    };
  });

  const metricConfig = {
    heartRate: { name: "Heart Rate", unit: "bpm", color: "#F87171", dataKey: "heartRate" },
    hrv: { name: "HRV (RMSSD)", unit: "ms", color: "#2DD4BF", dataKey: "hrv" },
    sleep: { name: "Sleep", unit: "hours", color: "#818CF8", dataKey: "sleep" },
    steps: { name: "Steps", unit: "steps", color: "#38BDF8", dataKey: "steps" },
  }[selectedMetric];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Patient Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F172A] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded-md pl-3 pr-8 py-1 text-sm font-semibold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-sm text-slate-300">
            {ehr?.age} yrs • {ehr?.sex} • BMI {ehr?.bmi}
          </span>
        </div>

        <button
          onClick={() => onNavigateTab("simulation")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Simulate New Reading</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading patient digital twin...</div>
      ) : (
        <>
          {/* Risk Score & Model Explanation Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Experimental Risk Score</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono" style={{ color: riskColor }}>
                    {Math.round(rfProb * 100)}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
                    {riskCategory} Risk
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm">
                Synthetic deterioration proxy probability over a 24-hour future window.
              </p>
            </div>

            {/* Contributing Factors Explanation */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Factors Associated with Model Output:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {prediction?.top_contributing_features?.slice(0, 4).map((f, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-200 block text-[11px] font-medium">{f.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Value: {f.current_value}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        f.direction === "Risk Escalator"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {f.direction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Health Information (with expandable additional clinical data) */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Historical Health Information</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Baseline Blood Pressure</span>
                <span className="font-semibold text-white font-mono mt-0.5 block">
                  {ehr?.baseline_systolic_bp}/{ehr?.baseline_diastolic_bp} mmHg
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Hypertension History</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {ehr?.hypertension ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Type 2 Diabetes</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {ehr?.diabetes ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Smoking Status</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {ehr?.smoking_status}
                </span>
              </div>
            </div>

            {/* Expandable Section for Additional Clinical Details */}
            <details className="group pt-2 border-t border-slate-800/60">
              <summary className="cursor-pointer text-xs font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1.5 py-1">
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                <span>Show Additional Clinical Labs & Data Provenance</span>
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-500 block text-[10px]">LDL Cholesterol</span>
                  <span className="font-mono text-slate-200">{ehr?.ldl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-500 block text-[10px]">HDL Cholesterol</span>
                  <span className="font-mono text-slate-200">{ehr?.hdl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-500 block text-[10px]">eGFR Filtration</span>
                  <span className="font-mono text-slate-200">{ehr?.egfr_ml_min} mL/min</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-500 block text-[10px]">Fasting Glucose</span>
                  <span className="font-mono text-slate-200">{ehr?.fasting_glucose_mg_dl} mg/dL</span>
                </div>
                <div className="col-span-2 sm:col-span-4 p-2 rounded bg-slate-900/60 text-[11px] text-slate-400">
                  Provenance: <span className="font-mono text-slate-300">{ehr?.data_provenance}</span>
                </div>
              </div>
            </details>
          </div>

          {/* Wearable Trend Chart */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Wearable Telemetry Stream</h2>

              {/* Selector */}
              <div className="inline-flex rounded-md bg-slate-900 p-0.5 border border-slate-800">
                {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
                  const labels = { heartRate: "Heart Rate", hrv: "HRV", sleep: "Sleep", steps: "Steps" };
                  const isSelected = selectedMetric === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMetric(m)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        isSelected ? "bg-slate-800 text-teal-300 font-medium" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B1120",
                      borderColor: "#334155",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} ${metricConfig.unit}`, metricConfig.name]}
                  />
                  <Line
                    type="monotone"
                    dataKey={metricConfig.dataKey}
                    stroke={metricConfig.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
