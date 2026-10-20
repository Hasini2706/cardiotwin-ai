import React from "react";
import { Activity } from "lucide-react";

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
    <header className="sticky top-0 z-50 bg-[#080D18]/90 backdrop-blur-md border-b border-[#263449]/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveTab("overview")}
          >
            <div className="w-7 h-7 rounded-md bg-[#21D4C2]/10 border border-[#21D4C2]/25 flex items-center justify-center text-[#21D4C2] group-hover:bg-[#21D4C2]/15 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">CardioTwin AI</span>
            </div>
          </div>

          {/* Centered Refined Navigation */}
          <nav className="inline-flex items-center gap-1 bg-[#101827] p-1 rounded-lg border border-[#263449]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs transition-all duration-150 ${
                    isActive
                      ? "bg-[#141F30] text-[#21D4C2] font-medium shadow-sm border border-[#263449]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#141F30]/50 border border-transparent font-normal"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Label */}
          <div className="flex items-center">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#101827] text-slate-400 border border-[#263449] tracking-wide">
              Research Prototype
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
