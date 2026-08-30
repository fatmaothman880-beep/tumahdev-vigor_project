import type { DelayEvent, OperationalReading, VesselStatus, VesselVisit } from "../types";
import { berths, delaysByVessel, eventsByVessel, genId, mk, readingsByVessel, vessels } from "./mockData";

/**
 * In-memory mock "database". Mirrors the shape the real FastAPI + PostgreSQL
 * backend will eventually own (see README "Real API contract"). Every
 * function below returns a Promise so swapping src/api's implementation for
 * real fetch() calls later requires no changes in components or pages.
 */

let db = {
  vessels: [...vessels],
  readings: { ...readingsByVessel },
  delays: { ...delaysByVessel },
  events: { ...eventsByVessel },
};

const delay = <T,>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Dates survive JSON round-trip as strings — revive every Date field we use.
function reviveVessel(v: any): VesselVisit {
  return {
    ...v,
    registeredAt: v.registeredAt ? new Date(v.registeredAt) : null,
    plannedArrival: v.plannedArrival ? new Date(v.plannedArrival) : null,
    actualArrival: v.actualArrival ? new Date(v.actualArrival) : null,
    plannedUnloadStart: v.plannedUnloadStart ? new Date(v.plannedUnloadStart) : null,
    unloadStart: v.unloadStart ? new Date(v.unloadStart) : null,
    plannedCompletion: v.plannedCompletion ? new Date(v.plannedCompletion) : null,
    unloadFinish: v.unloadFinish ? new Date(v.unloadFinish) : null,
    etaOverride: v.etaOverride ? new Date(v.etaOverride) : null,
  };
}

export async function getVesselVisits(status?: VesselStatus): Promise<VesselVisit[]> {
  const list = db.vessels.map(reviveVessel);
  return delay(status ? list.filter((v) => v.status === status) : list);
}

export async function getVesselVisit(id: number): Promise<VesselVisit | null> {
  const v = db.vessels.find((x) => x.id === id);
  return delay(v ? reviveVessel(v) : null);
}

export async function getReadings(id: number): Promise<OperationalReading[]> {
  const list = (db.readings[id] || []).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));
  return delay(list);
}

export async function getDelays(id: number): Promise<DelayEvent[]> {
  const list = (db.delays[id] || []).map((d) => ({ ...d, start: new Date(d.start), end: new Date(d.end) }));
  return delay(list);
}

export async function getEvents(id: number) {
  const list = (db.events[id] || []).map((e) => ({ ...e, time: new Date(e.time) }));
  return delay(list);
}

export async function getAllReadings() {
  return delay(clone(db.readings));
}
export async function getAllDelays() {
  return delay(clone(db.delays));
}
export async function getAllEvents() {
  return delay(clone(db.events));
}
export async function getBerths() {
  return delay(clone(berths));
}

/**
 * Planned/actual datetime fields arrive from <input type="datetime-local">
 * as "YYYY-MM-DDTHH:MM" strings — the browser parses those as local time
 * when handed straight to `new Date(...)`, which is what we want here.
 */
export interface CreateVesselVisitInput {
  name: string;
  reference: string;
  cargo: string;
  cargoTotalT: number;
  berthId: string;
  status: VesselStatus;
  plannedArrival: string;
  plannedUnloadStart?: string;
  plannedCompletion?: string;
  plannedRateTph?: number;
  notes?: string;
}

export async function createVesselVisit(data: CreateVesselVisitInput): Promise<VesselVisit> {
  const id = genId();
  const now = new Date();
  const vessel: VesselVisit = {
    id,
    name: data.name,
    reference: data.reference || "—",
    cargo: data.cargo,
    cargoTotalT: data.cargoTotalT,
    berthId: data.berthId,
    status: data.status,
    registeredAt: now,
    plannedArrival: data.plannedArrival ? new Date(data.plannedArrival) : null,
    actualArrival: data.status !== "Planned" ? now : null,
    plannedUnloadStart: data.plannedUnloadStart ? new Date(data.plannedUnloadStart) : null,
    unloadStart: data.status === "Unloading" ? now : null,
    plannedCompletion: data.plannedCompletion ? new Date(data.plannedCompletion) : null,
    unloadFinish: null,
    plannedRateTph: data.plannedRateTph ?? null,
    nextVesselId: null,
    postUnloadBufferMin: 20,
    notes: data.notes || "",
  };
  db.vessels = [...db.vessels, vessel];
  db.events = { ...db.events, [id]: [{ id: genId(), time: now, text: "Vessel visit registered." }] };
  return delay(vessel);
}

/**
 * Editable planning fields for a vessel visit — used by the "Edit" action
 * on planned (and not-yet-completed) visits. Deliberately a subset of
 * VesselVisit: identity fields (id) and system-derived fields (registeredAt)
 * are never edited here.
 */
export interface EditVesselVisitInput {
  name: string;
  reference: string;
  cargo: string;
  cargoTotalT: number;
  berthId: string;
  status: VesselStatus;
  plannedArrival: string;
  plannedUnloadStart: string;
  plannedCompletion: string;
  plannedRateTph?: number;
  notes?: string;
}

export async function editVesselVisit(id: number, data: EditVesselVisitInput): Promise<VesselVisit | null> {
  const patch: Partial<VesselVisit> = {
    name: data.name,
    reference: data.reference || "—",
    cargo: data.cargo,
    cargoTotalT: data.cargoTotalT,
    berthId: data.berthId,
    status: data.status,
    plannedArrival: data.plannedArrival ? new Date(data.plannedArrival) : null,
    plannedUnloadStart: data.plannedUnloadStart ? new Date(data.plannedUnloadStart) : null,
    plannedCompletion: data.plannedCompletion ? new Date(data.plannedCompletion) : null,
    plannedRateTph: data.plannedRateTph ?? null,
    notes: data.notes || "",
  };
  const result = await updateVesselVisit(id, patch);
  db.events = { ...db.events, [id]: [...(db.events[id] || []), { id: genId(), time: new Date(), text: "Vessel plan updated." }] };
  return result;
}

export async function updateVesselVisit(id: number, patch: Partial<VesselVisit>): Promise<VesselVisit | null> {
  let updated: VesselVisit | null = null;
  db.vessels = db.vessels.map((v) => {
    if (v.id !== id) return v;
    updated = { ...v, ...patch };
    return updated;
  });
  return delay(updated);
}

export async function completeVesselVisit(id: number): Promise<VesselVisit | null> {
  const now = new Date();
  const result = await updateVesselVisit(id, { status: "Completed", unloadFinish: now });
  db.events = { ...db.events, [id]: [...(db.events[id] || []), { id: genId(), time: now, text: "Vessel visit completed." }] };
  return result;
}

export async function cancelVesselVisit(id: number): Promise<VesselVisit | null> {
  const now = new Date();
  const result = await updateVesselVisit(id, { status: "Cancelled" });
  db.events = { ...db.events, [id]: [...(db.events[id] || []), { id: genId(), time: now, text: "Vessel visit cancelled." }] };
  return result;
}

export interface AddReadingInput {
  unloadedT: number;
  remainingT: number;
  observedRateTph: number;
  source: OperationalReading["source"];
  notes?: string;
}

export async function addReading(id: number, data: AddReadingInput): Promise<OperationalReading> {
  const now = new Date();
  const reading: OperationalReading = { id: genId(), timestamp: now, ...data };
  db.readings = { ...db.readings, [id]: [...(db.readings[id] || []), reading] };
  db.events = {
    ...db.events,
    [id]: [
      ...(db.events[id] || []),
      { id: genId(), time: now, text: `New operational reading logged (${data.unloadedT.toLocaleString()} t unloaded).` },
    ],
  };
  return delay(reading);
}

export interface AddDelayInput {
  start: Date;
  end: Date;
  category: DelayEvent["category"];
  area: string;
  description: string;
}

export async function addDelay(id: number, data: AddDelayInput): Promise<DelayEvent> {
  const delayEvent: DelayEvent = { id: genId(), ...data };
  db.delays = { ...db.delays, [id]: [...(db.delays[id] || []), delayEvent] };
  const mins = Math.round((data.end.getTime() - data.start.getTime()) / 60000);
  db.events = {
    ...db.events,
    [id]: [...(db.events[id] || []), { id: genId(), time: data.end, text: `${data.category} delay confirmed (${mins} min).` }],
  };
  return delay(delayEvent);
}

export async function getHistory(): Promise<VesselVisit[]> {
  const list = db.vessels.map(reviveVessel);
  return delay(list.filter((v) => v.status === "Completed" || v.status === "Cancelled"));
}

export async function resetMockDb() {
  db = {
    vessels: [...vessels],
    readings: { ...readingsByVessel },
    delays: { ...delaysByVessel },
    events: { ...eventsByVessel },
  };
}

// Re-exported so components needing a same-day clock time helper (e.g. quick demo forms) don't need to import mockData directly.
export { mk };
