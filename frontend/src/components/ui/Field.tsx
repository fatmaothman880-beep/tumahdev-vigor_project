import type { ReactNode } from "react";

export const inputCls = (hasError?: string) =>
  `w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors bg-paper text-ink border ${
    hasError ? "border-danger" : "border-line focus:border-teal"
  }`;

export default function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block mb-4">
      <span className="text-xs font-semibold text-ink-soft">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="text-[11px] mt-1 block text-gray-500">{hint}</span>}
      {error && <span className="text-[11px] mt-1 block font-medium text-danger">{error}</span>}
    </label>
  );
}
