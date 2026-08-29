import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type {
  ActiveDashboardResponse,
  BerthRiskLevel,
} from "../types";
import {
  toFrontendDataQuality,
  toNumber,
} from "./adapters";
import {
  berthRiskFor,
  computePrediction,
} from "../lib/prediction";

interface BackendDashboardResponse {
  visit_id: string;
  vessel_name: string;
  berth_name: string;
  cargo_type: string;
  cargo_total_t: number | string;
  visit_status: string;
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
  data_quality: string;
  next_vessel_arrival: string | null;
  berth_conflict: boolean | null;
  berth_risk_level: string | null;
  berth_gap_minutes: number | string | null;
  berth_message: string | null;
}

function mapBerthRisk(
  level: string | null,
  conflict: boolean | null,
): BerthRiskLevel {
  if (conflict === true) {
    return "conflict";
  }

  switch (level?.toUpperCase()) {
    case "HIGH":
    case "MEDIUM":
    case "CONFLICT":
      return "conflict";

    case "LOW":
    case "NONE":
    case "SAFE":
      return "low";

    default:
      return "unknown";
  }
}

function mapBackendDashboard(
  dashboard: BackendDashboardResponse,
): ActiveDashboardResponse {
  return {
    visit_id: dashboard.visit_id,
    vessel_name: dashboard.vessel_name,
    status: dashboard.visit_status,
    cargo_total_t: toNumber(dashboard.cargo_total_t),
    cargo_remaining_t: toNumber(dashboard.remaining_t),
    progress_pct: toNumber(dashboard.progress_pct),
    effective_rate_tph:
      dashboard.unloading_rate_tph === null
        ? null
        : toNumber(dashboard.unloading_rate_tph),
    estimated_unload_finish:
      dashboard.estimated_unload_finish,
    expected_berth_release:
      dashboard.expected_berth_release,
    next_vessel_eta: dashboard.next_vessel_arrival,
    berth_risk: mapBerthRisk(
      dashboard.berth_risk_level,
      dashboard.berth_conflict,
    ),
    data_quality: toFrontendDataQuality(
      dashboard.data_quality,
    ),
    last_update:
      dashboard.recorded_at || new Date().toISOString(),
  };
}

export async function getActiveDashboard():
Promise<ActiveDashboardResponse | null> {
  if (!USE_MOCK_API) {
    const dashboard =
      await apiFetch<BackendDashboardResponse | null>(
        "/dashboard/active",
      );

    return dashboard
      ? mapBackendDashboard(dashboard)
      : null;
  }

  const vessels = await mock.getVesselVisits();
  const readings = await mock.getAllReadings();

  const active = vessels.find(
    (vessel) =>
      vessel.status === "Unloading" ||
      vessel.status === "Berthed",
  );

  if (!active) {
    return null;
  }

  const revived = Object.fromEntries(
    Object.entries(readings).map(([key, list]) => [
      key,
      list.map((reading) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      })),
    ]),
  );

  const now = new Date();
  const prediction = computePrediction(
    active,
    revived,
    now,
  );
  const risk = berthRiskFor(
    active,
    prediction,
    vessels,
  );

  return {
    visit_id: active.id,
    vessel_name: active.name,
    status: active.status,
    cargo_total_t: active.cargoTotalT,
    cargo_remaining_t: prediction.remainingT,
    progress_pct:
      Math.round(prediction.progressPct * 10) / 10,
    effective_rate_tph:
      prediction.effectiveRateTph || null,
    estimated_unload_finish:
      prediction.eta?.toISOString() || null,
    expected_berth_release:
      prediction.berthRelease?.toISOString() || null,
    next_vessel_eta:
      risk.nextEta?.toISOString() || null,
    berth_risk: risk.risk,
    data_quality: prediction.dataQuality,
    last_update: now.toISOString(),
  };
}