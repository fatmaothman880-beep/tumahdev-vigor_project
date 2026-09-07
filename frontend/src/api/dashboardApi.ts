import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { ActiveDashboardResponse } from "../types";
import { computePrediction, berthRiskFor } from "../lib/prediction";
import { getVesselVisits } from "./vesselApi";
import { getPredictions } from "./predictionApi";
import { getReadings } from "./readingApi";

/**
 * GET /dashboard/active — see README "Real API contract" and
 * types/index.ts ActiveDashboardResponse for the exact shape the FastAPI
 * backend is expected to return. In mock mode we assemble an equivalent
 * response from the local prediction helper so pages can be written once
 * against this contract and left unchanged when the real backend lands.
 */
export async function getActiveDashboard(): Promise<ActiveDashboardResponse | null> {
  if (!USE_MOCK_API) {
    const [visits, forecasts] = await Promise.all([getVesselVisits(), getPredictions()]);
    const active = visits.find(v => ["Unloading", "Berthed", "Delayed"].includes(v.status));
    if (!active) return null;
    const p = forecasts[active.id];
    if (!p) throw new Error("No forecast returned for the active visit");
    const readings = await getReadings(active.id);
    const latest = readings[readings.length - 1];
    const risk = berthRiskFor(active, p, visits);
    return {visit_id: active.id, vessel_name: active.name, status: active.status,
      cargo_total_t: active.cargoTotalT, cargo_remaining_t: p.remainingT, progress_pct: p.progressPct,
      effective_rate_tph: p.effectiveRateTph, estimated_unload_finish: p.eta?.toISOString() || null,
      expected_berth_release: p.berthRelease?.toISOString() || null, next_vessel_eta: risk.nextEta?.toISOString() || null,
      berth_risk: risk.risk, data_quality: p.dataQuality, last_update: latest?.timestamp.toISOString() || ""};
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
