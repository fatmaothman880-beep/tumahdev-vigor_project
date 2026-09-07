import type { PredictionData, TimeProgress } from "../../types";
import { fmtDuration, fmtPct, fmtT, fmtTime } from "../../lib/format";
import ProgressBar from "./ProgressBar";

/**
 * Renders cargo progress and time/schedule progress as two clearly labeled,
 * visually distinct bars. Per the brief: never blend these into one number
 * — a vessel can be well into its scheduled time window while cargo
 * progress lags behind, and that gap is exactly the signal that should be
 * visible, not hidden by averaging.
 */
export default function DualProgress({
  cargo,
  time,
  cargoTotalT,
}: {
  cargo: PredictionData;
  time: TimeProgress;
  cargoTotalT: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink-soft">Cargo progress</span>
          <span className="text-xl font-bold tabular-nums font-data text-brand-green">{fmtPct(cargo.progressPct)}</span>
        </div>
        <ProgressBar pct={cargo.progressPct} tone="green" />
        <div className="flex justify-between text-xs mt-1.5 text-gray-500">
          <span>{fmtT(cargo.unloadedT)} unloaded</span>
          <span>
            {fmtT(cargo.remainingT)} remaining of {fmtT(cargoTotalT)}
          </span>
        </div>
      </div>

      {time.available && time.plannedProgressPct !== null && (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-semibold text-ink-soft">Schedule (time) progress</span>
            <span className="text-xl font-bold tabular-nums font-data text-teal">{fmtPct(time.plannedProgressPct)}</span>
          </div>
          <ProgressBar pct={time.plannedProgressPct} tone="teal" />
          <div className="flex justify-between text-xs mt-1.5 text-gray-500">
            <span>{fmtDuration(time.elapsedMin)} elapsed</span>
            <span>of {fmtDuration(time.totalPlannedMin)} planned operating window</span>
          </div>
        </div>
      )}
    </div>
  );
}
