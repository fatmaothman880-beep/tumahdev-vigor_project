import { AlertTriangle } from "lucide-react";
import type {
  BerthRiskInfo,
  PredictionData,
  VesselVisit,
} from "../../types";
import {
  fmtTime,
  pad2,
} from "../../lib/format";
import {
  Card,
  SectionHeader,
} from "./Layout";

export default function BerthTimeline({
  vessel,
  prediction,
  riskInfo,
}: {
  vessel: VesselVisit;
  prediction: PredictionData;
  riskInfo: BerthRiskInfo;
}) {
  const startHour = vessel.unloadStart
    ? vessel.unloadStart.getHours()
    : 6;

  const fallbackEnd = new Date();
  fallbackEnd.setHours(startHour + 4, 0, 0, 0);

  const lastMoment =
    riskInfo.nextEta && prediction.berthRelease
      ? new Date(
          Math.max(
            riskInfo.nextEta.getTime(),
            prediction.berthRelease.getTime(),
          ),
        )
      : prediction.berthRelease || fallbackEnd;

  const windowEndHour = Math.min(
    23,
    lastMoment.getHours() + 2,
  );

  const hours: number[] = [];

  for (
    let hour = startHour;
    hour <= windowEndHour;
    hour += 1
  ) {
    hours.push(hour);
  }

  const totalMinutes =
    (windowEndHour - startHour) * 60 || 1;

  const percentageOf = (date: Date): number => {
    const minutes =
      (date.getHours() - startHour) * 60 +
      date.getMinutes();

    return Math.max(
      0,
      Math.min(100, (minutes / totalMinutes) * 100),
    );
  };

  const unloadStartPercentage = percentageOf(
    vessel.unloadStart || new Date(),
  );

  const releasePercentage =
    prediction.berthReleaseAvailable &&
    prediction.berthRelease
      ? percentageOf(prediction.berthRelease)
      : null;

  const nextArrivalPercentage = riskInfo.nextEta
    ? percentageOf(riskInfo.nextEta)
    : null;

  const unloadingWidth = Math.max(
    2,
    (releasePercentage ?? 60) -
      unloadStartPercentage,
  );

  return (
    <Card className="p-4">
      <SectionHeader
        title="Berth timeline"
        sub="Current berth scheduling view"
      />

      <div className="relative pt-1">
        <div className="flex justify-between text-[10px] font-medium mb-1 text-gray-500">
          {hours.map((hour) => (
            <span key={hour}>
              {pad2(hour)}:00
            </span>
          ))}
        </div>

        <div className="relative h-9 rounded-md overflow-visible bg-paper border border-line">
          {releasePercentage !== null && (
            <div
              className="absolute top-0 h-full rounded-l-md bg-brand-green-tint"
              style={{
                left: 0,
                width: `${releasePercentage}%`,
              }}
            />
          )}

          <div
            className="absolute top-1.5 h-6 rounded-sm bg-brand-green"
            style={{
              left: `${unloadStartPercentage}%`,
              width: `${unloadingWidth}%`,
            }}
            title={vessel.name}
          />

          {releasePercentage !== null && (
            <div
              className="absolute -top-1"
              style={{
                left: `${releasePercentage}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="h-11 w-px bg-ink-soft" />
            </div>
          )}

          {nextArrivalPercentage !== null && (
            <div
              className="absolute -top-1"
              style={{
                left: `${nextArrivalPercentage}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="h-11 w-0 border-l-2 border-dashed border-teal" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-green" />
            {vessel.name} (unloading)
          </span>

          {releasePercentage !== null &&
            prediction.berthRelease && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-ink-soft" />
                Expected release{" "}
                {fmtTime(prediction.berthRelease)}
              </span>
            )}

          {nextArrivalPercentage !== null &&
            riskInfo.nextEta && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-0.5 border-l-2 border-dashed border-teal" />
                {riskInfo.nextVessel?.name || "Next vessel"}{" "}
                ETA {fmtTime(riskInfo.nextEta)}
              </span>
            )}
        </div>

        {riskInfo.risk === "conflict" && (
          <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 text-danger">
            <AlertTriangle size={13} />
            Potential {riskInfo.overlapMin} min overlap
          </div>
        )}
      </div>
    </Card>
  );
}