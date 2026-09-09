/**
 * Operational Reading API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /visits/{visit_id}/readings endpoints
 */

import { apiFetch } from './client';
import {
  BackendReading,
  BackendReadingCreateResponse,
  BackendReadingSource,
  BackendUnloadingStatus,
  BackendPackagingStatus,
} from './adapters';

export interface CreateReadingDto {
  recorded_at?: string;
  source?: BackendReadingSource;
  unloaded_t: number;
  observed_rate_tph?: number | null;
  buffer_level_t?: number | null;
  buffer_capacity_t?: number | null;
  packaging_rate_tph?: number | null;
  unloading_status?: BackendUnloadingStatus;
  packaging_status?: BackendPackagingStatus | null;
  notes?: string | null;
}

export async function getReadings(visitId: string): Promise<BackendReading[]> {
  return apiFetch<BackendReading[]>(`/visits/${visitId}/readings`, {
    method: 'GET',
  });
}

export async function getReading(visitId: string, readingId: string): Promise<BackendReading> {
  return apiFetch<BackendReading>(`/visits/${visitId}/readings/${readingId}`, {
    method: 'GET',
  });
}

/**
 * Creates an operational sounding reading on the backend.
 * Notice: The backend ALSO calculates and returns the updated prediction in the response!
 */
export async function addReading(
  visitId: string,
  data: CreateReadingDto
): Promise<BackendReadingCreateResponse> {
  return apiFetch<BackendReadingCreateResponse>(`/visits/${visitId}/readings`, {
    method: 'POST',
    body: JSON.stringify({
      recorded_at: data.recorded_at || new Date().toISOString(),
      source: data.source || 'MANUAL',
      unloaded_t: data.unloaded_t,
      observed_rate_tph: data.observed_rate_tph ?? null,
      buffer_level_t: data.buffer_level_t ?? null,
      buffer_capacity_t: data.buffer_capacity_t ?? null,
      packaging_rate_tph: data.packaging_rate_tph ?? null,
      unloading_status: data.unloading_status || 'ACTIVE',
      packaging_status: data.packaging_status ?? null,
      notes: data.notes ?? null,
    }),
  });
}
