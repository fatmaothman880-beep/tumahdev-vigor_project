export type VesselStatus =
  | "Planned"
  | "Arrived"
  | "Berthed"
  | "Unloading"
  | "Delayed"
  | "Completed"
  | "Cancelled";

export type DataQuality = "current" | "stale" | "insufficient" | "unavailable";

export type BerthRiskLevel = "low" | "conflict" | "unknown";

/** Rate unit the operator chooses to enter/view — internally always stored as t/h. */
export type RateUnit = "tph" | "tpm";

/**
 * Operational risk state for a single vessel visit. Distinct from
 * VesselStatus: a vessel can be "Unloading" and simultaneously "at-risk"
 * if its forecast completion has slipped past plan. See lib/riskEngine.ts.
 */
export type OperationalRiskLevel = "on-track" | "at-risk" | "delayed" | "overdue" | "unknown";

export interface OperationalRisk {
  level: OperationalRiskLevel;
  reason: string | null;
  projectedDelayMin: number | null;
}

/** A lightweight mock notification/alert surfaced in the header bell + Alerts feed. */
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertKind = "arrival" | "completion-shift" | "overdue" | "berth-conflict" | "rate-drop" | "berth-available";

export interface OperationalAlert {
  id: number;
  time: Date;
  severity: AlertSeverity;
  kind: AlertKind;
  message: string;
  vesselId?: number;
}

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
  /** When the vessel visit record was created in the system. */
  registeredAt: Date | null;
  plannedArrival: Date | null;
  actualArrival: Date | null;
  /** Planned start of unloading, independent of when it actually started. */
  plannedUnloadStart: Date | null;
  unloadStart: Date | null;
  /** Planned/target completion time, set at registration or edited later. */
  plannedCompletion: Date | null;
  unloadFinish: Date | null;
  /** Planned unloading rate the schedule was built around (t/h). */
  plannedRateTph: number | null;
  /** Demo-only linkage used to evaluate berth conflicts against the next scheduled vessel. */
  nextVesselId: number | null;
  /** Minutes required between unload completion and berth handover. */
  postUnloadBufferMin: number;
  /** Optional manual ETA override for vessels not yet berthed (demo assumption). */
  etaOverride?: Date | null;
  /** Free-text operational notes, editable alongside planning fields. */
  notes?: string;
}

export interface OperationalReading {
  id: number;
  timestamp: Date;
  source: "Manual" | "Spreadsheet import" | "Calculated";
  unloadedT: number;
  remainingT: number;
  observedRateTph: number;
  notes?: string;
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

/** Time-based schedule progress — kept strictly separate from cargo progress. See lib/riskEngine.ts. */
export interface TimeProgress {
  available: boolean;
  elapsedMin: number | null;
  totalPlannedMin: number | null;
  plannedProgressPct: number | null;
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
