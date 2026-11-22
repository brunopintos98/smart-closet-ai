"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { copy } from "@/copy/es-AR";

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-rise relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 pb-8 shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost -mr-2 rounded-full p-2" aria-label={copy.common.close}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
