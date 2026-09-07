import { useEffect, useState } from "react";

/**
 * Returns a Date that updates on an interval so time-based UI (elapsed/
 * remaining operational time, progress bars, overdue banners, alerts)
 * recalculates continuously while the app stays open — no page refresh
 * required. Defaults to once per minute per the brief; pass a shorter
 * interval for a visibly smoother progress bar where that adds value.
 */
export function useLiveClock(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
