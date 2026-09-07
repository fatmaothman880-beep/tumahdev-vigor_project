import { apiFetch } from "./client";
import { toNumber, toDate, toFrontendDataQuality, type BackendPrediction } from "./adapters";
import type { PredictionData } from "../types";

export async function getPredictions(): Promise<Record<string, PredictionData>> {
  const rows = await apiFetch<Record<string, BackendPrediction & {unloaded_t: string | number}>>("/integration/predictions");
  return Object.fromEntries(Object.entries(rows).map(([id, p]) => [id, {
    unloadedT: toNumber(p.unloaded_t), remainingT: toNumber(p.remaining_t), progressPct: toNumber(p.progress_pct),
    effectiveRateTph: toNumber(p.effective_rate_tph), etaAvailable: !!p.estimated_unload_finish,
    eta: toDate(p.estimated_unload_finish), berthReleaseAvailable: !!p.expected_berth_release,
    berthRelease: toDate(p.expected_berth_release), dataQuality: toFrontendDataQuality(p.data_quality), lastReading: null,
  }]));
}
