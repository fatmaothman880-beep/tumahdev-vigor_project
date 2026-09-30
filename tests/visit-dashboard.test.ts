import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupDashboardVisits } from '../src/lib/visitDashboard';
import type { VisitListItem } from '../src/api/visitApi';
import type { BackendVisitStatus } from '../src/api/adapters';

const row = (id: string, status: BackendVisitStatus, arrival: string | null = null): VisitListItem => ({
  vessel: { name: `Vessel ${id}` },
  visit: { id, vessel_id: `vessel-${id}`, berth_id: 'berth', cargo_type: 'Cement', cargo_total_t: 1000,
    status, planned_arrival: arrival, actual_arrival: null, unload_start: null, unload_end: null,
    planned_departure: null, actual_departure: null, post_unloading_minutes: 45, notes: null,
    created_at: '2026-09-24T00:00:00Z', updated_at: '2026-09-24T00:00:00Z' },
});

test('dashboard includes every active visit and excludes closed visits', () => {
  const grouped = groupDashboardVisits([
    row('1', 'ARRIVED'), row('2', 'BERTHED'), row('3', 'UNLOADING'), row('4', 'UNLOADING'),
    row('5', 'DELAYED'), row('6', 'COMPLETED'), row('7', 'DEPARTED'), row('8', 'CANCELLED'),
  ]);
  assert.equal(grouped.active.length, 5);
  assert.equal(grouped.unloading.length, 2);
  assert.equal(grouped.arrived.length, 1);
  assert.equal(grouped.berthed.length, 1);
  assert.equal(grouped.delayed.length, 1);
});

test('planned visits sort by arrival with unscheduled visits last, then move into active operations', () => {
  const visits = [row('unknown', 'PLANNED'), row('later', 'PLANNED', '2026-09-26T00:00:00Z'), row('next', 'PLANNED', '2026-09-25T00:00:00Z')];
  assert.deepEqual(groupDashboardVisits(visits).upcoming.map(row => row.visit.id), ['next', 'later', 'unknown']);
  visits[2].visit.status = 'UNLOADING';
  const result = groupDashboardVisits(visits);
  assert.equal(result.upcoming.length, 2);
  assert.equal(result.unloading[0].visit.id, 'next');
  assert.deepEqual(groupDashboardVisits([]).active, []);
});
