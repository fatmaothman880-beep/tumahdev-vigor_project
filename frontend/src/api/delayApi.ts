import { apiFetch, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type {
  DelayEvent,
  EntityId,
} from "../types";
import {
  toDelayCategory,
  type BackendDelay,
} from "./adapters";

function mapDelay(event: BackendDelay): DelayEvent {
  return {
    id: event.id,
    start: new Date(event.start_time),
    end: event.end_time
      ? new Date(event.end_time)
      : new Date(event.start_time),
    category: toDelayCategory(event.category),
    area: event.responsible_area || event.equipment || "—",
    description:
      event.description || event.cause || "No description",
  };
}

export async function getDelays(
  vesselId: EntityId,
): Promise<DelayEvent[]> {
  if (USE_MOCK_API) {
    return mock.getDelays(vesselId);
  }

  const events = await apiFetch<BackendDelay[]>(
    `/visits/${encodeURIComponent(String(vesselId))}/delays`,
  );

  return events.map(mapDelay);
}

export async function addDelay(
  vesselId: EntityId,
  data: mock.AddDelayInput,
): Promise<DelayEvent> {
  if (USE_MOCK_API) {
    return mock.addDelay(vesselId, data);
  }

  const event = await apiFetch<BackendDelay>(
    `/visits/${encodeURIComponent(String(vesselId))}/delays`,
    {
      method: "POST",
      body: JSON.stringify({
        start_time: data.start.toISOString(),
        end_time: data.end.toISOString(),
        category: data.category,
        cause: data.description || data.category,
        responsible_area: data.area || null,
        equipment:
          data.category === "Equipment"
            ? data.area || null
            : null,
        description: data.description || null,
      }),
    },
  );

  return mapDelay(event);
}