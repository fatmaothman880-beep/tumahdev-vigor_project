import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { VesselStatus, VesselVisit } from "../types";

export async function getVesselVisits(status?: VesselStatus): Promise<VesselVisit[]> {
  if (USE_MOCK_API) return mock.getVesselVisits(status);
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<VesselVisit[]>(`/vessel-visits${qs}`);
}

export async function getVesselVisit(id: number): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.getVesselVisit(id);
  return apiFetch<VesselVisit>(`/vessel-visits/${id}`);
}

export async function createVesselVisit(data: mock.CreateVesselVisitInput): Promise<VesselVisit> {
  if (USE_MOCK_API) return mock.createVesselVisit(data);
  return apiFetch<VesselVisit>(`/vessel-visits`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateVesselVisit(id: number, patch: Partial<VesselVisit>): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.updateVesselVisit(id, patch);
  return apiFetch<VesselVisit>(`/vessel-visits/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function completeVesselVisit(id: number): Promise<VesselVisit | null> {
  if (USE_MOCK_API) return mock.completeVesselVisit(id);
  return apiFetch<VesselVisit>(`/vessel-visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Completed" }),
  });
}

export async function getHistory(): Promise<VesselVisit[]> {
  if (USE_MOCK_API) return mock.getHistory();
  return apiFetch<VesselVisit[]>(`/vessel-visits?status=completed`);
}
