import 'dotenv/config';
import { proxyOperations } from './server/operationsProxy';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { loadAssistantRecords, answerFromRecords } from './server/groundedAssistant';
import {
  authenticate,
  findUserByEmail,
  registerUser,
  listAllUsers,
  updateUserStatus,
  updateUserRole,
  verifyToken,
  logActivity,
  getActivityLogs,
  validateCompanyDomain,
  UserRole,
} from './server/auth';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers for all API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const apiRouter = express.Router();

// Authentication middleware to populate req.user if Bearer token is provided
apiRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      const currentUser = await findUserByEmail(decoded.email);
      if (currentUser?.status === 'Active') (req as any).user = { ...decoded, role: currentUser.role };
    }
  }
  next();
});

// Helper auth guards
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    res.status(401).json({ error: 'Authentication required. Please sign in with your @turkysgroup.co.tz account.' });
    return;
  }
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: `Access denied. Role ${user.role} does not have required permissions.` });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Authentication & User Management Routes
// ---------------------------------------------------------------------------

// POST /api/v1/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    if (!validateCompanyDomain(email)) {
      res.status(403).json({
        error: 'Corporate Access Policy: Only authorized accounts under @turkysgroup.co.tz are permitted.',
      });
      return;
    }

    const result = await authenticate(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
});

// POST /api/v1/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, department, requestedRole } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    if (!validateCompanyDomain(email)) {
      res.status(403).json({
        error: 'Corporate Registration Policy: Registrations must use official @turkysgroup.co.tz company emails.',
      });
      return;
    }

    const user = await registerUser(email, password, fullName, department, requestedRole);
    res.status(201).json({
      message: 'Account registered successfully. It is now awaiting System Administrator activation.',
      user,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// GET /api/v1/auth/me
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

// POST /api/v1/auth/logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.email) {
    logActivity(user.email, 'LOGOUT', 'USER', user.uid, 'User logged out.');
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/v1/users (Admin only)
apiRouter.get('/users', requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const users = await listAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list users.' });
  }
});

// PUT /api/v1/users/:id/status (Admin only)
apiRouter.put('/users/:id/status', requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Disabled', 'Pending'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be Active, Disabled, or Pending.' });
      return;
    }
    const adminEmail = (req as any).user.email;
    const updated = await updateUserStatus(req.params.id, status, adminEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update user status.' });
  }
});

// PUT /api/v1/users/:id/role (Admin only)
apiRouter.put('/users/:id/role', requireRole(['Admin']), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Management', 'Operations', 'Viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be Admin, Management, Operations, or Viewer.' });
      return;
    }
    const adminEmail = (req as any).user.email;
    const updated = await updateUserRole(req.params.id, role, adminEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update user role.' });
  }
});

// GET /api/v1/activity-logs (Admin & Operations)
apiRouter.get('/activity-logs', requireRole(['Admin', 'Operations', 'Management']), (req: Request, res: Response) => {
  res.json(getActivityLogs());
});

// The assistant reads server-side records. Client context is never a factual source.
apiRouter.post('/ai/assistant', requireAuth, async (req: Request, res: Response) => {
  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
    res.status(400).json({ detail: 'Enter a question between 1 and 2000 characters.' });
    return;
  }
  const history = Array.isArray(req.body.conversationHistory)
    ? req.body.conversationHistory.slice(-6).filter((item: any) =>
        item && item.role === 'user' && typeof item.content === 'string' && item.content.length <= 2000)
    : [];
  try {
    const records = await loadAssistantRecords();
    res.json(await answerFromRecords(prompt.trim(), history, records));
  } catch {
    res.status(503).json({ detail: 'I cannot read the operational records right now. Please retry when the system connection is restored.' });
  }
});

// Read-only health probes are public; every operational request is authenticated.
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && ['/health', '/health/database'].includes(req.path)) return next();
  requireAuth(req, res, () => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return requireRole(['Admin', 'Operations'])(req, res, next);
    }
    next();
  });
});
apiRouter.use(proxyOperations);

// Mount /api/v1 router
app.use('/api/v1', apiRouter);

// Root health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'vigor-smart-port' });
});

// ---------------------------------------------------------------------------
// Server Bootstrap & Vite Integration
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`VIGOR Smart Port Operations server running on port ${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { app, startServer };
