/**
 * Delay Event API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /visits/{visit_id}/delays endpoints
 */

import { apiFetch } from './client';
import { BackendDelay } from './adapters';

export interface CreateDelayDto {
  start_time: string;
  end_time?: string | null;
  category: string;
  cause: string;
  responsible_area: string;
  equipment?: string | null;
  description?: string | null;
}

export interface UpdateDelayDto {
  end_time?: string | null;
  category?: string;
  cause?: string;
  responsible_area?: string;
  equipment?: string | null;
  description?: string | null;
}

export interface DelayFilterParams {
  category?: string;
  active_only?: boolean;
  offset?: number;
  limit?: number;
}

export async function getDelays(
  visitId: string,
  params: DelayFilterParams = {}
): Promise<BackendDelay[]> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.active_only !== undefined) query.set('active_only', String(params.active_only));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<BackendDelay[]>(`/visits/${visitId}/delays${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getDelay(visitId: string, delayId: string): Promise<BackendDelay> {
  return apiFetch<BackendDelay>(`/visits/${visitId}/delays/${delayId}`, {
    method: 'GET',
  });
}

export async function addDelay(visitId: string, data: CreateDelayDto): Promise<BackendDelay> {
  return apiFetch<BackendDelay>(`/visits/${visitId}/delays`, {
    method: 'POST',
    body: JSON.stringify({
      start_time: data.start_time,
      end_time: data.end_time || null,
      category: data.category,
      cause: data.cause,
      responsible_area: data.responsible_area,
      equipment: data.equipment || null,
      description: data.description || null,
    }),
  });
}

export async function updateDelay(
  visitId: string,
  delayId: string,
  data: UpdateDelayDto
): Promise<BackendDelay> {
  return apiFetch<BackendDelay>(`/visits/${visitId}/delays/${delayId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
