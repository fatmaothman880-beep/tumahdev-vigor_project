/**
 * Central API Client for VIGOR Smart Port Operations
 * Connects frontend to FastAPI (http://localhost:8000/api/v1) + PostgreSQL
 * Supports Dual Mode: Real API Mode (USE_MOCK_API=false) & Demo Mode (USE_MOCK_API=true)
 */

import {
  Vessel,
  Berth,
  Voyage,
  FuelOperation,
  PaymentAccount,
  PaymentTransaction,
  VesselPosition,
  ManufacturerQueueEntry,
  OperationalReading,
  DelayEvent,
  Alert,
  SystemSettings,
  WhatIfScenario,
} from '../types';
import { getInitialDemoData } from '../mock/mockData';
import { recalculateVoyageDependencies, calculateUnloadingForecast } from '../lib/scheduleEngine';
import { generateSystemAlerts } from '../lib/alerts';
import { calculatePaymentAccountTotals } from '../lib/paymentEngine';
import {
  BackendActiveDashboard,
  adaptBackendVessel,
  adaptBackendBerth,
  adaptBackendReading,
  adaptBackendDelay,
} from './adapters';

export const API_BASE_URL = (
  ((import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL as string | undefined) ||
  'http://localhost:8000/api/v1'
).replace(/\/+$/, '');

export const USE_MOCK_API =
  ((import.meta as unknown as { env: Record<string, string> }).env?.VITE_USE_MOCK_API ?? 'false') === 'true';

export class ApiError extends Error {
  public status: number;
  public detail: unknown;
  public isCorsOrNetworkError: boolean;

  constructor(
    message: string,
    status = 500,
    detail: unknown = null,
    isCorsOrNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isCorsOrNetworkError = isCorsOrNetworkError;
  }
}

/**
 * Universal fetch wrapper for all FastAPI endpoints.
 * Prepends API_BASE_URL, sets JSON headers, handles 204s, CORS failures, and FastAPI error structures.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Network request failed';
    const isCorsOrOffline =
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('Load failed') ||
      err instanceof TypeError;

    throw new ApiError(
      isCorsOrOffline
        ? 'Backend connection unavailable. Check API URL/CORS configuration.'
        : `Network Error: ${message}`,
      0,
      err,
      isCorsOrOffline
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Parse response body
  let responseData: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;

    if (responseData && typeof responseData === 'object' && 'detail' in responseData) {
      const detail = (responseData as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI Pydantic validation error format: [{ loc: [...], msg: "...", type: "..." }]
        errorMsg = detail
          .map((item: any) =>
            item.msg ? `${item.loc?.join('.') || 'field'}: ${item.msg}` : JSON.stringify(item)
          )
          .join('; ');
      } else {
        errorMsg = JSON.stringify(detail);
      }
    } else if (responseData && typeof responseData === 'object' && 'error' in responseData) {
      const backendError = (responseData as { error?: { message?: unknown } }).error;
      if (typeof backendError?.message === 'string') {
        errorMsg = backendError.message;
      } else if (backendError?.message) {
        errorMsg = JSON.stringify(backendError.message);
      }
    }

    throw new ApiError(errorMsg, response.status, responseData);
  }

  return responseData as T;
}

const STORAGE_KEY = 'vigor_smart_port_ops_v2';

export interface ConnectionInfo {
  connectionStatus: 'LIVE API' | 'DATABASE CONNECTED' | 'API OFFLINE' | 'DEMO MODE';
  apiHealth: 'healthy' | 'unhealthy' | 'offline' | 'checking';
  databaseStatus: 'connected' | 'unavailable' | 'offline' | 'checking';
  lastChecked: string | null;
  errorMessage: string | null;
  isCorsError: boolean;
  serviceName: string;
  backendActiveDashboard: BackendActiveDashboard | null;
}

export interface AppStore {
  vessels: Vessel[];
  berths: Berth[];
  voyages: Voyage[];
  fuelOperations: FuelOperation[];
  paymentAccounts: PaymentAccount[];
  paymentTransactions: PaymentTransaction[];
  vesselPositions: VesselPosition[];
  manufacturerQueue: ManufacturerQueueEntry[];
  operationalReadings: OperationalReading[];
  delayEvents: DelayEvent[];
  systemSettings: SystemSettings;
  activeScenario?: WhatIfScenario;
  connectionInfo: ConnectionInfo;
}

export type PersistedOperationalState = Pick<
  AppStore,
  | 'vessels'
  | 'berths'
  | 'voyages'
  | 'fuelOperations'
  | 'paymentAccounts'
  | 'paymentTransactions'
  | 'vesselPositions'
  | 'manufacturerQueue'
  | 'operationalReadings'
  | 'delayEvents'
  | 'systemSettings'
>;

export interface BackendOperationalStateEnvelope {
  state: Partial<PersistedOperationalState> | null;
  revision: number;
  updated_at: string | null;
}

type Listener = () => void;

class ApiClient {
  private store: AppStore;
  private listeners: Set<Listener> = new Set();
  private healthIntervalId: number | null = null;
  private stateSyncTimerId: number | null = null;
  private stateRevision = 0;
  private stateSyncInFlight = false;
  private stateSyncPending = false;

  constructor() {
    this.store = this.loadFromStorage();
    this.recalculateAll();

    // Initialize backend connection testing & polling
    if (!USE_MOCK_API) {
      this.testConnection();
      // Poll health every 30 seconds
      if (typeof window !== 'undefined') {
        this.healthIntervalId = window.setInterval(() => {
          this.testConnection(false);
        }, 30000);
      }
    }
  }

  private loadFromStorage(): AppStore {
    const defaultConnection: ConnectionInfo = {
      connectionStatus: USE_MOCK_API ? 'DEMO MODE' : 'API OFFLINE',
      apiHealth: 'checking',
      databaseStatus: 'checking',
      lastChecked: null,
      errorMessage: null,
      isCorsError: false,
      serviceName: 'port-monitoring-api',
      backendActiveDashboard: null,
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vessels && parsed.voyages && parsed.berths) {
          return {
            ...parsed,
            connectionInfo: {
              ...defaultConnection,
              ...(parsed.connectionInfo || {}),
            },
          };
        }
      }
    } catch {
      // Fallback
    }

    const baseline = getInitialDemoData();
    return {
      ...baseline,
      connectionInfo: defaultConnection,
    };
  }

  private saveToStorage(syncBackend = true): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch {
      // Quota exceeded
    }
    this.notify();
    if (syncBackend) {
      this.queueBackendStateSync();
    }
  }

  private getPersistedOperationalState(): PersistedOperationalState {
    const {
      vessels,
      berths,
      voyages,
      fuelOperations,
      paymentAccounts,
      paymentTransactions,
      vesselPositions,
      manufacturerQueue,
      operationalReadings,
      delayEvents,
      systemSettings,
    } = this.store;
    return {
      vessels,
      berths,
      voyages,
      fuelOperations,
      paymentAccounts,
      paymentTransactions,
      vesselPositions,
      manufacturerQueue,
      operationalReadings,
      delayEvents,
      systemSettings,
    };
  }

  private queueBackendStateSync(): void {
    if (
      USE_MOCK_API ||
      this.store.connectionInfo.apiHealth !== 'healthy' ||
      typeof window === 'undefined'
    ) {
      return;
    }
    if (this.stateSyncTimerId !== null) {
      window.clearTimeout(this.stateSyncTimerId);
    }
    this.stateSyncTimerId = window.setTimeout(() => {
      this.stateSyncTimerId = null;
      void this.persistOperationalState();
    }, 500);
  }

  private async persistOperationalState(): Promise<void> {
    if (this.stateSyncInFlight) {
      this.stateSyncPending = true;
      return;
    }
    this.stateSyncInFlight = true;
    try {
      const response = await apiFetch<BackendOperationalStateEnvelope>('/operations/state', {
        method: 'PUT',
        body: JSON.stringify({
          state: this.getPersistedOperationalState(),
          expected_revision: this.stateRevision,
        }),
      });
      this.stateRevision = response.revision;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        this.store.connectionInfo.errorMessage =
          'A newer operations update exists on the server. Refresh before editing again.';
        this.notify();
      } else {
        this.store.connectionInfo.errorMessage =
          'The API is online, but the latest operations update could not be saved.';
        this.notify();
      }
    } finally {
      this.stateSyncInFlight = false;
      if (this.stateSyncPending) {
        this.stateSyncPending = false;
        this.queueBackendStateSync();
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public resetDemoData(): void {
    const baseline = getInitialDemoData();
    this.store = {
      ...baseline,
      connectionInfo: {
        ...this.store.connectionInfo,
      },
    };
    this.recalculateAll();
    this.saveToStorage();
  }

  public exportState(): Record<string, unknown> {
    return {
      ...this.store,
      exportedAt: new Date().toISOString(),
      apiBaseUrl: API_BASE_URL,
      useMockApi: USE_MOCK_API,
    };
  }

  public recalculateAll(): void {
    // 1. Update all payment accounts based on transactions
    this.store.paymentAccounts = this.store.paymentAccounts.map((acc) => {
      const totals = calculatePaymentAccountTotals(acc, this.store.paymentTransactions);
      return {
        ...acc,
        isEligible: totals.isEligible,
        status: totals.remaining === 0 ? 'PAID' : totals.totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
        eligibleAt: totals.isEligible ? acc.eligibleAt || new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
    });

    // 2. Find primary berth B01 expected release time from vessel berthed there
    const v1Voyage = this.store.voyages.find(
      (v) => v.assignedBerthId === 'B01' && (v.currentStage === 'UNLOADING' || v.currentStage === 'BERTHED_AT_VIGOR')
    );
    const b01Release = v1Voyage ? v1Voyage.expectedBerthRelease : undefined;

    // 3. Recalculate each voyage's downstream dependencies and berth conflict
    this.store.voyages = this.store.voyages.map((voyage) => {
      const fuelOp = this.store.fuelOperations.find((f) => f.voyageId === voyage.id);
      const mfrPmt = this.store.paymentAccounts.find(
        (p) => p.voyageId === voyage.id && p.category === 'MANUFACTURER'
      );
      const fuelPmt = this.store.paymentAccounts.find(
        (p) => p.voyageId === voyage.id && p.category === 'FUEL'
      );
      const activeDelays = this.store.delayEvents.filter((d) => d.voyageId === voyage.id && !d.resolved);

      return recalculateVoyageDependencies(
        voyage,
        fuelOp,
        mfrPmt,
        fuelPmt,
        activeDelays,
        voyage.id !== v1Voyage?.id ? b01Release : undefined,
        this.store.systemSettings
      );
    });

    // 4. Update manufacturer queue eligibility based on payment accounts
    this.store.manufacturerQueue = this.store.manufacturerQueue.map((entry) => {
      if (entry.voyageId) {
        const pmt = this.store.paymentAccounts.find(
          (p) => p.voyageId === entry.voyageId && p.category === 'MANUFACTURER'
        );
        if (pmt) {
          return {
            ...entry,
            isEligible: pmt.isEligible,
            paymentStatus: pmt.isEligible ? 'PAID' : pmt.status === 'PARTIALLY_PAID' ? 'PARTIAL' : 'PENDING',
          };
        }
      }
      return entry;
    });
  }

  // -------------------------------------------------------------------------
  // Backend Connectivity & Synchronization
  // -------------------------------------------------------------------------

  public async testConnection(showLoading = true): Promise<ConnectionInfo> {
    if (USE_MOCK_API) {
      this.store.connectionInfo = {
        connectionStatus: 'DEMO MODE',
        apiHealth: 'healthy',
        databaseStatus: 'connected',
        lastChecked: new Date().toISOString(),
        errorMessage: null,
        isCorsError: false,
        serviceName: 'mock-storage-engine',
        backendActiveDashboard: null,
      };
      this.notify();
      return this.store.connectionInfo;
    }

    if (showLoading) {
      this.store.connectionInfo = {
        ...this.store.connectionInfo,
        apiHealth: 'checking',
        databaseStatus: 'checking',
      };
      this.notify();
    }

    const now = new Date().toISOString();
    let apiHealthResp: any = null;
    let dbHealthResp: any = null;
    let errorMsg: string | null = null;
    let isCors = false;

    try {
      apiHealthResp = await apiFetch<any>('/health', { method: 'GET' });
    } catch (err: any) {
      errorMsg = err.message || 'API unreachable';
      isCors = Boolean(err.isCorsOrNetworkError);
    }

    if (apiHealthResp) {
      try {
        dbHealthResp = await apiFetch<any>('/health/database', { method: 'GET' });
      } catch (err: any) {
        errorMsg = `Database check failed: ${err.message}`;
      }
    }

    const isApiHealthy = apiHealthResp?.status === 'healthy';
    const isDbConnected = dbHealthResp?.database === 'connected';

    let overallStatus: ConnectionInfo['connectionStatus'] = 'API OFFLINE';
    if (isDbConnected) {
      overallStatus = 'DATABASE CONNECTED';
    } else if (isApiHealthy) {
      overallStatus = 'LIVE API';
    }

    this.store.connectionInfo = {
      connectionStatus: overallStatus,
      apiHealth: isApiHealthy ? 'healthy' : errorMsg ? 'offline' : 'unhealthy',
      databaseStatus: isDbConnected ? 'connected' : 'unavailable',
      lastChecked: now,
      errorMessage: isDbConnected ? null : errorMsg,
      isCorsError: isCors,
      serviceName: apiHealthResp?.service || 'port-monitoring-api',
      backendActiveDashboard: this.store.connectionInfo.backendActiveDashboard,
    };

    if (isApiHealthy) {
      await this.syncFromBackend();
    }

    this.saveToStorage(false);
    return this.store.connectionInfo;
  }

  public async syncFromBackend(): Promise<void> {
    try {
      const [operationalState, vessels, berths, dashboard] = await Promise.allSettled([
        apiFetch<BackendOperationalStateEnvelope>('/operations/state'),
        apiFetch<any[]>('/vessels?limit=50'),
        apiFetch<any[]>('/berths?limit=50'),
        apiFetch<any>('/dashboard/active'),
      ]);

      const remoteState =
        operationalState.status === 'fulfilled' ? operationalState.value : null;
      if (remoteState?.state) {
        const state = remoteState.state;
        const arrayKeys: Array<keyof PersistedOperationalState> = [
          'vessels',
          'berths',
          'voyages',
          'fuelOperations',
          'paymentAccounts',
          'paymentTransactions',
          'vesselPositions',
          'manufacturerQueue',
          'operationalReadings',
          'delayEvents',
        ];
        for (const key of arrayKeys) {
          const value = state[key];
          if (Array.isArray(value)) {
            (this.store[key] as unknown[]) = value;
          }
        }
        if (state.systemSettings && typeof state.systemSettings === 'object') {
          this.store.systemSettings = {
            ...this.store.systemSettings,
            ...state.systemSettings,
          };
        }
        this.stateRevision = remoteState.revision;
      } else {
        // First integrated run: enrich the frontend baseline with normalized
        // backend master data, then establish the durable state document.
        if (vessels.status === 'fulfilled' && Array.isArray(vessels.value) && vessels.value.length > 0) {
          const existingVessels = this.store.vessels;
          const additions = vessels.value
            .map(adaptBackendVessel)
            .filter(
              (candidate) =>
                !existingVessels.some(
                  (current) =>
                    current.id === candidate.id ||
                    current.name.toLowerCase() === candidate.name.toLowerCase() ||
                    (current.imo && candidate.imo && current.imo === candidate.imo)
                )
            );
          this.store.vessels = [...existingVessels, ...additions];
        }
        if (berths.status === 'fulfilled' && Array.isArray(berths.value) && berths.value.length > 0) {
          const existingBerths = this.store.berths;
          const additions = berths.value
            .map(adaptBackendBerth)
            .filter(
              (candidate) =>
                !existingBerths.some(
                  (current) =>
                    current.id === candidate.id ||
                    current.name.toLowerCase() === candidate.name.toLowerCase()
                )
            );
          this.store.berths = [...existingBerths, ...additions];
        }
        if (operationalState.status === 'fulfilled') {
          this.stateRevision = operationalState.value.revision;
          await this.persistOperationalState();
        }
      }

      if (dashboard.status === 'fulfilled' && dashboard.value) {
        this.store.connectionInfo.backendActiveDashboard = dashboard.value;

        // Synchronize the normalized active visit into its matching full-cycle
        // voyage. Keep the original demo fallback for a newly initialized site.
        const activeDash = dashboard.value;
        const activeVoyage =
          this.store.voyages.find((v) => v.id === activeDash.visit_id) ||
          this.store.voyages.find((v) => v.id === 'voy-01');
        if (activeVoyage && activeDash.unloaded_t !== undefined) {
          activeVoyage.unloadedTonnes = Number(activeDash.unloaded_t) || activeVoyage.unloadedTonnes;
          if (activeDash.unloading_rate_tph) {
            activeVoyage.unloadingRateTph = Number(activeDash.unloading_rate_tph);
          }
          if (activeDash.estimated_unload_finish) {
            activeVoyage.forecastUnloadEnd = activeDash.estimated_unload_finish;
          }
          if (activeDash.expected_berth_release) {
            activeVoyage.expectedBerthRelease = activeDash.expected_berth_release;
          }
          if (activeDash.berth_conflict !== undefined) {
            activeVoyage.berthConflict = activeDash.berth_conflict;
          }
        }
      }

      this.recalculateAll();
      this.saveToStorage(false);
    } catch {
      // Sync error - keep local cache
    }
  }

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------

  public getSnapshot(): AppStore {
    return this.store;
  }

  public getConnectionInfo(): ConnectionInfo {
    return this.store.connectionInfo;
  }

  public getVessels(): Vessel[] {
    return this.store.vessels;
  }

  public getVesselById(id: string): Vessel | undefined {
    return this.store.vessels.find((v) => v.id === id);
  }

  public getBerths(): Berth[] {
    return this.store.berths;
  }

  public getVoyages(): Voyage[] {
    return this.store.voyages;
  }

  public getVoyageById(id: string): Voyage | undefined {
    return this.store.voyages.find((v) => v.id === id);
  }

  public getFuelOperations(): FuelOperation[] {
    return this.store.fuelOperations;
  }

  public getPaymentAccounts(): PaymentAccount[] {
    return this.store.paymentAccounts;
  }

  public getPaymentTransactions(): PaymentTransaction[] {
    return this.store.paymentTransactions;
  }

  public getVesselPositions(): VesselPosition[] {
    return this.store.vesselPositions;
  }

  public getManufacturerQueue(): ManufacturerQueueEntry[] {
    return this.store.manufacturerQueue;
  }

  public getOperationalReadings(voyageId?: string): OperationalReading[] {
    if (voyageId) {
      return this.store.operationalReadings.filter((r) => r.voyageId === voyageId);
    }
    return this.store.operationalReadings;
  }

  public getDelayEvents(voyageId?: string): DelayEvent[] {
    if (voyageId) {
      return this.store.delayEvents.filter((d) => d.voyageId === voyageId);
    }
    return this.store.delayEvents;
  }

  public getAlerts(): Alert[] {
    const v1Voyage = this.store.voyages.find(
      (v) => v.assignedBerthId === 'B01' && v.currentStage === 'UNLOADING'
    );
    return generateSystemAlerts(
      this.store.voyages,
      this.store.paymentAccounts,
      this.store.vesselPositions,
      v1Voyage?.expectedBerthRelease
    );
  }

  public getSettings(): SystemSettings {
    return this.store.systemSettings;
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  public addVessel(vessel: Omit<Vessel, 'id' | 'createdAt' | 'updatedAt'>): Vessel {
    const newVessel: Vessel = {
      ...vessel,
      id: `v-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.vessels.push(newVessel);
    this.saveToStorage();

    // Async sync to FastAPI backend if live
    if (!USE_MOCK_API && this.store.connectionInfo.apiHealth === 'healthy') {
      apiFetch('/vessels', {
        method: 'POST',
        body: JSON.stringify({
          name: newVessel.name,
          imo_reference: newVessel.imo || null,
          capacity_t: newVessel.capacityT,
        }),
      }).catch(() => {});
    }

    return newVessel;
  }

  public updateVessel(id: string, updates: Partial<Vessel>): void {
    const index = this.store.vessels.findIndex((v) => v.id === id);
    if (index >= 0) {
      this.store.vessels[index] = {
        ...this.store.vessels[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage();

      if (!USE_MOCK_API && this.store.connectionInfo.apiHealth === 'healthy') {
        apiFetch(`/vessels/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }).catch(() => {});
      }
    }
  }

  public addBerth(berth: Omit<Berth, 'createdAt' | 'updatedAt'>): Berth {
    const newBerth: Berth = {
      ...berth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.berths.push(newBerth);
    this.saveToStorage();
    return newBerth;
  }

  public updateBerth(id: string, updates: Partial<Berth>): void {
    const index = this.store.berths.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.store.berths[index] = {
        ...this.store.berths[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public addPaymentTransaction(
    txn: Omit<PaymentTransaction, 'id' | 'createdAt'>
  ): PaymentTransaction {
    const newTxn: PaymentTransaction = {
      ...txn,
      id: `tx-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.store.paymentTransactions.push(newTxn);
    this.recalculateAll();
    this.saveToStorage();
    return newTxn;
  }

  public async addOperationalReading(
    reading: Omit<OperationalReading, 'id'>
  ): Promise<OperationalReading> {
    const newReading: OperationalReading = {
      ...reading,
      id: `rd-${Date.now().toString().slice(-6)}`,
    };
    this.store.operationalReadings.unshift(newReading);

    // Update the voyage cargo & rates directly
    const voyage = this.store.voyages.find((v) => v.id === reading.voyageId);
    if (voyage) {
      voyage.unloadedTonnes = reading.unloadedTonnes;
      voyage.unloadingRateTph = reading.observedRateTph;

      const forecast = calculateUnloadingForecast(
        voyage,
        newReading,
        this.store.systemSettings.postUnloadBerthBufferHours
      );
      if (forecast.isAvailable) {
        voyage.forecastUnloadEnd = forecast.forecastUnloadEnd;
        voyage.expectedBerthRelease = forecast.expectedBerthRelease;
      }
    }

    this.recalculateAll();
    this.saveToStorage();

    // If connected to FastAPI, post the reading to the backend
    if (!USE_MOCK_API && this.store.connectionInfo.apiHealth === 'healthy') {
      try {
        const visitId = reading.voyageId;
        const res = await apiFetch<any>(`/visits/${visitId}/readings`, {
          method: 'POST',
          body: JSON.stringify({
            recorded_at: reading.timestamp || new Date().toISOString(),
            source: 'MANUAL',
            unloaded_t: reading.unloadedTonnes,
            observed_rate_tph: reading.observedRateTph,
            unloading_status: 'ACTIVE',
          }),
        });

        // The backend returns { reading, prediction, warnings }
        if (res && res.prediction && voyage) {
          if (res.prediction.estimated_unload_finish) {
            voyage.forecastUnloadEnd = res.prediction.estimated_unload_finish;
          }
          if (res.prediction.expected_berth_release) {
            voyage.expectedBerthRelease = res.prediction.expected_berth_release;
          }
          this.recalculateAll();
          this.saveToStorage();
        }
      } catch {
        // Fallback to local forecast
      }
    }

    return newReading;
  }

  public async addDelayEvent(delay: Omit<DelayEvent, 'id' | 'createdAt'>): Promise<DelayEvent> {
    const newDelay: DelayEvent = {
      ...delay,
      id: `del-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.store.delayEvents.unshift(newDelay);
    this.recalculateAll();
    this.saveToStorage();

    if (!USE_MOCK_API && this.store.connectionInfo.apiHealth === 'healthy') {
      try {
        await apiFetch(`/visits/${delay.voyageId}/delays`, {
          method: 'POST',
          body: JSON.stringify({
            start_time: delay.start,
            end_time: delay.end || null,
            category: delay.category,
            cause: delay.description,
            responsible_area: delay.area,
            description: delay.description,
          }),
        });
      } catch {
        // Fallback
      }
    }

    return newDelay;
  }

  public resolveDelay(id: string, endTime = new Date().toISOString()): void {
    const delay = this.store.delayEvents.find((d) => d.id === id);
    if (delay) {
      delay.resolved = true;
      delay.end = endTime;
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public updateFuelSchedule(
    id: string,
    scheduledStart: string,
    scheduledEnd: string,
    status?: FuelOperation['status']
  ): void {
    const fuel = this.store.fuelOperations.find((f) => f.id === id);
    if (fuel) {
      fuel.scheduledStart = scheduledStart;
      fuel.scheduledEnd = scheduledEnd;
      if (status) fuel.status = status;
      fuel.updatedAt = new Date().toISOString();
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public updateManufacturerConfirmation(
    queueId: string,
    confirmedSlot: string,
    confirmedPosition?: number
  ): void {
    const item = this.store.manufacturerQueue.find((q) => q.id === queueId);
    if (item) {
      item.confirmedSlot = confirmedSlot;
      if (confirmedPosition) item.confirmedQueuePosition = confirmedPosition;
      item.queueSource = 'MANUFACTURER_CONFIRMED';
      item.status = 'WAITING';

      if (item.voyageId) {
        const voyage = this.store.voyages.find((v) => v.id === item.voyageId);
        if (voyage) {
          voyage.manufacturerSlotConfirmed = confirmedSlot;
          voyage.manufacturerSlotForecast = confirmedSlot;
        }
      }
      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public updateVesselPosition(
    vesselId: string,
    latitude: number,
    longitude: number,
    speedKnots: number,
    heading: number,
    course: string
  ): void {
    const pos = this.store.vesselPositions.find((p) => p.vesselId === vesselId);
    if (pos) {
      pos.latitude = latitude;
      pos.longitude = longitude;
      pos.speedKnots = speedKnots;
      pos.heading = heading;
      pos.course = course;
      pos.timestamp = new Date().toISOString();
      pos.dataQuality = 'CURRENT';

      const voyage = this.store.voyages.find((v) => v.vesselId === vesselId && v.status === 'ACTIVE');
      if (voyage && speedKnots > 0) {
        const remainingHours = pos.distanceRemainingNm / speedKnots;
        const newEta = new Date(Date.now() + remainingHours * 3600000).toISOString();
        if (voyage.currentStage === 'RETURNING_TO_VIGOR') {
          voyage.returnEtaForecast = newEta;
        } else if (voyage.currentStage === 'SAILING_TO_MANUFACTURER') {
          voyage.manufacturerEtaForecast = newEta;
        }
      }

      this.recalculateAll();
      this.saveToStorage();
    }
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): void {
    this.store.systemSettings = {
      ...this.store.systemSettings,
      ...settings,
    };
    this.recalculateAll();
    this.saveToStorage();
  }

  public applyWhatIfScenario(scenario: WhatIfScenario | undefined): void {
    this.store.activeScenario = scenario;
    this.recalculateAll();
    this.saveToStorage();
  }

  public loadPresetScenario(type: 'BASELINE' | 'SOLVE_PAYMENT' | 'SOLVE_BERTH'): void {
    if (type === 'BASELINE') {
      this.resetDemoData();
      return;
    }

    if (type === 'SOLVE_PAYMENT') {
      // Find manufacturer payment for voy-01 and clear the remaining amount
      const mfrPmt = this.store.paymentAccounts.find(
        (p) => p.voyageId === 'voy-01' && p.category === 'MANUFACTURER'
      );
      if (mfrPmt) {
        const currentTxns = this.store.paymentTransactions.filter(
          (t) => t.paymentAccountId === mfrPmt.id
        );
        const paidSoFar = currentTxns.reduce((sum, t) => sum + t.amount, 0);
        const remaining = Math.max(0, mfrPmt.requiredAmount - paidSoFar);

        if (remaining > 0) {
          this.addPaymentTransaction({
            paymentAccountId: mfrPmt.id,
            vesselId: 'v-01',
            voyageId: 'voy-01',
            category: 'MANUFACTURER',
            amount: remaining,
            currency: 'TZS',
            transactionDate: new Date().toISOString(),
            paymentMethod: 'Bank Wire / RTGS',
            referenceNumber: `RTGS-SOLVE-${Date.now().toString().slice(-4)}`,
            enteredBy: 'Treasury Controller',
            notes: 'Preset scenario clearance: Unlocks Twiga loading queue eligibility.',
          });
        }
      }
      return;
    }

    if (type === 'SOLVE_BERTH') {
      // Adjust MV VIGOR 03 speed to 8.5 knots so arrival aligns with expected B01 release
      const pos03 = this.store.vesselPositions.find((p) => p.vesselId === 'v-03');
      const voy01 = this.store.voyages.find((v) => v.id === 'voy-01');
      const voy03 = this.store.voyages.find((v) => v.id === 'voy-03');

      if (pos03 && voy01 && voy03) {
        pos03.speedKnots = 8.5;
        pos03.timestamp = new Date().toISOString();
        // Set V03 arrival to 30 mins after B01 berth release
        const targetArrival = new Date(
          new Date(voy01.expectedBerthRelease).getTime() + 30 * 60000
        ).toISOString();
        voy03.returnEtaForecast = targetArrival;
        voy03.conflictNotes = 'Eco-steaming engaged at 8.5 kts. Berth synced with MV VIGOR 01 departure.';
        voy03.berthConflict = false;
        voy03.predictedAnchorageWaitHours = 0;
        this.recalculateAll();
        this.saveToStorage();
      }
    }
  }
}

export const api = new ApiClient();
