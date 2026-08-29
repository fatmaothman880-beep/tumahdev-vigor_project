import type {
  DataQuality,
  DelayCategory,
  EntityId,
  OperationalReading,
  VesselStatus,
  VesselVisit,
} from "../types";

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

export interface BackendVisit {
  id: string;
  vessel_id: string;
  berth_id: string;
  cargo_type: string;
  cargo_total_t: number | string;
  planned_arrival: string | null;
  actual_arrival: string | null;
  unload_start: string | null;
  unload_end: string | null;
  planned_departure: string | null;
  actual_departure: string | null;
  post_unloading_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendReading {
  id: string;
  visit_id: string;
  recorded_at: string;
  source: string;
  unloaded_t: number | string;
  observed_rate_tph: number | string | null;
  buffer_level_t: number | string | null;
  buffer_capacity_t: number | string | null;
  packaging_rate_tph: number | string | null;
  unloading_status: string;
  packaging_status: string | null;
  notes: string | null;
  created_at: string;
}

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
  data_quality: string;
  created_at: string;
}

export interface BackendReadingResult {
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
  responsible_area: string | null;
  equipment: string | null;
  description: string | null;
  created_at: string;
}

export function toNumber(
  value: number | string | null | undefined,
  fallback = 0,
): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const converted = Number(value);
  return Number.isFinite(converted) ? converted : fallback;
}

export function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

export function toBackendStatus(status: VesselStatus): string {
  const statuses: Record<VesselStatus, string> = {
    Planned: "PLANNED",
    Arrived: "ARRIVED",
    Berthed: "ARRIVED",
    Unloading: "UNLOADING",
    Delayed: "CANCELLED",
    Completed: "COMPLETED",
  };

  return statuses[status];
}

export function toFrontendStatus(status: string): VesselStatus {
  const statuses: Record<string, VesselStatus> = {
    PLANNED: "Planned",
    ARRIVED: "Arrived",
    UNLOADING: "Unloading",
    COMPLETED: "Completed",
    DEPARTED: "Completed",
    CANCELLED: "Delayed",
  };

  return statuses[status] ?? "Planned";
}

export function mapVisit(
  visit: BackendVisit,
  vessel: BackendVessel,
): VesselVisit {
  return {
    id: visit.id,
    name: vessel.name,
    reference: vessel.imo_reference || "—",
    cargo: visit.cargo_type,
    cargoTotalT: toNumber(visit.cargo_total_t),
    berthId: visit.berth_id,
    status: toFrontendStatus(visit.status),
    plannedArrival: toDate(visit.planned_arrival),
    actualArrival: toDate(visit.actual_arrival),
    unloadStart: toDate(visit.unload_start),
    unloadFinish: toDate(visit.unload_end),
    nextVesselId: null,
    postUnloadBufferMin: visit.post_unloading_minutes,
    etaOverride: null,
  };
}

export function toBackendReadingSource(
  source: OperationalReading["source"],
): string {
  const sources: Record<OperationalReading["source"], string> = {
    Manual: "MANUAL",
    "Spreadsheet import": "CSV",
    Calculated: "DEMO",
  };

  return sources[source];
}

export function toFrontendReadingSource(
  source: string,
): OperationalReading["source"] {
  if (source === "CSV") {
    return "Spreadsheet import";
  }

  if (source === "DEMO") {
    return "Calculated";
  }

  return "Manual";
}

export function mapReading(
  reading: BackendReading,
  cargoTotalT: number,
  remainingOverride?: number,
): OperationalReading {
  const unloadedT = toNumber(reading.unloaded_t);

  return {
    id: reading.id,
    timestamp: new Date(reading.recorded_at),
    source: toFrontendReadingSource(reading.source),
    unloadedT,
    remainingT:
      remainingOverride ??
      Math.max(cargoTotalT - unloadedT, 0),
    observedRateTph: toNumber(reading.observed_rate_tph),
  };
}

export function toFrontendDataQuality(value: string): DataQuality {
  const qualities: Record<string, DataQuality> = {
    VALID: "current",
    STALE: "stale",
    INSUFFICIENT: "insufficient",
    INVALID: "unavailable",
  };

  return qualities[value] ?? "unavailable";
}

export function toDelayCategory(value: string): DelayCategory {
  const allowed: DelayCategory[] = [
    "Equipment",
    "Weather",
    "Labour",
    "Berth",
    "Vessel",
    "Material",
    "Other",
  ];

  const match = allowed.find(
    (category) =>
      category.toLowerCase() === value.toLowerCase(),
  );

  return match ?? "Other";
}

export function sameId(
  first: EntityId,
  second: EntityId | null | undefined,
): boolean {
  return second !== null &&
    second !== undefined &&
    String(first) === String(second);
}