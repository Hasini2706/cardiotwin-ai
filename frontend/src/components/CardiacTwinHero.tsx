import React from "react";
import { Activity, Zap, ShieldAlert, Cpu, Heart, RefreshCw } from "lucide-react";
import type { PatientSummary } from "../types/api";

interface CardiacTwinHeroProps {
  selectedPatientId: string;
  patients: PatientSummary[];
  onSelectPatient: (id: string) => void;
  currentHr: number;
  currentHrv: number;
  riskProb: number;
  riskCategory: string;
  systolicBp?: number;
  diastolicBp?: number;
  onSimulate?: () => void;
  simulating?: boolean;
}

export const CardiacTwinHero: React.FC<CardiacTwinHeroProps> = ({
  selectedPatientId,
  patients,
  onSelectPatient,
  currentHr,
  currentHrv,
  riskProb,
  riskCategory,
  systolicBp = 126,
  diastolicBp = 82,
  onSimulate,
  simulating = false,
}) => {
  // Calculate dynamic heartbeat animation speed in seconds
  const clampedHr = Math.max(45, Math.min(160, currentHr || 75));
  const beatDuration = `${(60 / clampedHr).toFixed(2)}s`;

  // Color mappings
  const isHighRisk = riskProb >= 0.65;
  const isModerateRisk = riskProb >= 0.30 && riskProb < 0.65;

  const riskColor = isHighRisk ? "#FF2E63" : isModerateRisk ? "#FBBF24" : "#21D4C2";
  const riskBorderGlow = isHighRisk
    ? "rgba(255, 46, 99, 0.4)"
    : isModerateRisk
    ? "rgba(251, 191, 36, 0.35)"
    : "rgba(33, 212, 194, 0.35)";

  const autonomicState =
    currentHrv > 50
      ? "Parasympathetic (Rest / Recover)"
      : currentHrv > 30
      ? "Balanced Autonomic Tone"
      : "Sympathetic Stress Dominant";

  return (
    <div className="relative overflow-hidden rounded-2xl twin-card border border-white/10 p-5 sm:p-6 mb-6">
      {/* Background ambient lighting */}
      <div 
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{
          background: isHighRisk
            ? "radial-gradient(circle, #FF2E63 0%, rgba(255, 46, 99, 0) 70%)"
            : "radial-gradient(circle, #21D4C2 0%, rgba(33, 212, 194, 0) 70%)"
        }}
      />

      {/* Top Patient Quick-Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cardiovascular Digital Twin</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-rose-500/10 text-rose-300 border border-rose-500/25">
                LIVE TELEMETRY
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Coupled Biomechanical & Continuous Wearable Stream Architecture
            </p>
          </div>
        </div>

        {/* Patient Selection Pills */}
        <div className="flex items-center gap-1.5 bg-[#0a0d1d] p-1 rounded-xl border border-white/10 text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Select Twin:</span>
          {patients.map((p) => {
            const isSelected = p.patient_id === selectedPatientId;
            const pRisk = p.latest_prediction?.rf_deterioration_prob ?? 0.15;
            const pHigh = pRisk >= 0.65;
            return (
              <button
                key={p.patient_id}
                onClick={() => onSelectPatient(p.patient_id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#181d38] text-white shadow-md border border-white/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    pHigh ? "bg-rose-500 animate-pulse" : "bg-teal-400"
                  }`}
                />
                <span>{p.patient_id}</span>
                <span className="text-[10px] opacity-75">
                  ({Math.round(pRisk * 100)}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Display: The Cyber Heart Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Stats Column */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          {/* Heart Rate Metric */}
          <div className="p-3.5 rounded-xl bg-[#0b0e22]/90 border border-white/5 hover:border-rose-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Cardiac Rhythm</span>
              </span>
              <span className="text-[10px] text-rose-400 font-mono">Real-time</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {currentHr || 75}
              </span>
              <span className="text-xs text-slate-400 font-medium">BPM</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, ((currentHr - 40) / 120) * 100))}%`,
                  background: currentHr > 100 ? "#FF2E63" : "#21D4C2"
                }}
              />
            </div>
          </div>

          {/* HRV RMSSD */}
          <div className="p-3.5 rounded-xl bg-[#0b0e22]/90 border border-white/5 hover:border-teal-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>HRV (RMSSD)</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono">Vagal Tone</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-teal-300 tracking-tight">
                {currentHrv || 42}
              </span>
              <span className="text-xs text-slate-400 font-medium">ms</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              {autonomicState}
            </p>
          </div>

          {/* Blood Pressure */}
          <div className="p-3.5 rounded-xl bg-[#0b0e22]/90 border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Baseline Pressure</span>
              </span>
              <span className="text-[10px] text-slate-400">EHR Synced</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white tracking-tight">
                {systolicBp} / {diastolicBp}
              </span>
              <span className="text-xs text-slate-400 font-medium">mmHg</span>
            </div>
          </div>
        </div>

        {/* Center: Glowing Cybernetic Digital Twin Heart */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-2 order-1 lg:order-2">
          {/* Circular Telemetry Orbit / Pulse Frame */}
          <div className="relative w-72 h-56 sm:w-84 sm:h-64 flex items-center justify-center">
            {/* Ambient Red Glow Halo */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${riskColor} 0%, rgba(0, 0, 0, 0) 70%)`
              }}
            />

            {/* Heart Image with dynamic pulse animation synced to current HR */}
            <div
              className="animate-cardiac-beat relative z-10 w-full h-full flex items-center justify-center cursor-pointer select-none"
              style={{
                "--heartbeat-duration": beatDuration,
              } as React.CSSProperties}
              title={`Simulated cardiac pulse synced to ${currentHr} BPM`}
            >
              <img
                src="/cardiotwin_heart.png"
                alt="CardioTwin Digital Heart Model"
                className="max-h-full max-w-full object-contain mix-blend-screen filter drop-shadow-[0_0_25px_rgba(255,46,99,0.7)] transition-all"
              />
            </div>

            {/* Heartbeat Rate Indicator Label at Apex */}
            <div className="absolute -bottom-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b0e22]/90 border border-white/10 shadow-lg backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: riskColor }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: riskColor }}
                />
              </span>
              <span className="text-[11px] font-mono font-semibold text-white">
                Pulse Sync: {currentHr} BPM ({beatDuration}/beat)
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center max-w-xs">
            Multi-modal digital twin coupling high-frequency wearable telemetry with baseline clinical EHR indicators.
          </p>
        </div>

        {/* Right Column: Risk Prediction & Instant Action */}
        <div className="lg:col-span-3 space-y-3 order-3">
          {/* Deterioration Risk Score Gauge */}
          <div 
            className="p-4 rounded-xl bg-[#0b0e22]/90 border transition-all"
            style={{ borderColor: riskBorderGlow }}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" style={{ color: riskColor }} />
                <span>24h Deterioration Proxy</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span 
                className="text-4xl font-black font-mono tracking-tight"
                style={{ color: riskColor }}
              >
                {Math.round(riskProb * 100)}%
              </span>
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold border tracking-wide uppercase"
                style={{
                  color: riskColor,
                  borderColor: `${riskColor}50`,
                  backgroundColor: `${riskColor}15`
                }}
              >
                {riskCategory}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {isHighRisk 
                ? "Elevated cardiac risk detected. Vagal withdrawal and elevated baseline vitals trigger clinical alert."
                : isModerateRisk
                ? "Moderate variability observed. Continual telemetry surveillance recommended."
                : "Physiological telemetry within stable therapeutic thresholds."}
            </p>
          </div>

          {/* Quick Simulation Action Button */}
          {onSimulate && (
            <button
              onClick={onSimulate}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming Telemetry...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Simulate Next Telemetry Epoch</span>
                </>
              )}
            </button>
          )}

          {/* Quick Sensor Feed Indicator */}
          <div className="p-2.5 rounded-lg bg-[#070914] border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Telemetry Buffer:</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">5,600 Epochs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
