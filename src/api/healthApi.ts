/**
 * Health API Client for VIGOR Smart Port Operations
 * Checks FastAPI and PostgreSQL connectivity
 */

import { apiFetch, USE_MOCK_API } from './client';
import { BackendHealth, BackendDatabaseHealth } from './adapters';

export interface HealthCheckResult {
  apiStatus: 'healthy' | 'unhealthy' | 'offline';
  databaseStatus: 'connected' | 'unavailable' | 'offline';
  serviceName: string;
  lastChecked: string;
  errorMessage: string | null;
  isCorsError: boolean;
  overallStatus: 'LIVE API' | 'DATABASE CONNECTED' | 'API OFFLINE' | 'DEMO MODE';
}

export async function checkHealth(): Promise<BackendHealth> {
  return apiFetch<BackendHealth>('/health', { method: 'GET' });
}

export async function checkDatabaseHealth(): Promise<BackendDatabaseHealth> {
  return apiFetch<BackendDatabaseHealth>('/health/database', { method: 'GET' });
}

export async function checkSystemHealth(): Promise<HealthCheckResult> {
  const now = new Date().toISOString();

  if (USE_MOCK_API) {
    return {
      apiStatus: 'healthy',
      databaseStatus: 'connected',
      serviceName: 'demo-mock-storage',
      lastChecked: now,
      errorMessage: null,
      isCorsError: false,
      overallStatus: 'DEMO MODE',
    };
  }

  let apiHealth: BackendHealth | null = null;
  let dbHealth: BackendDatabaseHealth | null = null;
  let errorMessage: string | null = null;
  let isCorsError = false;

  try {
    apiHealth = await checkHealth();
  } catch (err: any) {
    errorMessage = err.message || 'API is offline';
    isCorsError = Boolean(err.isCorsOrNetworkError);
    return {
      apiStatus: 'offline',
      databaseStatus: 'offline',
      serviceName: 'port-monitoring-api',
      lastChecked: now,
      errorMessage,
      isCorsError,
      overallStatus: 'API OFFLINE',
    };
  }

  try {
    dbHealth = await checkDatabaseHealth();
  } catch (err: any) {
    errorMessage = `Database check failed: ${err.message}`;
  }

  const isDbOk = dbHealth?.database === 'connected';
  const isApiOk = apiHealth?.status === 'healthy';

  return {
    apiStatus: isApiOk ? 'healthy' : 'unhealthy',
    databaseStatus: isDbOk ? 'connected' : 'unavailable',
    serviceName: apiHealth?.service || 'port-monitoring-api',
    lastChecked: now,
    errorMessage: isDbOk ? null : errorMessage,
    isCorsError: false,
    overallStatus: isDbOk ? 'DATABASE CONNECTED' : isApiOk ? 'LIVE API' : 'API OFFLINE',
  };
}
