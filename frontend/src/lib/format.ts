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
