import { History as HistoryIcon } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { Page } from "../App";
import { fmtTime, minutesBetween } from "../lib/format";
import { Card, PageHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";

export default function History({ data, go }: { data: AppData; go: (p: Page, vesselId?: string | number) => void }) {
  const completed = data.vessels.filter((v) => v.status === "Completed");

  return (
    <div>
      <PageHeader eyebrow="Records" title="Completed vessel history" />
      <Card>
        {completed.length === 0 ? (
          <EmptyState title="No completed vessel visits" body="Completed visits will appear here for reporting." Icon={HistoryIcon} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-line">
                  <th className="px-4 py-3">Vessel</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Berth</th>
                  <th className="px-4 py-3">Arrival</th>
                  <th className="px-4 py-3">Completion</th>
                  <th className="px-4 py-3 text-right">Turnaround</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {completed.map((v) => {
                  const turnaroundMin = v.actualArrival && v.unloadFinish ? minutesBetween(v.actualArrival, v.unloadFinish) : null;
                  const berth = data.berths.find(
                    (item) =>
                      String(item.id) === String(v.berthId),
                  );
                  return (
                    <tr key={v.id} className="border-b border-line">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {v.name}
                        <div className="text-[11px] font-normal text-gray-500">{v.reference}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{v.cargo}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {berth?.name || v.berthId}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft">{fmtTime(v.actualArrival)}</td>
                      <td className="px-4 py-3 tabular-nums text-ink-soft">{fmtTime(v.unloadFinish)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">{turnaroundMin ? `${(turnaroundMin / 60).toFixed(1)} h` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => go("report", v.id)} className="text-xs font-semibold text-teal">
                          View report →
                        </button>
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
