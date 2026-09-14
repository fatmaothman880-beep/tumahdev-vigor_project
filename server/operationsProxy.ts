import { logActivity } from './auth';
import type { Request, Response } from 'express';

// All operational records use FastAPI/PostgreSQL, including the full-cycle state.
export async function proxyOperations(req: Request, res: Response) {
  const base = (process.env.OPERATIONS_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
  try {
    const upstream = await fetch(`${base}${req.url}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
      redirect: 'manual',
    });
    if (upstream.ok && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const user = (req as any).user;
      try {
        logActivity(user.email, 'OPERATIONS_WRITE', 'OPERATIONS', undefined, req.method + ' ' + req.path);
      } catch (error) {
        console.error('Operational write succeeded but its audit entry could not be persisted.', error);
      }
    }
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ detail: 'Operations backend unavailable. No changes were saved. Check FastAPI and PostgreSQL.' });
  }
}
