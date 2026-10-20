import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { OverviewScreen } from "./components/OverviewScreen";
import { PatientTwinScreen } from "./components/PatientTwinScreen";
import { LiveSimulationScreen } from "./components/LiveSimulationScreen";
import { ModelEvaluationScreen } from "./components/ModelEvaluationScreen";
import { ExplainabilityScreen } from "./components/ExplainabilityScreen";
import { AboutScreen } from "./components/AboutScreen";
import { PatientSummary } from "./types/api";
import { apiService } from "./services/api";
import { AlertTriangle, Heart, ShieldCheck, ExternalLink } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("PT-1001");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<"connected" | "connecting" | "offline">("connecting");

  const fetchPatientsList = async () => {
    try {
      const data = await apiService.getPatients();
      setPatients(data.patients);
      if (data.patients.length > 0 && !data.patients.some((p) => p.patient_id === selectedPatientId)) {
        setSelectedPatientId(data.patients[0].patient_id);
      }
      setBackendStatus("connected");
    } catch (err) {
      console.error("Failed to connect to backend", err);
      setBackendStatus("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  return (
    <div className="min-h-screen bg-[#070D1B] text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedPatientId={selectedPatientId} 
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {backendStatus === "offline" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Backend Connectivity Warning:</strong> Could not connect to FastAPI server at <code className="font-mono text-amber-300">http://127.0.0.1:8000</code>. Ensure backend is running.
              </span>
            </div>
            <button 
              onClick={fetchPatientsList}
              className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        {activeTab === "overview" && (
          <OverviewScreen 
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "digital-twin" && (
          <PatientTwinScreen 
            selectedPatientId={selectedPatientId}
            patients={patients}
            onSelectPatient={setSelectedPatientId}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "simulation" && (
          <LiveSimulationScreen 
            selectedPatientId={selectedPatientId}
            patients={patients}
            onSelectPatient={setSelectedPatientId}
            onRefreshData={fetchPatientsList}
          />
        )}

        {activeTab === "evaluation" && (
          <ModelEvaluationScreen />
        )}

        {activeTab === "explainability" && (
          <ExplainabilityScreen />
        )}

        {activeTab === "about" && (
          <AboutScreen />
        )}
      </main>

      {/* Institutional Footer & Legal Disclaimers */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#060A15] py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Heart className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-white">CardioTwin AI</span>
            <span>• Digital Twin Challenge 2026 (Happiest Health)</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 space-y-0.5">
            <p>Solo Student Entry: <strong>Madabattula Tejo Hasini</strong> (<a href="mailto:24b11ai223@adityauniversity.in" className="text-teal-400 hover:underline">24b11ai223@adityauniversity.in</a>)</p>
            <p>Aditya University, Andhra Pradesh, India • MIT Open-Source License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
