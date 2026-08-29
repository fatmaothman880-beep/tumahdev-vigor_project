import type { Berth, DelayEvent, OperationalEvent, OperationalReading, VesselVisit } from "../types";

/**
 * Fixed demo "now" so the prototype's numbers stay internally consistent
 * across a session. Illustrative data only — see README "Known limitations".
 */
export const NOW = (() => {
  const d = new Date();
  d.setHours(7, 42, 0, 0);
  return d;
})();

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
  { id: "B03", name: "Berth B03", lengthM: 160, notes: "General cargo" },
];

export const vessels: VesselVisit[] = [
  {
    id: 201,
    name: "MV Ocean Star",
    reference: "IMO 9812345",
    cargo: "Cement (bulk)",
    cargoTotalT: 12000,
    berthId: "B02",
    status: "Unloading",
    plannedArrival: mk(5, 30),
    actualArrival: mk(6, 10),
    unloadStart: mk(6, 35),
    unloadFinish: null,
    nextVesselId: 301,
    postUnloadBufferMin: 20,
  },
  {
    id: 301,
    name: "MV Blue Horizon",
    reference: "IMO 9765432",
    cargo: "Cement (bulk)",
    cargoTotalT: 9500,
    berthId: "B02",
    status: "Arrived",
    plannedArrival: mk(18, 0),
    actualArrival: null,
    etaOverride: mk(18, 47),
    unloadStart: null,
    unloadFinish: null,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    id: 302,
    name: "MV Zanzibar Trader",
    reference: "IMO 9701122",
    cargo: "Clinker (bulk)",
    cargoTotalT: 8000,
    berthId: "B03",
    status: "Planned",
    plannedArrival: mk(20, 30),
    actualArrival: null,
    unloadStart: null,
    unloadFinish: null,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
  {
    id: 401,
    name: "MV Coastal Pearl",
    reference: "IMO 9633211",
    cargo: "Cement (bulk)",
    cargoTotalT: 10500,
    berthId: "B01",
    status: "Completed",
    plannedArrival: mk(1, 30),
    actualArrival: mk(2, 0),
    unloadStart: mk(2, 15),
    unloadFinish: mk(6, 5),
    nextVesselId: null,
    postUnloadBufferMin: 20,
  },
];

export const readingsByVessel: Record<string, OperationalReading[]> = {
  201: [
    { id: nextId(), timestamp: mk(6, 40), source: "Manual", unloadedT: 1200, remainingT: 10800, observedRateTph: 380 },
    { id: nextId(), timestamp: mk(6, 55), source: "Manual", unloadedT: 2350, remainingT: 9650, observedRateTph: 460 },
    { id: nextId(), timestamp: mk(7, 10), source: "Manual", unloadedT: 5100, remainingT: 6900, observedRateTph: 440 },
    { id: nextId(), timestamp: mk(7, 25), source: "Manual", unloadedT: 6980, remainingT: 5020, observedRateTph: 400 },
    { id: nextId(), timestamp: mk(7, 35), source: "Manual", unloadedT: 8420, remainingT: 3580, observedRateTph: 410 },
  ],
};

export const delaysByVessel: Record<string, DelayEvent[]> = {
  201: [
    {
      id: nextId(),
      start: mk(7, 22),
      end: mk(7, 25),
      category: "Equipment",
      area: "Conveyor 2",
      description: "Belt tension adjustment (demo assumption).",
    },
  ],
};

export const eventsByVessel: Record<string, OperationalEvent[]> = {
  201: [
    { id: nextId(), time: mk(6, 20), text: "Vessel berthed at B02." },
    { id: nextId(), time: mk(6, 35), text: "Unloading started." },
    { id: nextId(), time: mk(7, 10), text: "Unloading rate updated to 440 t/h." },
    { id: nextId(), time: mk(7, 25), text: "Equipment delay recorded (3 min)." },
    { id: nextId(), time: mk(7, 35), text: "New operational reading logged." },
    { id: nextId(), time: mk(7, 42), text: "Completion estimate recalculated." },
  ],
  301: [{ id: nextId(), time: mk(5, 10), text: "Vessel arrived, awaiting berth." }],
  401: [
    { id: nextId(), time: mk(2, 0), text: "Vessel berthed at B01." },
    { id: nextId(), time: mk(2, 15), text: "Unloading started." },
    { id: nextId(), time: mk(6, 5), text: "Unloading completed." },
    { id: nextId(), time: mk(6, 40), text: "Vessel departed. Visit completed." },
  ],
};

export const genId = () => Date.now() + Math.floor(Math.random() * 1000);
