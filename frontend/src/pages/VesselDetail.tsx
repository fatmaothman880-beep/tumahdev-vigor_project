import { useState } from "react";
import OperationalChecklist from "../components/ui/OperationalChecklist";
import { ArrowLeft, Pencil } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { OperationalModel } from "../hooks/useOperationalModel";
import type { Page } from "../App";
import type { AddDelayInput, AddReadingInput } from "../mock/mockServices";
import type { RateUnit } from "../types";
import { berthRiskFor } from "../lib/prediction";
import { fmtFullDateTime, fmtT, fmtTime, minutesBetween } from "../lib/format";
import { Card, SectionHeader } from "../components/ui/Layout";
import { ErrorState } from "../components/ui/States";
import StatusBadge from "../components/ui/StatusBadge";
import DataQualityBadge from "../components/ui/DataQualityBadge";
import { RiskPanel } from "../components/ui/RiskBadge";
import { RateUnitToggle, RateValue } from "../components/ui/RateValue";
import DualProgress from "../components/ui/DualProgress";
import BerthRisk from "../components/ui/BerthRisk";
import BerthTimeline from "../components/ui/BerthTimeline";
import { Modal } from "../components/ui/Feedback";
import ReadingForm from "../components/ui/ReadingForm";
import DelayForm from "../components/ui/DelayForm";

function ScheduleField({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "muted" | "highlight" }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm tabular-nums ${tone === "highlight" ? "font-bold text-ink" : tone === "muted" ? "text-gray-400" : "text-ink"}`}>{value}</div>
    </div>
  );
}

export default function VesselDetail({
  data,
  model,
  rateUnit,
  setRateUnit,
  vesselId,
  go,
  back,
  onAddReading,
  onAddDelay,
  onComplete,
}: {
  data: AppData;
  model: OperationalModel;
  rateUnit: RateUnit;
  setRateUnit: (u: RateUnit) => void;
  vesselId: string | number;
  go: (p: Page, vesselId?: string | number) => void;
  back: () => void;
  onAddReading: (vesselId: string | number, input: AddReadingInput) => void | Promise<void>;
  onAddDelay: (vesselId: string | number, input: AddDelayInput) => void | Promise<void>;
  onComplete: (vesselId: string | number) => void;
}) {
  const [modal, setModal] = useState<null | "reading" | "delay">(null);
  const { vessels, readings, delays, events, berths } = data;
  const vessel = vessels.find((v) => v.id === vesselId);
  if (!vessel) return <ErrorState onRetry={back} />;

  const berth = berths.find((b) => b.id === vessel.berthId);
  const pred = model.predictions[vessel.id];
  const risk = model.risks[vessel.id];
  const timeProgress = model.timeProgress[vessel.id];
  const isActive = vessel.status === "Unloading" || vessel.status === "Berthed";
  const isEditable = vessel.status === "Planned" || vessel.status === "Arrived";
  const vesselDelays = delays[vessel.id] || [];
  const vesselReadings = readings[vessel.id] || [];

  return (
    <div>
      <button onClick={back} className="inline-flex items-center gap-1.5 text-sm font-semibold mb-3 text-teal">
        <ArrowLeft size={15} /> Back to vessels
      </button>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-ink">{vessel.name}</h2>
            <StatusBadge status={vessel.status} />
          </div>
          <div className="text-sm mt-1 text-gray-500">
            {vessel.reference} · {vessel.cargo} · {berth?.name || vessel.berthId}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isEditable && (
            <button onClick={() => go("vessel-edit", vessel.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
              <Pencil size={14} /> Edit
            </button>
          )}
          {isActive && (
            <button onClick={() => setModal("reading")} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors">
              Add reading
            </button>
          )}
          {isActive && (
            <button onClick={() => setModal("delay")} className="rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
              Confirm delay
            </button>
          )}
          {isActive && (
            <button onClick={() => onComplete(vessel.id)} className="rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors">
              Complete visit
            </button>
          )}
          {(vessel.status === "Completed" || vessel.status === "Cancelled") && (
            <button onClick={() => go("report", vessel.id)} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-ink hover:bg-ink/90 transition-colors">
              View report
            </button>
          )}
        </div>
      </div>

      <OperationalChecklist key={String(vessel.id)} visitId={vessel.id} readOnly={vessel.status === "Cancelled"} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Progress */}
          {(isActive || vessel.status === "Completed") && (
            <Card className="p-5">
              <SectionHeader
                title="Progress"
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">Rate unit</span>
                    <RateUnitToggle unit={rateUnit} onChange={setRateUnit} />
                  </div>
                }
              />
              {vessel.status === "Completed" ? (
                <div className="text-sm text-ink-soft">Unloading completed — 100% of {fmtT(vessel.cargoTotalT)} unloaded.</div>
              ) : (
                <DualProgress cargo={pred} time={timeProgress} cargoTotalT={vessel.cargoTotalT} />
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-line">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-gray-500">Unloading rate</div>
                  <div className="mt-0.5">
                    <RateValue rateTph={pred.effectiveRateTph} unit={rateUnit} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-gray-500">Data quality</div>
                  <div className="mt-0.5">
                    <DataQualityBadge quality={isActive ? pred.dataQuality : "current"} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase text-gray-500">Estimated completion</div>
                  <div className="font-bold mt-0.5 text-ink text-sm">
                    {vessel.status === "Completed" ? fmtTime(vessel.unloadFinish) : pred.etaAvailable ? fmtTime(pred.eta) : "Estimate unavailable"}
                  </div>
                </div>
              </div>
              {isActive && !pred.etaAvailable && (
                <div className="mt-3 text-xs rounded-lg px-3 py-2 bg-amber-tint text-[#7A5309]">Estimate unavailable — valid unloading rate required.</div>
              )}
            </Card>
          )}

          {/* Risk */}
          {vessel.status !== "Cancelled" && (
            <Card className="p-5">
              <SectionHeader title="Operational risk" sub="Automatically assessed from schedule and current readings" />
              <RiskPanel risk={risk} />
            </Card>
          )}

          {/* Schedule */}
          <Card className="p-5">
            <SectionHeader title="Schedule" sub="Planned vs. actual vs. forecast" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ScheduleField label="Registered" value={fmtFullDateTime(vessel.registeredAt)} tone="muted" />
              <ScheduleField label="Expected arrival" value={fmtFullDateTime(vessel.etaOverride || vessel.plannedArrival)} />
              <ScheduleField label="Actual arrival" value={vessel.actualArrival ? fmtFullDateTime(vessel.actualArrival) : "Not yet arrived"} tone={vessel.actualArrival ? "default" : "muted"} />
              <ScheduleField label="Planned unloading start" value={fmtFullDateTime(vessel.plannedUnloadStart)} />
              <ScheduleField label="Actual unloading start" value={vessel.unloadStart ? fmtFullDateTime(vessel.unloadStart) : "Not started"} tone={vessel.unloadStart ? "default" : "muted"} />
              <ScheduleField label="Planned completion" value={fmtFullDateTime(vessel.plannedCompletion)} />
              <ScheduleField
                label={vessel.status === "Completed" ? "Actual completion" : "Current forecast"}
                value={vessel.status === "Completed" ? fmtFullDateTime(vessel.unloadFinish) : pred?.etaAvailable ? fmtFullDateTime(pred.eta) : "Unavailable"}
                tone="highlight"
              />
              {vessel.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <div className="text-[11px] font-semibold uppercase text-gray-500">Notes</div>
                  <div className="mt-0.5 text-sm text-ink-soft">{vessel.notes}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Readings log */}
          <Card className="p-5">
            <SectionHeader title="Readings log" sub={`${vesselReadings.length} recorded readings`} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-left font-bold uppercase tracking-wide text-gray-500 border-b border-line">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3 text-right">Unloaded</th>
                    <th className="py-2 pr-3 text-right">Remaining</th>
                    <th className="py-2 pr-3 text-right">Rate</th>
                    <th className="py-2">Notes</th>
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
                        <td className="py-2 pr-3 text-right tabular-nums text-ink-soft">{r.observedRateTph > 0 ? <RateValue rateTph={r.observedRateTph} unit={rateUnit} size="sm" /> : "—"}</td>
                        <td className="py-2 text-ink-soft">{r.notes || "—"}</td>
                      </tr>
                    ))}
                  {vesselReadings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-500">
                        No readings recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Confirmed delays */}
          <Card className="p-5">
            <SectionHeader title="Confirmed delays" sub={`${vesselDelays.length} recorded`} />
            {vesselDelays.length === 0 ? (
              <div className="text-sm py-3 text-gray-500">No confirmed delays for this vessel visit.</div>
            ) : (
              <div className="space-y-2">
                {vesselDelays.map((d) => (
                  <div key={d.id} className="rounded-lg p-3 flex items-start justify-between gap-3 bg-danger-tint">
                    <div>
                      <div className="text-sm font-semibold text-danger">
                        {d.category}
                        {d.area ? ` · ${d.area}` : ""}
                      </div>
                      <div className="text-xs mt-0.5 text-ink-soft">{d.description}</div>
                    </div>
                    <div className="text-xs text-right shrink-0 tabular-nums text-ink-soft">
                      {fmtTime(d.start)}–{fmtTime(d.end)}
                      <br />
                      {minutesBetween(d.start, d.end)} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {isActive ? (
            <BerthRisk vessel={vessel} prediction={pred} riskInfo={berthRiskFor(vessel, pred, vessels)} berth={berth} />
          ) : (
            <Card className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Berth</div>
              <div className="text-sm font-semibold text-ink">{berth?.name || vessel.berthId}</div>
              <div className="text-xs text-gray-500 mt-0.5">{berth?.notes}</div>
            </Card>
          )}

          <Card className="p-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Operational timeline</div>
            {(events[vessel.id] || []).length === 0 ? (
              <div className="text-sm py-4 text-center text-gray-500">No operational events recorded yet.</div>
            ) : (
              <ol className="relative ml-2 border-l border-line">
                {[...(events[vessel.id] || [])]
                  .sort((a, b) => b.time.getTime() - a.time.getTime())
                  .map((ev) => (
                    <li key={ev.id} className="mb-4 ml-4 last:mb-0">
                      <span className="absolute -left-[5px] h-2.5 w-2.5 rounded-full mt-1.5 bg-brand-green" />
                      <div className="text-xs font-semibold tabular-nums text-gray-500">{fmtTime(ev.time)}</div>
                      <div className="text-sm mt-0.5 text-ink">{ev.text}</div>
                    </li>
                  ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {isActive && (
        <div className="mt-4">
          <BerthTimeline vessel={vessel} prediction={pred} riskInfo={berthRiskFor(vessel, pred, vessels)} berthName={berth?.name} />
        </div>
      )}

      {modal === "reading" && (
        <Modal title="Add operational reading" onClose={() => setModal(null)}>
          <ReadingForm
            vessel={vessel}
            onCancel={() => setModal(null)}
            onSave={async (input) => {
              await onAddReading(vessel.id, input);
              setModal(null);
            }}
          />
        </Modal>
      )}
      {modal === "delay" && (
        <Modal title="Confirm delay" onClose={() => setModal(null)}>
          <DelayForm
            onCancel={() => setModal(null)}
            onSave={async (input) => {
              await onAddDelay(vessel.id, input);
              setModal(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
