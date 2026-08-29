import type {
  DelayEvent,
  OperationalReading,
  VesselStatus,
  VesselVisit,
} from "../types";
import {
  berths,
  delaysByVessel,
  eventsByVessel,
  genId,
  mk,
  NOW,
  readingsByVessel,
  vessels,
} from "./mockData";

let db = {
  vessels: [...vessels],
  readings: { ...readingsByVessel },
  delays: { ...delaysByVessel },
  events: { ...eventsByVessel },
};

const delay = <T,>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

function reviveVessel(value: VesselVisit): VesselVisit {
  return {
    ...value,
    plannedArrival: value.plannedArrival
      ? new Date(value.plannedArrival)
      : null,
    actualArrival: value.actualArrival
      ? new Date(value.actualArrival)
      : null,
    unloadStart: value.unloadStart
      ? new Date(value.unloadStart)
      : null,
    unloadFinish: value.unloadFinish
      ? new Date(value.unloadFinish)
      : null,
    etaOverride: value.etaOverride
      ? new Date(value.etaOverride)
      : null,
  };
}

export async function getVesselVisits(
  status?: VesselStatus,
): Promise<VesselVisit[]> {
  const list = db.vessels.map(reviveVessel);

  return delay(
    status
      ? list.filter((vessel) => vessel.status === status)
      : list,
  );
}

export async function getVesselVisit(
  id: string | number,
): Promise<VesselVisit | null> {
  const vessel = db.vessels.find(
    (item) => String(item.id) === String(id),
  );

  return delay(vessel ? reviveVessel(vessel) : null);
}

export async function getReadings(
  id: string | number,
): Promise<OperationalReading[]> {
  const key = String(id);

  const list = (db.readings[key] || []).map((reading) => ({
    ...reading,
    timestamp: new Date(reading.timestamp),
  }));

  return delay(list);
}

export async function getDelays(
  id: string | number,
): Promise<DelayEvent[]> {
  const key = String(id);

  const list = (db.delays[key] || []).map((event) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));

  return delay(list);
}

export async function getEvents(id: string | number) {
  const key = String(id);

  const list = (db.events[key] || []).map((event) => ({
    ...event,
    time: new Date(event.time),
  }));

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

export interface CreateVesselVisitInput {
  name: string;
  reference: string;
  cargo: string;
  cargoTotalT: number;
  berthId: string;
  status: VesselStatus;
  plannedArrival: string;
}

export async function createVesselVisit(
  data: CreateVesselVisitInput,
): Promise<VesselVisit> {
  const id = genId();
  const key = String(id);
  const [plannedHour, plannedMinute] = (
    data.plannedArrival || "00:00"
  )
    .split(":")
    .map(Number);

  const vessel: VesselVisit = {
    id,
    name: data.name,
    reference: data.reference || "—",
    cargo: data.cargo,
    cargoTotalT: data.cargoTotalT,
    berthId: data.berthId,
    status: data.status,
    plannedArrival: mk(plannedHour, plannedMinute),
    actualArrival:
      data.status !== "Planned" ? new Date(NOW) : null,
    unloadStart:
      data.status === "Unloading" ? new Date(NOW) : null,
    unloadFinish: null,
    nextVesselId: null,
    postUnloadBufferMin: 20,
  };

  db.vessels = [...db.vessels, vessel];
  db.events = {
    ...db.events,
    [key]: [
      {
        id: genId(),
        time: new Date(NOW),
        text: "Vessel visit created.",
      },
    ],
  };

  return delay(vessel);
}

export async function updateVesselVisit(
  id: string | number,
  patch: Partial<VesselVisit>,
): Promise<VesselVisit | null> {
  let updated: VesselVisit | null = null;

  db.vessels = db.vessels.map((vessel) => {
    if (String(vessel.id) !== String(id)) {
      return vessel;
    }

    updated = {
      ...vessel,
      ...patch,
    };

    return updated;
  });

  return delay(updated);
}

export async function completeVesselVisit(
  id: string | number,
): Promise<VesselVisit | null> {
  const key = String(id);

  const result = await updateVesselVisit(id, {
    status: "Completed",
    unloadFinish: new Date(NOW),
  });

  db.events = {
    ...db.events,
    [key]: [
      ...(db.events[key] || []),
      {
        id: genId(),
        time: new Date(NOW),
        text: "Vessel visit completed.",
      },
    ],
  };

  return result;
}

export interface AddReadingInput {
  unloadedT: number;
  remainingT: number;
  observedRateTph: number;
  source: OperationalReading["source"];
}

export async function addReading(
  id: string | number,
  data: AddReadingInput,
): Promise<OperationalReading> {
  const key = String(id);

  const reading: OperationalReading = {
    id: genId(),
    timestamp: new Date(NOW),
    ...data,
  };

  db.readings = {
    ...db.readings,
    [key]: [...(db.readings[key] || []), reading],
  };

  db.events = {
    ...db.events,
    [key]: [
      ...(db.events[key] || []),
      {
        id: genId(),
        time: new Date(NOW),
        text:
          `New operational reading logged ` +
          `(${data.unloadedT.toLocaleString()} t unloaded).`,
      },
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

export async function addDelay(
  id: string | number,
  data: AddDelayInput,
): Promise<DelayEvent> {
  const key = String(id);

  const delayEvent: DelayEvent = {
    id: genId(),
    ...data,
  };

  db.delays = {
    ...db.delays,
    [key]: [...(db.delays[key] || []), delayEvent],
  };

  const minutes = Math.round(
    (data.end.getTime() - data.start.getTime()) / 60000,
  );

  db.events = {
    ...db.events,
    [key]: [
      ...(db.events[key] || []),
      {
        id: genId(),
        time: data.end,
        text: `${data.category} delay recorded (${minutes} min).`,
      },
    ],
  };

  return delay(delayEvent);
}

export async function getHistory(): Promise<VesselVisit[]> {
  return getVesselVisits("Completed");
}

export async function resetMockDb() {
  db = {
    vessels: [...vessels],
    readings: { ...readingsByVessel },
    delays: { ...delaysByVessel },
    events: { ...eventsByVessel },
  };
}