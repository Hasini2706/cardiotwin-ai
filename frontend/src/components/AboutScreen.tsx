import React from "react";
import { 
  Building2, 
  User, 
  Mail, 
  Award, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export const AboutScreen: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            Competition Submission Details • Digital Twin Challenge 2026
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            About CardioTwin AI & Methodology
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            CardioTwin AI was conceived and implemented as a rigorous proof-of-concept for the <strong>Digital Twin Challenge 2026</strong> organized by <strong>Happiest Health</strong>.
          </p>
        </div>
      </div>

      {/* Team & Institution Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
            <User className="w-4 h-4" />
            <span>Author & Student Researcher</span>
          </div>
          <h4 className="text-base font-bold text-white">Madabattula Tejo Hasini</h4>
          <p className="text-xs text-slate-400">Team Size: One Student (Solo Entry)</p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <a href="mailto:24b11ai223@adityauniversity.in" className="hover:text-teal-300 underline font-mono text-[11px]">
              24b11ai223@adityauniversity.in
            </a>
          </div>
        </div>

        <div className="glass-panel p-5 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
            <Building2 className="w-4 h-4" />
            <span>Academic Institution</span>
          </div>
          <h4 className="text-base font-bold text-white">Aditya University</h4>
          <p className="text-xs text-slate-400">Department of Artificial Intelligence</p>
          <p className="text-[11px] text-slate-500 mt-1">Andhra Pradesh, India</p>
        </div>

        <div className="glass-panel p-5 border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <Award className="w-4 h-4" />
            <span>Organizer & Hackathon</span>
          </div>
          <h4 className="text-base font-bold text-white">Digital Twin Challenge 2026</h4>
          <p className="text-xs text-slate-400">Organizer: Happiest Health</p>
          <p className="text-[11px] text-slate-500 mt-1">Track: Healthcare Digital Twins</p>
        </div>
      </div>

      {/* Digital Twin Conceptual Definition */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-teal-400" />
          <span>What is a Cardiovascular Digital Twin?</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In this implementation, a <strong>Cardiovascular Digital Twin</strong> is defined as a personalized, computational software avatar of an individual's cardiovascular state that continuously integrates two complementary data streams:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-teal-300 text-sm block">1. Static Baseline EHR Context</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Provides the anatomical and chronic vulnerability baseline: chronological age, sex, body mass index (BMI), diagnosed hypertension, type 2 diabetes status, baseline ambulatory systolic/diastolic BP, serum lipids (LDL, HDL), and renal filtration rate (eGFR).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-300 text-sm block">2. Dynamic Wearable Telemetry</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Provides high-frequency autonomic and hemodynamic signals: instantaneous heart rate, Root Mean Square of Successive Differences (HRV RMSSD in ms), nocturnal sleep duration, actigraphy step intensity, and derived rolling rate-pressure indexes.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical Safeguards, Privacy, and Honest Reporting */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Ethical Safeguards & Privacy Guarantees</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>100% Synthetic Data</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero Protected Health Information (PHI) or real human records were utilized. All profiles are generated deterministically under fixed random seeds.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Local Execution</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero external cloud, LLM, or paid API dependencies. The entire system executes locally via open-source FastAPI and React.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Medical Overclaiming</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explicitly framed as an academic simulation. Does not claim to diagnose disease, predict heart attacks, or replace board-certified cardiologists.
            </p>
          </div>
        </div>
      </div>

      {/* Path to Future Clinical Validation */}
      <div className="glass-panel p-6 border-slate-800 space-y-3 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-200">
          Required Prerequisites for Future Clinical Translation
        </h3>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <li><strong>Prospective Clinical Trials:</strong> Validation across diverse multi-center inpatient and outpatient clinical registries with institutional review board (IRB) ethical approval.</li>
          <li><strong>Medical Grade Sensor Calibration:</strong> Benchmarking commercial photoplethysmography (PPG) wearable sensors against gold-standard 12-lead Holter electrocardiograms.</li>
          <li><strong>Demographic Representation:</strong> Calibrating risk distributions against large-scale epidemiological cohorts representative of the Indian population (e.g., ICMR cardiovascular databases).</li>
          <li><strong>Regulatory Clearance:</strong> Rigorous software as a medical device (SaMD) documentation compliant with CDSCO and FDA 510(k) standards.</li>
        </ol>
      </div>

      {/* Deliverable Artifacts & Project Repository */}
      <div className="glass-panel p-5 border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Generated Submission Artifacts</h4>
          <p className="text-xs text-slate-400">Access the architecture diagrams, presentation deck, and 20-minute demonstration package</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-3 py-1.5 rounded border border-teal-500/30">
            Open-Source MIT License
          </span>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded border border-cyan-500/30">
            Full Python & TS Source Code
          </span>
        </div>
      </div>
    </div>
  );
};
