export function formatCurrency(amount: number, currency = 'TZS', compact = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currency} 0`;
  }
  if (compact && Math.abs(amount) >= 1_000_000_000) {
    return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `${currency} ${amount.toLocaleString('en-US')}`;
}

export function formatTonnage(tonnes: number, unit = 'tonnes'): string {
  if (isNaN(tonnes) || tonnes === null || tonnes === undefined) {
    return `0 ${unit}`;
  }
  return `${tonnes.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${unit}`;
}

export function formatRate(rateTph: number, unitPreference: 'TPH' | 'TPM' = 'TPH'): string {
  if (!rateTph || isNaN(rateTph) || rateTph <= 0) {
    return 'Rate unavailable';
  }
  if (unitPreference === 'TPM') {
    const tpm = (rateTph / 60).toFixed(2);
    return `${tpm} t/min`;
  }
  return `${Math.round(rateTph)} t/h`;
}

export function formatDate(isoString?: string): string {
  if (!isoString) return 'Unavailable';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(isoString?: string): string {
  if (!isoString) return 'Unavailable';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Unavailable';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Unavailable';
  return `${date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })} ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
}

export function formatHoursAndMinutes(hoursDecimal: number): string {
  if (isNaN(hoursDecimal) || hoursDecimal <= 0) return '0m';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatRelativeTime(targetIso: string, currentIso = new Date().toISOString()): string {
  const target = new Date(targetIso).getTime();
  const current = new Date(currentIso).getTime();
  const diffMs = target - current;
  const isPast = diffMs < 0;
  const absDiffHours = Math.abs(diffMs) / (1000 * 60 * 60);

  const durationStr = formatHoursAndMinutes(absDiffHours);
  if (isPast) {
    return `${durationStr} ago`;
  }
  return `in ${durationStr}`;
}
