import type { Berth, DelayEvent, OperationalEvent, OperationalReading, VesselVisit } from "../types";

/**
 * Anchored to the real clock at module load, not a fixed wall-clock time.
 *
 * This matters: automatic overdue/at-risk detection (see lib/riskEngine.ts)
 * and the live progress bars (see hooks/useLiveClock.ts) compare vessel
 * timestamps against `new Date()` continuously while the app is open. If
 * the seed data used a fixed clock time, every scenario below would only
 * look correct at the exact moment it was written. Defining every
 * timestamp as an offset in minutes from NOW means the demo looks correct
 * — and the overdue/at-risk numbers keep ticking up live — no matter when
 * the app is opened.
 */
export const NOW = new Date();

const MIN = 60000;
const DAY = 1440;

/** Minutes offset from NOW (negative = past, positive = future). */
export const off = (minutesFromNow: number): Date => new Date(NOW.getTime() + minutesFromNow * MIN);

/** Kept for compatibility with any code still constructing same-day clock times. */
export const mk = (hh: number, mm: number): Date => {
  const d = new Date(NOW);
  d.setHours(hh, mm, 0, 0);
  return d;
};

let idSeq = 1000;
const nextId = () => ++idSeq;

export const berths: Berth[] = [
  { id: "B01", name: "Berth B01", lengthM: 180, notes: "Bulk cement berth" },
  { id: "B02", name: "Berth B02", lengthM: 210, notes: "Bulk cement berth, deep draft" },
  { id: "B03", name: "Berth B03", lengthM: 160, notes: "Bulk cement / clinker berth" },
];

/*
 * Seven scenarios, five vessels (two scenarios ride on the same
 * conflicting pair at Berth B02):
 *   1&2. Normal, actively unloading, on track           -> MV Ocean Star
 *   3.   Low rate, projected completion delay (at-risk) -> MV Zanzibar Trader
 *   4.   Planned vessel approaching expected arrival    -> MV Blue Horizon
 *   5.   Planned vessel, arrival overdue                -> MV East Wind
 *   6.   Berth conflict                                 -> Ocean Star / Blue Horizon at B02
 *   7.   Completed historical vessel                    -> MV Coastal Pearl
 *   +    Cancelled visit, for status-filter completeness -> MV Silver Wave
 */

export const vessels: VesselVisit[] = [
  {
    // 1 & 2 & 6 — on track, actively unloading, and the berth-conflict pair with Blue Horizon.
    id: 201,
    name: "MV Ocean Star",
    reference: "IMO 9812345",
    cargo: "Cement (bulk)",
    cargoTotalT: 9600,
    berthId: "B02",
    status: "Unloading",
    registeredAt: off(-720),
    plannedArrival: off(-710),
    actualArrival: off(-700),
    plannedUnloadStart: off(-680),
    unloadStart: off(-670),
    plannedCompletion: off(310),
    unloadFinish: null,
    plannedRateTph: 600,
    nextVesselId: 301,
    postUnloadBufferMin: 25,
  },
  {
    // 4 & 6 — arriving soon, and the other half of the B02 berth conflict.
    id: 301,
    name: "MV Blue Horizon",
    reference: "IMO 9765432",
    cargo: "Cement (bulk)",
    cargoTotalT: 8200,
    berthId: "B02",
    status: "Planned",
    registeredAt: off(-300),
    plannedArrival: off(35),
    actualArrival: null,
    etaOverride: off(35),
    plannedUnloadStart: off(95),
    unloadStart: null,
    plannedCompletion: off(1120),
    unloadFinish: null,
    plannedRateTph: 480,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    // 3 — actively unloading well below the planned rate, forecast completion at risk.
    id: 302,
    name: "MV Zanzibar Trader",
    reference: "IMO 9701122",
    cargo: "Clinker (bulk)",
    cargoTotalT: 8000,
    berthId: "B03",
    status: "Unloading",
    registeredAt: off(-420),
    plannedArrival: off(-400),
    actualArrival: off(-392),
    plannedUnloadStart: off(-365),
    unloadStart: off(-360),
    plannedCompletion: off(600),
    unloadFinish: null,
    plannedRateTph: 500,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    // 5 — planned vessel whose expected arrival has already passed.
    id: 303,
    name: "MV East Wind",
    reference: "IMO 9754411",
    cargo: "Gypsum (bulk)",
    cargoTotalT: 7000,
    berthId: "B01",
    status: "Planned",
    registeredAt: off(-600),
    plannedArrival: off(-30),
    actualArrival: null,
    plannedUnloadStart: off(60),
    unloadStart: null,
    plannedCompletion: off(993),
    unloadFinish: null,
    plannedRateTph: 450,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    // 7 — completed historical visit, including a confirmed (and since-resolved) delay.
    id: 401,
    name: "MV Coastal Pearl",
    reference: "IMO 9633211",
    cargo: "Cement (bulk)",
    cargoTotalT: 10500,
    berthId: "B01",
    status: "Completed",
    registeredAt: off(-3 * DAY - 60),
    plannedArrival: off(-3 * DAY),
    actualArrival: off(-3 * DAY + 30),
    plannedUnloadStart: off(-3 * DAY + 45),
    unloadStart: off(-3 * DAY + 63),
    plannedCompletion: off(-3 * DAY + 1375),
    unloadFinish: off(-3 * DAY + 1415),
    plannedRateTph: 480,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    // Optional — demonstrates the "Cancelled" status in history filtering.
    id: 501,
    name: "MV Silver Wave",
    reference: "IMO 9711900",
    cargo: "Cement (bulk)",
    cargoTotalT: 6000,
    berthId: "B01",
    status: "Cancelled",
    registeredAt: off(-6 * DAY),
    plannedArrival: off(-5 * DAY),
    actualArrival: null,
    plannedUnloadStart: null,
    unloadStart: null,
    plannedCompletion: null,
    unloadFinish: null,
    plannedRateTph: null,
    nextVesselId: null,
    postUnloadBufferMin: 20,
    notes: "Visit cancelled — charter fell through (demo assumption).",
  },
];

export const readingsByVessel: Record<string | number, OperationalReading[]> = {
  // MV Ocean Star — healthy, on-plan rate, ~70% cargo progress.
  201: [
    { id: nextId(), timestamp: off(-610), source: "Manual", unloadedT: 1050, remainingT: 8550, observedRateTph: 580 },
    { id: nextId(), timestamp: off(-450), source: "Manual", unloadedT: 3200, remainingT: 6400, observedRateTph: 610 },
    { id: nextId(), timestamp: off(-270), source: "Manual", unloadedT: 5300, remainingT: 4300, observedRateTph: 590 },
    { id: nextId(), timestamp: off(-90), source: "Manual", unloadedT: 6700, remainingT: 2900, observedRateTph: 605 },
    { id: nextId(), timestamp: off(-8), source: "Manual", unloadedT: 6700, remainingT: 2900, observedRateTph: 605 },
  ],
  // MV Zanzibar Trader — declining rate, now 30% below plan; forecast at risk.
  302: [
    { id: nextId(), timestamp: off(-300), source: "Manual", unloadedT: 450, remainingT: 7550, observedRateTph: 450 },
    { id: nextId(), timestamp: off(-180), source: "Manual", unloadedT: 1400, remainingT: 6600, observedRateTph: 400 },
    { id: nextId(), timestamp: off(-60), source: "Manual", unloadedT: 2000, remainingT: 6000, observedRateTph: 360 },
    { id: nextId(), timestamp: off(-6), source: "Manual", unloadedT: 2300, remainingT: 5700, observedRateTph: 350 },
  ],
};

export const delaysByVessel: Record<string | number, DelayEvent[]> = {
  // Resolved hours ago — appears in history, but does not force a current "Delayed" status.
  201: [
    {
      id: nextId(),
      start: off(-640),
      end: off(-440),
      category: "Equipment",
      area: "Ship-side crane",
      description: "Equipment failure requiring temporary repair.",
    },
  ],
  // Historical, confirmed delay on the completed vessel.
  401: [
    {
      id: nextId(),
      start: off(-3 * DAY + 400),
      end: off(-3 * DAY + 600),
      category: "Equipment",
      area: "Unloading crane",
      description: "Equipment failure — crane motor replacement.",
    },
  ],
};

export const eventsByVessel: Record<string | number, OperationalEvent[]> = {
  201: [
    { id: nextId(), time: off(-700), text: "Vessel arrived." },
    { id: nextId(), time: off(-670), text: "Berthed at B02. Unloading started." },
    { id: nextId(), time: off(-640), text: "Equipment failure recorded — crane taken offline." },
    { id: nextId(), time: off(-440), text: "Equipment failure resolved. Unloading resumed." },
    { id: nextId(), time: off(-90), text: "Unloading rate holding at 605 t/h." },
    { id: nextId(), time: off(-8), text: "New operational reading logged." },
  ],
  301: [{ id: nextId(), time: off(-300), text: "Vessel visit registered." }],
  302: [
    { id: nextId(), time: off(-392), text: "Vessel arrived." },
    { id: nextId(), time: off(-360), text: "Berthed at B03. Unloading started." },
    { id: nextId(), time: off(-180), text: "Unloading rate below plan — monitoring." },
    { id: nextId(), time: off(-6), text: "New operational reading logged." },
  ],
  303: [{ id: nextId(), time: off(-600), text: "Vessel visit registered." }],
  401: [
    { id: nextId(), time: off(-3 * DAY + 63), text: "Berthed at B01. Unloading started." },
    { id: nextId(), time: off(-3 * DAY + 400), text: "Equipment failure recorded." },
    { id: nextId(), time: off(-3 * DAY + 600), text: "Equipment failure resolved. Unloading resumed." },
    { id: nextId(), time: off(-3 * DAY + 1415), text: "Unloading completed. Vessel departed." },
  ],
  501: [
    { id: nextId(), time: off(-6 * DAY), text: "Vessel visit registered." },
    { id: nextId(), time: off(-5 * DAY + 60), text: "Visit cancelled." },
  ],
};

export const genId = () => Date.now() + Math.floor(Math.random() * 1000);
