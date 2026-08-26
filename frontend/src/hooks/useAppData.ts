import { useCallback, useEffect, useState } from "react";
import type { Berth, DelayEvent, OperationalEvent, OperationalReading, VesselVisit } from "../types";
import * as vesselApi from "../api/vesselApi";
import * as readingApi from "../api/readingApi";
import * as delayApi from "../api/delayApi";
import * as mock from "../mock/mockServices";
import type { AddDelayInput, AddReadingInput, CreateVesselVisitInput } from "../mock/mockServices";
import type { ToastState } from "../components/ui/Feedback";

export interface AppData {
  vessels: VesselVisit[];
  berths: Berth[];
  readings: Record<number, OperationalReading[]>;
  delays: Record<number, DelayEvent[]>;
  events: Record<number, OperationalEvent[]>;
}

/**
 * Loads all data the dashboard/vessel pages need and exposes mutation
 * helpers that call the API layer (mock or real, see src/api/client.ts)
 * and then refresh local state so the UI reflects the change immediately.
 */
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [vessels, berths] = await Promise.all([vesselApi.getVesselVisits(), mock.getBerths()]);
      const readingsEntries = await Promise.all(vessels.map(async (v) => [v.id, await readingApi.getReadings(v.id)] as const));
      const delaysEntries = await Promise.all(vessels.map(async (v) => [v.id, await delayApi.getDelays(v.id)] as const));
      const eventsEntries = await Promise.all(vessels.map(async (v) => [v.id, await mock.getEvents(v.id)] as const));
      setData({
        vessels,
        berths,
        readings: Object.fromEntries(readingsEntries),
        delays: Object.fromEntries(delaysEntries),
        events: Object.fromEntries(eventsEntries),
      });
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const createVessel = useCallback(
    async (input: CreateVesselVisitInput) => {
      const vessel = await vesselApi.createVesselVisit(input);
      await loadAll();
      setToast({ type: "success", message: "Vessel visit created." });
      return vessel;
    },
    [loadAll]
  );

  const addReading = useCallback(
    async (vesselId: number, input: AddReadingInput) => {
      await readingApi.addReading(vesselId, input);
      await loadAll();
      setToast({ type: "success", message: "Reading saved. Dashboard updated." });
    },
    [loadAll]
  );

  const addDelay = useCallback(
    async (vesselId: number, input: AddDelayInput) => {
      await delayApi.addDelay(vesselId, input);
      await loadAll();
      setToast({ type: "success", message: "Delay recorded." });
    },
    [loadAll]
  );

  const completeVessel = useCallback(
    async (vesselId: number) => {
      await vesselApi.completeVesselVisit(vesselId);
      await loadAll();
      setToast({ type: "success", message: "Vessel visit completed." });
    },
    [loadAll]
  );

  return { data, loading, error, toast, reload: loadAll, createVessel, addReading, addDelay, completeVessel };
}
