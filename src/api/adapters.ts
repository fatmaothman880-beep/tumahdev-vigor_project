/**
 * VIGOR Smart Port Operations - Backend Contract Adapters & Types
 * Connects Frontend Types to FastAPI + PostgreSQL Backend
 */

import {
  Vessel,
  Berth,
  BerthStatus,
  OperationalReading,
  DelayEvent,
  DelayCategory,
  DataQuality,
  Voyage,
} from '../types';

/**
 * Safely converts string/number/null from PostgreSQL NUMERIC to JavaScript number.
 * Prevents NaN from ever leaking into UI calculations.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? fallback : num;
}

// ---------------------------------------------------------------------------
// 1. Backend Contract Interfaces (FastAPI + SQLAlchemy models)
// ---------------------------------------------------------------------------

export interface BackendVessel {
  id: string;
  name: string;
  imo_reference: string | null;
  capacity_t: number | string | null;
  agent_name: string | null;
  agent_phone: string | null;
  created_at: string;
  updated_at: string;
}

export type BackendBerthStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface BackendBerth {
  id: string;
  name: string;
  status: BackendBerthStatus;
  created_at: string;
  updated_at: string;
}

export type BackendVisitStatus =
  | 'PLANNED'
  | 'ARRIVED'
  | 'UNLOADING'
  | 'COMPLETED'
  | 'DEPARTED'
  | 'CANCELLED';

export interface BackendVisit {
  id: string;
  vessel_id: string;
  berth_id: string;
  cargo_type: string;
  cargo_total_t: number | string | null;
  planned_arrival: string | null;
  actual_arrival: string | null;
  unload_start: string | null;
  unload_end: string | null;
  planned_departure: string | null;
  actual_departure: string | null;
  post_unloading_minutes: number | string | null;
  status: BackendVisitStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BackendReadingSource = 'MANUAL' | 'CSV' | 'DEMO';
export type BackendUnloadingStatus = 'ACTIVE' | 'STOPPED' | 'COMPLETED';
export type BackendPackagingStatus = 'ACTIVE' | 'STOPPED' | 'NOT_APPLICABLE';

export interface BackendReading {
  id: string;
  visit_id: string;
  recorded_at: string;
  source: BackendReadingSource;
  unloaded_t: number | string;
  observed_rate_tph: number | string | null;
  buffer_level_t: number | string | null;
  buffer_capacity_t: number | string | null;
  packaging_rate_tph: number | string | null;
  unloading_status: BackendUnloadingStatus;
  packaging_status: BackendPackagingStatus | null;
  notes: string | null;
  created_at: string;
}

export type BackendDataQuality = 'VALID' | 'STALE' | 'INSUFFICIENT' | 'INVALID';

export interface BackendPrediction {
  id: string;
  visit_id: string;
  generated_at: string;
  remaining_t: number | string;
  progress_pct: number | string;
  effective_rate_tph: number | string | null;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  method: string;
  data_quality: BackendDataQuality;
  created_at: string;
}

export interface BackendReadingCreateResponse {
  reading: BackendReading;
  prediction: BackendPrediction | null;
  warnings: string[];
}

export interface BackendDelay {
  id: string;
  visit_id: string;
  start_time: string;
  end_time: string | null;
  category: string;
  cause: string;
  responsible_area: string;
  equipment: string | null;
  description: string | null;
  created_at: string;
}

export type BackendUpcomingCallStatus = 'PLANNED' | 'CONFIRMED' | 'ARRIVED' | 'CANCELLED';

export interface BackendUpcomingCall {
  id: string;
  vessel_id: string;
  berth_id: string;
  expected_arrival: string;
  cargo_type: string;
  cargo_quantity_t: number | string;
  expected_rate_tph: number | string | null;
  call_alert_at: string | null;
  confirmation_due_at: string | null;
  confirmed_at: string | null;
  berth_preparation_minutes: number | string | null;
  status: BackendUpcomingCallStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendActiveDashboard {
  visit_id: string;
  vessel_name: string;
  berth_name: string;
  cargo_type: string;
  cargo_total_t: number | string;
  visit_status: BackendVisitStatus;
  recorded_at: string | null;
  unloaded_t: number | string;
  remaining_t: number | string;
  progress_pct: number | string;
  unloading_rate_tph: number | string | null;
  unloading_status: string | null;
  buffer_level_t: number | string | null;
  buffer_capacity_t: number | string | null;
  buffer_percentage: number | string | null;
  buffer_risk_level: string | null;
  buffer_risk_type: string | null;
  buffer_net_flow_tph: number | string | null;
  buffer_hours_to_full: number | string | null;
  buffer_hours_to_empty: number | string | null;
  buffer_recommended_action: string | null;
  buffer_message: string | null;
  packaging_rate_tph: number | string | null;
  packaging_status: string | null;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  data_quality: BackendDataQuality;
  next_vessel_arrival: string | null;
  berth_conflict: boolean;
  berth_risk_level: string | null;
  berth_gap_minutes: number | string | null;
  berth_message: string | null;
}

export interface BackendHealth {
  status: string;
  service: string;
}

export interface BackendDatabaseHealth {
  status: string;
  database: string;
}

// ---------------------------------------------------------------------------
// 2. Adapters: Backend -> Frontend UI Types
// ---------------------------------------------------------------------------

export function adaptBackendDataQuality(dq: BackendDataQuality): DataQuality {
  switch (dq) {
    case 'VALID':
      return 'CURRENT';
    case 'STALE':
      return 'STALE';
    case 'INSUFFICIENT':
      return 'INSUFFICIENT';
    case 'INVALID':
    default:
      return 'UNAVAILABLE';
  }
}

export function adaptBackendReadingSource(
  source: BackendReadingSource
): 'Manual' | 'Spreadsheet Import' | 'Calculated' {
  switch (source) {
    case 'MANUAL':
      return 'Manual';
    case 'CSV':
      return 'Spreadsheet Import';
    case 'DEMO':
    default:
      return 'Calculated';
  }
}

export function adaptBackendBerthStatus(status: BackendBerthStatus): BerthStatus {
  switch (status) {
    case 'AVAILABLE':
      return 'ACTIVE';
    case 'OCCUPIED':
      return 'ACTIVE';
    case 'MAINTENANCE':
      return 'MAINTENANCE';
    default:
      return 'ACTIVE';
  }
}

export function adaptFrontendBerthStatusToBackend(status: BerthStatus): BackendBerthStatus {
  switch (status) {
    case 'MAINTENANCE':
      return 'MAINTENANCE';
    case 'ACTIVE':
    default:
      return 'AVAILABLE';
  }
}

export function adaptBackendVessel(bv: BackendVessel): Vessel {
  return {
    id: bv.id,
    name: bv.name,
    imo: bv.imo_reference || undefined,
    reference: bv.imo_reference || `IMO-${bv.id.slice(0, 7)}`,
    active: true,
    capacityT: toNumber(bv.capacity_t, 10000),
    notes: bv.agent_name ? `Agent: ${bv.agent_name} (${bv.agent_phone || 'N/A'})` : undefined,
    createdAt: bv.created_at,
    updatedAt: bv.updated_at,
  };
}

export function adaptBackendBerth(bb: BackendBerth): Berth {
  return {
    id: bb.id,
    name: bb.name,
    location: 'Zanzibar Port North Quay',
    type: 'Pneumatic Bulk Unloading',
    lengthM: 185,
    maxDraftM: 9.5,
    maximumVesselSize: 12000,
    operationalHours: '24/7 Continuous',
    defaultUnloadingRate: 600,
    status: adaptBackendBerthStatus(bb.status),
    createdAt: bb.created_at,
    updatedAt: bb.updated_at,
  };
}

export function adaptBackendReading(
  br: BackendReading,
  vesselId = 'v-01'
): OperationalReading {
  const unloaded = toNumber(br.unloaded_t);
  const observedRate = toNumber(br.observed_rate_tph, 600);
  return {
    id: br.id,
    voyageId: br.visit_id,
    vesselId,
    timestamp: br.recorded_at,
    source: adaptBackendReadingSource(br.source),
    unloadedTonnes: unloaded,
    remainingTonnes: Math.max(0, 9600 - unloaded),
    observedRateTph: observedRate,
    dataQuality: 'CURRENT',
    notes: br.notes || undefined,
  };
}

export function adaptBackendDelay(bd: BackendDelay, vesselId = 'v-01'): DelayEvent {
  return {
    id: bd.id,
    voyageId: bd.visit_id,
    vesselId,
    start: bd.start_time,
    end: bd.end_time || undefined,
    category: (bd.category as DelayCategory) || 'Equipment',
    area: bd.responsible_area || 'Berth B01 Unloading',
    description: bd.description || bd.cause || 'Operational delay',
    resolved: Boolean(bd.end_time),
    recordedBy: 'Terminal Officer',
    createdAt: bd.created_at,
  };
}
