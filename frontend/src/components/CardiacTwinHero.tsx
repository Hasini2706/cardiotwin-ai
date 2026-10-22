import React from "react";
import { Activity, ShieldAlert, Cpu, Heart, RefreshCw, Zap, TrendingUp, Layers } from "lucide-react";
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
  const clampedHr = Math.max(45, Math.min(160, currentHr || 75));
  const beatDuration = `${(60 / clampedHr).toFixed(2)}s`;

  const isHighRisk = riskProb >= 0.65;
  const isModerateRisk = riskProb >= 0.30 && riskProb < 0.65;
  const riskColor = isHighRisk ? "#FF2E63" : isModerateRisk ? "#FBBF24" : "#21D4C2";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#080b1d] via-[#050716] to-[#040510] border border-white/10 p-5 sm:p-7 shadow-2xl mb-6">
      {/* Background ambient lighting matching the heart's glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(circle, ${riskColor} 0%, rgba(139, 92, 246, 0.15) 50%, transparent 80%)`
        }}
      />

      {/* Top Header & Patient Quick-Selector */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Cardiovascular Digital Twin</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TWIN ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Coupling biomechanical telemetry circuits with multi-modal clinical EHR phenotype
            </p>
          </div>
        </div>

        {/* Patient Selection Pills */}
        <div className="flex items-center gap-1.5 bg-[#03040c]/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
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
                    ? "bg-gradient-to-r from-rose-500/25 to-pink-500/15 text-white shadow-md border border-rose-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${pHigh ? "bg-rose-500 animate-pulse" : "bg-teal-400"}`} />
                <span>{p.patient_id}</span>
                <span className="text-[10px] opacity-75">({Math.round(pRisk * 100)}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unified Digital Twin Canvas: Heart blended seamlessly with floating metrics */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        
        {/* Left Stats: Continuous Wearable Streams */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <div className="p-3.5 rounded-2xl bg-[#090c20]/80 backdrop-blur-md border border-white/10 hover:border-rose-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Cardiac Rhythm</span>
              </span>
              <span className="text-[10px] text-rose-400 font-mono">Live Pulse</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white tracking-tight">{currentHr || 75}</span>
              <span className="text-xs text-slate-400 font-medium">BPM</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, ((currentHr - 40) / 120) * 100))}%`,
                  background: currentHr > 100 ? "#FF2E63" : "#21D4C2"
                }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090c20]/80 backdrop-blur-md border border-white/10 hover:border-teal-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>HRV (RMSSD)</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono">Vagal Tone</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-teal-300 tracking-tight">{currentHrv || 42}</span>
              <span className="text-xs text-slate-400 font-medium">ms</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              {currentHrv > 50 ? "High Parasympathetic Tone" : currentHrv > 30 ? "Balanced Autonomic State" : "Sympathetic Stress Dominance"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090c20]/80 backdrop-blur-md border border-white/10 hover:border-purple-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Resting Blood Pressure</span>
              </span>
              <span className="text-[10px] text-slate-400">EHR Baseline</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">{systolicBp} / {diastolicBp}</span>
              <span className="text-xs text-slate-400 font-medium">mmHg</span>
            </div>
          </div>
        </div>

        {/* Center: The Seamlessly Blended Digital Twin Heart Artwork */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center order-1 lg:order-2 py-4">
          
          {/* Heart Graphic - NO CONTAINER BOX, 100% radial feathering into card background */}
          <div className="relative w-full max-w-[420px] aspect-[476/276] flex items-center justify-center">
            
            {/* Pulsing heart graphic with soft radial gradient feathering that eliminates all borders */}
            <div
              className="animate-cardiac-beat w-full h-full flex items-center justify-center cursor-pointer select-none"
              style={{
                "--heartbeat-duration": beatDuration,
              } as React.CSSProperties}
              title={`Digital Twin pulse synced to ${currentHr} BPM`}
            >
              <img
                src="/cardiotwin_heart.png"
                alt="CardioTwin Digital Heart Model"
                className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,46,99,0.55)]"
                style={{
                  maskImage: "radial-gradient(ellipse 88% 82% at 50% 50%, black 50%, transparent 95%)",
                  WebkitMaskImage: "radial-gradient(ellipse 88% 82% at 50% 50%, black 50%, transparent 95%)",
                }}
              />
            </div>

            {/* Circuit Telemetry Callout floating on the Left Circuit Side */}
            <div className="absolute -left-2 top-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050716]/90 border border-rose-500/30 text-rose-300 text-[10px] font-mono shadow-xl backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>Neural Telemetry Stream</span>
            </div>

            {/* Clinical EHR Callout floating on the Right Hexagon Side */}
            <div className="absolute -right-2 top-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050716]/90 border border-teal-500/30 text-teal-300 text-[10px] font-mono shadow-xl backdrop-blur-md">
              <Layers className="w-3 h-3 text-teal-400" />
              <span>Multi-Modal Biomarkers</span>
            </div>

            {/* Heartbeat Sync Pill beneath the Apex */}
            <div className="absolute -bottom-3 flex items-center gap-2 px-3 py-1 rounded-full bg-[#050716]/95 border border-white/15 shadow-2xl backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: riskColor }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: riskColor }} />
              </span>
              <span className="text-[11px] font-mono font-bold text-white tracking-wide">
                Pulse: {currentHr} BPM <span className="text-slate-400 font-normal">({beatDuration}/beat)</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-sm mt-5 leading-relaxed">
            Algorithmic Digital Twin continuously resolving non-linear cardiac dynamics from wearable streams and EHR phenotype.
          </p>
        </div>

        {/* Right Stats: 24h Deterioration Risk & Action */}
        <div className="lg:col-span-3 space-y-3.5 order-3">
          <div 
            className="p-4 rounded-2xl bg-[#090c20]/80 backdrop-blur-md border transition-all shadow-xl"
            style={{ borderColor: `${riskColor}40` }}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" style={{ color: riskColor }} />
                <span>24h Deterioration Proxy</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black font-mono tracking-tight" style={{ color: riskColor }}>
                {Math.round(riskProb * 100)}%
              </span>
              <span 
                className="px-2 py-0.5 rounded text-[11px] font-bold border tracking-wider uppercase"
                style={{
                  color: riskColor,
                  borderColor: `${riskColor}50`,
                  backgroundColor: `${riskColor}15`
                }}
              >
                {riskCategory}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              {isHighRisk 
                ? "Elevated deterioration probability. Diminished nocturnal HRV recovery and high baseline vitals require monitoring."
                : isModerateRisk
                ? "Moderate physiological fluctuation. Continual 24h surveillance active."
                : "Autonomic and vital parameters within stable therapeutic range."}
            </p>
          </div>

          {onSimulate && (
            <button
              onClick={onSimulate}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming Epoch Data...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Simulate Next Telemetry Epoch</span>
                </>
              )}
            </button>
          )}

          <div className="p-2.5 rounded-xl bg-[#03040c]/70 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Telemetry Buffer:</span>
            </span>
            <span className="font-mono text-slate-300 font-semibold">5,600 Epochs</span>
          </div>
        </div>

      </div>
    </div>
  );
};
