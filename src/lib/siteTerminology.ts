/** Migrate legacy labels in browser caches and saved operational documents. */
export function normalizeSiteTerminology<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/tanga/gi, match =>
      match === match.toUpperCase() ? 'MTWARA' : match[0] === match[0].toUpperCase() ? 'Mtwara' : 'mtwara'
    ) as T;
  }
  if (Array.isArray(value)) return value.map(normalizeSiteTerminology) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) =>
      [normalizeSiteTerminology(key), normalizeSiteTerminology(item)]
    )) as T;
  }
  return value;
}
