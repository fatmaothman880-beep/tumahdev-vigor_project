import { apiFetch, apiList, USE_MOCK_API } from "./client";
import * as mock from "../mock/mockServices";
import type {
  EntityId,
  OperationalReading,
} from "../types";
import {
  mapReading,
  toBackendReadingSource,
  toNumber,
  type BackendReading,
  type BackendReadingResult,
  type BackendVisit,
} from "./adapters";

/**
 * Return readings from oldest to newest.
 *
 * Member 1's dashboard calculation treats the final array entry as the
 * latest reading, while the backend returns readings newest-first.
 */
function sortReadingsChronologically(
  readings: OperationalReading[],
): OperationalReading[] {
  return [...readings].sort(
    (first, second) =>
      first.timestamp.getTime() -
      second.timestamp.getTime(),
  );
}

export async function getReadings(
  vesselId: EntityId,
): Promise<OperationalReading[]> {
  if (USE_MOCK_API) {
    const readings = await mock.getReadings(vesselId);
    return sortReadingsChronologically(readings);
  }

  const encodedId = encodeURIComponent(String(vesselId));

  const [backendReadings, visit] = await Promise.all([
    apiList<BackendReading>(
      `/visits/${encodedId}/readings`,
    ),
    apiFetch<BackendVisit>(`/visits/${encodedId}`),
  ]);

  const cargoTotalT = toNumber(visit.cargo_total_t);

  const readings = backendReadings.map((reading) =>
    mapReading(reading, cargoTotalT),
  );

  return sortReadingsChronologically(readings);
}

export async function addReading(
  vesselId: EntityId,
  data: mock.AddReadingInput,
): Promise<OperationalReading> {
  if (USE_MOCK_API) {
    return mock.addReading(vesselId, data);
  }

  const encodedId = encodeURIComponent(String(vesselId));

  const result = await apiFetch<BackendReadingResult>(
    `/visits/${encodedId}/readings`,
    {
      method: "POST",
      body: JSON.stringify({
        recorded_at: new Date().toISOString(),
        source: toBackendReadingSource(data.source),
        unloaded_t: data.unloadedT,
        observed_rate_tph: data.observedRateTph,
        buffer_level_t: null,
        buffer_capacity_t: null,
        packaging_rate_tph: null,
        unloading_status:
          data.observedRateTph > 0
            ? "ACTIVE"
            : "STOPPED",
        packaging_status: null,
        notes: data.notes || null,
      }),
    },
  );

  const remainingT =
    result.prediction !== null
      ? toNumber(result.prediction.remaining_t)
      : data.remainingT;

  const cargoTotalT = data.unloadedT + remainingT;

  return mapReading(
    result.reading,
    cargoTotalT,
    remainingT,
  );
}
