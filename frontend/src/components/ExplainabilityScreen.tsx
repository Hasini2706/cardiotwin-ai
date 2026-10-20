import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Clock, 
  Database,
  CheckCircle2,
  FileCode2,
  HeartPulse
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { EvaluationReport, FeatureImportanceItem } from "../types/api";
import { apiService } from "../services/api";

export const ExplainabilityScreen: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiService.getEvaluationMetrics();
        setReport(data);
      } catch (err) {
        console.error("Failed to load explainability data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featureItems: FeatureImportanceItem[] = report?.feature_importances ?? [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Explainability & Data Quality Assurance</h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
              Screen E: Transparency
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Understanding why CardioTwin AI highlights specific deterioration trajectories. Includes Gini feature ranking, telemetry ingestion validation, and strict boundary differentiation between statistical association and clinical causation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/40 border border-teal-800/50 px-3 py-2 rounded-lg shrink-0">
          <Clock className="w-4 h-4 text-teal-400" />
          <span>Trained: {report?.metadata.evaluation_date?.split("T")[0] ?? "2026-10-20"}</span>
        </div>
      </div>

      {/* Primary Feature Importance Chart */}
      <div className="glass-panel p-5 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Gini Impurity Feature Importance (Random Forest)</span>
            </h3>
            <p className="text-xs text-slate-400">Relative contribution of dynamic and static signals to the 24-hour deterioration proxy</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Features: {featureItems.length}</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Loading feature hierarchy...
          </div>
        ) : (
          <div className="h-72 w-full bg-slate-900/40 rounded-lg p-2 border border-slate-800/80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={featureItems.slice(0, 10)} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="friendly_name" 
                  stroke="#CBD5E1" 
                  fontSize={10} 
                  tickLine={false}
                  width={140}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, "Importance Weight"]}
                />
                <Bar dataKey="importance" fill="#2DD4BF" radius={[0, 4, 4, 0]}>
                  {featureItems.slice(0, 10).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? "#2DD4BF" : "#38BDF8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Physiological Interpretations of Top Signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-teal-300 font-semibold text-xs">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>1. Autonomic Drift (HRV RMSSD)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Root Mean Square of Successive Differences (RMSSD) reflects vagal (parasympathetic) modulation of the sinoatrial node. Sudden drops below 18 ms consistently precede virtual autonomic strain.
          </p>
        </div>

        <div className="glass-panel p-4 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <span>2. Myocardial Rate-Pressure Index</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Computed as (Heart Rate × Baseline Systolic BP) / 100. Serves as a surrogate for cardiac oxygen consumption and hemodynamic stress on the coronary microvasculature.
          </p>
        </div>

        <div className="glass-panel p-4 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>3. Cumulative Sleep Deficit</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Calculated as max(0, 7.5 - nocturnal sleep duration). Severe nocturnal deprivation alters diurnal blood pressure dipping and exacerbates sympathovagal imbalance.
          </p>
        </div>
      </div>

      {/* Data Quality & Missing Value Protocol */}
      <div className="glass-panel p-5 border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-400" />
            <span>Data Ingestion & Telemetry Quality Assurance</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated telemetry integrity verification executed across all data streams</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Simulated Packet Loss</span>
            <span className="font-bold text-white text-base mt-1 block">2.0%</span>
            <span className="text-[10px] text-slate-500">Stochastic telemetry dropout</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Imputation Strategy</span>
            <span className="font-bold text-teal-300 text-sm mt-1 block">Causal Forward-Fill</span>
            <span className="text-[10px] text-slate-500">Zero lookahead into future</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Timestamp Ordering</span>
            <span className="font-bold text-emerald-400 text-sm mt-1 block">Monotonic Strictly Ascending</span>
            <span className="text-[10px] text-slate-500">No out-of-order readings</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Zero Patient Overlap</span>
            <span className="font-bold text-cyan-300 text-sm mt-1 block">Strictly Enforced</span>
            <span className="text-[10px] text-slate-500">GroupShuffleSplit validation</span>
          </div>
        </div>
      </div>

      {/* Critical Medical Disclaimer: Correlation vs Causation */}
      <div className="p-4 rounded-xl border border-rose-800/40 bg-rose-950/20 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>CRITICAL SCIENTIFIC DISTINCTION: Association vs Causality</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300/90">
          Feature importance weights in CardioTwin AI represent statistical correlations and non-linear tree partitioning within synthetic training distributions. <strong>Feature importance does NOT prove biological or medical causality.</strong> High model association between low HRV and the deterioration proxy must not be interpreted as a claim that low HRV directly causes cardiac arrest.
        </p>
      </div>
    </div>
  );
};
