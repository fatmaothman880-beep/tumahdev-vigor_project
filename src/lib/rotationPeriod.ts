export type RotationPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL' | 'CUSTOM';

// Calendar boundaries in East Africa Time, independent of the browser timezone.
export function rotationInPeriod(start: string, period: RotationPeriod, now = new Date(), from = '', to = ''): boolean {
  if (period === 'ALL') return true;
  const stamp = new Date(start).getTime();
  if (!Number.isFinite(stamp)) return false;
  const eat = new Date(now.getTime() + 3 * 3600000);
  const year = eat.getUTCFullYear(), month = eat.getUTCMonth(), day = eat.getUTCDate();
  let lower = Date.UTC(year, month, day), upper = lower + 86400000;
  if (period === 'WEEK') {
    lower -= ((eat.getUTCDay() + 6) % 7) * 86400000;
    upper = lower + 7 * 86400000;
  } else if (period === 'MONTH') {
    lower = Date.UTC(year, month, 1); upper = Date.UTC(year, month + 1, 1);
  } else if (period === 'YEAR') {
    lower = Date.UTC(year, 0, 1); upper = Date.UTC(year + 1, 0, 1);
  } else if (period === 'CUSTOM') {
    if (!from || !to || from > to) return false;
    lower = Date.parse(`${from}T00:00:00Z`); upper = Date.parse(`${to}T00:00:00Z`) + 86400000;
  }
  return stamp >= lower - 3 * 3600000 && stamp < upper - 3 * 3600000;
}
