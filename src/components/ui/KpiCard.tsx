import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'teal' | 'sand';
  badge?: React.ReactNode;
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  badge,
  onClick,
}: KpiCardProps) {
  const valueStyles = {
    default: 'text-foreground',
    success: 'text-positive',
    warning: 'text-warning',
    danger: 'text-danger',
    teal: 'text-info',
    sand: 'text-warning',
  }[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
      className={`bg-surface rounded-xl border border-line p-5 transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:border-line hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold tracking-wide text-muted truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && <span className="text-muted">{icon}</span>}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight ${valueStyles}`}>
        {value}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-muted leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 mb-6">
      <div>
        {eyebrow && (
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-positive mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{children}</div>}
    </div>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-line">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export { Modal } from './Modal';
export type { ModalProps } from './Modal';
