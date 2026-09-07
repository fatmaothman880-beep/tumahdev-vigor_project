/**
 * Prediction logic (mock mode only).
 *
 * IMPORTANT: the frontend does not own this calculation in the real system.
 * The FastAPI backend computes progress, effective rate, estimated completion,
 * expected berth release and berth-risk, and the frontend simply displays the
 * result (see GET /dashboard/active in README.md).
 *
 * This module exists only so the mock-mode prototype can demonstrate the same
 * interaction pattern without a backend. It is intentionally isolated here so
 * it can be deleted wholesale once src/api switches to the real service.
 */
import { minutesBetween } from "./format";
import type {
  BerthRiskInfo,
  DataQuality,
  OperationalReading,
  PredictionData,
  VesselVisit,
} from "../types";

export function latestReading(
  readings: Record<string | number, OperationalReading[]>,
  vesselId: string | number
): OperationalReading | null {
  const list = readings[vesselId] || [];
  return list.length ? list[list.length - 1] : null;
}

export function dataQualityFor(reading: OperationalReading | null, now: Date): DataQuality {
  if (!reading) return "insufficient";
  const ageMin = minutesBetween(reading.timestamp, now);
  if (ageMin <= 20) return "current";
  if (ageMin <= 60) return "stale";
  return "insufficient";
}

export function computePrediction(
  vessel: VesselVisit,
  readings: Record<string | number, OperationalReading[]>,
  now: Date
): PredictionData {
  const r = latestReading(readings, vessel.id);
  const quality = dataQualityFor(r, now);

  if (!r || !r.observedRateTph || r.observedRateTph <= 0) {
    return {
      remainingT: r ? r.remainingT : vessel.cargoTotalT,
      unloadedT: r ? r.unloadedT : 0,
      progressPct: r ? (r.unloadedT / vessel.cargoTotalT) * 100 : 0,
      effectiveRateTph: 0,
      etaAvailable: false,
      eta: null,
      berthReleaseAvailable: false,
      berthRelease: null,
      dataQuality: quality,
      lastReading: r,
    };
  }

  const remainingHours = r.remainingT / r.observedRateTph;
  const eta = new Date(now.getTime() + remainingHours * 3600000);
  const berthRelease = new Date(eta.getTime() + (vessel.postUnloadBufferMin || 0) * 60000);

  return {
    remainingT: r.remainingT,
    unloadedT: r.unloadedT,
    progressPct: (r.unloadedT / vessel.cargoTotalT) * 100,
    effectiveRateTph: r.observedRateTph,
    etaAvailable: true,
    eta,
    berthReleaseAvailable: true,
    berthRelease,
    dataQuality: quality,
    lastReading: r,
  };
}

export function berthRiskFor(
  vessel: VesselVisit,
  prediction: PredictionData,
  vessels: VesselVisit[]
): BerthRiskInfo {
  const nextVessel = vessel.scheduledNext || vessels.find((v) => v.id === vessel.nextVesselId) || null;
  if (!nextVessel || !prediction.berthReleaseAvailable || !prediction.berthRelease) {
    return { risk: "unknown", nextVessel, overlapMin: 0, nextEta: null };
  }
  const nextEta = nextVessel.etaOverride || nextVessel.plannedArrival;
  if (!nextEta) {
    return { risk: "unknown", nextVessel, overlapMin: 0, nextEta: null };
  }
  const overlapMin = minutesBetween(nextEta, prediction.berthRelease) + (nextVessel.berthPreparationMin || 0);
  if (overlapMin > 0) {
    return { risk: "conflict", nextVessel, overlapMin, nextEta };
  }
  return { risk: "low", nextVessel, overlapMin: 0, nextEta };
}
