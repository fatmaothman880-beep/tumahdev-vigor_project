/**
 * Active Dashboard API Service for VIGOR Smart Port Operations
 * Interacts with FastAPI /dashboard/active endpoint
 */

import { apiFetch } from './client';
import { BackendActiveDashboard } from './adapters';

export async function getActiveDashboard(): Promise<BackendActiveDashboard | null> {
  try {
    return await apiFetch<BackendActiveDashboard>('/dashboard/active', {
      method: 'GET',
    });
  } catch (err: any) {
    if (err.status === 404) {
      return null;
    }
    throw err;
  }
}
