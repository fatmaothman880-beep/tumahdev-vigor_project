import 'dotenv/config';
import { proxyOperations } from './server/operationsProxy';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  performSemanticSearch,
  buildGroundedOperationalSnapshot,
  generateFactualAnalystResponse,
  SYSTEM_ROUTES,
  AssistantAnalysisResult,
} from './server/semanticKnowledge';
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

// 10. AI Assistant Endpoint (NLP + Vector Retrieval + Grounded Gemini Model)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

apiRouter.post('/ai/assistant', requireAuth, async (req: Request, res: Response) => {
  const { prompt, context, conversationHistory } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  // 1. Semantic search & entity/intent extraction
  const retrieved = performSemanticSearch(prompt, conversationHistory);

  // 2. Build live grounded operational data
  const groundedData = buildGroundedOperationalSnapshot(context);

  // 3. Generate high-precision baseline factual analyst response
  const baselineResponse = generateFactualAnalystResponse(prompt, retrieved, groundedData);
  let finalResult: AssistantAnalysisResult = { ...baselineResponse };

  // 4. If Gemini API is available, enhance with gemini-3.8-flash while strictly enforcing grounding rules
  const ai = getGenAI();
  if (ai) {
    try {
      const systemInstruction = `You are the senior VIGOR Port Operations Analyst for Vigor Cement Works / Turkys Group in Zanzibar.
You explain vessel schedules, berth conflicts, production, dispatch, and fuel status using the latest operational data.

STRICT OPERATIONAL RULES:
1. The system NO LONGER has live vessel GPS, AIS, or real-time location tracking. The vessel module is based purely on schedules, voyage rotations, recorded arrivals/departures, and pneumatic discharge telemetry. NEVER claim to monitor real-time vessel movements, GPS, AIS, or live coordinates.
2. Ground all answers strictly in the provided Live System Data. NEVER hallucinate or invent times, quantities, delays, or positions.
3. Keep answers concise: 2 to 5 clear, conversational, explanatory sentences. Do NOT output raw database objects, JSON dumps, or technical field names. Explain what is happening first in plain language.
4. Output your response strictly as valid JSON matching this schema:
{
  "answer": "string (2-5 conversational, explanatory sentences)",
  "severity": "warning" | "alert" | "info" | "normal",
  "statusBadge": "string e.g. '⚠ Berth conflict detected' or null",
  "relatedEntity": "string e.g. 'MV VIGOR 03' or null",
  "relatedRoute": "string e.g. 'berths' | 'control-tower' | 'fuel' | 'payments' | 'vessels' | 'vessel-detail' | 'manufacturer-queue' | 'alerts'",
  "routeLabel": "string e.g. 'View Berth Schedule →'"
}`;

      const geminiPrompt = `${systemInstruction}

LIVE SYSTEM DATA:
${JSON.stringify(groundedData, null, 2)}

RETRIEVED OPERATIONAL CONCEPT & RULES:
Concept: ${retrieved.concept.conceptName}
Category: ${retrieved.concept.category}
Operational Rules: ${retrieved.concept.operationalRules.join('; ')}
Target Route: ${retrieved.targetRoute}
Default Route Label: ${retrieved.routeLabel}

DETECTED ENTITIES & INTENT:
Entities: ${JSON.stringify(retrieved.detectedEntities)}
Intent: ${retrieved.intent}

RECENT CONVERSATION HISTORY:
${JSON.stringify(conversationHistory || [], null, 2)}

USER QUESTION:
"${prompt}"

Produce JSON output only:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: geminiPrompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        try {
          const parsed = JSON.parse(response.text);
          if (parsed && typeof parsed.answer === 'string' && parsed.answer.trim().length > 10) {
            finalResult = {
              answer: parsed.answer.trim(),
              severity: parsed.severity || baselineResponse.severity,
              statusBadge: parsed.statusBadge || baselineResponse.statusBadge,
              relatedEntity: parsed.relatedEntity || baselineResponse.relatedEntity,
              relatedRoute: parsed.relatedRoute || baselineResponse.relatedRoute,
              routeLabel: parsed.routeLabel || baselineResponse.routeLabel,
              vesselId: baselineResponse.vesselId,
            };
          }
        } catch (jsonErr) {
          // Fallback to baseline response if JSON parse fails
          console.warn('[Gemini Response JSON Parse Warning]:', jsonErr);
        }
      }
    } catch (err: unknown) {
      console.warn('[Gemini API Call Failed - Using Grounded Semantic Baseline]:', err);
    }
  }

  // Ensure route is valid
  const matchedRoute = SYSTEM_ROUTES.find((r) => r.id === finalResult.relatedRoute);
  if (!matchedRoute) {
    finalResult.relatedRoute = baselineResponse.relatedRoute;
    finalResult.routeLabel = baselineResponse.routeLabel;
  }

  res.json({
    answer: finalResult.answer,
    severity: finalResult.severity,
    statusBadge: finalResult.statusBadge,
    relatedEntity: finalResult.relatedEntity,
    relatedRoute: finalResult.relatedRoute,
    routeLabel: finalResult.routeLabel,
    vesselId: finalResult.vesselId,
    actions: [
      {
        label: finalResult.routeLabel,
        page: finalResult.relatedRoute,
        vesselId: finalResult.vesselId,
      },
    ],
    semanticMatch: {
      concept: retrieved.concept.conceptName,
      intent: retrieved.intent,
      score: Math.round(retrieved.similarityScore * 100) / 100,
    },
  });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIGOR Smart Port Operations server running on port ${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { app, startServer };
