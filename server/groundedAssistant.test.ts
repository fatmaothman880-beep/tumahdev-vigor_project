import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerFromRecords, fleetFrom, type AssistantRecords } from './groundedAssistant';
import { cosine, lexicalScores } from './assistantSearch';

const fixture = (): AssistantRecords => ({
  state: {
    vessels: [{ id: 'v-01', name: 'MV VIGOR 01', active: true }, { id: 'v-02', name: 'MV VIGOR 02', active: false }, { id: 'v-10', name: 'MV VIGOR 10', active: true }],
    voyages: [{ id: 'plan-1', vesselId: 'v-01', status: 'ACTIVE', currentStage: 'SAILING_TO_MANUFACTURER', manufacturerName: 'Mtwara Cement' }],
  },
  vessels: [{ id: 'db-1', name: 'MV VIGOR 01' }],
  berths: [{ id: 'berth-1', name: 'VIGOR Cement Factory berth' }],
  visits: [{ vessel: { id: 'db-1', name: 'MV VIGOR 01' }, visit: { id: 'visit-1', vessel_id: 'db-1', berth_id: 'berth-1', status: 'UNLOADING', updated_at: '2026-09-16T09:00:00Z' } }],
  forecasts: { 'visit-1': { estimated_unload_finish: '2026-09-16T15:00:00Z', expected_berth_release: '2026-09-16T16:30:00Z', remaining_t: 3000 } },
  checkedAt: '2026-09-16T10:00:00Z',
});

test('count deduplicates normalized and saved vessels; links use visible IDs', async () => {
  const data = fixture();
  assert.equal(fleetFrom(data).length, 3);
  const result = await answerFromRecords('How many vessels do we have?', [], data);
  assert.match(result.answer, /3 vessels.*MV VIGOR 01.*MV VIGOR 02.*MV VIGOR 10/);
  assert.ok(result.actions.some(a => a.page === 'vessel-detail' && a.vesselId === 'v-01'));
  assert.match((await answerFromRecords('How many active vessels?', [], data)).answer, /2 active vessels/);
  assert.match((await answerFromRecords('How many inactive vessels?', [], data)).answer, /1 inactive vessel/);
});

test('current database visit takes precedence over planning status', async () => {
  const result = await answerFromRecords('Where is mv vigor1 at the moment?', [], fixture());
  assert.match(result.answer, /VIGOR Cement Factory berth, unloading/);
  assert.doesNotMatch(result.answer, /sailing/);
  assert.equal(result.actions[0].vesselId, 'v-01');
});

test('numeric aliases do not confuse VIGOR 01 and VIGOR 10', async () => {
  const result = await answerFromRecords('Where is vigor 10?', [], fixture());
  assert.equal(result.actions[0].vesselId, 'v-10');
  assert.match(result.answer, /not confirmed/);
});

test('follow-up resolves vessel from user history and reads current forecast', async () => {
  const result = await answerFromRecords('When will it finish?', [{ role: 'user', content: 'Where is VIGOR 01?' }], fixture());
  assert.match(result.answer, /18:00 EAT/);
  assert.match(result.answer, /3,000 tonnes/);
  const data = fixture();
  data.forecasts = {};
  assert.match((await answerFromRecords('When will VIGOR 01 finish?', [], data)).answer, /no valid current/);
});

test('unknown names and empty register produce no invented vessels', async () => {
  assert.match((await answerFromRecords('Where is VIGOR 99?', [], fixture())).answer, /Which vessel/);
  const data = fixture(); data.state = {}; data.vessels = [];
  assert.match((await answerFromRecords('How many ships?', [], data)).answer, /0 vessels/);
});

test('ambiguous open visits require review rather than inventing a location', async () => {
  const data = fixture();
  data.visits.push({ ...data.visits[0], visit: { ...data.visits[0].visit, id: 'another' } });
  assert.match((await answerFromRecords('Where is VIGOR 01?', [], data)).answer, /more than one open visit/);
});

test('vector fallback ranks relevant intent and handles empty vectors', () => {
  const scores = lexicalScores('ships boats fleet');
  assert.equal(scores.indexOf(Math.max(...scores)), 0);
  assert.equal(cosine([0, 0], [1, 2]), 0);
  assert.ok(cosine([1, 2], [1, 2]) > 0.999);
});
