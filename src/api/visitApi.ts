/**
 * VesselVisit API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /visits endpoints
 */

import { apiFetch } from './client';
import { BackendVisit, BackendVisitStatus } from './adapters';

export interface CreateVisitDto {
  vessel_id: string;
  berth_id: string;
  cargo_type?: string;
  cargo_total_t?: number;
  planned_arrival?: string | null;
  actual_arrival?: string | null;
  unload_start?: string | null;
  unload_end?: string | null;
  planned_departure?: string | null;
  actual_departure?: string | null;
  post_unloading_minutes?: number | null;
  status?: BackendVisitStatus;
  notes?: string | null;
}

export interface UpdateVisitDto {
  berth_id?: string;
  cargo_type?: string;
  cargo_total_t?: number;
  planned_arrival?: string | null;
  actual_arrival?: string | null;
  unload_start?: string | null;
  unload_end?: string | null;
  planned_departure?: string | null;
  actual_departure?: string | null;
  post_unloading_minutes?: number | null;
  status?: BackendVisitStatus;
  notes?: string | null;
}

export interface VisitFilterParams {
  visit_status?: BackendVisitStatus;
  vessel_id?: string;
  berth_id?: string;
  offset?: number;
  limit?: number;
}

export async function getVisits(params: VisitFilterParams = {}): Promise<BackendVisit[]> {
  const query = new URLSearchParams();
  if (params.visit_status) query.set('visit_status', params.visit_status);
  if (params.vessel_id) query.set('vessel_id', params.vessel_id);
  if (params.berth_id) query.set('berth_id', params.berth_id);
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<BackendVisit[]>(`/visits${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getVisit(visitId: string): Promise<BackendVisit> {
  return apiFetch<BackendVisit>(`/visits/${visitId}`, {
    method: 'GET',
  });
}

export async function createVisit(data: CreateVisitDto): Promise<BackendVisit> {
  return apiFetch<BackendVisit>('/visits', {
    method: 'POST',
    body: JSON.stringify({
      vessel_id: data.vessel_id,
      berth_id: data.berth_id,
      cargo_type: data.cargo_type || 'Bulk Cement',
      cargo_total_t: data.cargo_total_t ?? 9600,
      planned_arrival: data.planned_arrival || null,
      actual_arrival: data.actual_arrival || null,
      unload_start: data.unload_start || null,
      unload_end: data.unload_end || null,
      planned_departure: data.planned_departure || null,
      actual_departure: data.actual_departure || null,
      post_unloading_minutes: data.post_unloading_minutes ?? 45,
      status: data.status || 'PLANNED',
      notes: data.notes || null,
    }),
  });
}

export async function updateVisit(visitId: string, data: UpdateVisitDto): Promise<BackendVisit> {
  return apiFetch<BackendVisit>(`/visits/${visitId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function completeVisit(visitId: string, departureTime = new Date().toISOString()): Promise<BackendVisit> {
  return updateVisit(visitId, {
    status: 'COMPLETED',
    actual_departure: departureTime,
  });
}
