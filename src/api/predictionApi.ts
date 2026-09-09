/**
 * Prediction API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /visits/{visit_id}/predictions endpoints
 */

import { apiFetch } from './client';
import { BackendPrediction } from './adapters';

export async function getPredictions(visitId: string): Promise<BackendPrediction[]> {
  return apiFetch<BackendPrediction[]>(`/visits/${visitId}/predictions`, {
    method: 'GET',
  });
}

export async function getLatestPrediction(visitId: string): Promise<BackendPrediction | null> {
  try {
    return await apiFetch<BackendPrediction>(`/visits/${visitId}/predictions/latest`, {
      method: 'GET',
    });
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function generatePrediction(visitId: string): Promise<BackendPrediction> {
  return apiFetch<BackendPrediction>(`/visits/${visitId}/predictions`, {
    method: 'POST',
  });
}
