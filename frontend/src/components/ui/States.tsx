import { CircleAlert, PackageX, Plus, RefreshCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  Icon = PackageX,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="rounded-full p-3 mb-3 bg-line/50">
        <Icon size={22} className="text-gray-500" />
      </div>
      <div className="font-semibold text-ink">{title}</div>
      <p className="text-sm mt-1 max-w-xs text-gray-500">{body}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-deep transition-colors"
        >
          <Plus size={15} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="rounded-full p-3 mb-3 bg-danger-tint">
        <CircleAlert size={22} className="text-danger" />
      </div>
      <div className="font-semibold text-ink">Unable to load operational data.</div>
      <p className="text-sm mt-1 max-w-xs text-gray-500">Check the API connection and try again.</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border border-line-strong text-ink bg-paper hover:bg-line/40 transition-colors"
      >
        <RefreshCcw size={14} /> Retry
      </button>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-line" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  );
}
