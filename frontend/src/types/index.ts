export type EntityId = string | number;

export type VesselStatus =
  | "Planned"
  | "Arrived"
  | "Berthed"
  | "Unloading"
  | "Delayed"
  | "Completed";

export type DataQuality =
  | "current"
  | "stale"
  | "insufficient"
  | "unavailable";

export type BerthRiskLevel = "low" | "conflict" | "unknown";

export interface Berth {
  id: string;
  name: string;
  lengthM: number;
  notes: string;
}

export interface VesselVisit {
  id: EntityId;
  name: string;
  reference: string;
  cargo: string;
  cargoTotalT: number;
  berthId: string;
  status: VesselStatus;
  plannedArrival: Date | null;
  actualArrival: Date | null;
  unloadStart: Date | null;
  unloadFinish: Date | null;

  /**
   * Demo linkage used to evaluate berth conflicts against the next
   * scheduled vessel.
   */
  nextVesselId: EntityId | null;

  /** Minutes required between unloading completion and berth handover. */
  postUnloadBufferMin: number;

  /**
   * Optional manual ETA override for vessels that have not yet berthed.
   */
  etaOverride?: Date | null;
}

export interface OperationalReading {
  id: EntityId;
  timestamp: Date;
  source: "Manual" | "Spreadsheet import" | "Calculated";
  unloadedT: number;
  remainingT: number;
  observedRateTph: number;
}

export type DelayCategory =
  | "Equipment"
  | "Weather"
  | "Labour"
  | "Berth"
  | "Vessel"
  | "Material"
  | "Other";

export interface DelayEvent {
  id: EntityId;
  start: Date;
  end: Date;
  category: DelayCategory;
  area: string;
  description: string;
}

export interface OperationalEvent {
  id: EntityId;
  time: Date;
  text: string;
}

export interface PredictionData {
  unloadedT: number;
  remainingT: number;
  progressPct: number;
  effectiveRateTph: number;
  etaAvailable: boolean;
  eta: Date | null;
  berthReleaseAvailable: boolean;
  berthRelease: Date | null;
  dataQuality: DataQuality;
  lastReading: OperationalReading | null;
}

export interface BerthRiskInfo {
  risk: BerthRiskLevel;
  nextVessel: VesselVisit | null;
  overlapMin: number;
  nextEta: Date | null;
}

/**
 * Frontend-compatible dashboard shape.
 *
 * The API adapter converts the backend snake_case response and uppercase
 * enum values into this frontend representation.
 */
export interface ActiveDashboardResponse {
  visit_id: EntityId;
  vessel_name: string;
  status: string;
  cargo_total_t: number;
  cargo_remaining_t: number;
  progress_pct: number;
  effective_rate_tph: number | null;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  next_vessel_eta: string | null;
  berth_risk: BerthRiskLevel;
  data_quality: DataQuality;
  last_update: string;
}