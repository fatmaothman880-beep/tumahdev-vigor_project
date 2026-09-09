/**
 * Upcoming Calls API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /upcoming-calls endpoints
 */

import { apiFetch } from './client';
import { BackendUpcomingCall, BackendUpcomingCallStatus } from './adapters';

export interface CreateUpcomingCallDto {
  vessel_id: string;
  berth_id: string;
  expected_arrival: string;
  cargo_type?: string;
  cargo_quantity_t: number;
  expected_rate_tph?: number | null;
  call_alert_at?: string | null;
  confirmation_due_at?: string | null;
  confirmed_at?: string | null;
  berth_preparation_minutes?: number | null;
  status?: BackendUpcomingCallStatus;
  notes?: string | null;
}

export interface UpdateUpcomingCallDto {
  vessel_id?: string;
  berth_id?: string;
  expected_arrival?: string;
  cargo_type?: string;
  cargo_quantity_t?: number;
  expected_rate_tph?: number | null;
  call_alert_at?: string | null;
  confirmation_due_at?: string | null;
  confirmed_at?: string | null;
  berth_preparation_minutes?: number | null;
  status?: BackendUpcomingCallStatus;
  notes?: string | null;
}

export async function getUpcomingCalls(offset = 0, limit = 50): Promise<BackendUpcomingCall[]> {
  return apiFetch<BackendUpcomingCall[]>(`/upcoming-calls?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function getUpcomingCall(callId: string): Promise<BackendUpcomingCall> {
  return apiFetch<BackendUpcomingCall>(`/upcoming-calls/${callId}`, {
    method: 'GET',
  });
}

export async function createUpcomingCall(data: CreateUpcomingCallDto): Promise<BackendUpcomingCall> {
  return apiFetch<BackendUpcomingCall>('/upcoming-calls', {
    method: 'POST',
    body: JSON.stringify({
      vessel_id: data.vessel_id,
      berth_id: data.berth_id,
      expected_arrival: data.expected_arrival,
      cargo_type: data.cargo_type || 'Bulk Cement',
      cargo_quantity_t: data.cargo_quantity_t,
      expected_rate_tph: data.expected_rate_tph ?? 600,
      call_alert_at: data.call_alert_at ?? null,
      confirmation_due_at: data.confirmation_due_at ?? null,
      confirmed_at: data.confirmed_at ?? null,
      berth_preparation_minutes: data.berth_preparation_minutes ?? 60,
      status: data.status || 'PLANNED',
      notes: data.notes ?? null,
    }),
  });
}

export async function updateUpcomingCall(
  callId: string,
  data: UpdateUpcomingCallDto
): Promise<BackendUpcomingCall> {
  return apiFetch<BackendUpcomingCall>(`/upcoming-calls/${callId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
