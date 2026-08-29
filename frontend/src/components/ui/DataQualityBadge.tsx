import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { DataQuality } from "../../types";

const MAP: Record<DataQuality, { label: string; bg: string; fg: string; Icon: typeof CircleCheck }> = {
  current: { label: "Current data", bg: "bg-brand-green-tint", fg: "text-brand-green-deep", Icon: CircleCheck },
  stale: { label: "Data may be stale", bg: "bg-amber-tint", fg: "text-amber", Icon: CircleAlert },
  insufficient: { label: "Insufficient data", bg: "bg-gray-100", fg: "text-ink-soft", Icon: CircleDashed },
  unavailable: { label: "Data unavailable", bg: "bg-danger-tint", fg: "text-danger", Icon: CircleAlert },
};

export default function DataQualityBadge({ quality }: { quality: DataQuality }) {
  const s = MAP[quality] || MAP.insufficient;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.fg}`}>
      <Icon size={13} strokeWidth={2.25} />
      {s.label}
    </span>
  );
}
