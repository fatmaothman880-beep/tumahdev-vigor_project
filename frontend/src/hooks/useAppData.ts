import { useCallback, useEffect, useState } from "react";
import type { Berth, DelayEvent, OperationalEvent, OperationalReading, VesselVisit } from "../types";
import * as vesselApi from "../api/vesselApi";
import * as readingApi from "../api/readingApi";
import * as delayApi from "../api/delayApi";
import * as mock from "../mock/mockServices";
import { getBerths } from "../api/berthApi";
import { getPredictions } from "../api/predictionApi";
import { USE_MOCK_API } from "../api/client";
import type { PredictionData } from "../types";
import type { AddDelayInput, AddReadingInput, CreateVesselVisitInput, EditVesselVisitInput } from "../mock/mockServices";
import type { ToastState } from "../components/ui/Feedback";

export interface AppData {
  predictions?: Record<string, PredictionData>;
  vessels: VesselVisit[];
  berths: Berth[];
  readings: Record<string | number, OperationalReading[]>;
  delays: Record<string | number, DelayEvent[]>;
  events: Record<string | number, OperationalEvent[]>;
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

  const loadAll = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(false);
    try {
      const [vessels, berths, predictions] = await Promise.all([
        vesselApi.getVesselVisits(), getBerths(), USE_MOCK_API ? undefined : getPredictions(),
      ]);
      const readingsEntries = await Promise.all(vessels.map(async (v) => [v.id, await readingApi.getReadings(v.id)] as const));
      const delaysEntries = await Promise.all(vessels.map(async (v) => [v.id, await delayApi.getDelays(v.id)] as const));
      const eventsEntries = await Promise.all(vessels.map(async (v) => [v.id, USE_MOCK_API ? await mock.getEvents(v.id) : [
        ...(v.registeredAt ? [{id: `registered-${v.id}`, time: v.registeredAt, text: "Visit registered."}] : []),
        ...(readingsEntries.find(([id]) => id === v.id)?.[1] || []).map(r => ({id: `reading-${r.id}`, time: r.timestamp, text: `Reading recorded: ${r.unloadedT} t unloaded.`})),
        ...(delaysEntries.find(([id]) => id === v.id)?.[1] || []).map(d => ({id: `delay-${d.id}`, time: d.start, text: `${d.category}: ${d.description}`})),
      ].sort((a,b) => a.time.getTime() - b.time.getTime())] as const));
      setData({
        predictions,
        vessels,
        berths,
        readings: Object.fromEntries(readingsEntries),
        delays: Object.fromEntries(delaysEntries),
        events: Object.fromEntries(eventsEntries),
      });
      return true;
    } catch (e) {
      setError(true);
      setToast({type: "error", message: e instanceof Error ? e.message : "Unable to load API data"});
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => { void loadAll(true); }, 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const createVessel = useCallback(
    async (input: CreateVesselVisitInput) => {
      const vessel = await vesselApi.createVesselVisit(input);
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Vessel visit created." });
      return vessel;
    },
    [loadAll]
  );

  const addReading = useCallback(
    async (vesselId: string | number, input: AddReadingInput) => {
      await readingApi.addReading(vesselId, input);
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Reading saved. Dashboard updated." });
    },
    [loadAll]
  );

  const addDelay = useCallback(
    async (vesselId: string | number, input: AddDelayInput) => {
      await delayApi.addDelay(vesselId, input);
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Delay recorded." });
    },
    [loadAll]
  );

  const completeVessel = useCallback(
    async (vesselId: string | number) => {
      try { await vesselApi.completeVesselVisit(vesselId); }
      catch (e) {
        setToast({type: "error", message: e instanceof Error ? e.message : "Unable to complete visit"});
        return;
      }
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Vessel visit completed." });
    },
    [loadAll]
  );

  const editVessel = useCallback(
    async (vesselId: string | number, input: EditVesselVisitInput) => {
      await vesselApi.editVesselVisit(vesselId, input);
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Vessel plan updated." });
    },
    [loadAll]
  );

  const cancelVessel = useCallback(
    async (vesselId: string | number) => {
      await vesselApi.cancelVesselVisit(vesselId);
      const refreshed = await loadAll(true);
      if (refreshed) setToast({ type: "success", message: "Vessel visit cancelled." });
    },
    [loadAll]
  );

  return { data, loading, error, toast, reload: () => loadAll(), createVessel, addReading, addDelay, completeVessel, editVessel, cancelVessel };
}
