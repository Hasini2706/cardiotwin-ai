import React from "react";
import { Activity, ShieldCheck, Cpu } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatientId: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Twin Dashboard" },
    { id: "digital-twin", label: "Patient Record & Telemetry" },
    { id: "simulation", label: "What-If Simulator" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#060713]/85 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand with Cyber Heart */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => setActiveTab("overview")}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-600/10 border border-rose-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-rose-500/10 group-hover:border-rose-400/50 transition-all">
              <img
                src="/cardiotwin_heart.png"
                alt="CardioTwin AI Logo"
                className="w-7 h-7 object-contain mix-blend-screen filter drop-shadow-[0_0_8px_rgba(255,46,99,0.7)] group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  CardioTwin<span className="text-rose-500">.AI</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Cardiovascular Digital Twin Platform
              </p>
            </div>
          </div>

          {/* Centered Navigation Tabs */}
          <nav className="inline-flex items-center gap-1.5 bg-[#0b0e22] p-1.5 rounded-xl border border-white/10 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-white font-semibold shadow-sm border border-rose-500/30 text-rose-200"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#0b0e22] text-slate-300 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RF Model Ready (AUC 0.89)</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 tracking-wide">
              Happiest Health '26
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

