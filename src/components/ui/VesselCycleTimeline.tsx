import React from 'react';
import { Voyage } from '../../types';
import { formatDateTime, formatTime } from '../../lib/format';
import { ScheduleSourceBadge } from './StatusBadge';
import { Anchor, Fuel, CreditCard, Ship, Factory, ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface VesselCycleTimelineProps {
  voyage: Voyage;
}

interface StepItem {
  id: string;
  name: string;
  sub: string;
  icon: React.ReactNode;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'AT_RISK' | 'BLOCKED';
  timeLabel?: string;
  source: 'ACTUAL' | 'CONFIRMED' | 'PLANNED' | 'FORECAST';
  detail?: string;
}

export function VesselCycleTimeline({ voyage }: VesselCycleTimelineProps) {
  // Construct the sequential cycle steps based on current voyage stage
  const steps: StepItem[] = [
    {
      id: 'step-unload',
      name: 'VIGOR Unloading',
      sub: 'Berth B01 pneumatic discharge',
      icon: <Anchor className="w-4 h-4" />,
      status:
        voyage.unloadedTonnes >= (voyage.actualCargoT || 9600)
          ? 'COMPLETED'
          : voyage.currentStage === 'UNLOADING'
          ? voyage.risk === 'AT_RISK'
            ? 'AT_RISK'
            : 'CURRENT'
          : voyage.currentStage === 'RETURNING_TO_VIGOR' || voyage.currentStage === 'BERTHED_AT_VIGOR'
          ? 'UPCOMING'
          : 'COMPLETED',
      timeLabel: voyage.actualUnloadEnd
        ? `Finished ${formatTime(voyage.actualUnloadEnd)}`
        : `Est. finish ${formatTime(voyage.forecastUnloadEnd)}`,
      source: voyage.actualUnloadEnd ? 'ACTUAL' : 'FORECAST',
      detail: `${Math.round((voyage.unloadedTonnes / (voyage.actualCargoT || 9600)) * 100)}% unloaded`,
    },
    {
      id: 'step-fuel',
      name: 'Fuel Bunkering',
      sub: voyage.fuelRequired ? 'Barge delivery post-berth' : 'Not required this cycle',
      icon: <Fuel className="w-4 h-4" />,
      status: !voyage.fuelRequired
        ? 'COMPLETED'
        : voyage.currentStage === 'WAITING_FOR_FUEL' || voyage.currentStage === 'FUEL_IN_PROGRESS'
        ? 'CURRENT'
        : voyage.currentStage === 'UNLOADING'
        ? 'UPCOMING'
        : 'COMPLETED',
      timeLabel: voyage.fuelRequired ? 'Barge scheduled' : 'Bypassed',
      source: 'PLANNED',
      detail: voyage.fuelRequired ? '45T MGO Puma Energy' : undefined,
    },
    {
      id: 'step-depart-vigor',
      name: 'VIGOR Departure',
      sub: 'Zanzibar Channel departure',
      icon: <Ship className="w-4 h-4" />,
      status: voyage.outboundDepartureActual
        ? 'COMPLETED'
        : voyage.currentStage === 'READY_TO_DEPART'
        ? 'CURRENT'
        : voyage.currentStage === 'SAILING_TO_MANUFACTURER' || voyage.currentStage === 'RETURNING_TO_VIGOR'
        ? 'COMPLETED'
        : 'UPCOMING',
      timeLabel: voyage.outboundDepartureActual
        ? `Dep. ${formatDateTime(voyage.outboundDepartureActual)}`
        : `Est. ${formatDateTime(voyage.outboundDepartureForecast)}`,
      source: voyage.outboundDepartureActual ? 'ACTUAL' : 'FORECAST',
    },
    {
      id: 'step-mfr-pmt',
      name: 'Manufacturer Payment',
      sub: 'Tanga Cement advance settlement',
      icon: <CreditCard className="w-4 h-4" />,
      status:
        voyage.currentBlocker === 'MANUFACTURER_PAYMENT'
          ? 'AT_RISK'
          : voyage.manufacturerSlotConfirmed || voyage.currentStage === 'SAILING_TO_MANUFACTURER'
          ? 'COMPLETED'
          : 'UPCOMING',
      timeLabel: 'Eligibility gate',
      source: 'CONFIRMED',
      detail: voyage.currentBlocker === 'MANUFACTURER_PAYMENT' ? 'TZS 200M remaining' : 'Fully paid',
    },
    {
      id: 'step-mfr-queue',
      name: 'Manufacturer Queue & Berth',
      sub: 'Mamba Wharf loading slot',
      icon: <Factory className="w-4 h-4" />,
      status: voyage.manufacturerSlotConfirmed
        ? 'COMPLETED'
        : voyage.currentStage === 'WAITING_AT_MANUFACTURER'
        ? 'CURRENT'
        : voyage.currentStage === 'RETURNING_TO_VIGOR'
        ? 'COMPLETED'
        : 'UPCOMING',
      timeLabel: voyage.manufacturerSlotConfirmed
        ? `Confirmed ${formatDateTime(voyage.manufacturerSlotConfirmed)}`
        : `Predicted ${formatDateTime(voyage.manufacturerSlotForecast)}`,
      source: voyage.manufacturerSlotConfirmed ? 'CONFIRMED' : 'FORECAST',
      detail: voyage.manufacturerQueuePosition ? `Queue Pos #${voyage.manufacturerQueuePosition}` : undefined,
    },
    {
      id: 'step-loading',
      name: 'Manufacturer Loading',
      sub: 'Bulk Portland Cement loading',
      icon: <Anchor className="w-4 h-4" />,
      status: voyage.manufacturerLoadingEndActual
        ? 'COMPLETED'
        : voyage.currentStage === 'LOADING'
        ? 'CURRENT'
        : voyage.currentStage === 'RETURNING_TO_VIGOR'
        ? 'COMPLETED'
        : 'UPCOMING',
      timeLabel: voyage.manufacturerLoadingEndActual
        ? `Loaded ${formatDateTime(voyage.manufacturerLoadingEndActual)}`
        : `Est. ${formatDateTime(voyage.manufacturerLoadingEndForecast)}`,
      source: voyage.manufacturerLoadingEndActual ? 'ACTUAL' : 'FORECAST',
      detail: `${(voyage.actualCargoT || 9400).toLocaleString()}T CEM I`,
    },
    {
      id: 'step-return',
      name: 'Return Transit',
      sub: 'Tanga to Zanzibar Channel',
      icon: <Ship className="w-4 h-4" />,
      status:
        voyage.currentStage === 'RETURNING_TO_VIGOR'
          ? voyage.berthConflict
            ? 'AT_RISK'
            : 'CURRENT'
          : voyage.currentStage === 'BERTHED_AT_VIGOR' || voyage.currentStage === 'UNLOADING'
          ? 'COMPLETED'
          : 'UPCOMING',
      timeLabel: `ETA ${formatDateTime(voyage.returnEtaForecast)}`,
      source: 'FORECAST',
      detail: voyage.berthConflict ? `Anchor wait ~${voyage.predictedAnchorageWaitHours}h` : 'Direct berthing expected',
    },
    {
      id: 'step-vigor-berth',
      name: 'VIGOR Berth B01',
      sub: 'Next rotation berthing',
      icon: <Anchor className="w-4 h-4" />,
      status: voyage.currentStage === 'BERTHED_AT_VIGOR' ? 'CURRENT' : 'UPCOMING',
      timeLabel: `Slot ${formatDateTime(voyage.expectedBerthRelease || voyage.returnEtaForecast)}`,
      source: 'FORECAST',
    },
  ];

  return (
    <div className="bg-white border border-[#E1DED4] rounded-xl p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0A7A3D]" />
            Full Vessel Cycle Dependency Timeline
          </h3>
          <p className="text-xs text-[#3F4A47] mt-0.5">
            Sequential supply chain milestones from VIGOR discharge through manufacturer loading and return.
          </p>
        </div>
        <span className="text-xs font-mono text-[#3F4A47] bg-[#F7F5F0] px-2 py-1 rounded border border-[#E1DED4]">
          Voyage: <strong>{voyage.voyageNumber}</strong>
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-[850px] gap-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            const borderColors = {
              COMPLETED: 'border-[#0C9349]',
              CURRENT: 'border-[#0E7C86] ring-2 ring-[#0E7C86]/20 bg-[#E4F1F2]/20',
              UPCOMING: 'border-[#E1DED4] opacity-75',
              AT_RISK: 'border-[#B5760F] ring-2 ring-[#B5760F]/30 bg-[#FBF0DD]/30',
              BLOCKED: 'border-[#AE3B2E] ring-2 ring-[#AE3B2E]/30 bg-[#F8E7E3]/30',
            }[step.status];

            const badgeBg = {
              COMPLETED: 'bg-[#0C9349] text-white',
              CURRENT: 'bg-[#0E7C86] text-white',
              UPCOMING: 'bg-[#E1DED4] text-[#3F4A47]',
              AT_RISK: 'bg-[#B5760F] text-white',
              BLOCKED: 'bg-[#AE3B2E] text-white',
            }[step.status];

            return (
              <React.Fragment key={step.id}>
                <div className={`flex-1 p-3 rounded-lg border ${borderColors} bg-white flex flex-col justify-between min-h-[140px]`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeBg}`}>
                        {idx + 1}
                      </span>
                      <ScheduleSourceBadge source={step.source} />
                    </div>
                    <h4 className="text-xs font-bold text-[#14181A] line-clamp-1">{step.name}</h4>
                    <p className="text-[10px] text-[#3F4A47] line-clamp-1">{step.sub}</p>
                  </div>

                  <div className="pt-2 border-t border-[#E1DED4] mt-2 text-[11px]">
                    <div className="font-mono text-[10px] text-[#14181A] font-medium leading-tight">
                      {step.timeLabel}
                    </div>
                    {step.detail && (
                      <div className="text-[10px] font-semibold text-[#0A7A3D] mt-0.5 truncate">
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div className="flex items-center justify-center pt-12 text-[#C9C4B6]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
