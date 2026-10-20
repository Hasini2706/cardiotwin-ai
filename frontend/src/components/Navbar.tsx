import React from "react";
import { Heart } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatientId: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "digital-twin", label: "Patient Twin" },
    { id: "simulation", label: "Simulation" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120] border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("overview")}>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Heart className="w-4 h-4 fill-teal-400/20" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">CardioTwin AI</span>
          </div>

          {/* Simple Navigation */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-teal-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Compact Right Badge */}
          <div className="flex items-center">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
              Research Prototype
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
