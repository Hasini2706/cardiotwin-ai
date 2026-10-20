import React, { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
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
    step: `#${idx + 1}`,
    score: Math.round(p.rf_deterioration_prob * 100),
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white tracking-tight">Virtual Patient Simulation</h1>
        <p className="text-xs text-slate-400">
          Adjust parameters to simulate how physiological changes alter the digital twin's risk score.
        </p>
      </div>

      {/* Patient Picker Bar */}
      <div className="flex items-center justify-between bg-[#0F172A] border border-slate-800 rounded-lg p-3 text-xs">
        <span className="text-slate-400">Simulating Twin:</span>
        <div className="relative">
          <select
            value={selectedPatientId}
            onChange={(e) => onSelectPatient(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-700 rounded-md pl-3 pr-8 py-1 font-semibold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} (Age {p.age})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Simple Sliders Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-4">
        {/* Heart Rate Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Heart Rate</span>
            <span className="font-mono font-semibold text-white">{sliderHr} bpm</span>
          </div>
          <input
            type="range"
            min="45"
            max="140"
            value={sliderHr}
            onChange={(e) => setSliderHr(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        {/* HRV Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Heart Rate Variability (HRV RMSSD)</span>
            <span className="font-mono font-semibold text-teal-400">{sliderHrv} ms</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={sliderHrv}
            onChange={(e) => setSliderHrv(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        {/* Sleep Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Sleep Duration</span>
            <span className="font-mono font-semibold text-white">{sliderSleep} hours</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="10.0"
            step="0.5"
            value={sliderSleep}
            onChange={(e) => setSliderSleep(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>

        {/* Step Count Input */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Step Count (3h interval)</span>
            <span className="font-mono font-semibold text-white">{inputSteps} steps</span>
          </div>
          <input
            type="number"
            min="0"
            max="20000"
            step="100"
            value={inputSteps}
            onChange={(e) => setInputSteps(Math.max(0, Number(e.target.value)))}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
          />
        </div>

        {/* Update Twin Button */}
        <button
          onClick={handleUpdateTwin}
          disabled={updating}
          className="w-full py-2.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          {updating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Updating Twin in SQLite...</span>
            </>
          ) : (
            <span>Update Twin</span>
          )}
        </button>

        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>

      {/* Before and After Scores */}
      {lastResult && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Model Recomputed via Backend API</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-2 bg-slate-900/60 rounded-md border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-500 block">Before</span>
              <span className="text-lg font-bold text-slate-300 font-mono">
                {Math.round(lastResult.comparison.before_score * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">After</span>
              <span className="text-lg font-bold text-teal-400 font-mono">
                {Math.round(lastResult.comparison.after_score * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Delta (Δ)</span>
              <span
                className={`text-lg font-bold font-mono ${
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
        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 space-y-2">
          <h2 className="text-xs font-semibold text-white">Risk Score Trend (Last Updates)</h2>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="step" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B1120",
                    borderColor: "#334155",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Risk Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2DD4BF" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
