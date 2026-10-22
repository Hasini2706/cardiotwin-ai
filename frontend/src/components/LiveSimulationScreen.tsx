import React, { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, CheckCircle2, Sliders, Zap, ShieldAlert, TrendingDown, TrendingUp, Sparkles, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { PatientSummary, SimulateUpdateResponse, PredictionRecord } from "../types/api";
import { apiService } from "../services/api";

interface LiveSimulationScreenProps {
  selectedPatientId: string;
  patients: PatientSummary[];
  onSelectPatient: (id: string) => void;
  onRefreshData: () => void;
}

export const LiveSimulationScreen: React.FC<LiveSimulationScreenProps> = ({
  selectedPatientId,
  patients,
  onSelectPatient,
  onRefreshData,
}) => {
  const [sliderHr, setSliderHr] = useState<number>(75);
  const [sliderHrv, setSliderHrv] = useState<number>(45);
  const [sliderSleep, setSliderSleep] = useState<number>(7.0);
  const [inputSteps, setInputSteps] = useState<number>(1500);

  const [updating, setUpdating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SimulateUpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];
  const baselineRisk = selectedPatient?.latest_prediction?.rf_deterioration_prob ?? 0.15;

  const loadHistory = async () => {
    try {
      const res = await apiService.getPatientPredictions(selectedPatientId, 10);
      setPredictionHistory(res.predictions);
    } catch (err) {
      console.error("Failed to load prediction history", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedPatientId]);

  const handleUpdateTwin = async () => {
    setUpdating(true);
    setError(null);
    try {
      const res = await apiService.simulateTelemetryUpdate(selectedPatientId, {
        heart_rate_bpm: sliderHr,
        hrv_rmssd_ms: sliderHrv,
        sleep_hours: sliderSleep,
        steps_interval: inputSteps,
      });
      setLastResult(res);
      await loadHistory();
      onRefreshData();
    } catch (err: any) {
      setError(err.message || "Failed to update virtual patient telemetry.");
    } finally {
      setUpdating(false);
    }
  };

  // Presets for fast interactive demo
  const applyPreset = (preset: "stress" | "recovery" | "moderate") => {
    if (preset === "stress") {
      setSliderHr(104);
      setSliderHrv(18);
      setSliderSleep(4.2);
      setInputSteps(700);
    } else if (preset === "recovery") {
      setSliderHr(62);
      setSliderHrv(72);
      setSliderSleep(8.5);
      setInputSteps(3200);
    } else {
      setSliderHr(74);
      setSliderHrv(48);
      setSliderSleep(7.2);
      setInputSteps(5000);
    }
  };

  const trendData = predictionHistory.map((p, idx) => ({
    step: `Ep.${idx + 1}`,
    score: Math.round(p.rf_deterioration_prob * 100),
  }));

  const simulatedProb = lastResult?.updated_prediction?.rf_deterioration_prob ?? baselineRisk;
  const delta = lastResult?.comparison?.delta ?? (simulatedProb - baselineRisk);
  const isBetter = delta < -0.02;
  const isWorse = delta > 0.02;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Quick Twin Switcher */}
      <div className="twin-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">Counterfactual Simulation Lab</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/25">
              WHAT-IF ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Perturb continuous telemetry variables to observe non-linear risk trajectories in the digital twin.
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Twin:</span>
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
        </div>
      </div>

      {/* Preset Scenarios Buttons for instant Judge Demo */}
      <div className="twin-card rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Quick Scenario Presets (1-Click Demonstration):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => applyPreset("stress")}
            className="p-3 rounded-xl bg-[#090b1c] border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/5 text-left transition-all group"
          >
            <span className="text-xs font-bold text-rose-300 block flex items-center justify-between">
              <span>⚡ Severe Vagal Stress</span>
              <span className="text-[10px] opacity-75">High Risk</span>
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              HR 104 bpm • HRV 18 ms • Sleep 4.2h
            </span>
          </button>

          <button
            onClick={() => applyPreset("recovery")}
            className="p-3 rounded-xl bg-[#090b1c] border border-teal-500/20 hover:border-teal-500/50 hover:bg-teal-500/5 text-left transition-all group"
          >
            <span className="text-xs font-bold text-teal-300 block flex items-center justify-between">
              <span>🧘 Optimal Sleep & Recovery</span>
              <span className="text-[10px] opacity-75">Low Risk</span>
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              HR 62 bpm • HRV 72 ms • Sleep 8.5h
            </span>
          </button>

          <button
            onClick={() => applyPreset("moderate")}
            className="p-3 rounded-xl bg-[#090b1c] border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all group"
          >
            <span className="text-xs font-bold text-purple-300 block flex items-center justify-between">
              <span>🚶 Active Cardio Adherence</span>
              <span className="text-[10px] opacity-75">Balanced</span>
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              HR 74 bpm • HRV 48 ms • 5k Steps
            </span>
          </button>
        </div>
      </div>

      {/* Main Simulation Controls & Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Telemetry Sliders */}
        <div className="lg:col-span-7 twin-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Simulated Epoch Parameters</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Next 24h Window</span>
          </div>

          {/* Heart Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Heart Rate</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{sliderHr} BPM</span>
            </div>
            <input
              type="range"
              min="45"
              max="140"
              value={sliderHr}
              onChange={(e) => setSliderHr(Number(e.target.value))}
              className="w-full h-2 bg-[#090b1c] rounded-lg appearance-none cursor-pointer accent-rose-500 border border-white/10"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Bradycardia (45)</span>
              <span>Resting (60-80)</span>
              <span>Tachycardia (140)</span>
            </div>
          </div>

          {/* HRV Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Heart Rate Variability (HRV RMSSD)</span>
              <span className="font-mono font-bold text-teal-400 text-sm">{sliderHrv} ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={sliderHrv}
              onChange={(e) => setSliderHrv(Number(e.target.value))}
              className="w-full h-2 bg-[#090b1c] rounded-lg appearance-none cursor-pointer accent-teal-400 border border-white/10"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Severe Depletion (10)</span>
              <span>Average (30-50)</span>
              <span>High Resilience (90)</span>
            </div>
          </div>

          {/* Sleep Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Nocturnal Sleep Duration</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{sliderSleep} hrs</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="10.0"
              step="0.5"
              value={sliderSleep}
              onChange={(e) => setSliderSleep(Number(e.target.value))}
              className="w-full h-2 bg-[#090b1c] rounded-lg appearance-none cursor-pointer accent-purple-400 border border-white/10"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Deprived (3h)</span>
              <span>Recommended (7-8h)</span>
              <span>Extended (10h)</span>
            </div>
          </div>

          {/* Steps Cadence Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Activity Cadence (Interval Steps)</span>
              <span className="font-mono font-bold text-sky-400 text-sm">{inputSteps.toLocaleString()} steps</span>
            </div>
            <input
              type="range"
              min="200"
              max="10000"
              step="200"
              value={inputSteps}
              onChange={(e) => setInputSteps(Number(e.target.value))}
              className="w-full h-2 bg-[#090b1c] rounded-lg appearance-none cursor-pointer accent-sky-400 border border-white/10"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Sedentary (200)</span>
              <span>Moderate (3,000)</span>
              <span>Active (10,000)</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleUpdateTwin}
              disabled={updating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing 22-Feature ML Inference...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Execute Twin Counterfactual Projection</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              {error}
            </p>
          )}
        </div>

        {/* Right: Twin Risk Projection Comparison */}
        <div className="lg:col-span-5 space-y-4">
          <div className="twin-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-white/5">
              Simulated Twin Risk Impact
            </h3>

            {/* Baseline vs Simulated comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/5 text-center">
                <span className="text-[11px] text-slate-400 block">Baseline Risk</span>
                <span className="text-2xl font-black font-mono text-slate-200 mt-1 block">
                  {Math.round(baselineRisk * 100)}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Current State</span>
              </div>

              <div className="p-3 rounded-xl bg-[#090b1c] border border-white/10 text-center relative overflow-hidden">
                <span className="text-[11px] text-slate-400 block">Simulated Risk</span>
                <span 
                  className="text-2xl font-black font-mono mt-1 block"
                  style={{
                    color: simulatedProb >= 0.65 ? "#FF2E63" : simulatedProb >= 0.30 ? "#FBBF24" : "#21D4C2"
                  }}
                >
                  {Math.round(simulatedProb * 100)}%
                </span>
                <span className="text-[10px] text-slate-300 uppercase font-semibold">What-If State</span>
              </div>
            </div>

            {/* Delta Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              isBetter
                ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                : isWorse
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}>
              <div className="flex items-center gap-2">
                {isBetter ? (
                  <TrendingDown className="w-4 h-4 text-teal-400" />
                ) : isWorse ? (
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                ) : (
                  <Activity className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {isBetter 
                    ? `Projected Risk Reduction: ${Math.round(Math.abs(delta) * 100)}%`
                    : isWorse
                    ? `Projected Risk Escalation: +${Math.round(delta * 100)}%`
                    : "No Significant Trajectory Shift"}
                </span>
              </div>
            </div>

            {/* Explanation text */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Updates are persisted directly into the SQLite digital twin registry and recalculated via the calibrated Random Forest deterioration pipeline.
            </p>
          </div>

          {/* Mini Projection Timeline */}
          <div className="twin-card rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-white block">Simulation History Timeline</span>
            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#171b30" vertical={false} />
                  <XAxis dataKey="step" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c0f22",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(val: any) => [`${val}%`, "Risk Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#FF2E63"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#FF2E63" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
