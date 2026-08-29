import { AlertTriangle, Anchor, CircleCheck, Info } from "lucide-react";
import type { Berth, BerthRiskInfo, PredictionData, VesselVisit } from "../../types";
import { fmtTime } from "../../lib/format";
import { Card } from "./Layout";
import StatusBadge from "./StatusBadge";

export default function BerthRisk({
  vessel,
  prediction,
  riskInfo,
  berth,
}: {
  vessel: VesselVisit;
  prediction: PredictionData;
  riskInfo: BerthRiskInfo;
  berth?: Berth | null;
}) {
  const isConflict = riskInfo.risk === "conflict";
  const isLow = riskInfo.risk === "low";

  return (
    <Card>
      <div className="p-4 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor size={16} className="text-teal" />
            <span className="font-bold text-sm text-ink">{berth?.name || vessel.berthId}</span>
          </div>
          <StatusBadge status={vessel.status === "Completed" ? "Completed" : "Unloading"} />
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[11px] uppercase font-semibold text-gray-500">Current vessel</div>
          <div className="font-semibold mt-0.5 text-ink">{vessel.name}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase font-semibold text-gray-500">Expected release</div>
          <div className="font-semibold mt-0.5 tabular-nums text-ink">
            {prediction.berthReleaseAvailable ? fmtTime(prediction.berthRelease) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase font-semibold text-gray-500">Next vessel</div>
          <div className="font-semibold mt-0.5 text-ink">{riskInfo.nextVessel?.name || "None scheduled"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase font-semibold text-gray-500">Next vessel ETA</div>
          <div className="font-semibold mt-0.5 tabular-nums text-ink">{riskInfo.nextEta ? fmtTime(riskInfo.nextEta) : "—"}</div>
        </div>
      </div>
      <div className="px-4 pb-4">
        {isConflict && (
          <div className="rounded-lg p-3 flex items-start gap-2.5 bg-danger-tint border border-danger/25">
            <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm text-danger">Potential berth conflict</div>
              <div className="text-xs mt-0.5 text-danger/90">
                {riskInfo.overlapMin} min expected overlap with {riskInfo.nextVessel?.name}.
              </div>
            </div>
          </div>
        )}
        {isLow && (
          <div className="rounded-lg p-3 flex items-start gap-2.5 bg-brand-green-tint border border-brand-green/25">
            <CircleCheck size={18} className="text-brand-green-deep mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm text-brand-green-deep">Berth risk: Low</div>
              <div className="text-xs mt-0.5 text-ink-soft">Berth expected to be clear before the next scheduled arrival.</div>
            </div>
          </div>
        )}
        {riskInfo.risk === "unknown" && (
          <div className="rounded-lg p-3 flex items-start gap-2.5 bg-paper border border-line">
            <Info size={18} className="text-gray-500 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-500">No next vessel scheduled, or release time cannot yet be estimated.</div>
          </div>
        )}
      </div>
    </Card>
  );
}
