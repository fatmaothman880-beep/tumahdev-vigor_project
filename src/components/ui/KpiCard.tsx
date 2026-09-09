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
  const borderStyles = {
    default: 'border-[#E1DED4]',
    success: 'border-[#0C9349]/40',
    warning: 'border-[#B5760F]/40',
    danger: 'border-[#AE3B2E]/40',
    teal: 'border-[#0E7C86]/40',
    sand: 'border-[#C99A5B]/40',
  }[variant];

  const valueStyles = {
    default: 'text-[#14181A]',
    success: 'text-[#0A7A3D]',
    warning: 'text-[#B5760F]',
    danger: 'text-[#AE3B2E]',
    teal: 'text-[#0E7C86]',
    sand: 'text-[#C99A5B]',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${borderStyles} p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#3F4A47] hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#3F4A47] truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && <span className="text-[#3F4A47]">{icon}</span>}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${valueStyles}`}>
        {value}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-[#3F4A47] font-medium truncate">
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E1DED4] mb-6">
      <div>
        {eyebrow && (
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#0A7A3D] mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#14181A]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[#3F4A47] max-w-3xl leading-relaxed">
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
    <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-[#E1DED4]">
      <div>
        <h2 className="text-base font-bold text-[#14181A] uppercase tracking-wide">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-[#3F4A47]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-[#C9C4B6] rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between p-5 border-b border-[#E1DED4]">
          <div>
            <h3 className="text-lg font-bold text-[#14181A]">{title}</h3>
            {subtitle && <p className="text-xs text-[#3F4A47] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#3F4A47] hover:text-[#14181A] p-1 rounded-md hover:bg-[#F7F5F0] transition"
          >
            ✕
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
