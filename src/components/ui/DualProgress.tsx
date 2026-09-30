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
    green: 'bg-brand',
    amber: 'bg-warning-strong',
    teal: 'bg-info-strong',
    danger: 'bg-critical',
    sand: 'bg-warning-strong',
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
          {label && <span className="text-muted font-medium">{label}</span>}
          {showPercentage && <span className="font-mono font-semibold text-foreground">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-raised rounded-full overflow-hidden ${heightStyles}`}>
        <div
          className={`${heightStyles} rounded-full transition-all duration-300 ${colorStyles}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {subtext && <p className="text-[11px] text-muted mt-1 font-mono">{subtext}</p>}
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
    <div className="space-y-3 bg-canvas p-3 rounded-lg border border-line">
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Cargo Unloaded
          </span>
          <span className="font-mono font-bold text-positive">
            {cargoClamped}% ({unloadedT.toLocaleString()} / {totalCargoT.toLocaleString()} T)
          </span>
        </div>
        <div className="w-full bg-raised h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-300"
            style={{ width: `${cargoClamped}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-info-strong" />
            Planned Schedule Elapsed
          </span>
          <span className="font-mono font-medium text-info">
            {schedClamped}%
          </span>
        </div>
        <div className="w-full bg-raised h-2 rounded-full overflow-hidden">
          <div
            className="bg-info-strong h-full rounded-full transition-all duration-300"
            style={{ width: `${schedClamped}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-line text-[11px]">
        <span className="text-muted font-medium">
          Pace:{' '}
          <strong className={paceGap >= 0 ? 'text-positive' : 'text-danger'}>
            {paceGap >= 0 ? `+${paceGap}% ahead of schedule` : `${Math.abs(paceGap)}% behind schedule`}
          </strong>
        </span>
        {rateTph && (
          <span className="font-mono text-foreground">
            Current: <strong>{Math.round(rateTph)} t/h</strong>
          </span>
        )}
        {timeRemainingStr && (
          <span className="font-mono text-muted">
            Est. remaining: <strong>{timeRemainingStr}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
