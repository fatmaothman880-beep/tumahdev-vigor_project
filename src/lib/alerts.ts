import { Alert, Voyage, PaymentAccount } from '../types';
import { formatHoursAndMinutes } from './format';

export function generateSystemAlerts(
  voyages: Voyage[],
  payments: PaymentAccount[],
  currentB01ReleaseTime?: string
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().getTime();

  // 1. Manufacturer payment alerts
  payments.forEach((payment) => {
    if (payment.category === 'MANUFACTURER' && !payment.isEligible) {
      const deadlineMs = new Date(payment.deadline).getTime();
      const diffHours = (deadlineMs - now) / 3600000;
      const voyage = voyages.find((v) => v.id === payment.voyageId);
      const vesselName = voyage?.vesselName || 'Vessel';

      if (diffHours < 0) {
        alerts.push({
          id: `alert-pmt-overdue-${payment.id}`,
          vesselId: payment.vesselId,
          vesselName,
          voyageId: payment.voyageId,
          type: 'PAYMENT_OVERDUE',
          severity: 'CRITICAL',
          title: `CRITICAL: Manufacturer Payment Overdue`,
          message: `${vesselName} manufacturer payment deadline has passed. Eligibility for loading queue is withheld until resolved.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          linkTo: { page: 'payments', vesselId: payment.vesselId, voyageId: payment.voyageId },
        });
      } else if (diffHours <= 24) {
        alerts.push({
          id: `alert-pmt-24h-${payment.id}`,
          vesselId: payment.vesselId,
          vesselName,
          voyageId: payment.voyageId,
          type: 'PAYMENT_DUE',
          severity: 'CRITICAL',
          title: `CRITICAL: Payment Due Within 24 Hours`,
          message: `${vesselName} manufacturer payment is due in ${Math.round(diffHours)}h. Unpaid balance blocks queue scheduling eligibility.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          linkTo: { page: 'payments', vesselId: payment.vesselId, voyageId: payment.voyageId },
        });
      } else if (diffHours <= 72) {
        alerts.push({
          id: `alert-pmt-72h-${payment.id}`,
          vesselId: payment.vesselId,
          vesselName,
          voyageId: payment.voyageId,
          type: 'PAYMENT_DUE',
          severity: 'WARNING',
          title: `WARNING: Manufacturer Payment Approaching`,
          message: `${vesselName} payment balance outstanding. Must reach threshold by deadline to secure loading window.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          linkTo: { page: 'payments', vesselId: payment.vesselId, voyageId: payment.voyageId },
        });
      }
    }
  });

  // 2. Berth Conflict Alerts (based on ETA, expected berth release, and buffer)
  voyages.forEach((voyage) => {
    if (voyage.berthConflict && voyage.predictedAnchorageWaitHours > 0) {
      alerts.push({
        id: `alert-berth-conflict-${voyage.id}`,
        vesselId: voyage.vesselId,
        vesselName: voyage.vesselName,
        voyageId: voyage.id,
        type: 'BERTH_CONFLICT',
        severity: 'WARNING',
        title: `WARNING: Berth B01 Conflict Detected`,
        message: `${voyage.vesselName} forecast return arrival precedes Berth B01 release. Estimated anchorage waiting: ${formatHoursAndMinutes(voyage.predictedAnchorageWaitHours)}.`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        linkTo: { page: 'berths', vesselId: voyage.vesselId, voyageId: voyage.id },
      });
    }
  });

  return alerts;
}
