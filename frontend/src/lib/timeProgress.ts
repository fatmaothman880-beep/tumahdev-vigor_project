/**
 * TIME progress vs CARGO progress are deliberately two different numbers.
 *
 * Cargo progress (see lib/prediction.ts#computePrediction) answers:
 *   "how much of the tonnage has actually been unloaded?"
 *
 * Time progress answers a different question:
 *   "how much of the *scheduled* operating window has elapsed?"
 *
 * A vessel can be at 80% time progress and 30% cargo progress — that
 * combination is exactly what should trigger an at-risk state in
 * lib/riskEngine.ts. Never blend these two numbers into one bar.
 */
import type { TimeProgress, VesselVisit } from "../types";
import { minutesBetween } from "./format";

export function computeTimeProgress(vessel: VesselVisit, now: Date): TimeProgress {
  const start = vessel.unloadStart || vessel.plannedUnloadStart;
  const plannedEnd = vessel.plannedCompletion;

  if (!start || !plannedEnd || plannedEnd.getTime() <= start.getTime()) {
    return { available: false, elapsedMin: null, totalPlannedMin: null, plannedProgressPct: null };
  }

  const totalPlannedMin = minutesBetween(start, plannedEnd);
  const elapsedMinRaw = minutesBetween(start, now);
  const elapsedMin = Math.max(0, elapsedMinRaw);
  const plannedProgressPct = Math.max(0, Math.min(100, (elapsedMin / totalPlannedMin) * 100));

  return { available: true, elapsedMin, totalPlannedMin, plannedProgressPct };
}

export function remainingPlannedMinutes(progress: TimeProgress): number | null {
  if (!progress.available || progress.elapsedMin === null || progress.totalPlannedMin === null) return null;
  return Math.max(0, progress.totalPlannedMin - progress.elapsedMin);
}
