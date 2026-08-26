import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { ActiveDashboardResponse } from "../types";
import { computePrediction, berthRiskFor } from "../lib/prediction";

/**
 * GET /dashboard/active — see README "Real API contract" and
 * types/index.ts ActiveDashboardResponse for the exact shape the FastAPI
 * backend is expected to return. In mock mode we assemble an equivalent
 * response from the local prediction helper so pages can be written once
 * against this contract and left unchanged when the real backend lands.
 */
export async function getActiveDashboard(): Promise<ActiveDashboardResponse | null> {
  if (!USE_MOCK_API) {
    return apiFetch<ActiveDashboardResponse>(`/dashboard/active`);
  }
  const vessels = await mock.getVesselVisits();
  const readings = await mock.getAllReadings();
  const active = vessels.find((v) => v.status === "Unloading" || v.status === "Berthed");
  if (!active) return null;

  const revived = Object.fromEntries(
    Object.entries(readings).map(([k, list]: [string, any]) => [
      Number(k),
      (list as any[]).map((r) => ({ ...r, timestamp: new Date(r.timestamp) })),
    ])
  );
  const now = new Date();
  const pred = computePrediction(active, revived, now);
  const risk = berthRiskFor(active, pred, vessels);

  return {
    visit_id: active.id,
    vessel_name: active.name,
    status: active.status.toLowerCase(),
    cargo_total_t: active.cargoTotalT,
    cargo_remaining_t: pred.remainingT,
    progress_pct: Math.round(pred.progressPct * 10) / 10,
    effective_rate_tph: pred.effectiveRateTph,
    estimated_unload_finish: pred.eta ? pred.eta.toISOString() : null,
    expected_berth_release: pred.berthRelease ? pred.berthRelease.toISOString() : null,
    next_vessel_eta: risk.nextEta ? risk.nextEta.toISOString() : null,
    berth_risk: risk.risk,
    data_quality: pred.dataQuality,
    last_update: now.toISOString(),
  };
}
