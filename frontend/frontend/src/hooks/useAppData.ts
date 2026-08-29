import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type {
  Berth,
  DelayEvent,
  EntityId,
  OperationalEvent,
  OperationalReading,
  VesselVisit,
} from "../types";
import * as vesselApi from "../api/vesselApi";
import * as readingApi from "../api/readingApi";
import * as delayApi from "../api/delayApi";
import * as berthApi from "../api/berthApi";
import {
  USE_MOCK_API,
} from "../api/client";
import * as mock from "../mock/mockServices";
import type {
  AddDelayInput,
  AddReadingInput,
  CreateVesselVisitInput,
} from "../mock/mockServices";
import type {
  ToastState,
} from "../components/ui/Feedback";

export interface AppData {
  vessels: VesselVisit[];
  berths: Berth[];
  readings: Record<string, OperationalReading[]>;
  delays: Record<string, DelayEvent[]>;
  events: Record<string, OperationalEvent[]>;
}

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] =
    useState<ToastState | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [vessels, berths] = await Promise.all([
        vesselApi.getVesselVisits(),
        berthApi.getBerths(),
      ]);

      const readingsEntries = await Promise.all(
        vessels.map(async (vessel) => [
          String(vessel.id),
          await readingApi.getReadings(vessel.id),
        ] as const),
      );

      const delaysEntries = await Promise.all(
        vessels.map(async (vessel) => [
          String(vessel.id),
          await delayApi.getDelays(vessel.id),
        ] as const),
      );

      const eventsEntries = await Promise.all(
        vessels.map(async (vessel) => [
          String(vessel.id),
          USE_MOCK_API
            ? await mock.getEvents(vessel.id)
            : [],
        ] as const),
      );

      setData({
        vessels,
        berths,
        readings: Object.fromEntries(readingsEntries),
        delays: Object.fromEntries(delaysEntries),
        events: Object.fromEntries(eventsEntries),
      });
    } catch (loadError) {
      console.error("Failed to load application data:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(
      () => setToast(null),
      2600,
    );

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const createVessel = useCallback(
    async (input: CreateVesselVisitInput) => {
      const vessel =
        await vesselApi.createVesselVisit(input);

      await loadAll();

      setToast({
        type: "success",
        message: "Vessel visit created.",
      });

      return vessel;
    },
    [loadAll],
  );

  const addReading = useCallback(
    async (
      vesselId: EntityId,
      input: AddReadingInput,
    ) => {
      await readingApi.addReading(vesselId, input);
      await loadAll();

      setToast({
        type: "success",
        message: "Reading saved. Dashboard updated.",
      });
    },
    [loadAll],
  );

  const addDelay = useCallback(
    async (
      vesselId: EntityId,
      input: AddDelayInput,
    ) => {
      await delayApi.addDelay(vesselId, input);
      await loadAll();

      setToast({
        type: "success",
        message: "Delay recorded.",
      });
    },
    [loadAll],
  );

  const completeVessel = useCallback(
    async (vesselId: EntityId) => {
      await vesselApi.completeVesselVisit(vesselId);
      await loadAll();

      setToast({
        type: "success",
        message: "Vessel visit completed.",
      });
    },
    [loadAll],
  );

  return {
    data,
    loading,
    error,
    toast,
    reload: loadAll,
    createVessel,
    addReading,
    addDelay,
    completeVessel,
  };
}