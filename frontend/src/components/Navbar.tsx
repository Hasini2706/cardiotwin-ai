import React from "react";
import { Activity, ShieldAlert, Cpu, Heart, Database, AlertTriangle } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatientId: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, selectedPatientId }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "digital-twin", label: "Patient Digital Twin" },
    { id: "simulation", label: "Live Simulation & What-If" },
    { id: "evaluation", label: "Model Evaluation" },
    { id: "explainability", label: "Explainability & Quality" },
    { id: "about", label: "About & Methodology" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070D1B]/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Research Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 px-4 py-1.5 border-b border-amber-800/40 text-xs text-amber-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium tracking-wide">
            <strong>RESEARCH PROTOTYPE ONLY:</strong> CardioTwin AI is an academic demonstration developed for the Digital Twin Challenge 2026 (Happiest Health). It does not provide medical diagnoses, treatment advice, or predict real-world heart attacks.
          </span>
          <span className="ml-auto hidden md:inline-flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] text-amber-300 border border-amber-500/20">
            Aditya University • Team Hasini
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
              <Heart className="w-5 h-5 text-teal-400 fill-teal-400/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">CardioTwin</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
              </div>
              <p className="text-[11px] text-slate-400">Cardiovascular Digital Twin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* System Telemetry Badges */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5"></span>
              <span className="text-slate-400">Twin:</span>
              <span className="font-semibold text-teal-300">{selectedPatientId}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-300">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>SQLite Synced</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium ${
                activeTab === tab.id
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "text-slate-400 bg-slate-800/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
