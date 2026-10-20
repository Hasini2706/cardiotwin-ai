import React, { useState, useEffect } from "react";
import { ChevronDown, ArrowRight, Activity, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  useEffect(() => {
    let isMounted = true;
    async function loadTrends() {
      if (!selectedPatientId) return;
      setLoadingReadings(true);
      try {
        const res = await apiService.getPatientWearables(selectedPatientId, 25);
        if (isMounted) {
          setReadings(res.readings);
        }
      } catch (err) {
        console.error("Failed to load overview readings", err);
      } finally {
        if (isMounted) setLoadingReadings(false);
      }
    }
    loadTrends();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  const riskProb = selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15;
  const riskCategory = selectedPatient?.latest_prediction?.risk_category ?? "Low";
  const riskColor = riskProb >= 0.65 ? "#F87171" : riskProb >= 0.30 ? "#FBBF24" : "#34D399";
  const badgeClass =
    riskProb >= 0.65
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : riskProb >= 0.30
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  // Chart data
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
    heartRate: {
      name: "Heart Rate",
      unit: "bpm",
      color: "#F87171",
      dataKey: "heartRate",
    },
    hrv: {
      name: "HRV (RMSSD)",
      unit: "ms",
      color: "#2DD4BF",
      dataKey: "hrv",
    },
    sleep: {
      name: "Sleep",
      unit: "hours",
      color: "#818CF8",
      dataKey: "sleep",
    },
    steps: {
      name: "Steps",
      unit: "steps",
      color: "#38BDF8",
      dataKey: "steps",
    },
  }[selectedMetric];

  // Latest reading info
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">CardioTwin AI</h1>
        <p className="text-sm text-slate-400">A smarter way to explore cardiovascular health</p>
        <p className="text-xs text-slate-500">Research prototype using synthetic data. Not for medical use.</p>
      </div>

      {/* Main Patient Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedPatientId}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
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
              Age: <strong className="text-white">{selectedPatient?.age ?? "--"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Experimental Risk Score:</span>
              <span className="text-lg font-bold font-mono" style={{ color: riskColor }}>
                {Math.round(riskProb * 100)}%
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
              {riskCategory}
            </span>
          </div>
        </div>

        {/* Vital Signs Row */}
        <div className="grid grid-cols-3 gap-4 py-4 text-center">
          <div>
            <span className="text-xs text-slate-400 block">Heart Rate</span>
            <span className="text-lg font-semibold text-white font-mono mt-0.5 block">
              {selectedPatient?.latest_reading?.heart_rate_bpm ?? "--"}{" "}
              <span className="text-xs font-normal text-slate-500">bpm</span>
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">HRV (RMSSD)</span>
            <span className="text-lg font-semibold text-teal-400 font-mono mt-0.5 block">
              {selectedPatient?.latest_reading?.hrv_rmssd_ms ?? "--"}{" "}
              <span className="text-xs font-normal text-slate-500">ms</span>
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Blood Pressure</span>
            <span className="text-lg font-semibold text-white font-mono mt-0.5 block">
              {selectedPatient?.baseline_systolic_bp ?? "--"}{" "}
              <span className="text-xs font-normal text-slate-500">mmHg</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={() => onNavigateTab("digital-twin")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition-colors"
          >
            <span>View Patient Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Wearable Trends */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Wearable Trends</h2>

          {/* Simple Metric Selector */}
          <div className="inline-flex rounded-md bg-slate-900 p-0.5 border border-slate-800">
            {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
              const labels = {
                heartRate: "Heart Rate",
                hrv: "HRV",
                sleep: "Sleep",
                steps: "Steps",
              };
              const isSelected = selectedMetric === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMetric(m)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    isSelected
                      ? "bg-slate-800 text-teal-300 font-medium"
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
        <div className="h-56 w-full pt-1">
          {loadingReadings ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading readings...
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Recent Update Section */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Latest reading:{" "}
            <strong className="text-white font-mono">
              {latest?.heart_rate_bpm ?? 72} bpm, {latest?.hrv_rmssd_ms ?? 45} ms HRV
            </strong>{" "}
            <span className="text-slate-500">({latestTimeStr})</span>
          </span>
        </div>

        <button
          onClick={() => onNavigateTab("simulation")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Simulate New Reading</span>
        </button>
      </div>
    </div>
  );
};
