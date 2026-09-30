import React from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

export function Feedback({ kind, title, children, action }: {
  kind: 'loading' | 'empty' | 'error'; title: string; children?: React.ReactNode; action?: React.ReactNode;
}) {
  const Icon = kind === 'loading' ? LoaderCircle : kind === 'error' ? AlertCircle : Inbox;
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-lg border px-4 py-4 ${kind === 'error' ? 'border-danger/25 bg-danger-soft/40' : 'border-line bg-surface'}`}>
    <Icon aria-hidden className={`w-4 h-4 mt-0.5 shrink-0 ${kind === 'loading' ? 'animate-spin text-muted' : kind === 'error' ? 'text-danger' : 'text-muted'}`} />
    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p>{children && <div className="text-xs text-muted mt-1 leading-relaxed">{children}</div>}</div>{action}
  </div>;
}
