import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vigor-auth-test-'));
process.env.AUTH_DATA_PATH = path.join(temp, 'auth.json');
const { app } = await import('../server');

test('authenticated gateway preserves backend semantics and rejects unauthorized writes', async () => {
  const upstream = express();
  upstream.use(express.json());
  upstream.get('/api/v1/health', (_req, res) => res.json({ status: 'healthy' }));
  upstream.get('/api/v1/operations/state', (_req, res) => res.json({ state: null, revision: 0 }));
  upstream.put('/api/v1/operations/state', (req, res) => {
    if (req.body.expected_revision !== 0) return res.status(409).json({ detail: 'stale revision' });
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
    const state = { vessels: [], voyages: [] };
    const saved = await call('/operations/state', 'PUT', { expected_revision: 0, state }, token);
    assert.deepEqual(await saved.json(), { state, revision: 1 });
    assert.equal((await call('/operations/state', 'PUT', { expected_revision: 8, state }, token)).status, 409);
    assert.deepEqual(await (await call('/integration/example?limit=3', 'GET', undefined, token)).json(), { query: { limit: '3' } });
    assert.equal((await call('/tracking', 'GET', undefined, token)).status, 404);
    const viewer = await (await call('/auth/login', 'POST', { email: 'auditor@turkysgroup.co.tz', password: 'Turkys@2025' })).json();
    assert.equal((await call('/operations/state', 'PUT', { state }, viewer.token)).status, 403);
    assert.equal((await call('/users', 'GET', undefined, viewer.token)).status, 403);
    const assistant = await call('/ai/assistant', 'POST', { prompt: 'What can you tell me about berth planning?', context: {} }, token);
    assert.equal(assistant.status, 200);
    assert.ok((await assistant.json()).answer);
    const reg = await call('/auth/register', 'POST', { email: 'test@turkysgroup.co.tz', password: 'Different123!', fullName: 'Test User', department: 'QA' });
    assert.equal(reg.status, 201);
    const { user } = await reg.json();
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
