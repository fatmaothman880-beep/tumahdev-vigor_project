/**
 * Vessel Tracking & AIS Telemetry API Service for VIGOR Smart Port Operations
 */

import { VesselPosition } from '../types';
import { apiFetch, BackendOperationalStateEnvelope, USE_MOCK_API } from './client';

export async function getVesselPositions(): Promise<VesselPosition[]> {
  if (USE_MOCK_API) return [];
  const response = await apiFetch<BackendOperationalStateEnvelope>('/operations/state');
  return response.state?.vesselPositions ?? [];
}
