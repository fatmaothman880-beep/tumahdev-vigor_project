/**
 * Payment & Treasury API Service for VIGOR Smart Port Operations
 * Manages commercial invoices, bank wires, and financial gate clearance
 */

import { PaymentAccount, PaymentTransaction } from '../types';
import { apiFetch, BackendOperationalStateEnvelope, USE_MOCK_API } from './client';

export interface RecordTransactionDto {
  paymentAccountId: string;
  vesselId: string;
  voyageId: string;
  category: PaymentAccount['category'];
  amount: number;
  currency: string;
  transactionDate: string;
  paymentMethod: string;
  referenceNumber: string;
  enteredBy: string;
  notes?: string;
}

export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
  if (USE_MOCK_API) return [];
  const response = await apiFetch<BackendOperationalStateEnvelope>('/operations/state');
  return response.state?.paymentAccounts ?? [];
}

export async function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  if (USE_MOCK_API) return [];
  const response = await apiFetch<BackendOperationalStateEnvelope>('/operations/state');
  return response.state?.paymentTransactions ?? [];
}
