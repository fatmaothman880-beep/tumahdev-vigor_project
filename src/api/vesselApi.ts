/**
 * Vessel API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /vessels endpoints
 */

import { apiFetch } from './client';
import { BackendVessel } from './adapters';

export interface CreateVesselDto {
  name: string;
  imo_reference?: string | null;
  capacity_t: number;
  agent_name?: string | null;
  agent_phone?: string | null;
}

export interface UpdateVesselDto {
  name?: string;
  imo_reference?: string | null;
  capacity_t?: number;
  agent_name?: string | null;
  agent_phone?: string | null;
}

export async function getVessels(offset = 0, limit = 50): Promise<BackendVessel[]> {
  return apiFetch<BackendVessel[]>(`/vessels?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function getVessel(vesselId: string): Promise<BackendVessel> {
  return apiFetch<BackendVessel>(`/vessels/${vesselId}`, {
    method: 'GET',
  });
}

export async function createVessel(data: CreateVesselDto): Promise<BackendVessel> {
  return apiFetch<BackendVessel>('/vessels', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      imo_reference: data.imo_reference || null,
      capacity_t: data.capacity_t,
      agent_name: data.agent_name || null,
      agent_phone: data.agent_phone || null,
    }),
  });
}

export async function updateVessel(vesselId: string, data: UpdateVesselDto): Promise<BackendVessel> {
  return apiFetch<BackendVessel>(`/vessels/${vesselId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
