import React from "react";

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
    <header className="sticky top-0 z-50 bg-[#060713]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand with Cyber Heart */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            onClick={() => setActiveTab("overview")}
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center overflow-hidden">
              <img
                src="/cardiotwin_heart.png"
                alt="CardioTwin Logo"
                className="w-6 h-6 object-contain filter drop-shadow-[0_0_6px_rgba(255,46,99,0.7)]"
                style={{
                  maskImage: "radial-gradient(circle at center, black 60%, transparent 100%)",
                  WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 100%)"
                }}
              />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">CardioTwin AI</span>
          </div>

          {/* Centered Simple Navigation */}
          <nav className="inline-flex items-center gap-1 bg-[#0b0e22] p-1 rounded-lg border border-white/10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${
                    isActive
                      ? "bg-[#141834] text-rose-300 font-semibold shadow-sm border border-rose-500/25"
                      : "text-slate-400 hover:text-slate-200 border border-transparent font-normal"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Label */}
          <div className="flex items-center">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0b0e22] text-slate-400 border border-white/10">
              Happiest Health '26
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
