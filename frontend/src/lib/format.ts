export const fmtT = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} t`;
export const fmtTph = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} t/h`;
export const fmtPct = (n: number) => `${n.toFixed(1)}%`;
export const pad2 = (n: number) => String(n).padStart(2, "0");

export const fmtTime = (d: Date | null | undefined) => (d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "—");

export const fmtDateTime = (d: Date | null | undefined) =>
  d
    ? `${pad2(d.getDate())} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}, ${fmtTime(d)}`
    : "—";

export const EAT_LABEL = "EAT (UTC+3)";

export const minutesBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60000);

/** Full date + time, used for schedule fields where the date itself matters (registration, arrival, completion). */
export const fmtFullDateTime = (d: Date | null | undefined) =>
  d ? `${pad2(d.getDate())} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()} — ${fmtTime(d)}` : "—";

export const fmtDateOnly = (d: Date | null | undefined) =>
  d ? `${pad2(d.getDate())} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}` : "—";

/** "4h 15m" / "45m" / "—" style duration formatting for delays, projected slippage, elapsed/remaining time. */
export function fmtDuration(totalMin: number | null | undefined): string {
  if (totalMin === null || totalMin === undefined || Number.isNaN(totalMin)) return "—";
  const sign = totalMin < 0 ? "-" : "";
  const abs = Math.round(Math.abs(totalMin));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/** Relative "in 45m" / "12m ago" phrasing used in alerts and overdue banners. */
export function fmtRelative(target: Date, now: Date): string {
  const diffMin = minutesBetween(now, target);
  if (diffMin === 0) return "now";
  if (diffMin > 0) return `in ${fmtDuration(diffMin)}`;
  return `${fmtDuration(-diffMin)} ago`;
}

/** Converts a Date to the "YYYY-MM-DDTHH:MM" value an <input type="datetime-local"> expects, in local time. */
export function toDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const h = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${y}-${mo}-${da}T${h}:${mi}`;
}
