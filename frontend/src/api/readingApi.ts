import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { OperationalReading } from "../types";

export async function getReadings(vesselId: number): Promise<OperationalReading[]> {
  if (USE_MOCK_API) return mock.getReadings(vesselId);
  return apiFetch<OperationalReading[]>(`/vessel-visits/${vesselId}/readings`);
}

export async function addReading(vesselId: number, data: mock.AddReadingInput): Promise<OperationalReading> {
  if (USE_MOCK_API) return mock.addReading(vesselId, data);
  return apiFetch<OperationalReading>(`/vessel-visits/${vesselId}/readings`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
