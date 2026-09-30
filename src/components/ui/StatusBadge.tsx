import React from 'react';
import {
  OperationalStage,
  OperationsHealth,
  OperationalRisk,
  DataQuality,
  ScheduleSource,
  PaymentCountdownState,
  CurrentBlocker,
} from '../../types';

export function StatusBadge({ stage }: { stage: OperationalStage }) {
  const stageLabels: Record<OperationalStage, { label: string; bg: string; text: string; border: string }> = {
    PLANNED: { label: 'PLANNED', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
    SAILING_TO_VIGOR: { label: 'SAILING TO VIGOR', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/30' },
    APPROACHING_VIGOR: { label: 'APPROACHING VIGOR', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/40' },
    WAITING_FOR_VIGOR_BERTH: { label: 'ANCHORAGE WAITING', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    BERTHED_AT_VIGOR: { label: 'BERTHED AT VIGOR', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/40' },
    UNLOADING: { label: 'UNLOADING CEMENT', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/50' },
    UNLOADING_DELAYED: { label: 'UNLOAD DELAYED', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    UNLOADING_COMPLETE: { label: 'UNLOAD COMPLETE', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    WAITING_FOR_FUEL: { label: 'WAITING FOR FUEL', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/30' },
    FUEL_PAYMENT_PENDING: { label: 'FUEL PAYMENT PENDING', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    FUEL_PARTIALLY_PAID: { label: 'FUEL PARTIALLY PAID', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/30' },
    FUEL_PAID: { label: 'FUEL PAID', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    FUEL_SCHEDULED: { label: 'FUEL SCHEDULED', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/30' },
    FUEL_IN_PROGRESS: { label: 'BUNKERING IN PROGRESS', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/40' },
    FUEL_COMPLETE: { label: 'FUEL COMPLETE', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    READY_TO_DEPART: { label: 'READY TO DEPART', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/40' },
    SAILING_TO_MANUFACTURER: { label: 'SAILING TO MFR', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/40' },
    MANUFACTURER_PAYMENT_PENDING: { label: 'MFR PAYMENT PENDING', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    MANUFACTURER_PARTIALLY_PAID: { label: 'MFR PARTIALLY PAID', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    MANUFACTURER_PAYMENT_COMPLETE: { label: 'MFR PAID (100%)', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    ELIGIBLE_FOR_MANUFACTURER_QUEUE: { label: 'QUEUE ELIGIBLE', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/40' },
    WAITING_AT_MANUFACTURER: { label: 'WAITING AT MFR', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    MANUFACTURER_BERTH_ASSIGNED: { label: 'MFR BERTH ASSIGNED', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/40' },
    LOADING: { label: 'LOADING CEMENT', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/50' },
    LOADING_DELAYED: { label: 'LOADING DELAYED', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    LOADING_COMPLETE: { label: 'LOADING COMPLETE', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    DEPARTING_MANUFACTURER: { label: 'DEPARTING MFR', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/40' },
    RETURNING_TO_VIGOR: { label: 'RETURNING TO VIGOR', bg: 'bg-info-soft', text: 'text-info', border: 'border-info/40' },
    MAINTENANCE: { label: 'MAINTENANCE', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
    OUT_OF_SERVICE: { label: 'OUT OF SERVICE', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    COMPLETED: { label: 'VOYAGE COMPLETED', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
  };

  const config = stageLabels[stage] || { label: stage, bg: 'bg-canvas', text: 'text-muted', border: 'border-line' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border ${config.bg} ${config.text} ${config.border} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
}

export function OperationsHealthBadge({ health }: { health: OperationsHealth }) {
  const configs: Record<OperationsHealth, { label: string; dot: string; bg: string; text: string; border: string }> = {
    READY: { label: 'READY', dot: 'bg-brand', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    AT_RISK: { label: 'AT RISK', dot: 'bg-warning-strong', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    BLOCKED: { label: 'BLOCKED', dot: 'bg-critical', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    DELAYED: { label: 'DELAYED', dot: 'bg-critical', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
  };
  const c = configs[health] || configs.READY;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: OperationalRisk }) {
  const configs: Record<OperationalRisk, { label: string; bg: string; text: string; border: string }> = {
    ON_TRACK: { label: 'ON TRACK', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    AT_RISK: { label: 'AT RISK', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    DELAYED: { label: 'DELAYED', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    ARRIVAL_OVERDUE: { label: 'ARRIVAL OVERDUE', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    UNKNOWN: { label: 'UNKNOWN', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
  };
  const c = configs[risk] || configs.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
      {c.label}
    </span>
  );
}

export function DataQualityBadge({ quality }: { quality: DataQuality }) {
  const configs: Record<DataQuality, { label: string; bg: string; text: string; border: string }> = {
    CURRENT: { label: 'CURRENT', bg: 'bg-positive-soft', text: 'text-positive', border: 'border-positive/30' },
    STALE: { label: 'STALE', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    INSUFFICIENT: { label: 'INSUFFICIENT', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40' },
    UNAVAILABLE: { label: 'UNAVAILABLE', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
  };
  const c = configs[quality] || configs.UNAVAILABLE;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono uppercase tracking-wider rounded border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
      {c.label}
    </span>
  );
}

export function ScheduleSourceBadge({ source }: { source: ScheduleSource }) {
  const configs: Record<ScheduleSource, { label: string; bg: string; text: string; border?: string }> = {
    ACTUAL: { label: 'ACTUAL', bg: 'bg-shell', text: 'text-white' },
    CONFIRMED: { label: 'CONFIRMED', bg: 'bg-brand-hover', text: 'text-white' },
    PLANNED: { label: 'PLANNED', bg: 'bg-raised', text: 'text-foreground' },
    FORECAST: { label: 'FORECAST', bg: 'bg-info-soft', text: 'text-info', border: 'border border-info/30' },
    SIMULATED: { label: 'SIMULATED', bg: 'bg-warning-soft', text: 'text-warning', border: 'border border-warning/40' },
  };
  const c = configs[source] || configs.FORECAST;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono uppercase tracking-wider rounded ${c.bg} ${c.text} ${c.border || ''} whitespace-nowrap`}>
      {c.label}
    </span>
  );
}

export function PaymentCountdownBadge({ state, hoursRemaining }: { state: PaymentCountdownState; hoursRemaining: number }) {
  const configs: Record<PaymentCountdownState, { label: string; bg: string; text: string; border: string }> = {
    MORE_THAN_7_DAYS: { label: '> 7 Days', bg: 'bg-canvas', text: 'text-muted', border: 'border-line' },
    DUE_WITHIN_7_DAYS: { label: 'Due in < 7d', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    DUE_WITHIN_3_DAYS: { label: 'Due in < 3d', bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40' },
    DUE_WITHIN_48_HOURS: { label: `${Math.max(0, Math.round(hoursRemaining))}h remaining`, bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/60' },
    DUE_WITHIN_24_HOURS: { label: `${Math.max(0, Math.round(hoursRemaining))}h left!`, bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/60' },
    DUE_TODAY: { label: 'DUE TODAY', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger' },
    OVERDUE: { label: 'OVERDUE', bg: 'bg-critical', text: 'text-white', border: 'border-danger' },
  };
  const c = configs[state] || configs.MORE_THAN_7_DAYS;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider rounded border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
      {c.label}
    </span>
  );
}

export function CurrentBlockerBadge({ blocker, description }: { blocker: CurrentBlocker; description?: string }) {
  const labels: Record<CurrentBlocker, { name: string; isBlocked: boolean }> = {
    NONE: { name: 'NO CURRENT BLOCKER', isBlocked: false },
    VIGOR_BERTH: { name: 'VIGOR BERTH OCCUPIED', isBlocked: true },
    UNLOADING: { name: 'UNLOADING SLOWDOWN / DELAY', isBlocked: true },
    FUEL_SCHEDULE: { name: 'AWAITING FUEL BUNKERING', isBlocked: true },
    FUEL_PAYMENT: { name: 'FUEL PAYMENT PENDING', isBlocked: true },
    MANUFACTURER_PAYMENT: { name: 'MANUFACTURER PAYMENT INCOMPLETE', isBlocked: true },
    MANUFACTURER_QUEUE: { name: 'MANUFACTURER QUEUE CONGESTION', isBlocked: true },
    MANUFACTURER_BERTH: { name: 'MANUFACTURER BERTH OCCUPIED', isBlocked: true },
    LOADING: { name: 'LOADING DELAYED', isBlocked: true },
    MAINTENANCE: { name: 'MAINTENANCE HOLD', isBlocked: true },
  };

  const info = labels[blocker] || { name: blocker, isBlocked: true };

  return (
    <div className={`p-2.5 rounded-lg border ${info.isBlocked ? 'bg-danger-soft/60 border-danger/30' : 'bg-positive-soft/60 border-positive/30'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Current Operational Blocker
        </span>
        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
            info.isBlocked ? 'bg-critical text-white' : 'bg-brand-hover text-white'
          }`}
        >
          {info.name}
        </span>
      </div>
      {description && (
        <p className="mt-1.5 text-xs text-foreground font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

/** One visual vocabulary for persisted visit states across live screens. */
export function VisitStatusBadge({ status }: { status: string }) {
  const tone = ['DELAYED', 'CANCELLED'].includes(status) ? 'bg-danger-soft text-danger'
    : ['UNLOADING', 'COMPLETED', 'DEPARTED'].includes(status) ? 'bg-positive-soft text-positive'
    : ['ARRIVED', 'BERTHED'].includes(status) ? 'bg-info-soft text-info'
    : 'bg-raised text-muted';
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap ${tone}`}>
    <span className="w-1 h-1 rounded-full bg-current" aria-hidden />{status.replaceAll('_', ' ')}
  </span>;
}
