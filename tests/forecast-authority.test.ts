import assert from 'node:assert/strict';
import { getInitialDemoData } from '../src/mock/mockData';
import { applyBackendForecast } from '../src/lib/backendForecast';
import { recalculateVoyageDependencies } from '../src/lib/scheduleEngine';

const data = getInitialDemoData();
const voyage = data.voyages[0];
const forecast = {
  estimated_unload_finish: '2026-09-16T18:00:00Z',
  expected_berth_release: '2026-09-16T19:30:00Z',
  effective_rate_tph: '500', unloaded_t: '3000',
};
applyBackendForecast(voyage, forecast);
voyage.unloadingRateTph = 999;
const updated = recalculateVoyageDependencies(voyage);
assert.equal(updated.forecastUnloadEnd, forecast.estimated_unload_finish);
assert.equal(updated.expectedBerthRelease, forecast.expected_berth_release);
applyBackendForecast(updated, { ...forecast, estimated_unload_finish: null, expected_berth_release: null });
assert.equal(updated.forecastUnloadEnd, '');
assert.equal(updated.expectedBerthRelease, '');
assert.doesNotThrow(() => recalculateVoyageDependencies({ ...updated, fuelRequired: true }, data.fuelOperations[0]));

Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => key === 'vigor_smart_port_ops_v2' ? JSON.stringify(data) : null,
  setItem() {},
} });
globalThis.fetch = async () => new Response(JSON.stringify({ status: 'offline' }));
const { api } = await import('../src/api/client');
await api.testConnection(false);
const before = JSON.stringify(api.getSnapshot().operationalReadings);
const cargo = api.getSnapshot().voyages[0].unloadedTonnes;
globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Visit not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
await assert.rejects(api.addOperationalReading({
  ...data.operationalReadings[0], voyageId: voyage.id,
  vesselId: voyage.vesselId, unloadedTonnes: 5900,
}), /Visit not found/);
assert.equal(JSON.stringify(api.getSnapshot().operationalReadings), before);
assert.equal(api.getSnapshot().voyages[0].unloadedTonnes, cargo);
assert.equal(api.getSnapshot().voyages[0].forecastUnloadEnd, '');
console.log('PASS backend estimates survive recalculation; unavailable forecasts clear; failed saves do not mutate records.');

const visitVoyage = { ...api.getSnapshot().voyages[0], id: 'database-visit-id' };
const state = { ...data, voyages: [visitVoyage, { ...data.voyages[0], id: 'voy-01' }] };
globalThis.fetch = async (input) => {
  const url = String(input);
  const body = url.endsWith('/operations/state') ? { state, revision: 1 }
    : url.endsWith('/integration/predictions') ? { 'database-visit-id': forecast }
    : url.endsWith('/dashboard/active') ? { visit_id: 'unrelated', estimated_unload_finish: forecast.estimated_unload_finish }
    : [];
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
await api.syncFromBackend();
assert.equal(api.getSnapshot().voyages[0].forecastUnloadEnd, forecast.estimated_unload_finish);
assert.equal(api.getSnapshot().voyages[1].forecastUnloadEnd, '');
api.recalculateAll();
assert.equal(api.getSnapshot().voyages[0].expectedBerthRelease, forecast.expected_berth_release);
console.log('PASS sync uses exact visit IDs and never assigns another visit to demo voyages.');
