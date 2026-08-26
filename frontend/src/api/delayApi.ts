import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type { DelayEvent } from "../types";

export async function getDelays(vesselId: number): Promise<DelayEvent[]> {
  if (USE_MOCK_API) return mock.getDelays(vesselId);
  return apiFetch<DelayEvent[]>(`/vessel-visits/${vesselId}/delays`);
}

export async function addDelay(vesselId: number, data: mock.AddDelayInput): Promise<DelayEvent> {
  if (USE_MOCK_API) return mock.addDelay(vesselId, data);
  return apiFetch<DelayEvent>(`/vessel-visits/${vesselId}/delays`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
