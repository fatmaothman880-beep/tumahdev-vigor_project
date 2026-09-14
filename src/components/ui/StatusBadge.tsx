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
    PLANNED: { label: 'PLANNED', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
    SAILING_TO_VIGOR: { label: 'SAILING TO VIGOR', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/30' },
    APPROACHING_VIGOR: { label: 'APPROACHING VIGOR', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/40' },
    WAITING_FOR_VIGOR_BERTH: { label: 'ANCHORAGE WAITING', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    BERTHED_AT_VIGOR: { label: 'BERTHED AT VIGOR', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/40' },
    UNLOADING: { label: 'UNLOADING CEMENT', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/50' },
    UNLOADING_DELAYED: { label: 'UNLOAD DELAYED', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    UNLOADING_COMPLETE: { label: 'UNLOAD COMPLETE', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    WAITING_FOR_FUEL: { label: 'WAITING FOR FUEL', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/30' },
    FUEL_PAYMENT_PENDING: { label: 'FUEL PAYMENT PENDING', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    FUEL_PARTIALLY_PAID: { label: 'FUEL PARTIALLY PAID', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/30' },
    FUEL_PAID: { label: 'FUEL PAID', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    FUEL_SCHEDULED: { label: 'FUEL SCHEDULED', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/30' },
    FUEL_IN_PROGRESS: { label: 'BUNKERING IN PROGRESS', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/40' },
    FUEL_COMPLETE: { label: 'FUEL COMPLETE', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    READY_TO_DEPART: { label: 'READY TO DEPART', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/40' },
    SAILING_TO_MANUFACTURER: { label: 'SAILING TO MFR', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/40' },
    MANUFACTURER_PAYMENT_PENDING: { label: 'MFR PAYMENT PENDING', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    MANUFACTURER_PARTIALLY_PAID: { label: 'MFR PARTIALLY PAID', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    MANUFACTURER_PAYMENT_COMPLETE: { label: 'MFR PAID (100%)', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    ELIGIBLE_FOR_MANUFACTURER_QUEUE: { label: 'QUEUE ELIGIBLE', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/40' },
    WAITING_AT_MANUFACTURER: { label: 'WAITING AT MFR', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    MANUFACTURER_BERTH_ASSIGNED: { label: 'MFR BERTH ASSIGNED', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/40' },
    LOADING: { label: 'LOADING CEMENT', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/50' },
    LOADING_DELAYED: { label: 'LOADING DELAYED', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    LOADING_COMPLETE: { label: 'LOADING COMPLETE', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    DEPARTING_MANUFACTURER: { label: 'DEPARTING MFR', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/40' },
    RETURNING_TO_VIGOR: { label: 'RETURNING TO VIGOR', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border-[#0E7C86]/40' },
    MAINTENANCE: { label: 'MAINTENANCE', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
    OUT_OF_SERVICE: { label: 'OUT OF SERVICE', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    COMPLETED: { label: 'VOYAGE COMPLETED', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
  };

  const config = stageLabels[stage] || { label: stage, bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' };

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
    READY: { label: 'READY', dot: 'bg-[#0C9349]', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    AT_RISK: { label: 'AT RISK', dot: 'bg-[#B5760F]', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    BLOCKED: { label: 'BLOCKED', dot: 'bg-[#AE3B2E]', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    DELAYED: { label: 'DELAYED', dot: 'bg-[#AE3B2E]', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
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
    ON_TRACK: { label: 'ON TRACK', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    AT_RISK: { label: 'AT RISK', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    DELAYED: { label: 'DELAYED', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    ARRIVAL_OVERDUE: { label: 'ARRIVAL OVERDUE', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    UNKNOWN: { label: 'UNKNOWN', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
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
    CURRENT: { label: 'CURRENT', bg: 'bg-[#E7F4EB]', text: 'text-[#0A7A3D]', border: 'border-[#0C9349]/30' },
    STALE: { label: 'STALE', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    INSUFFICIENT: { label: 'INSUFFICIENT', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/40' },
    UNAVAILABLE: { label: 'UNAVAILABLE', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
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
    ACTUAL: { label: 'ACTUAL', bg: 'bg-[#14181A]', text: 'text-white' },
    CONFIRMED: { label: 'CONFIRMED', bg: 'bg-[#0A7A3D]', text: 'text-white' },
    PLANNED: { label: 'PLANNED', bg: 'bg-[#E1DED4]', text: 'text-[#14181A]' },
    FORECAST: { label: 'FORECAST', bg: 'bg-[#E4F1F2]', text: 'text-[#0E7C86]', border: 'border border-[#0E7C86]/30' },
    SIMULATED: { label: 'SIMULATED', bg: 'bg-[#F4EBDB]', text: 'text-[#C99A5B]', border: 'border border-[#C99A5B]/40' },
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
    MORE_THAN_7_DAYS: { label: '> 7 Days', bg: 'bg-[#F7F5F0]', text: 'text-[#3F4A47]', border: 'border-[#C9C4B6]' },
    DUE_WITHIN_7_DAYS: { label: 'Due in < 7d', bg: 'bg-[#F4EBDB]', text: 'text-[#C99A5B]', border: 'border-[#C99A5B]/40' },
    DUE_WITHIN_3_DAYS: { label: 'Due in < 3d', bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/40' },
    DUE_WITHIN_48_HOURS: { label: `${Math.max(0, Math.round(hoursRemaining))}h remaining`, bg: 'bg-[#FBF0DD]', text: 'text-[#B5760F]', border: 'border-[#B5760F]/60' },
    DUE_WITHIN_24_HOURS: { label: `${Math.max(0, Math.round(hoursRemaining))}h left!`, bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]/60' },
    DUE_TODAY: { label: 'DUE TODAY', bg: 'bg-[#F8E7E3]', text: 'text-[#AE3B2E]', border: 'border-[#AE3B2E]' },
    OVERDUE: { label: 'OVERDUE', bg: 'bg-[#AE3B2E]', text: 'text-white', border: 'border-[#AE3B2E]' },
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
    <div className={`p-2.5 rounded-lg border ${info.isBlocked ? 'bg-[#F8E7E3]/60 border-[#AE3B2E]/30' : 'bg-[#E7F4EB]/60 border-[#0C9349]/30'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3F4A47]">
          Current Operational Blocker
        </span>
        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
            info.isBlocked ? 'bg-[#AE3B2E] text-white' : 'bg-[#0A7A3D] text-white'
          }`}
        >
          {info.name}
        </span>
      </div>
      {description && (
        <p className="mt-1.5 text-xs text-[#14181A] font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
