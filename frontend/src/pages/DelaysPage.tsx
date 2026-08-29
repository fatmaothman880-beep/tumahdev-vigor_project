import { Wrench } from "lucide-react";
import type { AppData } from "../hooks/useAppData";
import type { DelayEvent, VesselVisit } from "../types";
import { fmtTime, minutesBetween } from "../lib/format";
import { Card, PageHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";

export default function DelaysPage({ data, openVessel }: { data: AppData; openVessel: (id: string | number) => void }) {
  const { vessels, delays } = data;
  const all: (DelayEvent & { vessel?: VesselVisit })[] = [];
  Object.entries(delays).forEach(([vid, list]) => {
    const v = vessels.find((x) => x.id === Number(vid));
    list.forEach((d) => all.push({ ...d, vessel: v }));
  });
  all.sort((a, b) => b.start.getTime() - a.start.getTime());

  return (
    <div>
      <PageHeader eyebrow="Monitoring" title="Delays & downtime" />
      <Card>
        {all.length === 0 ? (
          <EmptyState title="No delays recorded" body="Delays logged against vessel visits will appear here." Icon={Wrench} />
        ) : (
          <div className="divide-y divide-line">
            {all.map((d) => (
              <button key={d.id} onClick={() => d.vessel && openVessel(d.vessel.id)} className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-black/[0.02]">
                <div>
                  <div className="font-semibold text-sm text-ink">
                    {d.category}
                    {d.area ? ` · ${d.area}` : ""}
                  </div>
                  <div className="text-xs mt-0.5 text-gray-500">
                    {d.vessel?.name} — {d.description}
                  </div>
                </div>
                <div className="text-xs text-right shrink-0 tabular-nums text-ink-soft">
                  {fmtTime(d.start)}–{fmtTime(d.end)}
                  <br />
                  {minutesBetween(d.start, d.end)} min
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
