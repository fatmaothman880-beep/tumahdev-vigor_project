import React from 'react';

export interface ProgressBarProps {
  label?: string;
  value: number; // 0 to 100
  color?: 'green' | 'amber' | 'teal' | 'danger' | 'sand';
  showPercentage?: boolean;
  subtext?: string;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  label,
  value,
  color = 'green',
  showPercentage = true,
  subtext,
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value || 0)));

  const colorStyles = {
    green: 'bg-[#0C9349]',
    amber: 'bg-[#B5760F]',
    teal: 'bg-[#0E7C86]',
    danger: 'bg-[#AE3B2E]',
    sand: 'bg-[#C99A5B]',
  }[color];

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  }[height];

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs mb-1">
          {label && <span className="text-[#3F4A47] font-medium">{label}</span>}
          {showPercentage && <span className="font-mono font-semibold text-[#14181A]">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#E1DED4] rounded-full overflow-hidden ${heightStyles}`}>
        <div
          className={`${heightStyles} rounded-full transition-all duration-300 ${colorStyles}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {subtext && <p className="text-[11px] text-[#3F4A47] mt-1 font-mono">{subtext}</p>}
    </div>
  );
}

export interface DualProgressProps {
  cargoProgress: number; // 0 - 100
  scheduleProgress: number; // 0 - 100
  unloadedT: number;
  totalCargoT: number;
  rateTph?: number;
  timeRemainingStr?: string;
}

export function DualProgress({
  cargoProgress,
  scheduleProgress,
  unloadedT,
  totalCargoT,
  rateTph,
  timeRemainingStr,
}: DualProgressProps) {
  const cargoClamped = Math.min(100, Math.max(0, Math.round(cargoProgress || 0)));
  const schedClamped = Math.min(100, Math.max(0, Math.round(scheduleProgress || 0)));
  const paceGap = cargoClamped - schedClamped;

  return (
    <div className="space-y-3 bg-[#F7F5F0] p-3 rounded-lg border border-[#E1DED4]">
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-semibold text-[#14181A] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0C9349]" />
            Cargo Unloaded
          </span>
          <span className="font-mono font-bold text-[#0A7A3D]">
            {cargoClamped}% ({unloadedT.toLocaleString()} / {totalCargoT.toLocaleString()} T)
          </span>
        </div>
        <div className="w-full bg-[#E1DED4] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#0C9349] h-full rounded-full transition-all duration-300"
            style={{ width: `${cargoClamped}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-semibold text-[#3F4A47] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0E7C86]" />
            Planned Schedule Elapsed
          </span>
          <span className="font-mono font-medium text-[#0E7C86]">
            {schedClamped}%
          </span>
        </div>
        <div className="w-full bg-[#E1DED4] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0E7C86] h-full rounded-full transition-all duration-300"
            style={{ width: `${schedClamped}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#E1DED4] text-[11px]">
        <span className="text-[#3F4A47] font-medium">
          Pace:{' '}
          <strong className={paceGap >= 0 ? 'text-[#0A7A3D]' : 'text-[#AE3B2E]'}>
            {paceGap >= 0 ? `+${paceGap}% ahead of schedule` : `${Math.abs(paceGap)}% behind schedule`}
          </strong>
        </span>
        {rateTph && (
          <span className="font-mono text-[#14181A]">
            Current: <strong>{Math.round(rateTph)} t/h</strong>
          </span>
        )}
        {timeRemainingStr && (
          <span className="font-mono text-[#3F4A47]">
            Est. remaining: <strong>{timeRemainingStr}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
