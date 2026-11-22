"use client";

import { Bell } from "lucide-react";
import { copy } from "@/copy/es-AR";
import { GarmentIllustration } from "./GarmentIllustration";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./Toast";

function ShoppingIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-xs" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full bg-sand" />
      <svg viewBox="0 0 100 100" className="absolute inset-[22%]">
        <path d="M22 34 L78 34 L84 92 L16 92 Z" fill="#9a4a2f" />
        <path d="M36 34 Q36 14 50 14 Q64 14 64 34" fill="none" stroke="#1d1c1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 52 L70 52" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
      </svg>
      <GarmentIllustration kind="shirt" category="top" color="lightBlue" className="absolute left-[2%] top-[10%] w-[34%] -rotate-12" />
      <GarmentIllustration kind="sneakers" category="footwear" color="white" className="absolute bottom-[6%] right-[0%] w-[36%] rotate-6" />
      <GarmentIllustration kind="skirt" category="bottom" color="camel" className="absolute right-[6%] top-[4%] w-[28%] rotate-12" />
      <span className="absolute bottom-[14%] left-[8%] rounded-full bg-surface px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-line">M · Celeste · $$</span>
    </div>
  );
}

export function ShoppingScreen() {
  const toast = useToast();
  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center gap-2">
        <p className="eyebrow">{copy.shopping.eyebrow}</p>
        <StatusBadge status="comingSoon" />
      </div>
      <ShoppingIllustration />
      <h1 className="mx-auto max-w-md font-serif text-3xl leading-tight tracking-tight">{copy.shopping.title}</h1>
      <div className="mx-auto max-w-md space-y-2 text-muted">
        {copy.shopping.lines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <button type="button" className="btn btn-secondary" onClick={() => toast.show(copy.shopping.notifyToast)}>
        <Bell className="size-4" /> {copy.shopping.notify}
      </button>
    </div>
  );
}
