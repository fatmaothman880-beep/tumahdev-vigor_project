import { ArrowLeft, Printer } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import { fmtDateTime, fmtFullDateTime, fmtT, fmtTph, minutesBetween } from "../lib/format";
import { Card } from "../components/ui/Layout";
import { ErrorState } from "../components/ui/States";
import StatusBadge from "../components/ui/StatusBadge";

export default function VesselReport({ data, vesselId, back }: { data: AppData; vesselId: number; back: () => void }) {
  const { vessels, delays } = data;
  const vessel = vessels.find((v) => v.id === vesselId);
  if (!vessel) return <ErrorState onRetry={back} />;

  const vesselDelays = delays[vessel.id] || [];
  const totalDelayMin = vesselDelays.reduce((s, d) => s + minutesBetween(d.start, d.end), 0);
  const turnaroundMin = vessel.actualArrival && vessel.unloadFinish ? minutesBetween(vessel.actualArrival, vessel.unloadFinish) : null;
  const unloadMin = vessel.unloadStart && vessel.unloadFinish ? minutesBetween(vessel.unloadStart, vessel.unloadFinish) : null;
  const finalRate = unloadMin ? Math.round(vessel.cargoTotalT / (unloadMin / 60)) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print-hide">
        <button onClick={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
          <ArrowLeft size={15} /> Back
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-ink hover:bg-ink/90 transition-colors">
          <Printer size={15} /> Print / export
        </button>
      </div>
      <Card className="p-6 sm:p-8" >
        <div id="report">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-3">
            <img src="/assets/vigor-emblem.png" className="h-10 w-10" alt="Vigor Cement Works" />
            <div>
              <div className="font-bold text-ink">VIGOR CEMENT WORKS</div>
              <div className="text-[11px] text-gray-500">Turky&rsquo;s Group of Companies — Zanzibar</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal">Vessel summary report</div>
            <div className="text-[11px] text-gray-500">Generated {fmtDateTime(new Date())} EAT (UTC+3)</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-1 text-ink">{vessel.name}</h2>
        <div className="text-sm mb-6 text-gray-500 flex items-center gap-2">
          {vessel.reference} · {vessel.cargo} · Berth {vessel.berthId} · <StatusBadge status={vessel.status} />
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2 text-gray-500">Timing — planned vs actual</div>
            <div className="text-sm space-y-1 text-ink">
              <div className="flex justify-between">
                <span className="text-gray-500">Planned arrival</span>
                <span className="tabular-nums">{fmtFullDateTime(vessel.plannedArrival)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual arrival</span>
                <span className="tabular-nums">{fmtFullDateTime(vessel.actualArrival)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unload start</span>
                <span className="tabular-nums">{fmtFullDateTime(vessel.unloadStart)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unload finish</span>
                <span className="tabular-nums">{fmtFullDateTime(vessel.unloadFinish)}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2 text-gray-500">Unloading performance</div>
            <div className="text-sm space-y-1 text-ink">
              <div className="flex justify-between">
                <span className="text-gray-500">Total cargo</span>
                <span className="tabular-nums">{fmtT(vessel.cargoTotalT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unload duration</span>
                <span className="tabular-nums">{unloadMin ? `${(unloadMin / 60).toFixed(1)} h` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Final average rate</span>
                <span className="tabular-nums">{finalRate ? fmtTph(finalRate) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total turnaround</span>
                <span className="tabular-nums">{turnaroundMin ? `${(turnaroundMin / 60).toFixed(1)} h` : "—"}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2 text-gray-500">Delay summary</div>
            <div className="text-sm space-y-1 text-ink">
              <div className="flex justify-between">
                <span className="text-gray-500">Delay events</span>
                <span className="tabular-nums">{vesselDelays.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total delay time</span>
                <span className="tabular-nums">{totalDelayMin} min</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2 text-gray-500">Recorded delays</div>
          {vesselDelays.length === 0 ? (
            <div className="text-sm text-gray-500">No delays recorded for this vessel visit.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase text-gray-500 border-b border-line">
                  <th className="py-1.5 pr-3">Category</th>
                  <th className="py-1.5 pr-3">Area</th>
                  <th className="py-1.5 pr-3">Description</th>
                  <th className="py-1.5 text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {vesselDelays.map((d) => (
                  <tr key={d.id} className="border-b border-line">
                    <td className="py-1.5 pr-3">{d.category}</td>
                    <td className="py-1.5 pr-3">{d.area || "—"}</td>
                    <td className="py-1.5 pr-3">{d.description}</td>
                    <td className="py-1.5 text-right tabular-nums">{minutesBetween(d.start, d.end)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-[11px] mt-6 pt-4 border-t border-line text-gray-500">
          Illustrative data — Smart Port Operations MVP-1. Decision-support prototype; not a record of automated machinery control.
        </div>
        </div>
      </Card>
    </div>
  );
}
