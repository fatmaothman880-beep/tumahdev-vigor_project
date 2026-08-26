export type VesselStatus =
  | "Planned"
  | "Arrived"
  | "Berthed"
  | "Unloading"
  | "Delayed"
  | "Completed";

export type DataQuality = "current" | "stale" | "insufficient" | "unavailable";

export type BerthRiskLevel = "low" | "conflict" | "unknown";

export interface Berth {
  id: string;
  name: string;
  lengthM: number;
  notes: string;
}

export interface VesselVisit {
  id: number;
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
  /** Demo-only linkage used to evaluate berth conflicts against the next scheduled vessel. */
  nextVesselId: number | null;
  /** Minutes required between unload completion and berth handover. */
  postUnloadBufferMin: number;
  /** Optional manual ETA override for vessels not yet berthed (demo assumption). */
  etaOverride?: Date | null;
}

export interface OperationalReading {
  id: number;
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
  id: number;
  start: Date;
  end: Date;
  category: DelayCategory;
  area: string;
  description: string;
}

export interface OperationalEvent {
  id: number;
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

/** Shape returned by GET /dashboard/active — see README "Real API contract". */
export interface ActiveDashboardResponse {
  visit_id: number;
  vessel_name: string;
  status: string;
  cargo_total_t: number;
  cargo_remaining_t: number;
  progress_pct: number;
  effective_rate_tph: number;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  next_vessel_eta: string | null;
  berth_risk: BerthRiskLevel | "unknown";
  data_quality: DataQuality;
  last_update: string;
}
