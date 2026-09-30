import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeUserRole } from '../shared/roles';

process.env.NODE_ENV = 'test';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigor-auth-test-'));
process.env.AUTH_DATA_PATH = path.join(temp, 'auth.json');
const { app } = await import('../server');

test('authenticated gateway preserves backend semantics and rejects unauthorized writes', async () => {
  const upstream = express();
  upstream.use(express.json());
  upstream.get('/api/v1/health', (_req, res) => res.json({ status: 'healthy' }));
  let storedState: any = null;
  upstream.get('/api/v1/operations/state', (_req, res) => res.json({ state: storedState, revision: 0 }));
  upstream.put('/api/v1/operations/state', (req, res) => {
    if (req.body.expected_revision !== 0) return res.status(409).json({ detail: 'stale revision' });
    storedState = req.body.state;
    res.json({ state: req.body.state, revision: 1 });
  });
  upstream.get('/api/v1/integration/example', (req, res) => res.json({ query: req.query }));
  const backend = upstream.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => backend.once('listening', resolve));
  process.env.OPERATIONS_API_URL = `http://127.0.0.1:${(backend.address() as AddressInfo).port}/api/v1`;
  const gateway = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => gateway.once('listening', resolve));
  const base = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}/api/v1`;
  const call = (url: string, method = 'GET', body?: unknown, token?: string) => fetch(base + url, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    assert.equal((await call('/operations/state')).status, 401);
    assert.equal((await call('/health')).status, 200);
    assert.equal((await call('/auth/login', 'POST', { email: 'admin@turkysgroup.co.tz', password: 'wrong' })).status, 401);
    const login = await call('/auth/login', 'POST', { email: 'admin@turkysgroup.co.tz', password: 'Turkys@2025' });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    assert.equal((await call('/users', 'GET', undefined, token)).status, 200);
    const state = { vessels: [], voyages: [], systemSettings: { bufferHours: 2 } };
    const saved = await call('/operations/state', 'PUT', { expected_revision: 0, state }, token);
    assert.deepEqual(await saved.json(), { state, revision: 1 });
    assert.equal((await call('/operations/state', 'PUT', { expected_revision: 8, state }, token)).status, 409);
    assert.deepEqual(await (await call('/integration/example?limit=3', 'GET', undefined, token)).json(), { query: { limit: '3' } });
    assert.equal((await call('/tracking', 'GET', undefined, token)).status, 404);
    const viewer = await (await call('/auth/login', 'POST', { email: 'auditor@turkysgroup.co.tz', password: 'Turkys@2025' })).json();
    assert.equal((await call('/operations/state', 'PUT', { state }, viewer.token)).status, 403);
    assert.equal((await call('/users', 'GET', undefined, viewer.token)).status, 403);
    assert.equal(normalizeUserRole('Operations'), 'Vessel Operation');
    assert.equal(normalizeUserRole('Admin'), 'Admin');
    const operations = await (await call('/auth/login', 'POST', { email: 'ops.dispatcher@turkysgroup.co.tz', password: 'Turkys@2025' })).json();
    assert.equal(operations.user.role, 'Vessel Operation');
    assert.equal((await call('/operations/state', 'PUT', { expected_revision: 0, state }, operations.token)).status, 200);
    assert.equal((await call('/operations/state', 'PUT', { expected_revision: 0, state: { ...state, systemSettings: { bufferHours: 9 } } }, operations.token)).status, 403);
    const management = await (await call('/auth/login', 'POST', { email: 'ceo@turkysgroup.co.tz', password: 'Turkys@2025' })).json();
    assert.equal(management.user.role, 'Management');
    for (const account of [operations, management, viewer]) {
      assert.equal((await call('/operations/state', 'GET', undefined, account.token)).status, 200);
      assert.equal((await call('/users', 'GET', undefined, account.token)).status, 403);
      assert.equal((await call('/users/usr-005/role', 'PUT', { role: 'Admin' }, account.token)).status, 403);
      assert.equal((await call('/users/usr-005/status', 'PUT', { status: 'Active' }, account.token)).status, 403);
    }
    assert.equal((await call('/operations/state', 'PUT', { expected_revision: 0, state }, management.token)).status, 403);
    assert.equal((await call('/users/usr-005/role', 'PUT', { role: 'Vessel Operation' }, token)).status, 200);
    assert.equal((await call('/users/usr-005/role', 'PUT', { role: 'Operations' }, token)).status, 400);
    assert.equal((await call('/auth/register', 'POST', { email: 'invalid@turkysgroup.co.tz', password: 'Different123!', fullName: 'Invalid Role', department: 'QA', requestedRole: 'Invalid' })).status, 400);
    const assistant = await call('/ai/assistant', 'POST', { prompt: 'What can you tell me about berth planning?', context: {} }, token);
    assert.equal(assistant.status, 200);
    assert.ok((await assistant.json()).answer);
    const reg = await call('/auth/register', 'POST', { email: 'test@turkysgroup.co.tz', password: 'Different123!', fullName: 'Test User', department: 'QA' });
    assert.equal(reg.status, 201);
    const { user } = await reg.json();
    assert.equal(user.role, 'Vessel Operation');
    assert.equal((await call(`/users/${user.id}/status`, 'PUT', { status: 'Active' }, token)).status, 200);
    assert.equal((await call('/auth/login', 'POST', { email: user.email, password: 'Turkys@2025' })).status, 401);
    const member = await (await call('/auth/login', 'POST', { email: user.email, password: 'Different123!' })).json();
    await call(`/users/${user.id}/status`, 'PUT', { status: 'Disabled' }, token);
    assert.equal((await call('/operations/state', 'GET', undefined, member.token)).status, 401);
    assert.ok(JSON.parse(fs.readFileSync(process.env.AUTH_DATA_PATH!, 'utf8')).users.some((u: any) => u.email === user.email));
    await new Promise<void>(resolve => backend.close(() => resolve()));
    assert.equal((await call('/operations/state', 'GET', undefined, token)).status, 502);
  } finally {
    gateway.closeAllConnections();
    backend.closeAllConnections();
    await new Promise<void>(resolve => gateway.close(() => resolve()));
    backend.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('read-only roles cannot mutate local operational state before synchronization', async () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalFetch = globalThis.fetch;
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  try {
    const { api } = await import('../src/api/client');
    await api.testConnection(false);
    for (const role of ['Viewer', 'Management']) {
      values.set('vigor_auth_user', JSON.stringify({ role }));
      const before = JSON.stringify(api.getSnapshot());
      assert.throws(() => api.addManufacturer('Blocked', 'Blocked'), /read-only/);
      assert.throws(() => api.resetDemoData(), /read-only/);
      assert.throws(() => api.updateSystemSettings({}), /read-only/);
      await assert.rejects(api.addDelayEvent({} as any), /read-only/);
      assert.equal(JSON.stringify(api.getSnapshot()), before);
    }
    values.set('vigor_auth_user', JSON.stringify({ role: 'Vessel Operation' }));
    assert.throws(() => api.updateSystemSettings({}), /read-only/);
    const manufacturerId = api.addManufacturer('Allowed', 'Works');
    assert.ok(manufacturerId);
    values.set('vigor_auth_user', JSON.stringify({ role: 'Admin' }));
    assert.doesNotThrow(() => api.updateSystemSettings({}));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete (globalThis as any).localStorage;
  }
});

test('visit creation is listed and permission errors use actionable language', async () => {
  const originalFetch = globalThis.fetch;
  const { canEditOperations } = await import('../shared/roles');
  assert.equal(canEditOperations('Admin'), true);
  assert.equal(canEditOperations('Vessel Operation'), true);
  assert.equal(canEditOperations('Management'), false);
  assert.equal(canEditOperations('Viewer'), false);
  const visit = {
    id: 'visit-new', vessel_id: 'vessel-one', berth_id: 'berth-one',
    status: 'PLANNED', cargo_type: 'Bulk Cement', cargo_total_t: '1500',
    planned_arrival: null, created_at: '2026-09-17T10:00:00Z',
  };
  let saved = false;
  const row = { visit, vessel: { name: 'Test Carrier' } };
  globalThis.fetch = async (url, options) => {
    const pathname = String(url);
    if (pathname.endsWith('/visits') && options?.method === 'POST') {
      assert.equal(JSON.parse(String(options.body)).vessel_id, 'vessel-one');
      saved = true;
      return Response.json(visit, { status: 201 });
    }
    if (pathname.endsWith('/integration/visits')) return Response.json(saved ? [row] : []);
    return Response.json({ error: 'Access denied.' }, { status: 403 });
  };
  try {
    const { createVisit, getVisitList } = await import('../src/api/visitApi');
    assert.deepEqual(await getVisitList(), []);
    const result = await createVisit({ vessel_id: 'vessel-one', berth_id: 'berth-one', cargo_total_t: 1500 });
    assert.equal(result.id, visit.id);
    assert.deepEqual(await getVisitList(), [row]);
    const { apiFetch } = await import('../src/api/client');
    await assert.rejects(apiFetch('/forbidden'), (error: any) => error.status === 403 && error.message === 'Your role does not allow this action. Please contact an administrator if you need access.');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { VesselVisitList } = await import('../src/components/ui/VesselVisitList');
    const { AuthProvider } = await import('../src/auth/AuthContext');
    const markup = renderToStaticMarkup(createElement(AuthProvider, { children: createElement(VesselVisitList, { savedVisit: { ...row, visit: result } }) }));
    assert.match(markup, /Test Carrier/);
    assert.match(markup, /PLANNED/);
    assert.match(markup, /Not scheduled/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
