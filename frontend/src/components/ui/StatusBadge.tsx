import type { VesselStatus } from "../../types";

const MAP: Record<VesselStatus, { bg: string; fg: string; dot: string }> = {
  Planned: { bg: "bg-gray-100", fg: "text-ink-soft", dot: "bg-gray-400" },
  Arrived: { bg: "bg-teal-tint", fg: "text-teal", dot: "bg-teal" },
  Berthed: { bg: "bg-teal-tint", fg: "text-teal", dot: "bg-teal" },
  Unloading: { bg: "bg-brand-green-tint", fg: "text-brand-green-deep", dot: "bg-brand-green" },
  Delayed: { bg: "bg-amber-tint", fg: "text-amber", dot: "bg-amber" },
  Cancelled: { bg: "bg-slate-100", fg: "text-slate-600", dot: "bg-slate-400" },
  Completed: { bg: "bg-gray-100", fg: "text-ink-soft", dot: "bg-ink-soft" },
};

export default function StatusBadge({ status }: { status: VesselStatus }) {
  const s = MAP[status] || MAP.Planned;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${s.bg} ${s.fg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

