"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { categoryLabels, copy, occasionLabels } from "@/copy/es-AR";
import type { GarmentCategory, Occasion } from "@/types/wardrobe";

export function ColdStartNotice({
  occasion,
  missing,
  canUseSample,
  onUseSample,
}: {
  occasion: Occasion;
  missing: GarmentCategory[];
  canUseSample: boolean;
  onUseSample: () => void;
}) {
  return (
    <section role="alert" className="animate-rise rounded-3xl bg-accent-soft p-5">
      <h3 className="flex items-center gap-2 font-serif text-lg">
        <CircleAlert className="size-5 text-accent" /> {copy.coldStart.title}
      </h3>
      <p className="mt-2 text-sm">{copy.coldStart.body(occasionLabels[occasion].toLowerCase())}</p>
      <ul className="mt-2 list-inside list-disc text-sm">
        {missing.map((c) => (
          <li key={c}>
            {c === "footwear" ? copy.coldStart.missingFootwear : copy.coldStart.missingItem(categoryLabels[c].singular)}
          </li>
        ))}
      </ul>
      {(missing.includes("top") || missing.includes("bottom")) && (
        <p className="mt-2 text-xs text-muted">{copy.coldStart.hint}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {canUseSample && (
          <button type="button" className="btn btn-primary" onClick={onUseSample}>
            {copy.coldStart.useSample}
          </button>
        )}
        <Link href="/wardrobe?add=1" className="btn btn-secondary">
          {copy.coldStart.addGarment}
        </Link>
      </div>
    </section>
  );
}
