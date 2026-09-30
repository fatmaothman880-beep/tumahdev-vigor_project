import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

/** Native dialog supplies focus containment, Escape and focus restoration. */
export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={subtitle ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); onClose(); }}
      className={`m-auto p-0 w-[calc(100%-2rem)] ${maxWidth} max-h-[90dvh] rounded-xl border border-line bg-surface text-foreground shadow-2xl backdrop:bg-black/70`}>
      <div className="flex flex-col max-h-[90dvh]">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line shrink-0">
          <div className="min-w-0"><h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p id={descriptionId} className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label="Close modal"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </dialog>, document.body,
  );
}
