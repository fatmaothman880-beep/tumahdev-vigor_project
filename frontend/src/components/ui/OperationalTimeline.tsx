import type { OperationalEvent } from "../../types";
import { fmtTime } from "../../lib/format";
import { Card, SectionHeader } from "./Layout";

export default function OperationalTimeline({ events }: { events?: OperationalEvent[] }) {
  return (
    <Card className="p-4">
      <SectionHeader title="Operational timeline" sub="Recent events for this vessel visit" />
      {!events || events.length === 0 ? (
        <div className="text-sm py-6 text-center text-gray-500">No operational events recorded yet.</div>
      ) : (
        <ol className="relative ml-2 border-l border-line">
          {[...events]
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
  );
}
