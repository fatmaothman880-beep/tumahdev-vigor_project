import { apiFetch, apiList, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { EntityId, VesselStatus, VesselVisit } from "../types";
import { mapVisit, toBackendStatus, type BackendVisit, type BackendVessel } from "./adapters";
type Pair = { visit: BackendVisit; vessel: BackendVessel };
const mapped = (pair: Pair) => mapVisit(pair.visit, pair.vessel);
export async function getVesselVisits(status?: VesselStatus): Promise<VesselVisit[]> {
  if (USE_MOCK_API) return mock.getVesselVisits(status);
  const visits = (await apiFetch<Pair[]>("/integration/visits")).map(mapped);
  const calls = await apiList<{id: string; vessel_id: string; berth_id: string; expected_arrival: string; cargo_type: string; cargo_quantity_t: string; status: string; berth_preparation_minutes: number}>("/upcoming-calls");
  const scheduled = await Promise.all(calls.filter(c => c.status === "PLANNED" || c.status === "CONFIRMED").map(async c => {
    const vessel = await apiFetch<BackendVessel>(`/vessels/${encodeURIComponent(c.vessel_id)}`);
    return {id: `call-${c.id}`, name: vessel.name, reference: vessel.imo_reference || "—", berthId: c.berth_id,
      cargo: c.cargo_type, cargoTotalT: Number(c.cargo_quantity_t), status: "Planned" as const,
      plannedArrival: new Date(c.expected_arrival), actualArrival: null, registeredAt: null,
      plannedUnloadStart: null, plannedCompletion: null, plannedRateTph: null, unloadStart: null, unloadFinish: null,
      postUnloadBufferMin: 0, nextVesselId: null, berthPreparationMin: c.berth_preparation_minutes};
  }));
  for (const v of visits) {
    const next = [...visits, ...scheduled].filter(n => n.id !== v.id && n.berthId === v.berthId && n.status === "Planned" && n.plannedArrival)
      .sort((a, b) => a.plannedArrival!.getTime() - b.plannedArrival!.getTime())[0];
    v.nextVesselId = next?.id ?? null;
    if (String(next?.id).startsWith("call-")) v.scheduledNext = next;
  }
  return status ? visits.filter(v => v.status === status) : visits;
}
export async function getVesselVisit(id: EntityId): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.getVesselVisit(id);
  return (await getVesselVisits()).find(v => v.id === id) || null;
}
function plan(data: mock.CreateVesselVisitInput) {
  const iso = (value?: string) => value ? new Date(value).toISOString() : null;
  return { ...data, status: toBackendStatus(data.status),
    plannedArrival: iso(data.plannedArrival), plannedUnloadStart: iso(data.plannedUnloadStart),
    plannedCompletion: iso(data.plannedCompletion), plannedRateTph: data.plannedRateTph ?? null };
}
export async function createVesselVisit(data: mock.CreateVesselVisitInput): Promise<VesselVisit> {
  if (USE_MOCK_API) return mock.createVesselVisit(data);
  return mapped(await apiFetch<Pair>("/integration/visits", {method: "POST", body: JSON.stringify(plan(data))}));
}
export async function editVesselVisit(id: EntityId, data: mock.EditVesselVisitInput): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.editVesselVisit(id, data);
  return mapped(await apiFetch<Pair>(`/integration/visits/${encodeURIComponent(id)}`, {method: "PUT", body: JSON.stringify(plan(data))}));
}
export async function updateVesselVisit(id: EntityId, patch: Partial<VesselVisit>): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.updateVesselVisit(id, patch);
  const v = await getVesselVisit(id);
  if (!v) throw new Error("Visit not found");
  const out = {...v, ...patch};
  return editVesselVisit(id, {...out, plannedArrival: out.plannedArrival?.toISOString() || "",
    plannedUnloadStart: out.plannedUnloadStart?.toISOString() || "",
    plannedCompletion: out.plannedCompletion?.toISOString() || "", plannedRateTph: out.plannedRateTph ?? undefined});
}
export async function cancelVesselVisit(id: EntityId): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.cancelVesselVisit(id);
  return mapped(await apiFetch<Pair>(`/integration/visits/${encodeURIComponent(id)}/status`, {method:"PATCH", body:JSON.stringify({status:"CANCELLED"})}));
}
export async function completeVesselVisit(id: EntityId): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.completeVesselVisit(id);
  return mapped(await apiFetch<Pair>(`/integration/visits/${encodeURIComponent(id)}/status`, {method:"PATCH", body:JSON.stringify({status:"COMPLETED"})}));
}
export async function getHistory() { return (await getVesselVisits()).filter(v => v.status === "Completed" || v.status === "Cancelled"); }
