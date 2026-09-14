import assert from 'node:assert/strict';
import {
  addSuggestedTasks,
  getChecklist,
  getOverdueTasks,
  getSiteCatalogue,
  getTaskHistory,
  saveTask,
  type OperationalTask,
  type TaskInput,
} from '../src/api/workflowApi';

const visitId = '76b543cc-bf36-4f4f-98e4-42b20205d15b';
const requests: Array<{ path: string; method: string; body?: any }> = [];
const task: OperationalTask = {
  id: '65158543-06d6-4f09-9776-c37de07d3837', visit_id: visitId,
  title: 'Arrange pilot', category: 'PILOT', owner_name: null,
  due_at: null, completed_at: null, status: 'NOT_STARTED', blocks_departure: true,
  reason: '', evidence_reference: '', version: 3, timeliness: 'UNSCHEDULED', delay_minutes: 0,
};

globalThis.fetch = async (url, init) => {
  const path = String(url).replace(/^.*\/api\/v1/, '');
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  requests.push({ path, method: init?.method || 'GET', body });
  let response: unknown = {};
  if (path === '/workflow/site') response = { configured: true, berth_label: 'Mangapwani — Berth 1', vessels: [{ vessel_id: 'v-1', name: 'Polar Night', reference: '', reported_cargo_t: '13800', temporary_label: false, notes: '' }] };
  else if (path === '/workflow/overdue') response = [{ ...task, vessel_id: 'v-1', vessel_name: 'Polar Night' }];
  else if (path.endsWith('/history')) response = [{ id: 'h-1', performed_by: 'Recorder', occurred_at: new Date().toISOString(), old_value: null, new_value: { status: 'NOT_STARTED' } }];
  else if (path.endsWith('/templates')) response = { tasks: [task], checklist_state: 'INCOMPLETE', overdue_count: 0, unassigned_count: 1, unscheduled_count: 1, notice: '' };
  else if (path.includes('/tasks')) response = init?.method === 'PUT' || init?.method === 'POST' ? task : { tasks: [task], checklist_state: 'INCOMPLETE', overdue_count: 0, unassigned_count: 1, unscheduled_count: 1, notice: '' };
  return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

assert.equal((await getSiteCatalogue()).vessels[0].name, 'Polar Night');
assert.equal((await getChecklist(visitId)).tasks[0].visit_id, visitId);
assert.equal((await getOverdueTasks())[0].vessel_id, 'v-1');
await addSuggestedTasks(visitId, 'Recorder');
assert.equal(requests.at(-1)?.body.performed_by, 'Recorder');
const values: TaskInput = { performed_by: 'Recorder', title: task.title, category: task.category, owner_name: null, due_at: null, completed_at: null, status: 'NOT_STARTED', blocks_departure: true, reason: '', evidence_reference: '' };
await saveTask(visitId, values, task, 'Owner review');
assert.equal(requests.at(-1)?.method, 'PUT');
assert.equal(requests.at(-1)?.body.expected_version, 3);
assert.equal(requests.at(-1)?.body.change_reason, 'Owner review');
assert.equal((await getTaskHistory(visitId, task.id))[0].performed_by, 'Recorder');
console.log('PASS: site catalogue, checklist, overdue tasks, templates, guarded task update and history API mappings.');
