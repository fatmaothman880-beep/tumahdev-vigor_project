import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard, Modal } from '../components/ui/KpiCard';
import { PaymentCountdownBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/DualProgress';
import {
  formatCurrency,
  formatDateTime,
  formatTime,
} from '../lib/format';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { calculatePaymentAccountTotals } from '../lib/paymentEngine';
import { PaymentCategory } from '../types';

interface PaymentsProps {
  onSelectVessel: (vesselId: string) => void;
}

export function Payments({ onSelectVessel }: PaymentsProps) {
  const { paymentAccounts, paymentTransactions, vessels, voyages, api } = useAppData();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | PaymentCategory>('ALL');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(paymentAccounts[0]?.id || '');

  // Record Payment Form
  const [amount, setAmount] = useState('200000000');
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire (CRDB Bank)');
  const [refNum, setRefNum] = useState('CRDB-WIRE-' + Math.floor(1000000 + Math.random() * 9000000));
  const [notes, setNotes] = useState('');

  // Calculate totals
  const totalRequiredTzs = paymentAccounts
    .filter((p) => p.currency === 'TZS')
    .reduce((acc, p) => acc + p.requiredAmount, 0);

  const totalPaidTzs = paymentTransactions
    .filter((t) => t.currency === 'TZS')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingAccounts = paymentAccounts.filter((p) => !p.isEligible);

  const filteredAccounts = paymentAccounts.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.counterpartyName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.vesselName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const acct = paymentAccounts.find((p) => p.id === selectedAccountId);
    if (!acct) return;

    api.addPaymentTransaction({
      paymentAccountId: acct.id,
      vesselId: acct.vesselId,
      voyageId: acct.voyageId,
      category: acct.category,
      amount: Number(amount),
      currency: acct.currency,
      transactionDate: new Date().toISOString(),
      paymentMethod,
      referenceNumber: refNum,
      enteredBy: 'Treasury Desk (Fatma M.)',
      notes: notes.trim() || 'Wire settlement executed via corporate online banking portal',
    });

    setIsAddModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="TREASURY & GATES"
        title="Finance Center & Payment Eligibility"
        description="Tracks commercial advance wires, fuel supplier clearances, and port authority disbursements. Downstream scheduling locks strictly on verified wire settlement."
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Record Wire Settlement
        </button>
      </PageHeader>

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Invoice Obligations"
          value={formatCurrency(totalRequiredTzs)}
          subtext="Mainland commercial commitments"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Cleared Payments"
          value={formatCurrency(totalPaidTzs)}
          subtext="Verified in bank accounts"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <KpiCard
          label="Remaining Outstanding"
          value={formatCurrency(Math.max(0, totalRequiredTzs - totalPaidTzs))}
          subtext={`${pendingAccounts.length} account requiring action`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={pendingAccounts.length > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Eligibility Threshold"
          value="100%"
          subtext="Strict gate requirement"
          icon={<Building className="w-5 h-5" />}
          variant="teal"
        />
      </div>

      {/* Primary Payment Account Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['ALL', 'MANUFACTURER', 'FUEL', 'PORT_FEES'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  categoryFilter === cat
                    ? 'bg-[#14181A] text-white'
                    : 'bg-white text-[#3F4A47] border border-[#E1DED4] hover:bg-[#F7F5F0]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3F4A47]" />
            <input
              type="text"
              placeholder="Search invoice or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAccounts.map((account) => {
            const totals = calculatePaymentAccountTotals(account, paymentTransactions);
            const isEligible = totals.isEligible;

            return (
              <div
                key={account.id}
                className={`bg-white border-2 rounded-xl p-5 shadow-xs transition flex flex-col justify-between ${
                  isEligible ? 'border-[#0C9349]/40' : 'border-[#C99A5B]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#14181A]">{account.counterpartyName}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F5F0] text-[#3F4A47] font-semibold">
                          {account.category}
                        </span>
                      </div>
                      <div className="text-xs text-[#3F4A47] mt-0.5">
                        Invoice: <strong className="font-mono">{account.invoiceNumber}</strong> · Vessel:{' '}
                        <strong>{account.vesselName}</strong>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                        isEligible
                          ? 'bg-[#E7F4EB] text-[#0A7A3D] border-[#0C9349]/30'
                          : 'bg-[#F8E7E3] text-[#AE3B2E] border-[#AE3B2E]/30'
                      }`}
                    >
                      {isEligible ? 'ELIGIBLE (100%)' : 'WITHHELD'}
                    </span>
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#3F4A47]">Invoice Total Required:</span>
                      <span className="font-mono font-bold text-[#14181A]">
                        {formatCurrency(account.requiredAmount, account.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#3F4A47]">Amount Cleared:</span>
                      <span className="font-mono font-bold text-[#0A7A3D]">
                        {formatCurrency(totals.totalPaid, account.currency)} ({totals.progressPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#3F4A47]">Remaining Balance Due:</span>
                      <span className="font-mono font-bold text-[#AE3B2E]">
                        {formatCurrency(totals.remaining, account.currency)}
                      </span>
                    </div>

                    <div className="pt-2">
                      <ProgressBar
                        label="Payment Progress to Gate"
                        value={totals.progressPercent}
                        color={isEligible ? 'green' : 'amber'}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#E1DED4]">
                      <span className="text-[#3F4A47]">Wire Deadline:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{formatDateTime(account.deadline)}</span>
                        <PaymentCountdownBadge
                          state={totals.countdownState}
                          hoursRemaining={totals.hoursRemaining}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E1DED4] flex items-center justify-between">
                  <button
                    onClick={() => onSelectVessel(account.vesselId)}
                    className="text-xs font-semibold text-[#3F4A47] hover:text-[#14181A]"
                  >
                    View Vessel Cycle →
                  </button>

                  {!isEligible && (
                    <button
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setAmount(String(totals.remaining));
                        setIsAddModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14181A] hover:bg-[#3F4A47] text-white flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Record Wire Settlement
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white border border-[#E1DED4] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E1DED4] flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A]">
            Historical Payment & Wire Clearing Ledger ({paymentTransactions.length})
          </h3>
          <span className="text-xs font-mono text-[#3F4A47]">Bank-verified records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] border-b border-[#E1DED4] text-[#3F4A47] font-semibold text-[11px] uppercase tracking-wider font-mono">
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Reference / Swift</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4">Officer</th>
                <th className="py-2.5 px-4 text-right">Amount Cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DED4] font-mono text-[11px]">
              {paymentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F7F5F0]/60">
                  <td className="py-2.5 px-4 text-[#14181A]">{formatDateTime(tx.transactionDate)}</td>
                  <td className="py-2.5 px-4 font-bold text-[#14181A]">{tx.referenceNumber}</td>
                  <td className="py-2.5 px-4 text-[#3F4A47] font-sans">{tx.category}</td>
                  <td className="py-2.5 px-4 text-[#3F4A47] font-sans">{tx.paymentMethod}</td>
                  <td className="py-2.5 px-4 text-[#3F4A47] font-sans">{tx.enteredBy}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#0A7A3D]">
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Wire Settlement Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Bank Wire Transaction"
        subtitle="Entering verified bank transactions updates eligibility and unlocks downstream manufacturer queues."
      >
        <form onSubmit={handleRecordTransaction} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Target Account *</label>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                const acct = paymentAccounts.find((p) => p.id === e.target.value);
                if (acct) {
                  const t = calculatePaymentAccountTotals(acct, paymentTransactions);
                  setAmount(String(t.remaining > 0 ? t.remaining : acct.requiredAmount));
                }
              }}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
            >
              {paymentAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.counterpartyName} ({a.invoiceNumber}) — {a.vesselName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Wire Amount *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
              >
                <option>Bank Wire (CRDB Bank)</option>
                <option>Bank Wire (NMB Bank)</option>
                <option>Bank Wire (Stanbic Bank)</option>
                <option>Direct Treasury Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">Reference Number</label>
              <input
                type="text"
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
                className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#14181A] mb-1">Settlement Notes</label>
            <input
              type="text"
              placeholder="e.g. Cleared via treasury online portal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-[#E1DED4] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white border border-[#E1DED4] text-[#3F4A47] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white font-semibold shadow-xs"
            >
              Confirm Wire Clearance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
