import { useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { Page } from "../App";
import { fmtFullDateTime, fmtTime, minutesBetween } from "../lib/format";
import { PERIOD_LABEL, isWithinPeriod, type PeriodKey } from "../lib/periods";
import { Card, PageHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import StatusBadge from "../components/ui/StatusBadge";

const PERIODS: PeriodKey[] = ["all", "today", "week", "month", "lastMonth", "year"];

export default function History({ data, now, go }: { data: AppData; now: Date; go: (p: Page, vesselId?: string | number) => void }) {
  const [period, setPeriod] = useState<PeriodKey>("all");
  const finished = data.vessels
    .filter((v) => v.status === "Completed" || v.status === "Cancelled")
    .filter((v) => isWithinPeriod(v.registeredAt, period, now))
    .sort((a, b) => (b.registeredAt?.getTime() ?? 0) - (a.registeredAt?.getTime() ?? 0));

  return (
    <div>
      <PageHeader
        eyebrow="Records"
        title="Vessel history"
        action={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="rounded-lg px-3 py-2 text-sm outline-none bg-paper border border-line text-ink-soft font-medium"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABEL[p]}
              </option>
            ))}
          </select>
        }
      />
      <Card>
        {finished.length === 0 ? (
          <EmptyState title="No visits in this period" body="Completed or cancelled visits will appear here for reporting." Icon={HistoryIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-line">
                  <th className="px-4 py-3">Vessel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Arrival</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3 text-right">Turnaround</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {finished.map((v) => {
                  const turnaroundMin = v.actualArrival && v.unloadFinish ? minutesBetween(v.actualArrival, v.unloadFinish) : null;
                  return (
                    <tr key={v.id} className="border-b border-line">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {v.name}
                        <div className="text-[11px] font-normal text-gray-500">{v.reference}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft text-xs">{fmtFullDateTime(v.registeredAt)}</td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft">{fmtTime(v.actualArrival)}</td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft">{fmtTime(v.unloadFinish)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{turnaroundMin ? `${(turnaroundMin / 60).toFixed(1)} h` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {v.status === "Completed" && (
                          <button onClick={() => go("report", v.id)} className="text-xs font-semibold text-teal">
                            View report →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
