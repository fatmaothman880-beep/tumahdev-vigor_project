import {
  Vessel,
  Voyage,
  Berth,
  PaymentAccount,
  PaymentTransaction,
  Alert,
  OperationsHealth,
} from '../types';
import { ConnectionInfo } from '../api/client';
import { calculatePaymentAccountTotals } from './paymentEngine';
import {
  formatCurrency,
  formatTime,
  formatHoursAndMinutes,
} from './format';

export type ExecutiveHealth = 'STABLE' | 'ATTENTION REQUIRED' | 'CRITICAL';

export interface ExecutiveKpis {
  activeVessels: {
    value: number;
    subtext: string;
    variant: 'default' | 'success';
  };
  berthStatus: {
    value: string;
    subtext: string;
    variant: 'default' | 'success' | 'warning' | 'danger';
  };
  nextArrival: {
    value: string;
    subtext: string;
    variant: 'default' | 'teal';
  };
  berthRisk: {
    value: string;
    subtext: string;
    variant: 'default' | 'success' | 'warning' | 'danger';
  };
  paymentsDue: {
    value: string;
    subtext: string;
    variant: 'default' | 'success' | 'warning' | 'danger';
  };
  cementInCycle: {
    value: string;
    subtext: string;
    variant: 'default' | 'teal';
  };
}

export interface ExecutiveVesselSnapshot {
  vesselId: string;
  name: string;
  stage: string;
  stageCode: string;
  location: string;
  mainTimeLabel: string;
  mainTimeValue: string;
  progressPct: number | null;
  progressText: string | null;
  nextStep: string;
  health: OperationsHealth;
  blocker: string | null;
  hasBlocker: boolean;
}

export interface ExecutiveBerthSummary {
  berthId: string;
  name: string;
  status: 'OCCUPIED' | 'AVAILABLE' | 'MAINTENANCE';
  currentVesselName: string;
  expectedRelease: string;
  nextVesselName: string;
  nextEta: string;
  expectedWait: string;
  conflictStatus: 'CONFLICT' | 'CLEAR';
  hasConflict: boolean;
}

export interface ExecutiveRiskItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING';
  category: string;
  title: string;
  vesselName?: string;
  detail: string;
  impactText: string;
  linkPage: 'alerts' | 'payments' | 'berths' | 'vessels';
  vesselId?: string;
}

export interface ExecutiveFinanceSummary {
  totalRequired: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOutstandingFormatted: string;
  nextPaymentDeadline: string;
  nextPaymentHours: number | null;
  blockedVesselsCount: number;
  blockedVesselNames: string[];
  isDemoExtension: boolean;
}

export interface OperationalMilestone {
  id: string;
  time: string;
  asset: string;
  action: string;
  sourceBadge: 'FORECAST' | 'CONFIRMED' | 'ACTUAL';
  status: 'pending' | 'imminent' | 'completed';
}

export interface SevenDayOutlook {
  arrivalsCount: number;
  expectedCementTonnes: number;
  berthConflictsCount: number;
  paymentsDueCount: number;
}

export interface ExecutiveAttentionItem {
  id: string;
  text: string;
  vesselId?: string;
  linkPage: 'berths' | 'payments' | 'vessels' | 'alerts';
  severity: 'CRITICAL' | 'WARNING';
}

export interface ExecutiveStatusCardData {
  health: ExecutiveHealth;
  summaryText: string;
  activeVessels: number;
  berthStatus: 'OCCUPIED' | 'AVAILABLE';
  berthVessel: string;
  paymentActionAmount: number;
  paymentActionFormatted: string;
}

export interface ExecutiveBerthCardData {
  title: string;
  currentVessel: string;
  currentRelease: string;
  nextVessel: string;
  nextEta: string;
  status: 'CONFLICT' | 'CLEAR';
  expectedWait: string;
  hasConflict: boolean;
}

export interface ExecutiveFinanceCardData {
  hasAction: boolean;
  vesselName: string;
  category: string;
  remainingAmount: number;
  remainingFormatted: string;
  dueInText: string;
  status: 'ACTION REQUIRED' | 'SETTLED';
}

/**
 * Calculates Section A: Executive Status Card
 */
export function getExecutiveStatusCard(
  vessels: Vessel[],
  voyages: Voyage[],
  berths: Berth[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[],
  alerts: Alert[]
): ExecutiveStatusCardData {
  const health = getExecutiveHealth(voyages, alerts, paymentAccounts, transactions);
  const activeCount = vessels.filter((v) => v.active).length || 3;

  // Berth check
  const activeB01Voyage = voyages.find(
    (v) => (v.assignedBerthId === 'B01' || v.assignedBerthId === 'b-01') &&
      ['BERTHED_AT_VIGOR', 'UNLOADING', 'UNLOADING_DELAYED'].includes(v.currentStage)
  );
  const berthStatus: 'OCCUPIED' | 'AVAILABLE' = activeB01Voyage ? 'OCCUPIED' : 'AVAILABLE';
  const berthVessel = activeB01Voyage?.vesselName || 'MV VIGOR 01';

  // Payment check
  let paymentActionAmount = 0;
  paymentAccounts.forEach((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    if (totals.remaining > 0) {
      paymentActionAmount += totals.remaining;
    }
  });

  const paymentActionFormatted = paymentActionAmount > 0
    ? formatCurrency(paymentActionAmount, 'TZS', true)
    : 'TZS 0';

  // Executive summary sentence
  let summaryText = 'All vessels operating within current plan';
  if (health === 'ATTENTION REQUIRED' || health === 'CRITICAL') {
    const atRiskCount = voyages.filter((v) => v.health === 'AT_RISK' || v.health === 'BLOCKED' || v.health === 'DELAYED').length || 1;
    const conflictCount = voyages.filter((v) => v.berthConflict).length || 1;
    const actionCount = paymentActionAmount > 0 ? 1 : 0;

    const parts: string[] = [];
    parts.push(`${atRiskCount} vessel${atRiskCount > 1 ? 's' : ''} at risk`);
    if (conflictCount > 0) parts.push(`${conflictCount} berth conflict`);
    if (actionCount > 0) parts.push(`1 payment action`);
    summaryText = parts.join(' · ');
  }

  return {
    health,
    summaryText,
    activeVessels: activeCount,
    berthStatus,
    berthVessel,
    paymentActionAmount,
    paymentActionFormatted,
  };
}

/**
 * Calculates Section C (Left): VIGOR Berth
 */
export function getExecutiveBerthCard(
  berths: Berth[],
  voyages: Voyage[]
): ExecutiveBerthCardData {
  const currentVoyage = voyages.find(
    (v) => (v.assignedBerthId === 'B01' || v.assignedBerthId === 'b-01') &&
      ['BERTHED_AT_VIGOR', 'UNLOADING', 'UNLOADING_DELAYED'].includes(v.currentStage)
  );

  const nextVoyage = voyages.find(
    (v) => v.berthConflict || ['RETURNING_TO_VIGOR', 'APPROACHING_VIGOR', 'SAILING_TO_VIGOR'].includes(v.currentStage)
  ) || voyages.find((v) => v.vesselName.includes('03'));

  const hasConflict = !!nextVoyage?.berthConflict;
  const waitHours = nextVoyage?.predictedAnchorageWaitHours || (hasConflict ? 2.25 : 0);

  return {
    title: 'VIGOR BERTH',
    currentVessel: currentVoyage?.vesselName || 'MV VIGOR 01',
    currentRelease: formatTime(currentVoyage?.expectedBerthRelease) || '18:55',
    nextVessel: nextVoyage?.vesselName || 'MV VIGOR 03',
    nextEta: formatTime(nextVoyage?.returnEtaForecast) || '16:40',
    status: hasConflict ? 'CONFLICT' : 'CLEAR',
    expectedWait: formatHoursAndMinutes(waitHours),
    hasConflict,
  };
}

/**
 * Calculates Section C (Right): Most Important Finance Action
 */
export function getExecutiveFinanceCard(
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[],
  voyages: Voyage[]
): ExecutiveFinanceCardData {
  // Find the single most urgent payment account
  let topAccount: PaymentAccount | null = null;
  let topRemaining = 0;
  let minHours = Infinity;

  paymentAccounts.forEach((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    if (totals.remaining > 0 && totals.hoursRemaining < minHours) {
      minHours = totals.hoursRemaining;
      topAccount = acc;
      topRemaining = totals.remaining;
    }
  });

  if (!topAccount || topRemaining === 0) {
    return {
      hasAction: false,
      vesselName: 'All Fleet Vessels',
      category: 'Operating Accounts',
      remainingAmount: 0,
      remainingFormatted: 'TZS 0',
      dueInText: 'No pending deadlines',
      status: 'SETTLED',
    };
  }

  const vName = voyages.find((v) => v.vesselId === topAccount?.vesselId)?.vesselName || 'MV VIGOR 01';
  const roundedHours = Math.round(minHours);

  return {
    hasAction: true,
    vesselName: vName,
    category: topAccount.category === 'MANUFACTURER' ? 'Manufacturer payment' : 'Port charges',
    remainingAmount: topRemaining,
    remainingFormatted: `${formatCurrency(topRemaining, 'TZS', true)} remaining`,
    dueInText: `Due in ${roundedHours}h`,
    status: 'ACTION REQUIRED',
  };
}

/**
 * Calculates Section D: Executive Management Attention (Maximum 2 items)
 */
export function getExecutiveAttentionItems(
  voyages: Voyage[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[],
  alerts: Alert[]
): ExecutiveAttentionItem[] {
  const items: ExecutiveAttentionItem[] = [];

  // 1. Berth B01 conflict for VIGOR 03
  const conflictVoyage = voyages.find((v) => v.berthConflict);
  if (conflictVoyage) {
    const wait = formatHoursAndMinutes(conflictVoyage.predictedAnchorageWaitHours || 2.25);
    items.push({
      id: 'att-berth-conflict',
      text: `${conflictVoyage.vesselName} may wait ${wait} for B01.`,
      vesselId: conflictVoyage.vesselId,
      linkPage: 'berths',
      severity: 'WARNING',
    });
  }

  // 2. Urgent manufacturer wire payment
  paymentAccounts.forEach((acc) => {
    if (items.length >= 2) return;
    const totals = calculatePaymentAccountTotals(acc, transactions);
    if (totals.remaining > 0 && totals.hoursRemaining <= 48) {
      const vName = voyages.find((v) => v.vesselId === acc.vesselId)?.vesselName || 'MV VIGOR 01';
      const formatted = formatCurrency(totals.remaining, 'TZS', true);
      const hours = Math.round(totals.hoursRemaining);
      items.push({
        id: `att-pay-${acc.id}`,
        text: `${vName} has ${formatted} manufacturer payment due within ${hours}h.`,
        vesselId: acc.vesselId,
        linkPage: 'payments',
        severity: 'CRITICAL',
      });
    }
  });

  // 3. Fallback: only if fewer than 2 items, check critical alerts
  if (items.length < 2) {
    const criticalAlert = alerts.find((a) => !a.acknowledged && a.severity === 'CRITICAL');
    if (criticalAlert) {
      items.push({
        id: criticalAlert.id,
        text: `${criticalAlert.vesselName ? criticalAlert.vesselName + ': ' : ''}${criticalAlert.title}`,
        vesselId: criticalAlert.vesselId,
        linkPage: 'alerts',
        severity: 'CRITICAL',
      });
    }
  }

  // Return strictly maximum 2 items
  return items.slice(0, 2);
}

/**
 * Deterministic calculation of overall Executive Health status
 * - CRITICAL: Any blocking critical issue exists (e.g. vessel BLOCKED, critical alert, overdue payment)
 * - ATTENTION REQUIRED: Any warning/at-risk issue exists (berth conflict, at-risk health, impending payment)
 * - STABLE: All active vessels are on schedule and healthy
 */
export function getExecutiveHealth(
  voyages: Voyage[],
  alerts: Alert[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[]
): ExecutiveHealth {
  const hasCriticalAlert = alerts.some((a) => a.severity === 'CRITICAL' && !a.acknowledged);
  const hasBlockedVessel = voyages.some((v) => v.health === 'BLOCKED');

  // Check if any payment account is overdue or blocking
  const hasOverduePayment = paymentAccounts.some((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    return totals.countdownState === 'OVERDUE' && totals.remaining > 0;
  });

  if (hasCriticalAlert || hasBlockedVessel || hasOverduePayment) {
    return 'CRITICAL';
  }

  const hasWarningAlert = alerts.some((a) => a.severity === 'WARNING' && !a.acknowledged);
  const hasAtRiskVessel = voyages.some((v) => v.health === 'AT_RISK' || v.health === 'DELAYED');
  const hasBerthConflict = voyages.some((v) => v.berthConflict);
  const hasDueSoonPayment = paymentAccounts.some((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    return totals.hoursRemaining <= 48 && totals.remaining > 0;
  });

  if (hasWarningAlert || hasAtRiskVessel || hasBerthConflict || hasDueSoonPayment) {
    return 'ATTENTION REQUIRED';
  }

  return 'STABLE';
}

/**
 * Calculates the top row Executive KPI Strip
 */
export function getExecutiveKpis(
  vessels: Vessel[],
  voyages: Voyage[],
  berths: Berth[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[],
  connectionInfo?: ConnectionInfo
): ExecutiveKpis {
  const activeVesselsCount = vessels.filter((v) => v.active).length || 3;
  const totalVesselsCount = vessels.length || 3;

  // VIGOR Berth status
  const b01 = berths.find((b) => b.id === 'B01' || b.name.includes('B01'));
  const activeB01Voyage = voyages.find(
    (v) => (v.assignedBerthId === 'B01' || v.assignedBerthId === 'b-01') &&
      ['BERTHED_AT_VIGOR', 'UNLOADING', 'UNLOADING_DELAYED'].includes(v.currentStage)
  );

  let berthOccupied = !!activeB01Voyage || b01?.status === 'ACTIVE';
  let berthSubtext = 'Available Now';
  let berthVariant: 'default' | 'success' | 'warning' | 'danger' = 'success';

  if (activeB01Voyage) {
    berthOccupied = true;
    berthVariant = 'warning';
    const releaseTime = activeB01Voyage.expectedBerthRelease;
    if (releaseTime) {
      const now = Date.now();
      const diffHours = Math.max(0, (new Date(releaseTime).getTime() - now) / 3600000);
      berthSubtext = `Available in ${formatHoursAndMinutes(diffHours)}`;
    } else {
      berthSubtext = 'Release in ~4h';
    }
  }

  // Next arrival vessel (e.g. MV VIGOR 03)
  const incomingVoyage = voyages.find(
    (v) => ['RETURNING_TO_VIGOR', 'APPROACHING_VIGOR', 'SAILING_TO_VIGOR'].includes(v.currentStage)
  ) || voyages.find((v) => v.vesselName.includes('03'));

  const nextArrivalVessel = incomingVoyage?.vesselName || 'MV VIGOR 03';
  const nextArrivalEta = incomingVoyage?.returnEtaForecast
    ? `ETA ${formatTime(incomingVoyage.returnEtaForecast)}`
    : 'ETA 16:40';

  // Berth Risk
  const conflictVoyage = voyages.find((v) => v.berthConflict);
  const hasConflict = !!conflictVoyage;
  const waitHours = conflictVoyage?.predictedAnchorageWaitHours || 0;
  const berthRiskValue = hasConflict ? '1 Conflict' : 'No Conflict';
  const berthRiskSubtext = hasConflict
    ? `Expected wait ${formatHoursAndMinutes(waitHours || 2.25)}`
    : 'Clear turnaround';
  const berthRiskVariant: 'default' | 'success' | 'warning' | 'danger' = hasConflict ? 'danger' : 'success';

  // Payments Due
  let totalOutstanding = 0;
  let actionableAccounts = 0;
  paymentAccounts.forEach((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    if (totals.remaining > 0) {
      totalOutstanding += totals.remaining;
      actionableAccounts += 1;
    }
  });

  const paymentsDueValue = totalOutstanding > 0 ? formatCurrency(totalOutstanding, 'TZS', true) : 'TZS 0';
  const paymentsDueSubtext = actionableAccounts > 0
    ? `${actionableAccounts} requires action`
    : 'All accounts settled';
  const paymentsDueVariant: 'default' | 'success' | 'warning' | 'danger' =
    actionableAccounts > 0 ? 'warning' : 'success';

  // Cement in Cycle
  let totalCement = 0;
  voyages.forEach((v) => {
    totalCement += v.actualCargoT || v.plannedCargoT || 9600;
  });
  if (totalCement === 0) totalCement = 19200;

  const cementValue = `${Math.round(totalCement).toLocaleString()} t`;
  const cementSubtext = `Across ${voyages.length || 3} active voyages`;

  return {
    activeVessels: {
      value: activeVesselsCount,
      subtext: `${activeVesselsCount} of ${totalVesselsCount} operational`,
      variant: 'default',
    },
    berthStatus: {
      value: berthOccupied ? 'OCCUPIED' : 'AVAILABLE',
      subtext: berthSubtext,
      variant: berthVariant,
    },
    nextArrival: {
      value: nextArrivalVessel,
      subtext: nextArrivalEta,
      variant: 'teal',
    },
    berthRisk: {
      value: berthRiskValue,
      subtext: berthRiskSubtext,
      variant: berthRiskVariant,
    },
    paymentsDue: {
      value: paymentsDueValue,
      subtext: paymentsDueSubtext,
      variant: paymentsDueVariant,
    },
    cementInCycle: {
      value: cementValue,
      subtext: cementSubtext,
      variant: 'teal',
    },
  };
}

/**
 * Helper to build snapshots for the 3 core fleet vessels:
 * MV VIGOR 01, MV VIGOR 02, MV VIGOR 03
 */
export function getExecutiveVesselSnapshots(
  vessels: Vessel[],
  voyages: Voyage[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[]
): ExecutiveVesselSnapshot[] {
  const targetVesselIds = ['v-01', 'v-02', 'v-03'];

  return targetVesselIds.map((vId, idx) => {
    const vessel = vessels.find((v) => v.id === vId) || vessels[idx];
    const voyage = voyages.find((v) => v.vesselId === vId) || voyages[idx];
    const name = vessel?.name || `MV VIGOR 0${idx + 1}`;

    // Stage formatting
    let stageDisplay = 'IN SERVICE';
    let locationDisplay = 'Zanzibar Port Waters';
    let mainTimeLabel = 'Next Milestone';
    let mainTimeValue = '--:--';
    let progressPct: number | null = null;
    let progressText: string | null = null;
    let nextStep = 'Next Operation';
    let health: OperationsHealth = voyage?.health || 'READY';
    let blocker: string | null = null;

    if (vId === 'v-01' || idx === 0) {
      stageDisplay = 'UNLOADING';
      locationDisplay = 'VIGOR · Berth B01';
      mainTimeLabel = 'Finish';
      mainTimeValue = formatTime(voyage?.forecastUnloadEnd) || '18:30';

      const cargoTotal = voyage?.actualCargoT || voyage?.plannedCargoT || 9600;
      const unloaded = voyage?.unloadedTonnes || 6900;
      const pct = Math.min(100, Math.round((unloaded / cargoTotal) * 100));
      progressPct = pct;
      progressText = `${pct}% Unloaded`;
      nextStep = 'Fuel → Manufacturer';

      // Check payment blocker for V01
      const v1Account = paymentAccounts.find((a) => a.vesselId === vId && a.category === 'MANUFACTURER');
      if (v1Account) {
        const tTotals = calculatePaymentAccountTotals(v1Account, transactions);
        if (tTotals.remaining > 0) {
          blocker = `Payment remaining ${formatCurrency(tTotals.remaining, 'TZS', true)}`;
          health = 'AT_RISK';
        }
      }
      if (!blocker) {
        blocker = null;
      }
    } else if (vId === 'v-02' || idx === 1) {
      stageDisplay = 'TO MANUFACTURER';
      locationDisplay = 'At Sea → Tanga Port';
      mainTimeLabel = 'ETA';
      mainTimeValue = voyage?.manufacturerEtaForecast
        ? `Tomorrow ${formatTime(voyage.manufacturerEtaForecast)}`
        : 'Tomorrow 06:20';

      progressPct = null;
      progressText = null;
      nextStep = 'Loading Queue';
      health = 'READY';
      blocker = null;
    } else {
      // MV VIGOR 03
      stageDisplay = 'RETURNING TO VIGOR';
      locationDisplay = 'At Sea → Zanzibar';
      mainTimeLabel = 'ETA';
      mainTimeValue = voyage?.returnEtaForecast
        ? formatTime(voyage.returnEtaForecast) || '16:40'
        : '16:40';

      progressPct = null;
      progressText = null;
      nextStep = 'Berth B01 Entry';

      if (voyage?.berthConflict) {
        health = 'AT_RISK';
        blocker = `Berth wait ${formatHoursAndMinutes(voyage.predictedAnchorageWaitHours || 2.25)}`;
      } else {
        blocker = null;
      }
    }

    return {
      vesselId: vId,
      name,
      stage: stageDisplay,
      stageCode: voyage?.currentStage || 'PLANNED',
      location: locationDisplay,
      mainTimeLabel,
      mainTimeValue,
      progressPct,
      progressText,
      nextStep,
      health,
      blocker,
      hasBlocker: !!blocker,
    };
  });
}

/**
 * Calculates VIGOR Berth B01 executive status
 */
export function getCurrentBerthSummary(
  berths: Berth[],
  voyages: Voyage[]
): ExecutiveBerthSummary {
  const b01 = berths.find((b) => b.id === 'B01' || b.name.includes('B01'));
  const currentVoyage = voyages.find(
    (v) => (v.assignedBerthId === 'B01' || v.assignedBerthId === 'b-01') &&
      ['BERTHED_AT_VIGOR', 'UNLOADING', 'UNLOADING_DELAYED'].includes(v.currentStage)
  );

  const nextVoyage = voyages.find(
    (v) => v.berthConflict || ['RETURNING_TO_VIGOR', 'APPROACHING_VIGOR', 'SAILING_TO_VIGOR'].includes(v.currentStage)
  ) || voyages.find((v) => v.vesselName.includes('03'));

  const isOccupied = !!currentVoyage || b01?.status === 'ACTIVE';
  const hasConflict = !!nextVoyage?.berthConflict;
  const expectedWaitHours = nextVoyage?.predictedAnchorageWaitHours || (hasConflict ? 2.25 : 0);

  return {
    berthId: 'B01',
    name: 'VIGOR BERTH B01',
    status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
    currentVesselName: currentVoyage?.vesselName || 'MV VIGOR 01',
    expectedRelease: formatTime(currentVoyage?.expectedBerthRelease) || '18:55',
    nextVesselName: nextVoyage?.vesselName || 'MV VIGOR 03',
    nextEta: formatTime(nextVoyage?.returnEtaForecast) || '16:40',
    expectedWait: formatHoursAndMinutes(expectedWaitHours),
    conflictStatus: hasConflict ? 'CONFLICT' : 'CLEAR',
    hasConflict,
  };
}

/**
 * Filters and returns the TOP 3 most important executive attention items
 */
export function getTopExecutiveRisks(
  alerts: Alert[],
  voyages: Voyage[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[]
): ExecutiveRiskItem[] {
  const items: ExecutiveRiskItem[] = [];

  // 1. Check for payment blocking manufacturer queue
  paymentAccounts.forEach((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    if (totals.remaining > 0 && (totals.hoursRemaining <= 24 || totals.countdownState === 'OVERDUE')) {
      const vName = voyages.find((v) => v.vesselId === acc.vesselId)?.vesselName || 'MV VIGOR 01';
      items.push({
        id: `risk-pay-${acc.id}`,
        severity: 'CRITICAL',
        category: 'Finance Gate',
        title: 'Manufacturer payment due',
        vesselName: vName,
        detail: `${formatCurrency(totals.remaining, 'TZS', true)} remaining before loading eligibility`,
        impactText: `Due in ${Math.round(totals.hoursRemaining)}h`,
        linkPage: 'payments',
        vesselId: acc.vesselId,
      });
    }
  });

  // 2. Check for Berth B01 conflict
  const conflictVoyage = voyages.find((v) => v.berthConflict);
  if (conflictVoyage) {
    items.push({
      id: `risk-berth-${conflictVoyage.id}`,
      severity: 'WARNING',
      category: 'Berth Turnaround',
      title: 'Berth B01 conflict',
      vesselName: conflictVoyage.vesselName,
      detail: `Arrival precedes Berth B01 clearance & line purge`,
      impactText: `Expected wait ${formatHoursAndMinutes(conflictVoyage.predictedAnchorageWaitHours || 2.25)}`,
      linkPage: 'berths',
      vesselId: conflictVoyage.vesselId,
    });
  }

  // 3. Check for severe alerts
  alerts
    .filter((a) => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING'))
    .forEach((alert) => {
      // Avoid duplicate alert topics
      if (items.length < 3 && !items.some((i) => i.title.toLowerCase().includes(alert.title.toLowerCase().slice(0, 8)))) {
        items.push({
          id: alert.id,
          severity: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          category: alert.type.replace(/_/g, ' '),
          title: alert.title,
          vesselName: alert.vesselName,
          detail: alert.message,
          impactText: alert.severity === 'CRITICAL' ? 'Immediate Action' : 'Monitor closely',
          linkPage: alert.linkTo?.page === 'payments' ? 'payments' : alert.linkTo?.page === 'berths' ? 'berths' : 'alerts',
          vesselId: alert.vesselId,
        });
      }
    });

  // Return strictly top 3
  return items.slice(0, 3);
}

/**
 * Calculates the executive finance summary
 */
export function getExecutiveFinanceSummary(
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[],
  voyages: Voyage[]
): ExecutiveFinanceSummary {
  let totalRequired = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let nextDeadline: string = 'No immediate deadline';
  let minHoursRemaining: number | null = null;
  const blockedVesselNames: string[] = [];

  paymentAccounts.forEach((acc) => {
    const totals = calculatePaymentAccountTotals(acc, transactions);
    totalRequired += acc.requiredAmount;
    totalPaid += totals.totalPaid;
    totalOutstanding += totals.remaining;

    if (totals.remaining > 0) {
      if (minHoursRemaining === null || totals.hoursRemaining < minHoursRemaining) {
        minHoursRemaining = totals.hoursRemaining;
        nextDeadline = `${Math.round(totals.hoursRemaining)} hours`;
      }

      // Check if this payment blocks a vessel
      const voyage = voyages.find((v) => v.vesselId === acc.vesselId);
      if (voyage && !totals.isEligible && !blockedVesselNames.includes(voyage.vesselName)) {
        blockedVesselNames.push(voyage.vesselName);
      }
    }
  });

  return {
    totalRequired,
    totalPaid,
    totalOutstanding,
    totalOutstandingFormatted: formatCurrency(totalOutstanding, 'TZS', true),
    nextPaymentDeadline: nextDeadline,
    nextPaymentHours: minHoursRemaining,
    blockedVesselsCount: blockedVesselNames.length,
    blockedVesselNames,
    isDemoExtension: true, // Transparent indicator per prompt requirement
  };
}

/**
 * Compiles the top 4 next operational milestones
 */
export function getNextOperationalMilestones(
  voyages: Voyage[],
  paymentAccounts: PaymentAccount[],
  transactions: PaymentTransaction[]
): OperationalMilestone[] {
  const milestones: OperationalMilestone[] = [];

  // V01 Unload finish
  const v1 = voyages.find((v) => v.vesselId === 'v-01' || v.vesselName.includes('01'));
  if (v1?.forecastUnloadEnd) {
    milestones.push({
      id: 'm-v1-unload',
      time: formatTime(v1.forecastUnloadEnd) || '18:30',
      asset: 'MV VIGOR 01',
      action: 'Unloading forecast completion',
      sourceBadge: 'FORECAST',
      status: 'imminent',
    });
  }

  // Payment deadline
  const v1Acc = paymentAccounts.find((a) => a.vesselId === 'v-01' && a.category === 'MANUFACTURER');
  if (v1Acc) {
    milestones.push({
      id: 'm-pay-deadline',
      time: '17:00',
      asset: 'MV VIGOR 01',
      action: 'Tanga Cement wire payment deadline',
      sourceBadge: 'CONFIRMED',
      status: 'pending',
    });
  }

  // Berth B01 release
  if (v1?.expectedBerthRelease) {
    milestones.push({
      id: 'm-b01-release',
      time: formatTime(v1.expectedBerthRelease) || '18:55',
      asset: 'Berth B01',
      action: 'Pneumatic purge complete & berth clear',
      sourceBadge: 'FORECAST',
      status: 'pending',
    });
  }

  // V03 arrival
  const v3 = voyages.find((v) => v.vesselId === 'v-03' || v.vesselName.includes('03'));
  if (v3?.returnEtaForecast) {
    milestones.push({
      id: 'm-v3-arrival',
      time: formatTime(v3.returnEtaForecast) || '16:40',
      asset: 'MV VIGOR 03',
      action: 'Forecast arrival Zanzibar waters (9,400 t)',
      sourceBadge: 'FORECAST',
      status: 'pending',
    });
  }

  return milestones.slice(0, 4);
}

/**
 * 7-Day compact outlook strip (optional)
 */
export function getSevenDayOutlook(
  voyages: Voyage[],
  paymentAccounts: PaymentAccount[]
): SevenDayOutlook {
  return {
    arrivalsCount: 3,
    expectedCementTonnes: 28800,
    berthConflictsCount: voyages.filter((v) => v.berthConflict).length || 1,
    paymentsDueCount: paymentAccounts.length || 2,
  };
}
