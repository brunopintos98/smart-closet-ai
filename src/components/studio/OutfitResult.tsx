"use client";

import { Bookmark, BookmarkCheck, Check, RefreshCw, Share2, TriangleAlert } from "lucide-react";
import { copy, formatReason, formatViolation } from "@/copy/es-AR";
import type { OutfitPieces, ScoredOutfit } from "@/types/outfit";
import { GarmentImage } from "../GarmentImage";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toast";

const ORDER: (keyof OutfitPieces)[] = ["outerwear", "top", "onePiece", "bottom", "footwear"];

export function OutfitResult({
  outfit,
  position,
  total,
  isSaved,
  stale,
  onTryAnother,
  onSave,
}: {
  outfit: ScoredOutfit;
  position: number;
  total: number;
  isSaved: boolean;
  stale: boolean;
  onTryAnother: () => void;
  onSave: () => void;
}) {
  const toast = useToast();
  const pieces = ORDER.flatMap((slot) => {
    const g = outfit.pieces[slot];
    return g ? [{ slot, garment: g }] : [];
  });

  return (
    <section key={outfit.id} className="animate-rise space-y-4" aria-labelledby="outfit-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="outfit-title" className="font-serif text-2xl">{copy.studio.optionCounter(position, total)}</h2>
        <span className="text-sm text-muted">{copy.studio.match(outfit.score)}</span>
      </div>

      {stale && <p className="rounded-xl bg-sand px-3 py-2 text-xs text-muted">{copy.studio.staleHint}</p>}

      <ul className={`grid gap-3 ${pieces.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {pieces.map(({ slot, garment }) => (
          <li key={garment.id} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            <GarmentImage garment={garment} className="aspect-square" />
            <div className="p-3">
              <p className="eyebrow !text-[10px]">{copy.studio.pieceLabels[slot]}</p>
              <p className="mt-0.5 text-sm leading-snug">{garment.name}</p>
            </div>
          </li>
        ))}
      </ul>

      {outfit.violations.length > 0 && (
        <div className="rounded-2xl bg-status-simulated-bg p-4 text-sm text-status-simulated" role="status">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" /> {copy.studio.bestEffortTitle}
          </p>
          <p className="mt-1">{copy.studio.bestEffortBody}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {outfit.violations.map((v, i) => <li key={i}>{formatViolation(v)}</li>)}
          </ul>
        </div>
      )}

      {outfit.reasons.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <h3 className="eyebrow mb-2">{copy.studio.whyTitle}</h3>
          <ul className="space-y-2 text-sm">
            {outfit.reasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-status-working" />
                <span>{formatReason(r)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-secondary" onClick={onTryAnother} disabled={total < 2}>
          <RefreshCw className="size-4" /> {copy.studio.tryAnother}
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSaved}>
          {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          {isSaved ? copy.studio.saved : copy.studio.save}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-ghost w-full justify-center text-sm text-muted"
        onClick={() => toast.show(copy.share.toast)}
      >
        <Share2 className="size-4" /> {copy.studio.share} <StatusBadge status="comingSoon" />
      </button>
    </section>
  );
}
