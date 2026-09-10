/**
 * Voyage Full-Cycle API Service for VIGOR Smart Port Operations
 */

import { Voyage } from '../types';
import { apiFetch, BackendOperationalStateEnvelope, USE_MOCK_API } from './client';

export async function getVoyages(): Promise<Voyage[]> {
  if (USE_MOCK_API) return [];
  const response = await apiFetch<BackendOperationalStateEnvelope>('/operations/state');
  return response.state?.voyages ?? [];
}
