import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { Page } from "../App";
import type { AddDelayInput, AddReadingInput } from "../mock/mockServices";
import { computePrediction, berthRiskFor } from "../lib/prediction";
import { fmtPct, fmtT, fmtTime, fmtTph, minutesBetween } from "../lib/format";
import { Card, SectionHeader } from "../components/ui/Layout";
import { ErrorState } from "../components/ui/States";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import BerthRisk from "../components/ui/BerthRisk";
import OperationalTimeline from "../components/ui/OperationalTimeline";
import { Modal } from "../components/ui/Feedback";
import ReadingForm from "../components/ui/ReadingForm";
import DelayForm from "../components/ui/DelayForm";

export default function VesselDetail({
  data,
  vesselId,
  go,
  back,
  onAddReading,
  onAddDelay,
  onComplete,
}: {
  data: AppData;
  vesselId: string | number;
  go: (p: Page, vesselId?: string | number) => void;
  back: () => void;
  onAddReading: (vesselId: string | number, input: AddReadingInput) => void;
  onAddDelay: (vesselId: string | number, input: AddDelayInput) => void;
  onComplete: (vesselId: string | number) => void;
}) {
  const [modal, setModal] = useState<null | "reading" | "delay">(null);
  const { vessels, readings, delays, events, berths } = data;
  const vessel = vessels.find(
    (item) =>
      String(item.id) === String(vesselId),
  );
  if (!vessel) return <ErrorState onRetry={back} />;

  const berth = berths.find(
    (item) =>
      String(item.id) === String(vessel.berthId),
  );
  const now = new Date();
  const pred = computePrediction(vessel, readings, now);
  const risk = berthRiskFor(vessel, pred, vessels);
  const isActive = vessel.status === "Unloading" || vessel.status === "Berthed";
  const vesselDelays = delays[String(vessel.id)] || [];
  const vesselReadings = readings[String(vessel.id)] || [];

  return (
    <div>
      <button onClick={back} className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 text-teal">
        <ArrowLeft size={15} /> Back to vessels
      </button>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">{vessel.name}</h2>
            <StatusBadge status={vessel.status} />
          </div>
          <div className="text-sm mt-1 text-gray-500">
            {vessel.reference} · {vessel.cargo} ·{" "}
            {berth?.name || vessel.berthId}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isActive && (
            <button onClick={() => setModal("reading")} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
              Add reading
            </button>
          )}
          {isActive && (
            <button onClick={() => setModal("delay")} className="rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
              Record delay
            </button>
          )}
          {isActive && (
            <button onClick={() => onComplete(vessel.id)} className="rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
              Complete visit
            </button>
          )}
          {vessel.status === "Completed" && (
            <button onClick={() => go("report", vessel.id)} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-ink hover:bg-ink/90 transition-colors">
              View report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <SectionHeader title="Cargo & performance" />
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm font-semibold text-ink-soft">Progress</span>
              <span className="text-xl font-bold tabular-nums text-brand-green">{vessel.status === "Completed" ? "100.0%" : fmtPct(pred.progressPct)}</span>
            </div>
            <ProgressBar pct={vessel.status === "Completed" ? 100 : pred.progressPct} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Total cargo</div>
              <div className="font-bold mt-0.5 text-ink">{fmtT(vessel.cargoTotalT)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Unloaded</div>
              <div className="font-bold mt-0.5 text-ink">{fmtT(pred.unloadedT)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Remaining</div>
              <div className="font-bold mt-0.5 text-ink">{fmtT(pred.remainingT)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Effective rate</div>
              <div className="font-bold mt-0.5 text-ink">{pred.effectiveRateTph > 0 ? fmtTph(pred.effectiveRateTph) : "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Data quality</div>
              <div className="mt-0.5">
                <DataQualityBadge quality={isActive ? pred.dataQuality : "current"} />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Estimated completion</div>
              <div className="font-bold mt-0.5 text-ink">
                {vessel.status === "Completed" ? fmtTime(vessel.unloadFinish) : pred.etaAvailable ? fmtTime(pred.eta) : "Estimate unavailable"}
              </div>
            </div>
          </div>
          {isActive && !pred.etaAvailable && (
            <div className="mt-3 text-xs rounded-lg px-3 py-2 bg-amber-tint text-[#7A5309]">Estimate unavailable — valid unloading rate required.</div>
          )}

          <div className="mt-5 pt-5 border-t border-line">
            <SectionHeader title="Timing" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Planned arrival</div>
                <div className="mt-0.5 tabular-nums text-ink">{fmtTime(vessel.plannedArrival)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Actual arrival</div>
                <div className="mt-0.5 tabular-nums text-ink">{fmtTime(vessel.actualArrival)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Unload start</div>
                <div className="mt-0.5 tabular-nums text-ink">{fmtTime(vessel.unloadStart)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-gray-500">Unload finish</div>
                <div className="mt-0.5 tabular-nums text-ink">{fmtTime(vessel.unloadFinish)}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-line">
            <SectionHeader title="Readings log" sub={`${vesselReadings.length} recorded readings`} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="text-left font-bold uppercase tracking-wide text-gray-500 border-b border-line">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3 text-right">Unloaded</th>
                    <th className="py-2 pr-3 text-right">Remaining</th>
                    <th className="py-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vesselReadings
                    .slice()
                    .reverse()
                    .map((r) => (
                      <tr key={r.id} className="border-b border-line">
                        <td className="py-2 pr-3 tabular-nums text-ink-soft">{fmtTime(r.timestamp)}</td>
                        <td className="py-2 pr-3 text-ink-soft">{r.source}</td>
                        <td className="py-2 pr-3 text-right tabular-nums font-medium text-ink">{fmtT(r.unloadedT)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-ink-soft">{fmtT(r.remainingT)}</td>
                        <td className="py-2 text-right tabular-nums text-ink-soft">{r.observedRateTph > 0 ? fmtTph(r.observedRateTph) : "—"}</td>
                      </tr>
                    ))}
                  {vesselReadings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        No readings recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-line">
            <SectionHeader title="Delays" sub={`${vesselDelays.length} recorded delay(s)`} />
            {vesselDelays.length === 0 ? (
              <div className="text-sm py-3 text-gray-500">No delays recorded for this vessel visit.</div>
            ) : (
              <div className="space-y-2">
                {vesselDelays.map((d) => (
                  <div key={d.id} className="rounded-lg p-3 flex items-start justify-between gap-3 bg-amber-tint">
                    <div>
                      <div className="text-sm font-semibold text-[#7A5309]">
                        {d.category}
                        {d.area ? ` · ${d.area}` : ""}
                      </div>
                      <div className="text-xs mt-0.5 text-[#7A5309]">{d.description}</div>
                    </div>
                    <div className="text-xs text-right shrink-0 tabular-nums text-[#7A5309]">
                      {fmtTime(d.start)}–{fmtTime(d.end)}
                      <br />
                      {minutesBetween(d.start, d.end)} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <BerthRisk vessel={vessel} prediction={pred} riskInfo={risk} berth={berth} />
          <OperationalTimeline
            events={events[String(vessel.id)] || []}
          />
        </div>
      </div>

      {modal === "reading" && (
        <Modal title="Add operational reading" onClose={() => setModal(null)}>
          <ReadingForm
            vessel={vessel}
            onCancel={() => setModal(null)}
            onSave={(input) => {
              onAddReading(vessel.id, input);
              setModal(null);
            }}
          />
        </Modal>
      )}
      {modal === "delay" && (
        <Modal title="Record delay / downtime" onClose={() => setModal(null)}>
          <DelayForm
            onCancel={() => setModal(null)}
            onSave={(input) => {
              onAddDelay(vessel.id, input);
              setModal(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
