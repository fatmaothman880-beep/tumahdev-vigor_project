import assert from 'node:assert/strict';
import { test } from 'node:test';
import { controlTowerRows, forecastExplanation, timelineRange, type VisitForecast } from '../src/lib/controlTower';
import type { VisitListItem } from '../src/api/visitApi';
import type { BackendVisitStatus } from '../src/api/adapters';

const row = (id: string, status: BackendVisitStatus = 'UNLOADING'): VisitListItem => ({
  vessel: { name: 'Same vessel' },
  visit: { id, vessel_id: 'same-vessel', berth_id: 'berth', cargo_type: 'Cement', cargo_total_t: 6000,
    status, planned_arrival: null, actual_arrival: null, unload_start: null, unload_end: null,
    planned_departure: null, actual_departure: null, post_unloading_minutes: 45, notes: null,
    created_at: '2026-09-30T00:00:00Z', updated_at: '2026-09-30T00:00:00Z' },
});
const forecast: VisitForecast = {
  unloaded_t: 3000, remaining_t: 3000, progress_pct: 50, effective_rate_tph: 500,
  estimated_unload_finish: '2026-09-30T18:00:00Z', expected_berth_release: '2026-09-30T18:45:00Z', data_quality: 'VALID',
};

test('Control Tower joins exact visit IDs, preserves multiple calls, and excludes closed visits', () => {
  const result = controlTowerRows([row('real-1'), row('real-2'), row('planned', 'PLANNED'), row('closed', 'COMPLETED')], {
    'real-2': forecast, 'voy-01': forecast,
  });
  assert.deepEqual(result.map(r => r.visit.id), ['real-1', 'real-2', 'planned']);
  assert.equal(result[0].forecast, undefined);
  assert.equal(result[1].forecast?.estimated_unload_finish, forecast.estimated_unload_finish);
  assert.equal(result[1].explanation, null);
});

test('missing forecasts explain data quality without substituting planned dates', () => {
  const visit = { ...row('real').visit, planned_completion: '2026-10-01T12:00:00Z' };
  const missing = { ...forecast, estimated_unload_finish: null, expected_berth_release: null };
  assert.match(forecastExplanation(visit, { ...missing, data_quality: 'STALE' })!, /over two hours old/);
  assert.match(forecastExplanation(visit, { ...missing, data_quality: 'INSUFFICIENT' })!, /Not enough usable readings/);
  assert.match(forecastExplanation(visit, { ...missing, data_quality: 'INVALID' })!, /invalid/);
  assert.match(forecastExplanation(visit, missing)!, /unloading status/);
  assert.match(forecastExplanation(visit)!, /could not be loaded/);
  assert.match(forecastExplanation({ ...visit, status: 'PLANNED' }, missing)!, /Awaiting arrival/);
  assert.match(forecastExplanation({ ...visit, status: 'DELAYED' }, missing)!, /delayed/);
});

test('timeline clips the selected horizon and omits unknown, past and future ranges', () => {
  const now = Date.parse('2026-09-30T00:00:00Z');
  assert.deepEqual(timelineRange('2026-09-29', '2026-10-02', now, 7), { left: '0%', width: `${2 / 7 * 100}%` });
  assert.deepEqual(timelineRange('2026-09-29', '2026-10-30', now, 7), { left: '0%', width: '100%' });
  assert.equal(timelineRange(null, forecast.estimated_unload_finish, now, 7), null);
  assert.equal(timelineRange('bad-date', '2026-10-01', now, 7), null);
  assert.equal(timelineRange('2026-09-28', '2026-09-29', now, 7), null);
  assert.equal(timelineRange('2026-10-10', '2026-10-11', now, 7), null);
  assert.equal(timelineRange('2026-10-02', '2026-10-01', now, 7), null);
  assert.deepEqual(controlTowerRows([], {}), []);
});
