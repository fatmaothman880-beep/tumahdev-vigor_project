import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { ReactNode } from "react";

export interface ToastState {
  type: "success" | "error";
  message: string;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] rounded-lg px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-medium text-white animate-fadein ${
        isError ? "bg-danger" : "bg-ink"
      }`}
    >
      {isError ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
      {toast.message}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white">
          <h3 className="font-bold text-[15px] text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
