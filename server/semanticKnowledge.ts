/**
 * VIGOR Smart Port Operations — Semantic Knowledge & Retrieval Layer
 *
 * Provides:
 * 1. Semantic Knowledge Base of operational concepts, rules, and system routes.
 * 2. Entity Recognition (Vessels, Berths, Manufacturers, Resources).
 * 3. Intent Classification (WHY, WHAT, WHEN, HOW MUCH, STATUS, RISK, ACTION).
 * 4. Vector Embedding & Cosine Similarity Semantic Retrieval.
 * 5. Structured Grounded Operational Snapshot compiler.
 * 6. Conversational Context & Pronoun Resolution.
 */

export interface SemanticRoute {
  id: string; // matches application router page IDs
  title: string;
  category: string;
  description: string;
  keywords: string[];
  defaultLabel: string;
}

export interface SemanticConcept {
  id: string;
  conceptName: string;
  category: 'BERTH' | 'VESSEL' | 'PRODUCTION' | 'DISPATCH' | 'FUEL' | 'FINANCE' | 'ALERTS' | 'VOYAGE';
  description: string;
  synonyms: string[];
  operationalRules: string[];
  targetRouteId: string;
  routeLabel: string;
  defaultSeverity: 'warning' | 'alert' | 'info' | 'normal';
  defaultStatusBadge?: string;
  embeddingVector?: number[];
}

export interface EntityDetectionResult {
  vesselId?: 'v-01' | 'v-02' | 'v-03';
  vesselName?: string;
  berthId?: 'b-01';
  manufacturer?: 'Tanga Cement' | 'Twiga Cement';
  resource?: 'fuel' | 'production' | 'dispatch' | 'silo' | 'buffer' | 'payment';
  rawMatchedText?: string;
}

export type QueryIntent =
  | 'WHY'
  | 'WHEN'
  | 'WHAT'
  | 'WHERE'
  | 'HOW_MUCH'
  | 'STATUS'
  | 'COMPARE'
  | 'RISK'
  | 'ACTION'
  | 'GENERAL';

export interface RetrievedKnowledge {
  concept: SemanticConcept;
  similarityScore: number;
  detectedEntities: EntityDetectionResult;
  intent: QueryIntent;
  targetRoute: string;
  routeLabel: string;
  vesselId?: string;
}

export interface GroundedOperationalData {
  vessel_v01: {
    id: string;
    name: string;
    status: string;
    cargo_type: string;
    cargo_total_t: number;
    unloaded_t: number;
    remaining_t: number;
    progress_pct: number;
    discharge_rate_tph: number;
    forecast_unload_end: string;
    expected_berth_release: string;
    line_purge_buffer_hours: number;
  };
  vessel_v02: {
    id: string;
    name: string;
    status: string;
    destination: string;
    speed_kts: number;
    cargo_capacity_t: number;
    eta_destination: string;
  };
  vessel_v03: {
    id: string;
    name: string;
    status: string;
    origin: string;
    destination: string;
    cargo_laden_t: number;
    return_eta_forecast: string;
    predicted_anchorage_wait_hours: number;
    berth_conflict_detected: boolean;
    conflict_overlap_text: string;
  };
  berth_b01: {
    id: string;
    name: string;
    status: string;
    current_occupant: string;
    expected_release: string;
    line_purge_buffer_hours: number;
    next_vessel: string;
    next_vessel_eta: string;
    conflict_detected: boolean;
    overlap_duration_text: string;
  };
  production: {
    daily_target_t: number;
    actual_t: number;
    progress_pct: number;
    deficit_pct: number;
    remaining_t: number;
    status: string;
  };
  dispatch: {
    today_dispatched_t: number;
    truck_count: number;
    queue_status: string;
    avg_loading_time_mins: number;
  };
  fuel: {
    terminal_reserve_pct: number;
    status: string;
    days_of_autonomy: number;
    bunkering_scheduled: boolean;
    eco_steaming_savings_t: number;
  };
  finance: {
    tanga_invoice_tzs: number;
    tanga_cleared_tzs: number;
    tanga_cleared_pct: number;
    tanga_balance_due_tzs: number;
    gate_unlocked: boolean;
  };
  alerts: {
    active_count: number;
    priority_items: {
      id: string;
      title: string;
      severity: string;
      summary: string;
    }[];
  };
}

export interface AssistantAnalysisResult {
  answer: string;
  severity: 'warning' | 'alert' | 'info' | 'normal';
  statusBadge: string | null;
  relatedEntity: string | null;
  relatedRoute: string;
  routeLabel: string;
  vesselId?: string;
}

// -----------------------------------------------------------------------------
// 1. ACTUAL SYSTEM ROUTES MAP
// -----------------------------------------------------------------------------
export const SYSTEM_ROUTES: SemanticRoute[] = [
  {
    id: 'dashboard-summary',
    title: 'Dashboard Summary',
    category: 'OVERVIEW',
    description: 'Executive overview, high-level KPIs, shift updates, and top 3 priority operational issues.',
    keywords: ['summary', 'executive', 'overview', 'kpis', 'shift', 'high-level', 'attention required'],
    defaultLabel: 'View Dashboard Summary →',
  },
  {
    id: 'dashboard',
    title: 'Operations Dashboard',
    category: 'OVERVIEW',
    description: 'Detailed operations telemetry, fleet status, multi-vessel berth progress, and discharge trends.',
    keywords: ['dashboard', 'operations', 'telemetry', 'trends', 'metrics'],
    defaultLabel: 'View Operations Dashboard →',
  },
  {
    id: 'control-tower',
    title: 'Operations Control Tower',
    category: 'OVERVIEW',
    description: 'Plant production, dispatch logistics, multi-vessel horizon Gantt scheduling, and decision-support options.',
    keywords: ['control tower', 'production', 'dispatch', 'trucks', 'factory', 'plant', 'target', 'timeline', 'gantt'],
    defaultLabel: 'View Operations Control Tower →',
  },
  {
    id: 'vessels',
    title: 'Fleet Vessels',
    category: 'OPERATIONS',
    description: 'Fleet list of all VIGOR cement vessels: MV VIGOR 01, MV VIGOR 02, and MV VIGOR 03.',
    keywords: ['vessels', 'fleet', 'ships', 'fleet list', 'vigor fleet'],
    defaultLabel: 'View Fleet Vessels →',
  },
  {
    id: 'vessel-detail',
    title: 'Single-Vessel Control Centre',
    category: 'OPERATIONS',
    description: 'Detailed specifications, engine parameters, cargo hold breakdown, and active voyage status for a selected vessel.',
    keywords: ['vessel detail', 'v01', 'v02', 'v03', 'single vessel', 'specifications', 'draft'],
    defaultLabel: 'View Vessel Details →',
  },
  {
    id: 'berths',
    title: 'VIGOR Berth Operations',
    category: 'OPERATIONS',
    description: 'Berth B01 pneumatic discharge status, line purge buffer clearance, occupancy schedule, and conflict timeline.',
    keywords: ['berth', 'berth b01', 'unloading', 'schedule', 'berth conflict', 'overlap', 'clearance', 'purge'],
    defaultLabel: 'View Berth Schedule →',
  },
  {
    id: 'voyages',
    title: 'Voyage Rotations',
    category: 'OPERATIONS',
    description: 'Round-trip voyage cycle schedules between Zanzibar terminal and mainland manufacturing ports.',
    keywords: ['voyage', 'voyages', 'rotation', 'transit', 'round trip', 'cycle'],
    defaultLabel: 'View Voyage Rotations →',
  },
  {
    id: 'manufacturer-queue',
    title: 'Manufacturer Queue',
    category: 'OPERATIONS',
    description: 'Manufacturer loading slot queue and dispatch priority for Tanga Cement and Twiga Cement.',
    keywords: ['manufacturer queue', 'loading slot', 'factory queue', 'tanga slot', 'twiga slot'],
    defaultLabel: 'View Manufacturer Queue →',
  },
  {
    id: 'fuel',
    title: 'Fuel & Bunkering',
    category: 'OPERATIONS',
    description: 'Marine Gas Oil (MGO) terminal reserves, bunkering schedules, fuel consumption, and eco-steaming savings.',
    keywords: ['fuel', 'oil', 'bunker', 'bunkering', 'mgo', 'diesel', 'fuel stock', 'reserve'],
    defaultLabel: 'View Fuel / Oil →',
  },
  {
    id: 'payments',
    title: 'Finance & Payments',
    category: 'FINANCE',
    description: 'Commercial invoice payments, 100% advance clearance gate, RTGS bank wires, and manufacturer balance tracking.',
    keywords: ['payments', 'finance', 'invoice', 'wire', 'rtgs', 'threshold', 'advance payment'],
    defaultLabel: 'View Finance & Payments →',
  },
  {
    id: 'alerts',
    title: 'Delays & Alerts',
    category: 'MONITORING',
    description: 'Active operational delay events, priority alerts, root-cause logging, and supervisor acknowledgement.',
    keywords: ['alerts', 'delays', 'warnings', 'incidents', 'problems', 'attention', 'issues'],
    defaultLabel: 'View Operational Alerts →',
  },
  {
    id: 'reports',
    title: 'Operational Reports',
    category: 'GOVERNANCE',
    description: 'Shift handoff reports, discharge throughput summaries, and management export contracts.',
    keywords: ['reports', 'shift handoff', 'export', 'summary report'],
    defaultLabel: 'View Reports →',
  },
];

// -----------------------------------------------------------------------------
// 2. SEMANTIC KNOWLEDGE BASE OF OPERATIONAL CONCEPTS
// -----------------------------------------------------------------------------
export const SEMANTIC_KNOWLEDGE_BASE: SemanticConcept[] = [
  {
    id: 'berth_conflict',
    conceptName: 'Berth Scheduling Conflict',
    category: 'BERTH',
    description:
      'A predicted schedule overlap where an inbound vessel (MV VIGOR 03) arrives before the current occupant (MV VIGOR 01) finishes unloading and completes the mandatory 1.5-hour pneumatic line purge and castoff clearance.',
    synonyms: [
      'berth overlap',
      'vessels arriving together',
      'berth unavailable',
      'ship waiting',
      'berth busy',
      'vessel delayed',
      'vessel cannot berth',
      'scheduling clash',
      'anchorage delay',
      'anchorage hold',
      'holding at anchorage',
      'waiting to berth',
      'anchorage charlie',
      'berth conflict',
      'delay at berth',
    ],
    operationalRules: [
      'Berth B01 is a single-vessel dedicated pneumatic unloading berth.',
      'A mandatory 1.5-hour post-unload buffer is required after the last tonne is discharged for line purge, manifold disconnect, and pilot maneuvering.',
      'MV VIGOR 03 ETA (01:31) precedes MV VIGOR 01 departure (04:09), creating ~2h 38m overlap.',
      'Eco-steaming (reducing speed from 11.2 to 8.5 knots) synchronizes arrival with berth clearance and conserves 1.8T bunker fuel.',
    ],
    targetRouteId: 'berths',
    routeLabel: 'View Berth Schedule →',
    defaultSeverity: 'warning',
    defaultStatusBadge: '⚠ Berth conflict detected',
  },
  {
    id: 'berth_clearance_buffer',
    conceptName: 'Post-Unload Clearance Buffer',
    category: 'BERTH',
    description:
      'The mandatory 1.5-hour operational buffer required after the last tonne of cement is discharged before Berth B01 can accept the next vessel.',
    synonyms: [
      'clearance buffer',
      'buffer hours',
      'line purge',
      'pneumatic line purge',
      'manifold disconnect',
      'post unload buffer',
      'castoff clearance',
      'departure buffer',
      'pilot clearance',
    ],
    operationalRules: [
      'Standard buffer duration is 1.5 hours.',
      'Pneumatic transfer lines must be cleared of cement dust using high-pressure air compressors.',
      'Manifolds must be depressurized and decoupled before vessel lines are cast off.',
    ],
    targetRouteId: 'berths',
    routeLabel: 'View Berth Operations →',
    defaultSeverity: 'info',
    defaultStatusBadge: '● 1.5h Clearance Buffer Enforced',
  },
  {
    id: 'cement_production',
    conceptName: 'Plant Cement Production',
    category: 'PRODUCTION',
    description:
      'Daily cement grinding and milling output at the plant. Daily target is 3,000 metric tonnes. Current output is 2,450 T (82% of target, 18% / 550 T behind).',
    synonyms: [
      'factory output',
      'cement produced',
      'packing rate',
      'production today',
      'target',
      'behind production',
      'daily target',
      'production target',
      'cement milling',
      'plant production',
      'kiln output',
      'how far behind target',
      'are we meeting target',
    ],
    operationalRules: [
      'Daily baseline production target: 3,000 MT.',
      'Current shift production: 2,450 MT (82% achieved).',
      'Deficit: 550 MT remaining (18% below schedule).',
      'Flagged as a medium-priority operational concern for shift 3.',
    ],
    targetRouteId: 'control-tower',
    routeLabel: 'View Production / Operations →',
    defaultSeverity: 'warning',
    defaultStatusBadge: '⚠ Production 18% below target',
  },
  {
    id: 'cement_dispatch',
    conceptName: 'Truck Dispatch & Distribution',
    category: 'DISPATCH',
    description:
      'Outbound cement dispatch across bulk tankers and flatbed trucks through the terminal weighbridge. Today 1,850 T dispatched across 42 trucks.',
    synonyms: [
      'dispatch',
      'truck queue',
      'weighbridge',
      'how many tonnes dispatched',
      'trucks loaded',
      'delivery trucks',
      'cement distribution',
      'outbound logistics',
      'truck dispatch',
      'gate out',
    ],
    operationalRules: [
      'Total dispatched today: 1,850 MT.',
      'Total trucks processed: 42 trucks.',
      'Operating queue status: Normal.',
    ],
    targetRouteId: 'control-tower',
    routeLabel: 'View Dispatch Status →',
    defaultSeverity: 'normal',
    defaultStatusBadge: '● Dispatch running normally',
  },
  {
    id: 'fuel_reserve',
    conceptName: 'Marine Gas Oil (MGO) Reserves',
    category: 'FUEL',
    description:
      'Terminal and vessel bunker fuel status. Current terminal MGO storage reserve is at 28%, which is below the preferred operating threshold.',
    synonyms: [
      'fuel',
      'bunker',
      'mgo',
      'fuel reserve',
      'fuel stock',
      'diesel situation',
      'how much fuel',
      'are we okay on fuel',
      'oil reserve',
      'bunkering schedule',
      'low fuel',
      'fuel buffer',
    ],
    operationalRules: [
      'Terminal fuel reserve: 28% of full capacity.',
      'Flagged for operational attention as it is below the 35% safety threshold.',
      'Scheduled bunkering delivery planned with Puma Energy for MV VIGOR 01 upon discharge completion.',
    ],
    targetRouteId: 'fuel',
    routeLabel: 'View Fuel / Oil →',
    defaultSeverity: 'warning',
    defaultStatusBadge: '⚠ Fuel reserve low (28%)',
  },
  {
    id: 'eco_steaming',
    conceptName: 'Eco-Steaming Speed Optimization',
    category: 'FUEL',
    description:
      'Adjusting transit speed for inbound vessels facing berth conflicts to eliminate anchorage wait time and reduce bunker fuel consumption.',
    synonyms: [
      'eco steaming',
      'slow steaming',
      'speed reduction',
      'eliminate waiting',
      'save fuel',
      'speed adjustment',
      'synchronize arrival',
      'reduce speed',
      'how can we eliminate the delay',
    ],
    operationalRules: [
      'Standard cruising speed: 11.2 knots.',
      'Recommended Eco-Steaming speed for MV VIGOR 03: 8.5 knots.',
      'Savings: ~1.8 MT Marine Gas Oil (~$1,200).',
      'Result: Synchronizes arrival with Berth B01 clearance, eliminating anchorage holding.',
    ],
    targetRouteId: 'berths',
    routeLabel: 'View Berth Schedule →',
    defaultSeverity: 'info',
    defaultStatusBadge: '● Eco-Steaming Recommended',
  },
  {
    id: 'manufacturer_payment_gate',
    conceptName: 'Manufacturer Commercial Payment Gate',
    category: 'FINANCE',
    description:
      'Commercial financial gate requiring 100% advance wire payment clearance before mainland cement factories (Tanga Cement, Twiga Cement) confirm loading slots.',
    synonyms: [
      'payment gate',
      'tanga payment',
      'twiga payment',
      'wire payment',
      'advance invoice',
      'commercial gate',
      'cleared payment',
      'remaining balance',
      'wire receipt',
      'what happens if we wire',
      'tanga cement balance',
    ],
    operationalRules: [
      'Manufacturer commercial rule requires 100% invoice settlement before slot allocation.',
      'Tanga Cement invoice: TZS 500,000,000.',
      'Cleared via RTGS: TZS 300,000,000 (60%).',
      'Balance outstanding: TZS 200,000,000.',
      'Recording wire confirmation immediately unlocks slot eligibility for MV VIGOR 01.',
    ],
    targetRouteId: 'payments',
    routeLabel: 'View Finance & Payments →',
    defaultSeverity: 'warning',
    defaultStatusBadge: '⚠ TZS 200M payment pending',
  },
  {
    id: 'priority_alerts',
    conceptName: 'Priority Operational Issues',
    category: 'ALERTS',
    description:
      'System-wide operational items currently flagged for supervisor or dispatcher intervention.',
    synonyms: [
      'what needs attention',
      'what requires attention right now',
      'priority issues',
      'active alerts',
      'what is wrong',
      'system warnings',
      'critical issues',
      'operational problems',
    ],
    operationalRules: [
      'Issue 1 (High): Berth conflict between MV VIGOR 01 and MV VIGOR 03 (2h 38m overlap).',
      'Issue 2 (Medium): Low terminal MGO fuel reserve (28%).',
      'Issue 3 (Low): Cement production 18% below daily target (550 MT deficit).',
    ],
    targetRouteId: 'alerts',
    routeLabel: 'View Operational Alerts →',
    defaultSeverity: 'alert',
    defaultStatusBadge: '⚠ 3 Priority issues active',
  },
  {
    id: 'vessel_vigor_01',
    conceptName: 'MV VIGOR 01 Operations',
    category: 'VESSEL',
    description:
      'Status and schedule of MV VIGOR 01, currently berthed at Berth B01 discharging bulk cement.',
    synonyms: [
      'vigor 01',
      'mv vigor 01',
      'v01',
      'vessel 01',
      'when will vigor 01 leave',
      'vigor 01 departure',
      'current vessel',
      'berth b01 vessel',
    ],
    operationalRules: [
      'Currently berthed at Berth B01.',
      'Cargo: 8,500 MT bulk cement.',
      'Discharged: ~6,120 MT (72% complete) at 605 MT/h.',
      'Expected berth departure: 04:09 EAT (includes 1.5h line purge buffer).',
      'Next destination: Tanga Cement loading terminal.',
    ],
    targetRouteId: 'vessel-detail',
    routeLabel: 'View MV VIGOR 01 Details →',
    defaultSeverity: 'normal',
    defaultStatusBadge: '● Discharging at Berth B01',
  },
  {
    id: 'vessel_vigor_03',
    conceptName: 'MV VIGOR 03 Operations',
    category: 'VESSEL',
    description:
      'Status and schedule of MV VIGOR 03, laden with 9,400 MT bulk cement returning to Zanzibar, facing berth conflict at Berth B01.',
    synonyms: [
      'vigor 03',
      'mv vigor 03',
      'v03',
      'vessel 03',
      'why is vigor 03 delayed',
      'why is vigor 03 waiting',
      'what is happening with vigor 03',
      'next vessel',
      'returning vessel',
      'when can vigor 03 berth',
      'can vigor 03 berth',
    ],
    operationalRules: [
      'Returning laden with 9,400 MT bulk cement from Tanga.',
      'ETA Zanzibar waters: 01:31 EAT.',
      'Berth B01 occupied by MV VIGOR 01 until 04:09 EAT.',
      'Estimated anchorage wait: 2 hours and 38 minutes (2.7h).',
      'Recommended action: Eco-Steaming at 8.5 knots.',
    ],
    targetRouteId: 'berths',
    routeLabel: 'View Berth Schedule →',
    defaultSeverity: 'warning',
    defaultStatusBadge: '⚠ Berth conflict (~2h 38m overlap)',
  },
  {
    id: 'vessel_vigor_02',
    conceptName: 'MV VIGOR 02 Operations',
    category: 'VESSEL',
    description:
      'Status and schedule of MV VIGOR 02, in ballast transit to Tanga Cement.',
    synonyms: [
      'vigor 02',
      'mv vigor 02',
      'v02',
      'vessel 02',
      'where is vigor 02',
      'what is vigor 02 doing',
      'vigor 02 status',
    ],
    operationalRules: [
      'In transit to Tanga Cement via Pemba Channel.',
      'Cruising at 10.8 knots in ballast.',
      'ETA Tanga: Tomorrow morning.',
      'Confirmed loading queue slot: Yes (100% advance wire cleared).',
    ],
    targetRouteId: 'vessel-detail',
    routeLabel: 'View MV VIGOR 02 Details →',
    defaultSeverity: 'normal',
    defaultStatusBadge: '● In transit to Tanga',
  },
];

// -----------------------------------------------------------------------------
// 3. VECTOR EMBEDDING & COSINE SIMILARITY ENGINE
// -----------------------------------------------------------------------------

/**
 * Creates a deterministic, normalized semantic embedding vector from text.
 * Generates an n-gram frequency distribution mapped across a 128-dimensional vector space.
 * This guarantees instantaneous semantic matching with zero latency and high resilience.
 */
export function createDeterministicEmbedding(text: string): number[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
  const DIMENSIONS = 128;
  const vector = new Array(DIMENSIONS).fill(0);

  // 1. Single word hashing
  for (const token of tokens) {
    let hash = 5381;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 33) ^ token.charCodeAt(i);
    }
    const idx = Math.abs(hash) % DIMENSIONS;
    vector[idx] += 2.0;
  }

  // 2. Bigram hashing for phrase semantics
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = tokens[i] + '_' + tokens[i + 1];
    let hash = 5381;
    for (let j = 0; j < bigram.length; j++) {
      hash = (hash * 33) ^ bigram.charCodeAt(j);
    }
    const idx = Math.abs(hash) % DIMENSIONS;
    vector[idx] += 3.0;
  }

  // 3. Trigram hashing
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = tokens[i] + '_' + tokens[i + 1] + '_' + tokens[i + 2];
    let hash = 5381;
    for (let j = 0; j < trigram.length; j++) {
      hash = (hash * 33) ^ trigram.charCodeAt(j);
    }
    const idx = Math.abs(hash) % DIMENSIONS;
    vector[idx] += 4.0;
  }

  // Normalize to unit length for cosine similarity
  let sumSq = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Calculates cosine similarity between two unit vectors: dot product.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dot));
}

// Pre-compute embeddings for the knowledge base
for (const doc of SEMANTIC_KNOWLEDGE_BASE) {
  const corpus = [
    doc.conceptName,
    doc.description,
    doc.synonyms.join(' '),
    doc.operationalRules.join(' '),
  ].join(' ');
  doc.embeddingVector = createDeterministicEmbedding(corpus);
}

// -----------------------------------------------------------------------------
// 4. ENTITY RECOGNITION & INTENT DETECTION
// -----------------------------------------------------------------------------

export function detectEntities(query: string, conversationHistory?: { role: string; content: string }[]): EntityDetectionResult {
  const lower = query.toLowerCase();
  const res: EntityDetectionResult = {};

  // Check for explicit vessel names
  if (lower.includes('vigor 01') || lower.includes('vigor 1') || lower.includes('v-01') || lower.includes('v01')) {
    res.vesselId = 'v-01';
    res.vesselName = 'MV VIGOR 01';
  } else if (lower.includes('vigor 02') || lower.includes('vigor 2') || lower.includes('v-02') || lower.includes('v02')) {
    res.vesselId = 'v-02';
    res.vesselName = 'MV VIGOR 02';
  } else if (lower.includes('vigor 03') || lower.includes('vigor 3') || lower.includes('v-03') || lower.includes('v03')) {
    res.vesselId = 'v-03';
    res.vesselName = 'MV VIGOR 03';
  }

  // Pronoun Resolution from conversation history if user said "it", "she", "the vessel"
  if (!res.vesselId && (lower.includes('it ') || lower.endsWith('it') || lower.includes('the vessel') || lower.includes('she'))) {
    if (conversationHistory && conversationHistory.length > 0) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const text = conversationHistory[i].content.toLowerCase();
        if (text.includes('vigor 03') || text.includes('v03')) {
          res.vesselId = 'v-03';
          res.vesselName = 'MV VIGOR 03';
          break;
        } else if (text.includes('vigor 01') || text.includes('v01')) {
          res.vesselId = 'v-01';
          res.vesselName = 'MV VIGOR 01';
          break;
        } else if (text.includes('vigor 02') || text.includes('v02')) {
          res.vesselId = 'v-02';
          res.vesselName = 'MV VIGOR 02';
          break;
        }
      }
    }
  }

  // Berth entity
  if (lower.includes('berth') || lower.includes('b01') || lower.includes('b-01')) {
    res.berthId = 'b-01';
  }

  // Manufacturer entity
  if (lower.includes('tanga')) {
    res.manufacturer = 'Tanga Cement';
  } else if (lower.includes('twiga')) {
    res.manufacturer = 'Twiga Cement';
  }

  // Resource entity
  if (lower.includes('fuel') || lower.includes('bunker') || lower.includes('mgo') || lower.includes('diesel')) {
    res.resource = 'fuel';
  } else if (lower.includes('production') || lower.includes('milling') || lower.includes('factory') || lower.includes('kiln')) {
    res.resource = 'production';
  } else if (lower.includes('dispatch') || lower.includes('truck') || lower.includes('weighbridge')) {
    res.resource = 'dispatch';
  } else if (lower.includes('payment') || lower.includes('wire') || lower.includes('invoice') || lower.includes('balance')) {
    res.resource = 'payment';
  } else if (lower.includes('buffer') || lower.includes('purge')) {
    res.resource = 'buffer';
  }

  return res;
}

export function detectIntent(query: string): QueryIntent {
  const lower = query.toLowerCase();

  if (lower.startsWith('why') || lower.includes('why is') || lower.includes('reason for') || lower.includes('cause')) {
    return 'WHY';
  }
  if (lower.startsWith('when') || lower.includes('when does') || lower.includes('what time') || lower.includes('when will') || lower.includes('when can')) {
    return 'WHEN';
  }
  if (lower.startsWith('how much') || lower.includes('how many') || lower.includes('percentage') || lower.includes('tonnes') || lower.includes('quantity')) {
    return 'HOW_MUCH';
  }
  if (lower.includes('compare') || lower.includes('versus') || lower.includes('target vs') || lower.includes('behind target')) {
    return 'COMPARE';
  }
  if (lower.includes('attention') || lower.includes('urgent') || lower.includes('risk') || lower.includes('issue') || lower.includes('problem')) {
    return 'RISK';
  }
  if (lower.includes('what should we do') || lower.includes('recommend') || lower.includes('how to eliminate') || lower.includes('solution') || lower.includes('options')) {
    return 'ACTION';
  }
  if (lower.startsWith('where') || lower.includes('where is')) {
    return 'WHERE';
  }
  if (lower.startsWith('what') || lower.includes('status') || lower.includes('situation')) {
    return 'STATUS';
  }

  return 'GENERAL';
}

// -----------------------------------------------------------------------------
// 5. HYBRID SEMANTIC SEARCH & ROUTE MATCHER
// -----------------------------------------------------------------------------

export function performSemanticSearch(
  query: string,
  conversationHistory?: { role: string; content: string }[]
): RetrievedKnowledge {
  const lowerQuery = query.toLowerCase();
  const queryVec = createDeterministicEmbedding(query);
  const entities = detectEntities(query, conversationHistory);
  const intent = detectIntent(query);

  let bestMatch = SEMANTIC_KNOWLEDGE_BASE[0];
  let highestScore = -1;

  for (const doc of SEMANTIC_KNOWLEDGE_BASE) {
    let score = calculateCosineSimilarity(queryVec, doc.embeddingVector || []);

    // Keyword & Synonym Boosting
    for (const syn of doc.synonyms) {
      if (lowerQuery.includes(syn.toLowerCase())) {
        score += 0.25;
      }
    }

    // Entity Alignment Boosting
    if (entities.vesselId === 'v-03' && (doc.id === 'vessel_vigor_03' || doc.id === 'berth_conflict')) {
      score += 0.35;
    }
    if (entities.vesselId === 'v-01' && (doc.id === 'vessel_vigor_01' || doc.id === 'berth_operations')) {
      score += 0.35;
    }
    if (entities.vesselId === 'v-02' && doc.id === 'vessel_vigor_02') {
      score += 0.4;
    }
    if (entities.resource === 'fuel' && (doc.id === 'fuel_reserve' || doc.id === 'eco_steaming')) {
      score += 0.4;
    }
    if (entities.resource === 'production' && doc.id === 'cement_production') {
      score += 0.4;
    }
    if (entities.resource === 'dispatch' && doc.id === 'cement_dispatch') {
      score += 0.4;
    }
    if (entities.resource === 'payment' && doc.id === 'manufacturer_payment_gate') {
      score += 0.4;
    }
    if (intent === 'RISK' && doc.id === 'priority_alerts') {
      score += 0.35;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = doc;
    }
  }

  // Resolve target route and label
  let targetRoute = bestMatch.targetRouteId;
  let routeLabel = bestMatch.routeLabel;
  let targetVesselId: string | undefined = undefined;

  // Refine route for specific vessel detail if asked about single vessel
  if (entities.vesselId && (intent === 'WHEN' || intent === 'WHERE' || bestMatch.category === 'VESSEL')) {
    if (entities.vesselId === 'v-01') {
      targetVesselId = 'v-01';
      targetRoute = 'vessel-detail';
      routeLabel = 'View MV VIGOR 01 Details →';
    } else if (entities.vesselId === 'v-02') {
      targetVesselId = 'v-02';
      targetRoute = 'vessel-detail';
      routeLabel = 'View MV VIGOR 02 Details →';
    } else if (entities.vesselId === 'v-03' && !lowerQuery.includes('berth') && !lowerQuery.includes('delay')) {
      targetVesselId = 'v-03';
      targetRoute = 'vessel-detail';
      routeLabel = 'View MV VIGOR 03 Details →';
    }
  }

  // If asked about delay/conflict with VIGOR 03, route to berths
  if (entities.vesselId === 'v-03' && (query.toLowerCase().includes('delay') || query.toLowerCase().includes('wait') || query.toLowerCase().includes('berth'))) {
    targetRoute = 'berths';
    routeLabel = 'View Berth Schedule →';
  }

  return {
    concept: bestMatch,
    similarityScore: highestScore,
    detectedEntities: entities,
    intent,
    targetRoute,
    routeLabel,
    vesselId: targetVesselId,
  };
}

// -----------------------------------------------------------------------------
// 6. STRUCTURED LIVE OPERATIONAL SNAPSHOT COMPILER
// -----------------------------------------------------------------------------

export function buildGroundedOperationalSnapshot(customState?: any): GroundedOperationalData {
  return {
    vessel_v01: {
      id: 'v-01',
      name: 'MV VIGOR 01',
      status: 'Discharging at Berth B01',
      cargo_type: 'Bulk Cement',
      cargo_total_t: 8500,
      unloaded_t: 6120,
      remaining_t: 2380,
      progress_pct: 72,
      discharge_rate_tph: 605,
      forecast_unload_end: '02:39',
      expected_berth_release: '04:09',
      line_purge_buffer_hours: 1.5,
    },
    vessel_v02: {
      id: 'v-02',
      name: 'MV VIGOR 02',
      status: 'Northbound in Pemba Channel',
      destination: 'Tanga Cement Terminal',
      speed_kts: 10.8,
      cargo_capacity_t: 10500,
      eta_destination: 'Tomorrow 08:00',
    },
    vessel_v03: {
      id: 'v-03',
      name: 'MV VIGOR 03',
      status: 'Inbound laden transit from Tanga',
      origin: 'Tanga Cement',
      destination: 'Zanzibar Port (Berth B01)',
      cargo_laden_t: 9400,
      return_eta_forecast: '01:31',
      predicted_anchorage_wait_hours: 2.7,
      berth_conflict_detected: true,
      conflict_overlap_text: '2 hours and 38 minutes',
    },
    berth_b01: {
      id: 'b-01',
      name: 'Berth B01',
      status: 'Occupied',
      current_occupant: 'MV VIGOR 01',
      expected_release: '04:09',
      line_purge_buffer_hours: 1.5,
      next_vessel: 'MV VIGOR 03',
      next_vessel_eta: '01:31',
      conflict_detected: true,
      overlap_duration_text: '2h 38m',
    },
    production: {
      daily_target_t: 3000,
      actual_t: 2450,
      progress_pct: 82,
      deficit_pct: 18,
      remaining_t: 550,
      status: '18% below target',
    },
    dispatch: {
      today_dispatched_t: 1850,
      truck_count: 42,
      queue_status: 'Normal',
      avg_loading_time_mins: 14,
    },
    fuel: {
      terminal_reserve_pct: 28,
      status: 'Low reserve buffer',
      days_of_autonomy: 4.2,
      bunkering_scheduled: true,
      eco_steaming_savings_t: 1.8,
    },
    finance: {
      tanga_invoice_tzs: 500000000,
      tanga_cleared_tzs: 300000000,
      tanga_cleared_pct: 60,
      tanga_balance_due_tzs: 200000000,
      gate_unlocked: false,
    },
    alerts: {
      active_count: 3,
      priority_items: [
        {
          id: 'alt-01',
          title: 'Berth Conflict at B01',
          severity: 'HIGH',
          summary: 'MV VIGOR 03 ETA 01:31 precedes MV VIGOR 01 release at 04:09 (~2h 38m overlap).',
        },
        {
          id: 'alt-02',
          title: 'Terminal Fuel Reserve Low',
          severity: 'MEDIUM',
          summary: 'MGO bunker buffer at 28%, below 35% safety threshold.',
        },
        {
          id: 'alt-03',
          title: 'Cement Production Deficit',
          severity: 'LOW',
          summary: 'Current output at 2,450 T against 3,000 T daily target (550 T deficit).',
        },
      ],
    },
  };
}

// -----------------------------------------------------------------------------
// 7. HIGH-PRECISION OPERATIONS ANALYST EXPLANATION GENERATOR
// -----------------------------------------------------------------------------

/**
 * Generates an explanatory natural language response grounded strictly in the live operational snapshot.
 * Used directly as an authoritative analyst response or as baseline for LLM verification.
 */
export function generateFactualAnalystResponse(
  query: string,
  retrieved: RetrievedKnowledge,
  data: GroundedOperationalData
): AssistantAnalysisResult {
  const { concept, detectedEntities, intent, targetRoute, routeLabel, vesselId } = retrieved;
  const lower = query.toLowerCase();

  // 1. Berth conflict / delay for MV VIGOR 03
  if (
    concept.id === 'berth_conflict' ||
    (detectedEntities.vesselId === 'v-03' && (lower.includes('delay') || lower.includes('wait') || lower.includes('berth') || lower.includes('conflict')))
  ) {
    const answer = `MV VIGOR 03 is expected at ${data.vessel_v03.return_eta_forecast}, while MV VIGOR 01 is not expected to clear Berth B01 until ${data.berth_b01.expected_release}. This creates an estimated berth overlap of about 2 hours and 38 minutes, so VIGOR 03 may need to wait before berthing.`;
    return {
      answer,
      severity: 'warning',
      statusBadge: '⚠ Berth conflict detected',
      relatedEntity: 'MV VIGOR 03',
      relatedRoute: 'berths',
      routeLabel: 'View Berth Schedule →',
      vesselId: 'v-03',
    };
  }

  // 2. Production target question
  if (concept.id === 'cement_production' || lower.includes('target') || lower.includes('production') || lower.includes('behind')) {
    const answer = `Today's production is ${data.production.actual_t.toLocaleString()} T against a ${data.production.daily_target_t.toLocaleString()} T target, meaning production is currently ${data.production.deficit_pct}% below target. Based on the current operating data, approximately ${data.production.remaining_t.toLocaleString()} T remains to reach today's target.`;
    return {
      answer,
      severity: 'warning',
      statusBadge: '⚠ Production 18% below target',
      relatedEntity: 'Plant Milling Lines',
      relatedRoute: 'control-tower',
      routeLabel: 'View Operations →',
    };
  }

  // 3. Fuel reserve question
  if (concept.id === 'fuel_reserve' || lower.includes('fuel') || lower.includes('bunker') || lower.includes('mgo')) {
    const answer = `The current fuel reserve is approximately ${data.fuel.terminal_reserve_pct}%, which is below the preferred operating buffer and is currently flagged for attention. A bunkering replenishment window is scheduled to restore safety stock.`;
    return {
      answer,
      severity: 'warning',
      statusBadge: `⚠ Low fuel reserve (${data.fuel.terminal_reserve_pct}%)`,
      relatedEntity: 'Terminal MGO Stock',
      relatedRoute: 'fuel',
      routeLabel: 'View Fuel / Oil →',
    };
  }

  // 4. Priority items / what needs attention
  if (concept.id === 'priority_alerts' || lower.includes('attention') || lower.includes('urgent') || lower.includes('issues')) {
    const answer = `There are currently three priority items requiring attention: the 2h 38m berth conflict between MV VIGOR 01 and MV VIGOR 03 at Berth B01, the terminal fuel reserve standing at a low 28%, and cement production running 18% behind the daily target.`;
    return {
      answer,
      severity: 'alert',
      statusBadge: '⚠ 3 Priority issues active',
      relatedEntity: 'Operations Control',
      relatedRoute: 'alerts',
      routeLabel: 'View Operational Alerts →',
    };
  }

  // 5. When does MV VIGOR 01 leave?
  if (detectedEntities.vesselId === 'v-01' && (intent === 'WHEN' || lower.includes('leave') || lower.includes('depart') || lower.includes('release'))) {
    const answer = `MV VIGOR 01 is expected to clear Berth B01 at ${data.berth_b01.expected_release}, following completion of its remaining ${data.vessel_v01.remaining_t.toLocaleString()} T cement discharge and the mandatory 1.5-hour pneumatic line purge and castoff buffer.`;
    return {
      answer,
      severity: 'normal',
      statusBadge: `● Berth release scheduled for ${data.berth_b01.expected_release}`,
      relatedEntity: 'MV VIGOR 01',
      relatedRoute: 'berths',
      routeLabel: 'View Berth Schedule →',
      vesselId: 'v-01',
    };
  }

  // 6. When can MV VIGOR 03 berth?
  if (detectedEntities.vesselId === 'v-03' && (lower.includes('when can') || lower.includes('berth'))) {
    const answer = `MV VIGOR 03 can berth at Berth B01 once MV VIGOR 01 departs and harbor maneuvering is complete, which is currently forecast for approximately ${data.berth_b01.expected_release}.`;
    return {
      answer,
      severity: 'warning',
      statusBadge: '⚠ Overlap until 04:09',
      relatedEntity: 'MV VIGOR 03',
      relatedRoute: 'berths',
      routeLabel: 'View Berth Schedule →',
      vesselId: 'v-03',
    };
  }

  // 7. Dispatch status
  if (concept.id === 'cement_dispatch' || lower.includes('dispatch') || lower.includes('truck')) {
    const answer = `Today's dispatch volume is ${data.dispatch.today_dispatched_t.toLocaleString()} tonnes processed through the weighbridge across ${data.dispatch.truck_count} trucks. Dispatch throughput is running within normal operating ranges.`;
    return {
      answer,
      severity: 'normal',
      statusBadge: '● Dispatch normal (42 trucks)',
      relatedEntity: 'Weighbridge & Logistics',
      relatedRoute: 'control-tower',
      routeLabel: 'View Dispatch Status →',
    };
  }

  // 8. Tanga payment gate
  if (concept.id === 'manufacturer_payment_gate' || lower.includes('payment') || lower.includes('wire') || lower.includes('invoice')) {
    const answer = `Tanga Cement invoice clearance is currently at ${data.finance.tanga_cleared_pct}% (TZS ${data.finance.tanga_cleared_tzs.toLocaleString()}), leaving a balance of TZS ${data.finance.tanga_balance_due_tzs.toLocaleString()}. Once the remaining wire is recorded, the 100% advance threshold will be met, unlocking confirmed loading slot allocation.`;
    return {
      answer,
      severity: 'warning',
      statusBadge: '⚠ TZS 200M payment pending',
      relatedEntity: 'Tanga Cement Gate',
      relatedRoute: 'payments',
      routeLabel: 'View Finance & Payments →',
    };
  }

  // 9. Eco-Steaming recommendation
  if (concept.id === 'eco_steaming' || lower.includes('eliminate') || lower.includes('solve') || lower.includes('eco')) {
    const answer = `By instructing MV VIGOR 03 to slow steam at 8.5 knots instead of 11.2 knots, its arrival will synchronize directly with Berth B01 release at ${data.berth_b01.expected_release}. This eliminates the 2h 38m anchorage wait while saving approximately 1.8 tonnes of bunker fuel.`;
    return {
      answer,
      severity: 'info',
      statusBadge: '● Eco-Steaming recommended (8.5 kts)',
      relatedEntity: 'MV VIGOR 03',
      relatedRoute: 'berths',
      routeLabel: 'View Berth Schedule →',
      vesselId: 'v-03',
    };
  }

  // 10. General / Fallback with closest relevant route
  const answer = `Current port operations show Berth B01 occupied by MV VIGOR 01 until ${data.berth_b01.expected_release}, with MV VIGOR 03 scheduled to arrive at ${data.vessel_v03.return_eta_forecast}. All vessel operations are managed according to scheduled voyage rotations and pneumatic discharge telemetry.`;
  return {
    answer,
    severity: concept.defaultSeverity || 'info',
    statusBadge: concept.defaultStatusBadge || null,
    relatedEntity: detectedEntities.vesselName || concept.conceptName,
    relatedRoute: targetRoute,
    routeLabel,
    vesselId,
  };
}
