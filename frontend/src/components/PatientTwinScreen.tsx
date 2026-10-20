import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  Moon, 
  Footprints, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  Info,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";
import { PatientEHR, WearableReading, PredictionRecord, PatientSummary } from "../types/api";
import { apiService } from "../services/api";

interface PatientTwinScreenProps {
  selectedPatientId: string;
  patients: PatientSummary[];
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTwinData() {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, wearRes] = await Promise.all([
          apiService.getPatientProfile(selectedPatientId),
          apiService.getPatientWearables(selectedPatientId, 50),
        ]);
        if (isMounted) {
          setEhr(profileRes.patient);
          setPrediction(profileRes.latest_prediction);
          setReadings(wearRes.readings);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load patient twin data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTwinData();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  // Format timestamps for Recharts
  const chartData = readings.map((r, idx) => {
    const d = new Date(r.timestamp);
    const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:00`;
    return {
      time: timeStr,
      heartRate: r.heart_rate_bpm,
      hrv: r.hrv_rmssd_ms,
      sleep: r.sleep_hours,
      sleepQuality: r.sleep_quality_score,
      steps: r.steps_interval,
      sbp: r.estimated_systolic_bp,
      isMissing: r.is_missing,
      index: idx + 1,
    };
  });

  const rfProb = prediction?.rf_deterioration_prob ?? 0.15;
  const lrProb = prediction?.lr_deterioration_prob ?? 0.18;
  const ci = prediction?.confidence_interval ?? [Math.max(0, rfProb - 0.08), Math.min(1, rfProb + 0.08)];

  return (
    <div className="space-y-6">
      {/* Patient Header & Selector Toolbar */}
      <div className="glass-panel p-4 border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg font-mono">
            PT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">{selectedPatientId}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {ehr?.age ?? "--"} yrs • {ehr?.sex ?? "--"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                rfProb >= 0.65 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                rfProb >= 0.30 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {prediction?.risk_category ?? "Low"} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Virtual Twin Instance • State updated via continuous telemetry
            </p>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="patient-select" className="text-xs text-slate-400">Select Twin:</label>
          <div className="relative">
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} ({p.age}y {p.sex} • SBP {p.baseline_systolic_bp})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => onNavigateTab("simulation")}
            className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-semibold text-xs hover:bg-teal-400 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate Readings</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Synthesizing virtual patient digital twin state...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 border-rose-800 bg-rose-950/20 text-rose-300 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400" />
          <div>
            <h4 className="font-semibold text-sm">Failed to Load Patient Twin</h4>
            <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Twin Profile: Static Baseline EHR vs Dynamic 24h Model Output */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Static EHR Baseline Card */}
            <div className="glass-panel p-5 border-slate-800 lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">A. Static Baseline EHR</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">EHR Profile</span>
              </div>

              {/* Patient Core Baseline Attributes */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Baseline Blood Pressure</span>
                  <span className="font-semibold text-slate-100 font-mono text-sm">
                    {ehr?.baseline_systolic_bp}/{ehr?.baseline_diastolic_bp} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Body Mass Index (BMI)</span>
                  <span className="font-semibold text-slate-100 font-mono text-sm">
                    {ehr?.bmi} <span className="text-[10px] font-normal text-slate-400">kg/m²</span>
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">LDL Cholesterol</span>
                  <span className="font-semibold text-slate-100 font-mono text-sm">
                    {ehr?.ldl_mg_dl} <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">eGFR Filtration Rate</span>
                  <span className="font-semibold text-slate-100 font-mono text-sm">
                    {ehr?.egfr_ml_min} <span className="text-[10px] font-normal text-slate-400">mL/min</span>
                  </span>
                </div>
              </div>

              {/* Comorbidities & Medical History */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Clinical Risk Factors:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    ehr?.hypertension ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    Hypertension: {ehr?.hypertension ? "Yes" : "No"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    ehr?.diabetes ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    Diabetes: {ehr?.diabetes ? "Yes" : "No"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    ehr?.prior_cardiac_event ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    Prior Cardiac Event: {ehr?.prior_cardiac_event ? "Yes" : "None"}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                    Smoking: {ehr?.smoking_status}
                  </span>
                </div>
              </div>

              {/* Data Provenance & Missing Indicator Note */}
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  <span>Provenance & Audit Stamp</span>
                </div>
                <p className="text-[10px] leading-tight font-mono">{ehr?.data_provenance}</p>
                <p className="text-[10px] text-slate-500">Record Created: {ehr?.created_at?.split("T")[0]}</p>
              </div>
            </div>

            {/* 2. Real-time Model Prediction & Explainability */}
            <div className="glass-panel p-5 border-slate-800 lg:col-span-2 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      C. Digital-Twin Output: 24h Deterioration Proxy Score
                    </h3>
                  </div>
                  <span className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30 font-mono">
                    Horizon: 24 Hours
                  </span>
                </div>

                {/* Score Gauge & Model Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 font-medium">Random Forest Estimate</span>
                    <div className="mt-2 text-4xl font-extrabold" style={{ color: prediction?.risk_color ?? "#34D399" }}>
                      {Math.round(rfProb * 100)}%
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      95% CI: [{Math.round(ci[0] * 100)}% - {Math.round(ci[1] * 100)}%]
                    </span>
                    <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.round(rfProb * 100)}%`,
                          backgroundColor: prediction?.risk_color ?? "#34D399"
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 font-medium">Logistic Regression Baseline</span>
                    <div className="mt-2 text-4xl font-extrabold text-slate-300">
                      {Math.round(lrProb * 100)}%
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Standardized linear model
                    </span>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Difference: {Math.round((rfProb - lrProb) * 100)}%
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col justify-center text-xs space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Prediction Meaning:</span>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Calculates the mathematical probability of acute autonomic collapse (HRV ≤ 18 ms) or sustained tachycardia (HR ≥ 95 bpm) emerging over the subsequent 24-hour telemetry window.
                    </p>
                    <div className="pt-1 text-[10px] text-amber-300/80 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Not a medical heart attack diagnosis.</span>
                    </div>
                  </div>
                </div>

                {/* Top Contributing Features for this specific patient */}
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Top Contributing Features for this Prediction:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prediction?.top_contributing_features?.slice(0, 4).map((f, i) => (
                      <div 
                        key={i} 
                        className="bg-slate-900/70 p-2.5 rounded border border-slate-800/90 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-200 block text-[11px]">{f.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Current: {f.current_value}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          f.direction === "Risk Escalator"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}>
                          {f.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button to What-If Lab */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Curious how lifestyle or medication would change this score?</span>
                <button
                  onClick={() => onNavigateTab("simulation")}
                  className="px-3 py-1.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold hover:bg-teal-500/30 transition-all"
                >
                  Test Interventions in What-If Lab →
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Wearable Telemetry Visualizations (B. DYNAMIC WEARABLE DATA) */}
          <div className="glass-panel p-5 border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <span>B. Dynamic Wearable Time-Series Stream</span>
                </h3>
                <p className="text-xs text-slate-400">Sequential multi-day observations (3-hour intervals) with missing packet indicators</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Heart Rate (bpm)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> HRV RMSSD (ms)
                </span>
                <span className="text-slate-500 font-mono">Total Observations: {readings.length}</span>
              </div>
            </div>

            {/* 1. Heart Rate & HRV RMSSD Stream Chart */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="font-semibold">Heart Rate (bpm) & Parasympathetic HRV (RMSSD ms)</span>
                <span className="text-slate-400 text-[11px]">Dotted lines indicate normal resting baseline</span>
              </div>
              <div className="h-64 w-full bg-slate-900/40 rounded-lg p-2 border border-slate-800/80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" domain={[40, 140]} stroke="#F87171" fontSize={10} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 90]} stroke="#2DD4BF" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                      labelStyle={{ color: "#F8FAFC", fontWeight: "bold" }}
                    />
                    <ReferenceLine yAxisId="left" y={100} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Tachycardia (100)", fill: "#EF4444", fontSize: 9 }} />
                    <ReferenceLine yAxisId="right" y={18} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "Autonomic Distress (18ms)", fill: "#F59E0B", fontSize: 9 }} />
                    <Line yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#F87171" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="hrv" name="HRV RMSSD (ms)" stroke="#2DD4BF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Split Row: Sleep Duration & Cumulative Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sleep Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nocturnal Sleep (Hours / Night)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Target: 7.0 - 8.5h</span>
                </div>
                <div className="h-44 w-full bg-slate-900/40 rounded-lg p-2 border border-slate-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={9} tickLine={false} />
                      <YAxis domain={[0, 10]} stroke="#818CF8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }} />
                      <ReferenceLine y={7.0} stroke="#34D399" strokeDasharray="3 3" label={{ value: "Target (7h)", fill: "#34D399", fontSize: 9 }} />
                      <Bar dataKey="sleep" name="Sleep (Hours)" fill="#818CF8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Physical Activity (Steps) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Physical Activity (Steps per 3h Interval)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Ambulatory Actigraphy</span>
                </div>
                <div className="h-44 w-full bg-slate-900/40 rounded-lg p-2 border border-slate-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={9} tickLine={false} />
                      <YAxis stroke="#38BDF8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="steps" name="Steps" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
