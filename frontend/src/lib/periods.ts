export type PeriodKey = "all" | "today" | "week" | "month" | "lastMonth" | "year" | "custom";

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  lastMonth: "Last month",
  year: "This year",
  custom: "Custom range",
};

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = c.getDay(); // 0 = Sunday
  c.setDate(c.getDate() - day);
  return c;
}

/** Returns [start, end) for the given period key relative to `now`, or null for "all"/"custom" (handled by the caller). */
export function periodRange(key: PeriodKey, now: Date, custom?: { from: string; to: string }): [Date, Date] | null {
  switch (key) {
    case "all":
      return null;
    case "today": {
      const start = startOfDay(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return [start, end];
    }
    case "week": {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return [start, end];
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return [start, end];
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return [start, end];
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return [start, end];
    }
    case "custom": {
      if (!custom?.from || !custom?.to) return null;
      const start = new Date(custom.from);
      const end = new Date(custom.to);
      end.setDate(end.getDate() + 1); // inclusive of the "to" day
      return [start, end];
    }
  }
}

export function isWithinPeriod(date: Date | null, key: PeriodKey, now: Date, custom?: { from: string; to: string }): boolean {
  if (key === "all") return true;
  if (!date) return false;
  const range = periodRange(key, now, custom);
  if (!range) return true;
  const [start, end] = range;
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}
