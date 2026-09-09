import {
  PaymentAccount,
  PaymentTransaction,
  PaymentCountdownState,
} from '../types';

export function calculatePaymentAccountTotals(
  account: PaymentAccount,
  transactions: PaymentTransaction[]
): {
  totalPaid: number;
  remaining: number;
  progressPercent: number;
  isEligible: boolean;
  countdownState: PaymentCountdownState;
  hoursRemaining: number;
} {
  const accountTxns = transactions.filter((t) => t.paymentAccountId === account.id);
  const totalPaid = accountTxns.reduce((acc, t) => acc + (t.amount || 0), 0);
  const remaining = Math.max(0, account.requiredAmount - totalPaid);
  const progressPercent =
    account.requiredAmount > 0
      ? Math.min(100, Math.round((totalPaid / account.requiredAmount) * 100))
      : 100;

  // Determine eligibility
  let isEligible = account.isEligible;
  if (account.eligibilityThresholdType === 'FULL') {
    isEligible = totalPaid >= account.requiredAmount;
  } else if (account.eligibilityThresholdType === 'PERCENTAGE') {
    isEligible = progressPercent >= account.eligibilityThresholdValue;
  } else if (account.eligibilityThresholdType === 'AMOUNT') {
    isEligible = totalPaid >= account.eligibilityThresholdValue;
  }

  // Calculate deadline countdown
  const now = new Date().getTime();
  const deadlineMs = new Date(account.deadline).getTime();
  const diffMs = deadlineMs - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  let countdownState: PaymentCountdownState = 'MORE_THAN_7_DAYS';
  if (diffMs < 0) {
    countdownState = 'OVERDUE';
  } else if (hoursRemaining <= 12) {
    countdownState = 'DUE_TODAY';
  } else if (hoursRemaining <= 24) {
    countdownState = 'DUE_WITHIN_24_HOURS';
  } else if (hoursRemaining <= 48) {
    countdownState = 'DUE_WITHIN_48_HOURS';
  } else if (hoursRemaining <= 72) {
    countdownState = 'DUE_WITHIN_3_DAYS';
  } else if (hoursRemaining <= 168) {
    countdownState = 'DUE_WITHIN_7_DAYS';
  } else {
    countdownState = 'MORE_THAN_7_DAYS';
  }

  return {
    totalPaid,
    remaining,
    progressPercent,
    isEligible,
    countdownState,
    hoursRemaining,
  };
}
