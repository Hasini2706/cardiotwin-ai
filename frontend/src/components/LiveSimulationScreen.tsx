import React, { useState } from "react";
import { 
  Play, 
  RotateCcw, 
  Flame, 
  Heart, 
  Moon, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";
import type { PatientSummary, SimulateUpdateResponse, WhatIfResponse } from "../types/api";
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
  // Update state
  const [updating, setUpdating] = useState<boolean>(false);
  const [lastUpdateResult, setLastUpdateResult] = useState<SimulateUpdateResponse | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // What-If state
  const [sliderHr, setSliderHr] = useState<number>(75);
  const [sliderHrv, setSliderHrv] = useState<number>(45);
  const [sliderSleep, setSliderSleep] = useState<number>(7.2);
  const [sliderSbp, setSliderSbp] = useState<number>(128);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState<boolean>(false);

  // Reset state
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) || patients[0];

  // Execute actual simulation update
  const handleSimulateUpdate = async (type: "normal" | "stress" | "recovery") => {
    setUpdating(true);
    setUpdateError(null);
    setResetMessage(null);

    let readingPayload = {};
    if (type === "stress") {
      readingPayload = {
        heart_rate_bpm: 112.0,
        hrv_rmssd_ms: 13.5,
        sleep_hours: 4.2,
        sleep_quality_score: 38.0,
        steps_interval: 250,
        estimated_systolic_bp: 168.0,
      };
    } else if (type === "recovery") {
      readingPayload = {
        heart_rate_bpm: 64.0,
        hrv_rmssd_ms: 58.0,
        sleep_hours: 8.5,
        sleep_quality_score: 92.0,
        steps_interval: 1800,
        estimated_systolic_bp: 118.0,
      };
    }

    try {
      const res = await apiService.simulateTelemetryUpdate(selectedPatientId, readingPayload);
      setLastUpdateResult(res);
      onRefreshData();
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update virtual patient telemetry.");
    } finally {
      setUpdating(false);
    }
  };

  // Run What-If Counterfactual calculation
  const handleRunWhatIf = async () => {
    setWhatIfLoading(true);
    try {
      const res = await apiService.simulateWhatIf({
        patient_id: selectedPatientId,
        target_hr: sliderHr,
        target_hrv: sliderHrv,
        target_sleep: sliderSleep,
        target_systolic_bp: sliderSbp,
      });
      setWhatIfResult(res);
    } catch (err: any) {
      console.error("What-If calculation failed", err);
    } finally {
      setWhatIfLoading(false);
    }
  };

  // Reset simulation database
  const handleResetSimulation = async () => {
    if (!window.confirm("Are you sure you want to reset the simulation? This restores the database to pristine synthetic baseline.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await apiService.resetSimulation();
      setResetMessage(res.message);
      setLastUpdateResult(null);
      setWhatIfResult(null);
      onRefreshData();
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header Banner */}
      <div className="glass-panel p-5 border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Virtual Patient Simulation & What-If Studio</h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
              Screen C: Live Playback
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Deterministically inject synthetic telemetry, observe dynamic model score updates in real-time, or use counterfactual sliders to hypothesize intervention outcomes without clinical risk.
          </p>
        </div>

        <button
          onClick={handleResetSimulation}
          disabled={resetting}
          className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
          <span>Reset Simulation State</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid: Section 1 (Telemetry Playback) & Section 2 (What-If Studio) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Deterministic Telemetry Injector & Before/After Score */}
        <div className="glass-panel p-5 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">Part 1 • Dynamic Telemetry Updates</span>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <span>Simulate Timeline Advance for {selectedPatientId}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Actions below will actually persist new records to the backend SQLite database and recalculate the 24h deterioration proxy.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSimulateUpdate("normal")}
                disabled={updating}
                className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700 text-xs transition-all space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 group-hover:text-teal-300">
                  <Play className="w-3.5 h-3.5 text-teal-400" />
                  <span>Advance (+3h)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">Plausible circadian telemetry step.</p>
              </button>

              <button
                onClick={() => handleSimulateUpdate("stress")}
                disabled={updating}
                className="p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-left border border-rose-800/40 text-xs transition-all space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Autonomic Spike</span>
                </div>
                <p className="text-[10px] text-rose-300/80 leading-tight">HR 112 bpm, HRV drops to 13.5ms, SBP 168.</p>
              </button>

              <button
                onClick={() => handleSimulateUpdate("recovery")}
                disabled={updating}
                className="p-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 text-left border border-emerald-800/40 text-xs transition-all space-y-1 group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deep Recovery</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 leading-tight">HR 64 bpm, HRV rebounds to 58ms, 8.5h sleep.</p>
              </button>
            </div>
            {updating && (
              <div className="text-center py-2 text-xs text-teal-300 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Persisting reading to SQLite and recomputing rolling model inference...</span>
              </div>
            )}
            {updateError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {updateError}
              </div>
            )}
          </div>

          {/* Before-and-After Differential Panel */}
          {lastUpdateResult ? (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Telemetry Ingested & Model Recalculated!</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {lastUpdateResult.new_reading.reading_id}
                </span>
              </div>

              {/* Before vs After Score Diff */}
              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Score Prior:</span>
                  <span className="text-sm font-bold text-slate-300 font-mono">
                    {Math.round(lastUpdateResult.comparison.before_score * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Score Now:</span>
                  <span className="text-sm font-bold text-white font-mono" style={{ color: lastUpdateResult.updated_prediction.risk_color ?? "#34D399" }}>
                    {Math.round(lastUpdateResult.comparison.after_score * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Delta (Δ):</span>
                  <span className={`text-sm font-bold font-mono flex items-center justify-center gap-0.5 ${
                    lastUpdateResult.comparison.delta > 0 ? "text-rose-400" : (lastUpdateResult.comparison.delta < 0 ? "text-emerald-400" : "text-slate-400")
                  }`}>
                    {lastUpdateResult.comparison.delta > 0 ? "+" : ""}
                    {Math.round(lastUpdateResult.comparison.delta * 100)}%
                  </span>
                </div>
              </div>

              {/* Ingested Values Summary */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] text-slate-300">
                <div className="p-1.5 rounded bg-slate-950 text-center">
                  <span className="text-[10px] text-slate-500 block">HR</span>
                  <span className="font-semibold">{lastUpdateResult.new_reading.heart_rate_bpm} bpm</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950 text-center">
                  <span className="text-[10px] text-slate-500 block">HRV</span>
                  <span className="font-semibold text-teal-300">{lastUpdateResult.new_reading.hrv_rmssd_ms} ms</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950 text-center">
                  <span className="text-[10px] text-slate-500 block">Sleep</span>
                  <span className="font-semibold">{lastUpdateResult.new_reading.sleep_hours}h</span>
                </div>
                <div className="p-1.5 rounded bg-slate-950 text-center">
                  <span className="text-[10px] text-slate-500 block">SBP</span>
                  <span className="font-semibold">{lastUpdateResult.new_reading.estimated_systolic_bp} mmHg</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-1">
              <Zap className="w-5 h-5 text-teal-400 mx-auto" />
              <p className="font-medium text-slate-300">No Simulation Ingest Run Yet in this Session</p>
              <p className="text-[11px]">Click any trigger above to inject synthetic readings into the SQLite database.</p>
            </div>
          )}
        </div>

        {/* Section 2: What-If Counterfactual Intervention Lab */}
        <div className="glass-panel p-5 border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Part 2 • Counterfactual Interventions</span>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Interactive What-If Simulation Studio</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust hypothetical physiological parameters below to simulate how lifestyle or clinical interventions modify the digital twin without altering stored data.
            </p>
          </div>

          {/* Counterfactual Interactive Sliders */}
          <div className="space-y-3.5 text-xs">
            {/* Heart Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hypothetical Heart Rate:</span>
                </span>
                <span className="font-bold text-white font-mono">{sliderHr} bpm</span>
              </div>
              <input
                type="range"
                min="45"
                max="150"
                value={sliderHr}
                onChange={(e) => setSliderHr(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* HRV RMSSD Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Hypothetical HRV RMSSD:</span>
                </span>
                <span className="font-bold text-teal-300 font-mono">{sliderHrv} ms</span>
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

            {/* Sleep Hours Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nocturnal Sleep Duration:</span>
                </span>
                <span className="font-bold text-white font-mono">{sliderSleep} hours</span>
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

            {/* Systolic Blood Pressure */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estimated Systolic BP:</span>
                </span>
                <span className="font-bold text-white font-mono">{sliderSbp} mmHg</span>
              </div>
              <input
                type="range"
                min="90"
                max="195"
                value={sliderSbp}
                onChange={(e) => setSliderSbp(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            <button
              onClick={handleRunWhatIf}
              disabled={whatIfLoading}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{whatIfLoading ? "Simulating Counterfactual..." : "Calculate What-If Impact"}</span>
            </button>
          </div>

          {/* What-If Counterfactual Results Card */}
          {whatIfResult && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Counterfactual Simulation Outcome:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  whatIfResult.impact.direction === "Risk Mitigation"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : (whatIfResult.impact.direction === "Risk Escalation" ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-300")
                }`}>
                  {whatIfResult.impact.direction}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Baseline Risk</span>
                  <span className="text-sm font-bold text-slate-300">
                    {Math.round(whatIfResult.baseline.rf_probability * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Hypothetical Risk</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {Math.round(whatIfResult.counterfactual.rf_probability * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Net Impact</span>
                  <span className={`text-sm font-bold ${whatIfResult.impact.risk_difference < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {whatIfResult.impact.risk_difference > 0 ? "+" : ""}
                    {Math.round(whatIfResult.impact.risk_difference * 100)}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300/90 leading-tight bg-slate-950/50 p-2 rounded border border-slate-800">
                <strong>Model Hypothesis:</strong> {whatIfResult.impact.clinical_interpretation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
