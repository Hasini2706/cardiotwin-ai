import {
  PatientSummary,
  PatientEHR,
  WearableReading,
  PredictionRecord,
  EvaluationReport,
  WhatIfResponse,
  SimulateUpdateResponse,
} from "../types/api";

const API_BASE = "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `API error (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const apiService = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; service: string; timestamp: string; disclaimer: string }>(res);
  },

  async getPatients(): Promise<{ count: number; patients: PatientSummary[] }> {
    const res = await fetch(`${API_BASE}/api/patients`);
    return handleResponse<{ count: number; patients: PatientSummary[] }>(res);
  },

  async getPatientProfile(patientId: string): Promise<{ patient: PatientEHR; latest_prediction: PredictionRecord; recent_readings_count: number }> {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    return handleResponse<{ patient: PatientEHR; latest_prediction: PredictionRecord; recent_readings_count: number }>(res);
  },

  async getPatientEHR(patientId: string): Promise<PatientEHR> {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/ehr`);
    return handleResponse<PatientEHR>(res);
  },

  async getPatientWearables(patientId: string, limit: number = 60): Promise<{ patient_id: string; count: number; readings: WearableReading[] }> {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/wearables?limit=${limit}`);
    return handleResponse<{ patient_id: string; count: number; readings: WearableReading[] }>(res);
  },

  async getPatientPredictions(patientId: string, limit: number = 25): Promise<{ patient_id: string; count: number; predictions: PredictionRecord[] }> {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/predictions?limit=${limit}`);
    return handleResponse<{ patient_id: string; count: number; predictions: PredictionRecord[] }>(res);
  },

  async simulateTelemetryUpdate(
    patientId: string,
    reading?: {
      heart_rate_bpm?: number;
      hrv_rmssd_ms?: number;
      sleep_hours?: number;
      sleep_quality_score?: number;
      steps_interval?: number;
      estimated_systolic_bp?: number;
    }
  ): Promise<SimulateUpdateResponse> {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/simulate-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading || {}),
    });
    return handleResponse<SimulateUpdateResponse>(res);
  },

  async simulateWhatIf(payload: {
    patient_id: string;
    target_hr?: number;
    target_hrv?: number;
    target_sleep?: number;
    target_systolic_bp?: number;
  }): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/api/simulation/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<WhatIfResponse>(res);
  },

  async resetSimulation(): Promise<{ status: string; message: string; timestamp: string }> {
    const res = await fetch(`${API_BASE}/api/simulation/reset`, {
      method: "POST",
    });
    return handleResponse<{ status: string; message: string; timestamp: string }>(res);
  },

  async getEvaluationMetrics(): Promise<EvaluationReport> {
    const res = await fetch(`${API_BASE}/api/evaluation`);
    return handleResponse<EvaluationReport>(res);
  },
};
