import React, { useState, useEffect } from "react";
import { ChevronDown, ArrowRight, Activity, Clock, RefreshCw, Cpu, Heart, Moon, Footprints, ShieldAlert, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { PatientSummary, WearableReading } from "../types/api";
import { apiService } from "../services/api";
import { CardiacTwinHero } from "./CardiacTwinHero";

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
  
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const currentHr = latest?.heart_rate_bpm ?? selectedPatient?.latest_reading?.heart_rate_bpm ?? 74;
  const currentHrv = latest?.hrv_rmssd_ms ?? selectedPatient?.latest_reading?.hrv_rmssd_ms ?? 42;

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
    heartRate: {
      name: "Heart Rate",
      unit: "bpm",
      color: "#FF2E63",
      gradientFrom: "rgba(255, 46, 99, 0.35)",
      gradientTo: "rgba(255, 46, 99, 0.0)",
      icon: Heart,
    },
    hrv: {
      name: "HRV (RMSSD)",
      unit: "ms",
      color: "#21D4C2",
      gradientFrom: "rgba(33, 212, 194, 0.35)",
      gradientTo: "rgba(33, 212, 194, 0.0)",
      icon: Activity,
    },
    sleep: {
      name: "Sleep Duration",
      unit: "hrs",
      color: "#A78BFA",
      gradientFrom: "rgba(167, 139, 250, 0.35)",
      gradientTo: "rgba(167, 139, 250, 0.0)",
      icon: Moon,
    },
    steps: {
      name: "Steps Cadence",
      unit: "steps",
      color: "#38BDF8",
      gradientFrom: "rgba(56, 189, 248, 0.35)",
      gradientTo: "rgba(56, 189, 248, 0.0)",
      icon: Footprints,
    },
  };

  const activeMetric = metricConfigs[selectedMetric];

  const latestTimeStr = latest?.timestamp
    ? new Date(latest.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "Live Synced";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Visual Centerpiece: Cybernetic Digital Twin Hero */}
      <CardiacTwinHero
        selectedPatientId={selectedPatientId}
        patients={patients}
        onSelectPatient={onSelectPatient}
        currentHr={currentHr}
        currentHrv={currentHrv}
        riskProb={riskProb}
        riskCategory={riskCategory}
        systolicBp={selectedPatient?.baseline_systolic_bp}
        diastolicBp={82}
        onSimulate={handleSimulate}
        simulating={simulating}
      />

      {/* Two Column Grid: Telemetry Trends & Clinical Biomarkers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wearable Telemetry Streams */}
        <div className="lg:col-span-8 twin-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Continuous Wearable Telemetry</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                  25 Epochs
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Synchronized 24-hour ambulatory sensor streams
              </p>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="inline-flex rounded-xl bg-[#070914] p-1 border border-white/10 text-xs">
              {(["heartRate", "hrv", "sleep", "steps"] as MetricType[]).map((m) => {
                const conf = metricConfigs[m];
                const Icon = conf.icon;
                const isSelected = selectedMetric === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMetric(m)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                      isSelected
                        ? "bg-[#181d38] text-white font-semibold shadow-sm border border-white/15"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3 h-3" style={{ color: isSelected ? conf.color : undefined }} />
                    <span className="text-[11px]">{conf.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Chart with Cyber Glow Gradient */}
          <div className="h-60 w-full pt-2">
            {loadingReadings ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin text-rose-500 mr-2" />
                Synchronizing telemetry stream...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0.0} />
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
                    formatter={(val: any) => [`${val} ${activeMetric.unit}`, activeMetric.name]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={activeMetric.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#gradient-${selectedMetric})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Stream Update: <strong className="text-slate-200">{latestTimeStr}</strong></span>
            </span>

            <button
              onClick={() => onNavigateTab("digital-twin")}
              className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
            >
              <span>Inspect Full Twin Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Physiological Twin Summary & Quick Nav */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Quick Profile Card */}
          <div className="twin-card rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-white tracking-tight">Patient Phenotype</span>
              <span className="text-[11px] text-slate-400 font-mono">ID: {selectedPatient?.patient_id}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Chronological Age:</span>
                <span className="font-semibold text-white font-mono">{selectedPatient?.age} years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Biological Sex:</span>
                <span className="font-semibold text-white">{selectedPatient?.sex}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Resting Systolic BP:</span>
                <span className="font-semibold text-white font-mono">{selectedPatient?.baseline_systolic_bp} mmHg</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Model Proxy Status:</span>
                <span className="font-semibold text-teal-400 font-mono">22 Features Active</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab("simulation")}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition-colors"
              >
                <span>Launch Counterfactual Simulation</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Digital Twin Challenge 2026 Academic Badge */}
          <div className="twin-card rounded-2xl p-4 border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-[#0d1020] to-purple-900/10">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold mb-1">
              <Cpu className="w-4 h-4 text-rose-400" />
              <span>Digital Twin Challenge 2026</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Happiest Health solo submission by <strong>Madabattula Tejo Hasini</strong> (Aditya University). Zero external LLM or paid API dependencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
