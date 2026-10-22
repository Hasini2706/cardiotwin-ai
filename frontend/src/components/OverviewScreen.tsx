import React, { useState, useEffect } from "react";
import { ChevronDown, ArrowRight, Activity, Clock, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { PatientSummary, WearableReading } from "../types/api";
import { apiService } from "../services/api";

interface OverviewScreenProps {
  patients: PatientSummary[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

type MetricType = "heartRate" | "hrv" | "sleep" | "steps";

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onNavigateTab,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("heartRate");
  const [readings, setReadings] = useState<WearableReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  const loadTrends = async () => {
    if (!selectedPatientId) return;
    setLoadingReadings(true);
    try {
      const res = await apiService.getPatientWearables(selectedPatientId, 25);
      setReadings(res.readings);
    } catch (err) {
      console.error("Failed to load overview readings", err);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [selectedPatientId]);

  const handleSimulate = async () => {
    if (!selectedPatientId) return;
    setSimulating(true);
    try {
      const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
      const baseHr = latestReading?.heart_rate_bpm ?? 75;
      const baseHrv = latestReading?.hrv_rmssd_ms ?? 40;
      
      const simHr = Math.min(130, Math.max(52, Math.round(baseHr + (Math.random() * 8 - 4))));
      const simHrv = Math.min(85, Math.max(16, Math.round(baseHrv + (Math.random() * 6 - 3))));

      await apiService.simulateTelemetryUpdate(selectedPatientId, {
        heart_rate_bpm: simHr,
        hrv_rmssd_ms: simHrv,
        sleep_hours: 7.0,
        steps_interval: 1400,
      });

      await loadTrends();
    } catch (err: any) {
      console.error("Simulation error", err);
    } finally {
      setSimulating(false);
    }
  };

  const riskProb = selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15;
  const riskCategory = selectedPatient?.latest_prediction?.risk_category ?? "Low";
  
  const riskColor = riskProb >= 0.65 ? "#FF2E63" : riskProb >= 0.30 ? "#FBBF24" : "#21D4C2";
  const badgeClass =
    riskProb >= 0.65
      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
      : riskProb >= 0.30
      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
      : "bg-teal-500/10 text-teal-300 border-teal-500/30";

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

  const metricConfig = {
    heartRate: { name: "Heart Rate", unit: "bpm", color: "#FF2E63", dataKey: "heartRate" },
    hrv: { name: "HRV", unit: "ms", color: "#21D4C2", dataKey: "hrv" },
    sleep: { name: "Sleep", unit: "hrs", color: "#A78BFA", dataKey: "sleep" },
    steps: { name: "Steps", unit: "steps", color: "#38BDF8", dataKey: "steps" },
  }[selectedMetric];

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const latestTimeStr = latest?.timestamp
    ? new Date(latest.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "Recently synced";

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Simple, Elegant Header with heart artwork seamlessly integrated into the right side */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">CardioTwin AI</h1>
          <p className="text-xs text-slate-400">
            A smarter way to explore cardiovascular health through digital twin simulation.
          </p>
          <p className="text-[11px] text-slate-500">
            Research prototype using synthetic EHR and continuous wearable data.
          </p>
        </div>

        {/* Seamlessly blended heart image - no box, no frame, just smooth glowing artwork */}
        <div className="hidden sm:block shrink-0 w-28 h-20 select-none pointer-events-none">
          <img
            src="/cardiotwin_heart.png"
            alt="CardioTwin"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,46,99,0.5)]"
            style={{
              maskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 50%, transparent 95%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 50%, black 50%, transparent 95%)",
            }}
          />
        </div>
      </div>

      {/* Main Patient Card */}
      <div className="bg-[#0b0e22]/90 border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedPatientId}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="appearance-none bg-[#121630] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-500 cursor-pointer shadow-sm"
              >
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} (Age {p.age})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-xs text-slate-400">
              Sex: <strong className="text-slate-200">{selectedPatient?.sex}</strong> • BMI: <strong className="text-slate-200">{selectedPatient?.bmi}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400">24h Risk Score:</span>
            <span className="text-xl font-bold font-mono" style={{ color: riskColor }}>
              {Math.round(riskProb * 100)}%
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeClass}`}>
              {riskCategory}
            </span>
          </div>
        </div>

        {/* 3 Key Measurements Row */}
        <div className="grid grid-cols-3 gap-4 py-2 text-center">
          <div>
            <span className="text-[11px] text-slate-400 block">Heart Rate</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">
              {latest?.heart_rate_bpm ?? selectedPatient?.latest_reading?.heart_rate_bpm ?? 75}{" "}
              <span className="text-xs font-normal text-slate-500">bpm</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">HRV (RMSSD)</span>
            <span className="text-2xl font-bold text-teal-300 font-mono mt-0.5 block">
              {latest?.hrv_rmssd_ms ?? selectedPatient?.latest_reading?.hrv_rmssd_ms ?? 40}{" "}
              <span className="text-xs font-normal text-slate-500">ms</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Blood Pressure</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">
              {selectedPatient?.baseline_systolic_bp ?? 126}{" "}
              <span className="text-xs font-normal text-slate-500">mmHg</span>
            </span>
          </div>
        </div>

        {/* One Simple Button */}
        <div className="pt-3 border-t border-white/5 flex justify-end">
          <button
            onClick={() => onNavigateTab("digital-twin")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-300 border border-rose-500/25 text-xs font-medium transition-colors"
          >
            <span>View Patient Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Wearable Trends */}
      <div className="bg-[#0b0e22]/90 border border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white">Wearable Trends (Last 24 Hours)</h2>

          <div className="inline-flex rounded-lg bg-[#040614] p-0.5 border border-white/10 text-xs">
            {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
              const labels = { heartRate: "Heart Rate", hrv: "HRV", sleep: "Sleep", steps: "Steps" };
              const isSelected = selectedMetric === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMetric(m)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    isSelected
                      ? "bg-[#141834] text-rose-300 font-semibold border border-rose-500/25"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Line Chart */}
        <div className="h-52 w-full pt-1">
          {loadingReadings ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading readings...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-simple-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#161b32" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b0e22",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
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
                  fill={`url(#gradient-simple-${selectedMetric})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Update Section */}
      <div className="bg-[#0b0e22]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Latest reading:{" "}
            <strong className="text-white font-mono">
              {latest?.heart_rate_bpm ?? 75} bpm, {latest?.hrv_rmssd_ms ?? 40} ms HRV
            </strong>{" "}
            <span className="text-slate-500">({latestTimeStr})</span>
          </span>
        </div>

        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-60 shadow-md"
        >
          {simulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5" />
              <span>Simulate New Reading</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
