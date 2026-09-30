import type { BackendDataQuality, BackendVisit } from '../api/adapters';
import type { VisitListItem } from '../api/visitApi';
import { groupDashboardVisits } from './visitDashboard';

export interface VisitForecast {
  unloaded_t: number | string;
  remaining_t: number | string;
  progress_pct: number | string;
  effective_rate_tph: number | string | null;
  estimated_unload_finish: string | null;
  expected_berth_release: string | null;
  data_quality: BackendDataQuality;
}

export function forecastExplanation(visit: BackendVisit, forecast?: VisitForecast): string | null {
  if (forecast?.estimated_unload_finish) return null;
  if (visit.status === 'PLANNED') return 'Awaiting arrival and unloading readings. Planned dates are shown separately.';
  if (visit.status === 'DELAYED') return 'Visit is delayed. Review the operation status before resuming unloading.';
  if (!forecast) return 'Forecast data could not be loaded. Retry using Refresh.';
  if (forecast.data_quality === 'STALE') return 'Latest reading is over two hours old. Record a current unloading reading.';
  if (forecast.data_quality === 'INSUFFICIENT') return 'Not enough usable readings to calculate an unloading rate. Record unloading progress for this visit.';
  if (forecast.data_quality === 'INVALID') return 'The recorded readings are invalid. Review the unloading and buffer measurements.';
  return 'No finish estimate is available. Review the latest unloading status and readings for this visit.';
}

export function controlTowerRows(visits: VisitListItem[], forecasts: Record<string, VisitForecast>) {
  const { active, upcoming } = groupDashboardVisits(visits);
  // Match visits by their database ID, never by vessel name or legacy planning ID.
  return [...active, ...upcoming].map(row => ({
    ...row, forecast: forecasts[row.visit.id],
    explanation: forecastExplanation(row.visit, forecasts[row.visit.id]),
  }));
}

export function timelineRange(start: string | null | undefined, end: string | null | undefined, now: number, days: number) {
  const from = Date.parse(start || '');
  const to = Date.parse(end || '');
  const horizon = now + days * 86400000;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to <= now || from >= horizon) return null;
  const left = (Math.max(from, now) - now) / (horizon - now) * 100;
  const right = (Math.min(to, horizon) - now) / (horizon - now) * 100;
  return { left: `${left}%`, width: `${right - left}%` };
}
