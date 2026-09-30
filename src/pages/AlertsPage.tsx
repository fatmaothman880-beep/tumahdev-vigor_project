import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader, KpiCard } from '../components/ui/KpiCard';
import { formatDateTime, formatTime } from '../lib/format';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Ship,
  Anchor,
  Clock,
  Check,
  CreditCard,
} from 'lucide-react';
import { AlertSeverity } from '../types';

interface AlertsPageProps {
  onSelectVessel: (vesselId: string) => void;
  onNavigateToBerths: () => void;
  onNavigateToPayments: () => void;
}

export function AlertsPage({
  onSelectVessel,
  onNavigateToBerths,
  onNavigateToPayments,
}: AlertsPageProps) {
  const { alerts, api } = useAppData();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="SYSTEM MONITORING"
        title="Delays & Operational Alerts"
        description="Automated cross-system intelligence detecting berth conflicts, payment deadline gates, unloading pace variances, and telemetry latency."
      />

      {/* Severity KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Active Alerts"
          value={alerts.length}
          subtext="Operational flags active"
          icon={<Bell className="w-5 h-5" />}
        />
        <KpiCard
          label="Critical Actions"
          value={criticalCount}
          subtext="Requires immediate intervention"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="danger"
        />
        <KpiCard
          label="Warning Advisories"
          value={warningCount}
          subtext="Pace & schedule deviations"
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <KpiCard
          label="Informational"
          value={infoCount}
          subtext="Routine telemetry milestones"
          icon={<Info className="w-5 h-5" />}
          variant="teal"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              severityFilter === sev
                ? 'bg-shell text-white'
                : 'bg-surface text-muted border border-line hover:bg-canvas'
            }`}
          >
            {sev} ({sev === 'ALL' ? alerts.length : alerts.filter((a) => a.severity === sev).length})
          </button>
        ))}
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCritical
                  ? 'bg-danger-soft/60 border-danger/40'
                  : isWarning
                  ? 'bg-warning-soft/60 border-warning/40'
                  : 'bg-surface border-line'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  {isCritical ? (
                    <span className="w-3 h-3 rounded-full bg-critical inline-block animate-pulse" />
                  ) : isWarning ? (
                    <span className="w-3 h-3 rounded-full bg-warning-strong inline-block" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-info-strong inline-block" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-surface/80 border border-line">
                      {alert.category}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{alert.title}</h3>
                    {alert.vesselName && (
                      <span className="text-xs text-muted font-medium flex items-center gap-1">
                        <Ship className="w-3 h-3" /> {alert.vesselName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed max-w-2xl">
                    {alert.message}
                  </p>
                  <div className="text-[10px] font-mono text-muted/80">
                    Logged: {formatDateTime(alert.timestamp)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {alert.vesselId && (
                  <button
                    onClick={() => onSelectVessel(alert.vesselId!)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-line hover:bg-canvas text-foreground transition"
                  >
                    Open Vessel
                  </button>
                )}
                {alert.category === 'BERTH_CONFLICT' && (
                  <button
                    onClick={onNavigateToBerths}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-line hover:bg-canvas text-foreground transition"
                  >
                    Berth Console
                  </button>
                )}
                {alert.category === 'PAYMENT_REQUIRED' && (
                  <button
                    onClick={onNavigateToPayments}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-hover transition shadow-xs"
                  >
                    Clear Payment
                  </button>
                )}
                {!alert.acknowledged && (
                  <button
                    onClick={() => api.acknowledgeAlert(alert.id)}
                    className="p-1.5 text-xs font-semibold rounded-lg bg-surface border border-line hover:bg-canvas text-muted transition"
                    title="Acknowledge alert"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
