import React, { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, CheckCircle2, Sliders, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
  const [sliderHr, setSliderHr] = useState<number>(78);
  const [sliderHrv, setSliderHrv] = useState<number>(38);
  const [sliderSleep, setSliderSleep] = useState<number>(6.5);
  const [inputSteps, setInputSteps] = useState<number>(1400);

  const [updating, setUpdating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SimulateUpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recent prediction history for trend chart
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);

  // Load prediction history for the small trend chart
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

  // Execute real backend simulation update
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

  // Format trend chart points
  const trendData = predictionHistory.map((p, idx) => ({
    step: `T-${predictionHistory.length - idx}`,
    score: Math.round(p.rf_deterioration_prob * 100),
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Eyebrow */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#21D4C2]/90">
            Counterfactual Engine
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">Algorithmic Physiological Twin</span>
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Virtual Patient Simulation</h1>
        <p className="text-xs text-slate-400">
          Modulate dynamic physiological telemetry parameters to simulate short-term risk trajectory changes.
        </p>
      </div>

      {/* Patient Picker Bar */}
      <div className="flex items-center justify-between bg-[#101827] border border-[#263449] rounded-xl p-4 text-xs shadow-sm">
        <span className="text-slate-400 font-medium">Active Virtual Patient:</span>
        <div className="relative">
          <select
            value={selectedPatientId}
            onChange={(e) => onSelectPatient(e.target.value)}
            className="appearance-none bg-[#141F30] border border-[#263449] rounded-md pl-3 pr-8 py-1.5 font-semibold text-white focus:outline-none focus:border-[#21D4C2] cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} (Age {p.age}, {p.sex})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Form Controls Card */}
      <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[#263449]/70">
          <Sliders className="w-4 h-4 text-[#21D4C2]" />
          <h2 className="text-sm font-semibold text-white tracking-tight">Physiological Inputs</h2>
        </div>

        {/* Heart Rate Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-medium">Heart Rate</span>
            <span className="font-mono font-semibold text-white">{sliderHr} bpm</span>
          </div>
          <input
            type="range"
            min="45"
            max="140"
            value={sliderHr}
            onChange={(e) => setSliderHr(Number(e.target.value))}
            className="w-full h-1.5 bg-[#141F30] rounded-lg appearance-none cursor-pointer accent-[#21D4C2]"
          />
        </div>

        {/* HRV Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-medium">Heart Rate Variability (HRV RMSSD)</span>
            <span className="font-mono font-semibold text-[#21D4C2]">{sliderHrv} ms</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={sliderHrv}
            onChange={(e) => setSliderHrv(Number(e.target.value))}
            className="w-full h-1.5 bg-[#141F30] rounded-lg appearance-none cursor-pointer accent-[#21D4C2]"
          />
        </div>

        {/* Sleep Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-medium">Sleep Duration</span>
            <span className="font-mono font-semibold text-white">{sliderSleep} hrs</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="10.0"
            step="0.5"
            value={sliderSleep}
            onChange={(e) => setSliderSleep(Number(e.target.value))}
            className="w-full h-1.5 bg-[#141F30] rounded-lg appearance-none cursor-pointer accent-[#21D4C2]"
          />
        </div>

        {/* Step Count Input */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-medium">Step Count (3-hour interval)</span>
            <span className="font-mono font-semibold text-white">{inputSteps.toLocaleString()} steps</span>
          </div>
          <input
            type="number"
            min="0"
            max="25000"
            step="100"
            value={inputSteps}
            onChange={(e) => setInputSteps(Math.max(0, Number(e.target.value)))}
            className="w-full bg-[#141F30] border border-[#263449] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#21D4C2] font-mono"
          />
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleUpdateTwin}
          disabled={updating}
          className="w-full py-2.5 rounded-lg bg-[#21D4C2] hover:bg-[#1dbfae] text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
        >
          {updating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Recomputing Random Forest & Persisting to SQLite...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Update virtual patient</span>
            </>
          )}
        </button>

        {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
      </div>

      {/* Before and After Scores */}
      {lastResult && (
        <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <CheckCircle2 className="w-4 h-4 text-[#21D4C2]" />
            <span>Telemetry Persisted & Model Evaluated</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-3 bg-[#141F30] rounded-lg border border-[#263449]">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Before Output</span>
              <span className="text-xl font-bold text-slate-300 font-mono mt-0.5 block">
                {Math.round(lastResult.comparison.before_score * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Updated Output</span>
              <span className="text-xl font-bold text-[#21D4C2] font-mono mt-0.5 block">
                {Math.round(lastResult.comparison.after_score * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Net Delta (Δ)</span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  lastResult.comparison.delta > 0
                    ? "text-rose-400"
                    : lastResult.comparison.delta < 0
                    ? "text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                {lastResult.comparison.delta > 0 ? "+" : ""}
                {Math.round(lastResult.comparison.delta * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Small Trend Chart Showing Recent Score Evolution */}
      {trendData.length > 1 && (
        <div className="bg-[#101827] border border-[#263449] rounded-xl p-5 space-y-3 shadow-sm">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">Recent Risk Score Evolution</h2>
            <p className="text-[10px] text-slate-400">Audited longitudinal model outputs for {selectedPatientId}</p>
          </div>
          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#21D4C2" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#21D4C2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="step" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#101827",
                    borderColor: "#263449",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Experimental Risk Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#21D4C2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendAreaGrad)"
                  activeDot={{ r: 4, fill: "#21D4C2", stroke: "#101827", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
