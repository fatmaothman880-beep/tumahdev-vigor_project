import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type {
  EntityId,
  VesselStatus,
  VesselVisit,
} from "../types";
import {
  mapVisit,
  toBackendStatus,
  type BackendVessel,
  type BackendVisit,
} from "./adapters";

async function getBackendVisitWithVessel(
  visitId: EntityId,
): Promise<VesselVisit> {
  const visit = await apiFetch<BackendVisit>(
    `/visits/${encodeURIComponent(String(visitId))}`,
  );

  const vessel = await apiFetch<BackendVessel>(
    `/vessels/${encodeURIComponent(visit.vessel_id)}`,
  );

  return mapVisit(visit, vessel);
}

export async function getVesselVisits(
  status?: VesselStatus,
): Promise<VesselVisit[]> {
  if (USE_MOCK_API) {
    return mock.getVesselVisits(status);
  }

  const query = status
    ? `?visit_status=${encodeURIComponent(toBackendStatus(status))}`
    : "";

  const [visits, vessels] = await Promise.all([
    apiFetch<BackendVisit[]>(`/visits${query}`),
    apiFetch<BackendVessel[]>("/vessels"),
  ]);

  const vesselMap = new Map(
    vessels.map((vessel) => [vessel.id, vessel]),
  );

  return visits.flatMap((visit) => {
    const vessel = vesselMap.get(visit.vessel_id);

    return vessel ? [mapVisit(visit, vessel)] : [];
  });
}

export async function getVesselVisit(
  id: EntityId,
): Promise<VesselVisit | null> {
  if (USE_MOCK_API) {
    return mock.getVesselVisit(id);
  }

  return getBackendVisitWithVessel(id);
}

function plannedArrivalToIso(time: string): string {
  const [hour, minute] = (time || "00:00")
    .split(":")
    .map(Number);

  const plannedArrival = new Date();
  plannedArrival.setHours(hour, minute, 0, 0);

  return plannedArrival.toISOString();
}

export async function createVesselVisit(
  data: mock.CreateVesselVisitInput,
): Promise<VesselVisit> {
  if (USE_MOCK_API) {
    return mock.createVesselVisit(data);
  }

  const vessel = await apiFetch<BackendVessel>("/vessels", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      imo_reference: data.reference || null,
      capacity_t: data.cargoTotalT,
      agent_name: null,
      agent_phone: null,
    }),
  });

  const now = new Date().toISOString();
  const backendStatus = toBackendStatus(data.status);

  const visit = await apiFetch<BackendVisit>("/visits", {
    method: "POST",
    body: JSON.stringify({
      vessel_id: vessel.id,
      berth_id: data.berthId,
      cargo_type: data.cargo,
      cargo_total_t: data.cargoTotalT,
      planned_arrival: plannedArrivalToIso(
        data.plannedArrival,
      ),
      actual_arrival:
        data.status === "Planned" ? null : now,
      unload_start:
        data.status === "Unloading" ? now : null,
      unload_end: null,
      planned_departure: null,
      actual_departure: null,
      post_unloading_minutes: 20,
      status: backendStatus,
      notes: null,
    }),
  });

  return mapVisit(visit, vessel);
}

export async function updateVesselVisit(
  id: EntityId,
  patch: Partial<VesselVisit>,
): Promise<VesselVisit | null> {
  if (USE_MOCK_API) {
    return mock.updateVesselVisit(id, patch);
  }

  const payload: Record<string, unknown> = {};

  if (patch.cargo !== undefined) {
    payload.cargo_type = patch.cargo;
  }

  if (patch.cargoTotalT !== undefined) {
    payload.cargo_total_t = patch.cargoTotalT;
  }

  if (patch.berthId !== undefined) {
    payload.berth_id = patch.berthId;
  }

  if (patch.status !== undefined) {
    payload.status = toBackendStatus(patch.status);
  }

  if (patch.plannedArrival !== undefined) {
    payload.planned_arrival =
      patch.plannedArrival?.toISOString() ?? null;
  }

  if (patch.actualArrival !== undefined) {
    payload.actual_arrival =
      patch.actualArrival?.toISOString() ?? null;
  }

  if (patch.unloadStart !== undefined) {
    payload.unload_start =
      patch.unloadStart?.toISOString() ?? null;
  }

  if (patch.unloadFinish !== undefined) {
    payload.unload_end =
      patch.unloadFinish?.toISOString() ?? null;
  }

  if (patch.postUnloadBufferMin !== undefined) {
    payload.post_unloading_minutes =
      patch.postUnloadBufferMin;
  }

  await apiFetch<BackendVisit>(
    `/visits/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return getBackendVisitWithVessel(id);
}

export async function completeVesselVisit(
  id: EntityId,
): Promise<VesselVisit | null> {
  if (USE_MOCK_API) {
    return mock.completeVesselVisit(id);
  }

  await apiFetch<BackendVisit>(
    `/visits/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "COMPLETED",
        unload_end: new Date().toISOString(),
      }),
    },
  );

  return getBackendVisitWithVessel(id);
}

export async function getHistory(): Promise<VesselVisit[]> {
  return getVesselVisits("Completed");
}