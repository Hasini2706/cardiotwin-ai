import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Activity, Clock, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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
          apiService.getPatientWearables(selectedPatientId, 32),
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
  const riskColor = rfProb >= 0.65 ? "#F87171" : rfProb >= 0.30 ? "#FBBF24" : "#21D4C2";
  const badgeClass =
    rfProb >= 0.65
      ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
      : rfProb >= 0.30
      ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
      : "bg-[#21D4C2]/10 text-[#21D4C2] border-[#21D4C2]/25";

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
    hrv: { name: "HRV (RMSSD)", unit: "ms", color: "#21D4C2", dataKey: "hrv" },
    sleep: { name: "Sleep Duration", unit: "hrs", color: "#818CF8", dataKey: "sleep" },
    steps: { name: "Activity Steps", unit: "steps", color: "#38BDF8", dataKey: "steps" },
  }[selectedMetric];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Patient Summary Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101827] border border-[#263449] rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#141F30] border border-[#263449] flex items-center justify-center text-[#21D4C2] shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedPatientId}
                  onChange={(e) => onSelectPatient(e.target.value)}
                  className="appearance-none bg-[#141F30] border border-[#263449] rounded-md pl-2.5 pr-7 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#21D4C2] cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-300">
                Age <strong className="text-white font-medium">{ehr?.age ?? "--"}</strong> • {ehr?.sex ?? "--"} • BMI {ehr?.bmi ?? "--"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("simulation")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21D4C2] hover:bg-[#1dbfae] text-slate-950 font-semibold text-xs transition-colors shrink-0 shadow-sm"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Simulate Telemetry Update</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-[#101827] border border-[#263449] rounded-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-[#21D4C2] mx-auto mb-2" />
          Loading patient digital twin...
        </div>
      ) : (
        <>
          {/* Current Experimental Model Output & Feature Contributors */}
          <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#263449]/70">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                  Current Experimental Model Output
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-bold font-mono tracking-tight" style={{ color: riskColor }}>
                    {Math.round(rfProb * 100)}%
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeClass}`}>
                    {riskCategory} Risk
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm">
                Estimated probability of 24-hour deterioration proxy based on joint fusion of baseline clinical history and continuous wearable streams.
              </p>
            </div>

            {/* Carefully Worded Feature Attribution */}
            <div>
              <span className="text-xs font-semibold text-white tracking-tight block mb-2.5">
                Key Factors Associated with Current Output
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {prediction?.top_contributing_features?.slice(0, 4).map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#141F30] border border-[#263449] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-200 block text-xs font-medium">{f.label}</span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        Value: {f.current_value}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        f.direction === "Risk Escalator"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                      }`}
                    >
                      {f.direction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Health Information (Collapsible) */}
          <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-white tracking-tight">Historical Clinical Record (EHR)</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#141F30] border border-[#263449]">
                <span className="text-slate-400 block text-[11px]">Baseline Blood Pressure</span>
                <span className="font-semibold text-white font-mono mt-1 block">
                  {ehr?.baseline_systolic_bp}/{ehr?.baseline_diastolic_bp} mmHg
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141F30] border border-[#263449]">
                <span className="text-slate-400 block text-[11px]">Hypertension History</span>
                <span className="font-semibold text-white mt-1 block">
                  {ehr?.hypertension ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141F30] border border-[#263449]">
                <span className="text-slate-400 block text-[11px]">Type 2 Diabetes</span>
                <span className="font-semibold text-white mt-1 block">
                  {ehr?.diabetes ? "Diagnosed" : "None"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#141F30] border border-[#263449]">
                <span className="text-slate-400 block text-[11px]">Smoking Status</span>
                <span className="font-semibold text-white mt-1 block">
                  {ehr?.smoking_status}
                </span>
              </div>
            </div>

            {/* Collapsible Accordion for Labs & Provenance */}
            <details className="group pt-2 border-t border-[#263449]/70">
              <summary className="cursor-pointer text-xs font-medium text-[#21D4C2] hover:text-[#1dbfae] flex items-center gap-1.5 py-1.5 transition-colors select-none">
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                <span>Show Additional Clinical Labs & Data Provenance</span>
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#141F30]/70 border border-[#263449]">
                  <span className="text-slate-400 block text-[10px]">LDL Cholesterol</span>
                  <span className="font-mono text-slate-200 mt-0.5 block">{ehr?.ldl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141F30]/70 border border-[#263449]">
                  <span className="text-slate-400 block text-[10px]">HDL Cholesterol</span>
                  <span className="font-mono text-slate-200 mt-0.5 block">{ehr?.hdl_mg_dl} mg/dL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141F30]/70 border border-[#263449]">
                  <span className="text-slate-400 block text-[10px]">eGFR Filtration</span>
                  <span className="font-mono text-slate-200 mt-0.5 block">{ehr?.egfr_ml_min} mL/min</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141F30]/70 border border-[#263449]">
                  <span className="text-slate-400 block text-[10px]">Fasting Glucose</span>
                  <span className="font-mono text-slate-200 mt-0.5 block">{ehr?.fasting_glucose_mg_dl} mg/dL</span>
                </div>
                <div className="col-span-2 sm:col-span-4 p-2.5 rounded-lg bg-[#141F30]/70 border border-[#263449] text-[11px] text-slate-400">
                  Data Provenance: <span className="font-mono text-slate-300">{ehr?.data_provenance}</span>
                </div>
              </div>
            </details>
          </div>

          {/* Wearable History Chart */}
          <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">Wearable Telemetry History</h2>
                <p className="text-[11px] text-slate-400">Time-series signals fed into the feature engineer</p>
              </div>

              {/* Selector */}
              <div className="inline-flex rounded-lg bg-[#141F30] p-0.5 border border-[#263449] text-xs">
                {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
                  const labels = { heartRate: "Heart Rate", hrv: "HRV", sleep: "Sleep", steps: "Steps" };
                  const isSelected = selectedMetric === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMetric(m)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        isSelected
                          ? "bg-[#101827] text-[#21D4C2] font-medium border border-[#263449]"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="patientAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#101827",
                      borderColor: "#263449",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} ${metricConfig.unit}`, metricConfig.name]}
                  />
                  <Area
                    type="monotone"
                    dataKey={metricConfig.dataKey}
                    stroke={metricConfig.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#patientAreaGrad)"
                    activeDot={{ r: 4, fill: metricConfig.color, stroke: "#101827", strokeWidth: 2 }}
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
