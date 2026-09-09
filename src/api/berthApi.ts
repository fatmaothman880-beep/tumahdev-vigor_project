/**
 * Berth API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /berths endpoints
 */

import { apiFetch } from './client';
import { BackendBerth, BackendBerthStatus } from './adapters';

export interface CreateBerthDto {
  name: string;
  status?: BackendBerthStatus;
}

export interface UpdateBerthDto {
  name?: string;
  status?: BackendBerthStatus;
}

export async function getBerths(offset = 0, limit = 50): Promise<BackendBerth[]> {
  return apiFetch<BackendBerth[]>(`/berths?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function getBerth(berthId: string): Promise<BackendBerth> {
  return apiFetch<BackendBerth>(`/berths/${berthId}`, {
    method: 'GET',
  });
}

export async function createBerth(data: CreateBerthDto): Promise<BackendBerth> {
  return apiFetch<BackendBerth>('/berths', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      status: data.status || 'AVAILABLE',
    }),
  });
}

export async function updateBerth(berthId: string, data: UpdateBerthDto): Promise<BackendBerth> {
  return apiFetch<BackendBerth>(`/berths/${berthId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
