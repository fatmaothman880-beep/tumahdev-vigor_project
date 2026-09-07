import type { RateUnit } from "../types";

/**
 * Unloading rates are always stored internally in tonnes/hour (t/h) — this
 * keeps every calculation in lib/riskEngine.ts and lib/prediction.ts
 * consistent regardless of which unit the operator prefers to type in.
 * These helpers only convert for display/input purposes.
 */
export const TPH_PER_TPM = 60;

export const tphToTpm = (tph: number) => tph / TPH_PER_TPM;
export const tpmToTph = (tpm: number) => tpm * TPH_PER_TPM;

export function convertToTph(value: number, unit: RateUnit): number {
  return unit === "tpm" ? tpmToTph(value) : value;
}

export function convertFromTph(tph: number, unit: RateUnit): number {
  return unit === "tpm" ? tphToTpm(tph) : tph;
}

export function formatRatePrimary(tph: number, unit: RateUnit): string {
  const value = convertFromTph(tph, unit);
  const label = unit === "tpm" ? "t/min" : "t/h";
  const decimals = unit === "tpm" ? 1 : 0;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: decimals })} ${label}`;
}

/** The secondary "≈" conversion line shown under the primary rate. */
export function formatRateSecondary(tph: number, unit: RateUnit): string {
  const otherUnit: RateUnit = unit === "tpm" ? "tph" : "tpm";
  return `≈ ${formatRatePrimary(tph, otherUnit)}`;
}

export const RATE_UNIT_LABEL: Record<RateUnit, string> = {
  tph: "t/h",
  tpm: "t/min",
};
