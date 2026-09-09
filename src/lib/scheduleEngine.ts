import {
  Voyage,
  FuelOperation,
  PaymentAccount,
  OperationalReading,
  DelayEvent,
  SystemSettings,
  CurrentBlocker,
  OperationsHealth,
  OperationalRisk,
} from '../types';

export interface UnloadingForecast {
  remainingTonnes: number;
  remainingHours: number;
  cargoProgressPercent: number;
  scheduleProgressPercent: number;
  forecastUnloadEnd: string;
  expectedBerthRelease: string;
  isAvailable: boolean;
  unavailabilityReason?: string;
}

export function calculateUnloadingForecast(
  voyage: Voyage,
  latestReading?: OperationalReading,
  postUnloadBufferHours = 1.5
): UnloadingForecast {
  const cargoTotal = voyage.actualCargoT || voyage.plannedCargoT || 9600;
  const unloaded = latestReading?.unloadedTonnes ?? voyage.unloadedTonnes;
  const rateTph = latestReading?.observedRateTph ?? voyage.unloadingRateTph;

  const remainingTonnes = Math.max(0, cargoTotal - unloaded);
  const cargoProgressPercent =
    cargoTotal > 0 ? Math.min(100, Math.round((unloaded / cargoTotal) * 100)) : 0;

  // Schedule progress
  const plannedStart = new Date(voyage.plannedUnloadStart).getTime();
  const plannedEnd = new Date(voyage.plannedUnloadEnd).getTime();
  const now = new Date().getTime();
  const plannedDuration = Math.max(1, plannedEnd - plannedStart);
  const elapsed = Math.max(0, now - plannedStart);
  const scheduleProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((elapsed / plannedDuration) * 100))
  );

  if (!rateTph || rateTph <= 0) {
    return {
      remainingTonnes,
      remainingHours: 0,
      cargoProgressPercent,
      scheduleProgressPercent,
      forecastUnloadEnd: voyage.forecastUnloadEnd || voyage.plannedUnloadEnd,
      expectedBerthRelease: voyage.expectedBerthRelease,
      isAvailable: false,
      unavailabilityReason: 'Valid unloading rate required for forecast calculation.',
    };
  }

  const remainingHours = remainingTonnes / rateTph;
  const forecastEndMs = now + remainingHours * 3600 * 1000;
  const forecastUnloadEnd = new Date(forecastEndMs).toISOString();
  const berthReleaseMs = forecastEndMs + postUnloadBufferHours * 3600 * 1000;
  const expectedBerthRelease = new Date(berthReleaseMs).toISOString();

  return {
    remainingTonnes,
    remainingHours,
    cargoProgressPercent,
    scheduleProgressPercent,
    forecastUnloadEnd,
    expectedBerthRelease,
    isAvailable: true,
  };
}

export function recalculateVoyageDependencies(
  voyage: Voyage,
  fuelOp?: FuelOperation,
  manufacturerPayment?: PaymentAccount,
  fuelPayment?: PaymentAccount,
  activeDelays: DelayEvent[] = [],
  b01ReleaseTime?: string,
  settings?: Partial<SystemSettings>
): Voyage {
  const updated: Voyage = { ...voyage };
  const now = new Date();
  const buffer = settings?.postUnloadBerthBufferHours ?? 1.5;

  // 1. Unloading forecast
  if (updated.currentStage === 'UNLOADING' || updated.currentStage === 'BERTHED_AT_VIGOR') {
    const forecast = calculateUnloadingForecast(updated, undefined, buffer);
    if (forecast.isAvailable) {
      updated.forecastUnloadEnd = forecast.forecastUnloadEnd;
      updated.expectedBerthRelease = forecast.expectedBerthRelease;
    }
  }

  // 2. Fuel schedule dependency
  if (updated.fuelRequired && fuelOp) {
    const unloadFinished = updated.actualUnloadEnd || updated.forecastUnloadEnd;
    const earliestFuelStart = new Date(
      new Date(unloadFinished).getTime() + 0.5 * 3600000
    ).toISOString();

    if (new Date(fuelOp.scheduledStart).getTime() < new Date(earliestFuelStart).getTime()) {
      fuelOp.scheduledStart = earliestFuelStart;
      fuelOp.scheduledEnd = new Date(
        new Date(earliestFuelStart).getTime() + 4 * 3600000
      ).toISOString();
    }

    // Departure depends on fuel completion
    const fuelFinish = fuelOp.actualEnd || fuelOp.scheduledEnd;
    updated.outboundDepartureForecast = new Date(
      new Date(fuelFinish).getTime() + 1 * 3600000
    ).toISOString();
  }

  // 3. Outbound sailing & Manufacturer ETA
  if (updated.currentStage === 'SAILING_TO_MANUFACTURER') {
    // If sailing, manufacturer ETA is driven by distance & speed
    // Default Zanzibar to Tanga route is ~115 NM at 11 knots = ~10.5 hours
  }

  // 4. Check Payment Eligibility Gate for Manufacturer
  const isEligible = manufacturerPayment?.isEligible ?? true;
  if (!isEligible && manufacturerPayment) {
    // If not eligible, predicted slot cannot start before payment deadline + 4h processing
    const paymentDeadlineMs = new Date(manufacturerPayment.deadline).getTime();
    const minSlotMs = paymentDeadlineMs + 4 * 3600000;
    const currentSlotMs = new Date(updated.manufacturerSlotForecast).getTime();
    if (currentSlotMs < minSlotMs) {
      updated.manufacturerSlotForecast = new Date(minSlotMs).toISOString();
      updated.manufacturerLoadingEndForecast = new Date(minSlotMs + 12 * 3600000).toISOString();
      updated.manufacturerDepartureForecast = new Date(minSlotMs + 14 * 3600000).toISOString();
      // Return ETA shifted as well!
      updated.returnEtaForecast = new Date(minSlotMs + 25 * 3600000).toISOString();
    }
  }

  // 5. Check Berth Conflict against B01 Release
  if (
    b01ReleaseTime &&
    (updated.currentStage === 'RETURNING_TO_VIGOR' ||
      updated.currentStage === 'WAITING_FOR_VIGOR_BERTH' ||
      updated.currentStage === 'APPROACHING_VIGOR')
  ) {
    const etaMs = new Date(updated.returnEtaForecast).getTime();
    const releaseMs = new Date(b01ReleaseTime).getTime();

    if (etaMs < releaseMs) {
      const waitHours = Math.max(0, (releaseMs - etaMs) / (1000 * 60 * 60));
      updated.berthConflict = true;
      updated.predictedAnchorageWaitHours = Number(waitHours.toFixed(1));
      updated.conflictNotes = `Predicted arrival is ${waitHours.toFixed(1)}h before Berth B01 release. Designated anchorage wait predicted.`;
    } else {
      updated.berthConflict = false;
      updated.predictedAnchorageWaitHours = 0;
      updated.conflictNotes = undefined;
    }
  }

  // 6. Determine Critical Path / Current Blocker
  let blocker: CurrentBlocker = 'NONE';
  let blockerDesc = 'Operations proceeding normally';

  const hasActiveDelays = activeDelays.some((d) => !d.resolved && d.voyageId === updated.id);

  if (updated.berthConflict && (updated.currentStage === 'RETURNING_TO_VIGOR' || updated.currentStage === 'WAITING_FOR_VIGOR_BERTH')) {
    blocker = 'VIGOR_BERTH';
    blockerDesc = `Waiting on Berth B01 release (approx. ${updated.predictedAnchorageWaitHours}h wait)`;
  } else if (manufacturerPayment && !manufacturerPayment.isEligible && updated.currentStage !== 'COMPLETED') {
    blocker = 'MANUFACTURER_PAYMENT';
    blockerDesc = `Manufacturer payment incomplete. Threshold not met for queue eligibility.`;
  } else if (fuelPayment && fuelPayment.status !== 'PAID' && updated.currentStage === 'WAITING_FOR_FUEL') {
    blocker = 'FUEL_PAYMENT';
    blockerDesc = `Fuel payment pending before bunkering authorization.`;
  } else if (updated.currentStage === 'WAITING_FOR_FUEL') {
    blocker = 'FUEL_SCHEDULE';
    blockerDesc = `Awaiting bunker barge connection and fueling start.`;
  } else if (updated.currentStage === 'UNLOADING' && hasActiveDelays) {
    blocker = 'UNLOADING';
    blockerDesc = `Active unloading delay recorded.`;
  } else if (updated.currentStage === 'WAITING_AT_MANUFACTURER') {
    blocker = 'MANUFACTURER_QUEUE';
    blockerDesc = `Awaiting manufacturer berth assignment slot.`;
  } else if (updated.currentStage === 'LOADING' && hasActiveDelays) {
    blocker = 'LOADING';
    blockerDesc = `Active loading delay recorded at manufacturer.`;
  }

  updated.currentBlocker = blocker;
  updated.blockerDescription = blockerDesc;

  // 7. Operations Health
  let health: OperationsHealth = 'READY';
  if (hasActiveDelays) {
    health = 'DELAYED';
  } else if (blocker === 'MANUFACTURER_PAYMENT' || blocker === 'VIGOR_BERTH' || updated.berthConflict) {
    health = 'AT_RISK';
  } else if (blocker === 'FUEL_PAYMENT' || blocker === 'MANUFACTURER_QUEUE') {
    health = 'BLOCKED';
  }
  updated.health = health;

  // 8. Operational Risk
  let risk: OperationalRisk = 'ON_TRACK';
  if (hasActiveDelays) {
    risk = 'DELAYED';
  } else if (health === 'AT_RISK' || health === 'BLOCKED') {
    risk = 'AT_RISK';
  }
  updated.risk = risk;

  return updated;
}
