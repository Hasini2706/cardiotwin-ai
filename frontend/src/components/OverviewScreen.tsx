import React, { useState, useEffect } from "react";
import { ChevronDown, ArrowRight, Activity, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PatientSummary, WearableReading } from "../types/api";
import { apiService } from "../services/api";

interface OverviewScreenProps {
  patients: PatientSummary[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

type MetricType = "heartRate" | "hrv" | "sleep" | "steps";
type TimeRangeType = "7d" | "14d";

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onNavigateTab,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("heartRate");
  const [timeRange, setTimeRange] = useState<TimeRangeType>("7d");
  const [readings, setReadings] = useState<WearableReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  const loadTrends = async () => {
    if (!selectedPatientId) return;
    setLoadingReadings(true);
    try {
      // 7 days = ~56 readings at 3h intervals, 14 days = ~112 readings
      const count = timeRange === "7d" ? 28 : 56;
      const res = await apiService.getPatientWearables(selectedPatientId, count);
      setReadings(res.readings);
    } catch (err) {
      console.error("Failed to load overview readings", err);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [selectedPatientId, timeRange]);

  // Execute quick simulation from bottom activity panel
  const handleQuickSimulate = async () => {
    if (!selectedPatientId) return;
    setSimulating(true);
    setSimFeedback(null);
    try {
      const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
      const baseHr = latestReading?.heart_rate_bpm ?? 76;
      const baseHrv = latestReading?.hrv_rmssd_ms ?? 38;
      
      // Slight physiological variation
      const simHr = Math.min(135, Math.max(52, Math.round(baseHr + (Math.random() * 8 - 4))));
      const simHrv = Math.min(85, Math.max(16, Math.round(baseHrv + (Math.random() * 6 - 3))));
      const simSleep = +(6.5 + Math.random() * 1.5).toFixed(1);
      const simSteps = Math.round(1100 + Math.random() * 800);

      const res = await apiService.simulateTelemetryUpdate(selectedPatientId, {
        heart_rate_bpm: simHr,
        hrv_rmssd_ms: simHrv,
        sleep_hours: simSleep,
        steps_interval: simSteps,
      });

      await loadTrends();
      setSimFeedback(`Telemetry synced: ${simHr} bpm, ${simHrv} ms HRV. Risk updated to ${Math.round(res.comparison.after_score * 100)}%.`);
      setTimeout(() => setSimFeedback(null), 5000);
    } catch (err: any) {
      console.error("Simulation error", err);
      setSimFeedback("Simulation failed: " + (err.message || "Backend error"));
    } finally {
      setSimulating(false);
    }
  };

  const riskProb = selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15;
  const riskCategory = selectedPatient?.latest_prediction?.risk_category ?? "Low";
  
  // Restrained clinical color scheme
  const riskColor = riskProb >= 0.65 ? "#F87171" : riskProb >= 0.30 ? "#FBBF24" : "#21D4C2";
  const badgeClass =
    riskProb >= 0.65
      ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
      : riskProb >= 0.30
      ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
      : "bg-[#21D4C2]/10 text-[#21D4C2] border-[#21D4C2]/25";

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
      color: "#21D4C2",
      dataKey: "hrv",
    },
    sleep: {
      name: "Sleep Duration",
      unit: "hrs",
      color: "#818CF8",
      dataKey: "sleep",
    },
    steps: {
      name: "Activity Steps",
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Page Introduction (Compact, Linear-inspired) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#21D4C2]/90">
            Digital Health Research
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">Cardiovascular Digital Twin Platform</span>
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">CardioTwin AI</h1>
        <p className="text-xs text-slate-400">A living view of cardiovascular health.</p>
        <p className="text-[11px] text-slate-500">
          Research prototype using synthetic longitudinal telemetry. Not cleared for diagnostic or clinical use.
        </p>
      </div>

      {/* 2. Main Patient Panel */}
      <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 shadow-sm">
        {/* Header: Left profile & Right risk score */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#263449]/70">
          {/* Left: Patient ID, Age, Avatar, Baseline summary */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#141F30] border border-[#263449] flex items-center justify-center text-[#21D4C2] shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => onSelectPatient(e.target.value)}
                    className="appearance-none bg-[#141F30] border border-[#263449] rounded-md pl-2.5 pr-7 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#21D4C2] cursor-pointer hover:border-slate-500 transition-colors"
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
                  Age <strong className="text-white font-medium">{selectedPatient?.age ?? "--"}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">{selectedPatient?.sex ?? "Patient"}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                BMI: <span className="text-slate-200 font-mono">{selectedPatient?.bmi ?? "--"}</span> • HTN:{" "}
                <span className="text-slate-200">{selectedPatient?.hypertension ? "Diagnosed" : "None"}</span> • T2D:{" "}
                <span className="text-slate-200">{selectedPatient?.diabetes ? "Diagnosed" : "None"}</span>
              </p>
            </div>
          </div>

          {/* Right: Restrained risk score & Explore button */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Experimental Risk
                </span>
                <span className="text-2xl font-bold font-mono tracking-tight" style={{ color: riskColor }}>
                  {Math.round(riskProb * 100)}%
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${badgeClass}`}>
                {riskCategory}
              </span>
            </div>

            <button
              onClick={() => onNavigateTab("digital-twin")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141F30] hover:bg-[#1a2940] text-[#21D4C2] border border-[#263449] hover:border-[#21D4C2]/40 text-xs font-medium transition-all"
            >
              <span>Explore Patient Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Aligned 3 Measurements */}
        <div className="grid grid-cols-3 gap-4 pt-5">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Heart Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-semibold text-white font-mono tracking-tight">
                {latest?.heart_rate_bpm ?? selectedPatient?.latest_reading?.heart_rate_bpm ?? "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">bpm</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium block">HRV (RMSSD)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-semibold text-[#21D4C2] font-mono tracking-tight">
                {latest?.hrv_rmssd_ms ?? selectedPatient?.latest_reading?.hrv_rmssd_ms ?? "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">ms</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium block">Systolic BP</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-semibold text-white font-mono tracking-tight">
                {selectedPatient?.baseline_systolic_bp ?? "--"}
              </span>
              <span className="text-xs text-slate-500 font-mono">mmHg</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Wearable Trends Panel */}
      <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Wearable trends</h2>
            <p className="text-[11px] text-slate-400">Continuous multi-modal longitudinal telemetry</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time range switcher */}
            <div className="inline-flex rounded-lg bg-[#141F30] p-0.5 border border-[#263449] text-[11px]">
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === "7d"
                    ? "bg-[#101827] text-white font-medium border border-[#263449]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange("14d")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === "14d"
                    ? "bg-[#101827] text-white font-medium border border-[#263449]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                14 Days
              </button>
            </div>

            {/* Metric Selector */}
            <div className="inline-flex rounded-lg bg-[#141F30] p-0.5 border border-[#263449] text-xs">
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
        </div>

        {/* Refined Chart */}
        <div className="h-60 w-full pt-2">
          {loadingReadings ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-[#21D4C2] mr-2" />
              Loading telemetry stream...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No telemetry readings recorded for this window.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#metricAreaGrad)"
                  activeDot={{ r: 4, fill: metricConfig.color, stroke: "#101827", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Bottom Activity Panel ("Latest update") */}
      <div className="bg-[#101827] border border-[#263449] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          {/* Data source indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#21D4C2]" />
            <span className="text-slate-400 font-medium">Simulated Telemetry Stream</span>
          </div>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Latest:{" "}
              <strong className="text-white font-mono">
                {latest?.heart_rate_bpm ?? 76} bpm, {latest?.hrv_rmssd_ms ?? 38} ms HRV
              </strong>{" "}
              <span className="text-slate-500">({latestTimeStr})</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleQuickSimulate}
            disabled={simulating}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#21D4C2] hover:bg-[#1dbfae] text-slate-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
          >
            {simulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Simulate reading</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {simFeedback && (
        <div className="p-3 rounded-lg bg-[#141F30] border border-[#263449] text-xs text-slate-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#21D4C2] shrink-0" />
            <span>{simFeedback}</span>
          </div>
          <button
            onClick={() => setSimFeedback(null)}
            className="text-slate-400 hover:text-white text-xs ml-3"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
