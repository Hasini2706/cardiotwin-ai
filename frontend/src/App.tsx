import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { OverviewScreen } from "./components/OverviewScreen";
import { PatientTwinScreen } from "./components/PatientTwinScreen";
import { LiveSimulationScreen } from "./components/LiveSimulationScreen";
import type { PatientSummary } from "./types/api";
import { apiService } from "./services/api";
import { AlertTriangle } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("PT-1001");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
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
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  return (
    <div className="min-h-screen bg-[#070D1B] text-slate-100 flex flex-col font-sans">
      {/* Compact Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedPatientId={selectedPatientId} 
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {backendStatus === "offline" && (
          <div className="mb-5 p-3 rounded-md bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Could not connect to backend at http://127.0.0.1:8000. Ensure server is active.</span>
            </div>
            <button 
              onClick={fetchPatientsList}
              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

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

      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-800/60 bg-[#070D1B] py-4 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CardioTwin AI • Digital Twin Challenge 2026 (Happiest Health)</span>
          <span>Madabattula Tejo Hasini • Aditya University</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
