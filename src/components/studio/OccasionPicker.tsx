"use client";

import { Briefcase, Coffee, Dumbbell, Gem, Wine } from "lucide-react";
import { copy, occasionLabels } from "@/copy/es-AR";
import { OCCASIONS, type Occasion } from "@/types/wardrobe";

const ICONS = { office: Briefcase, casual: Coffee, dinner: Wine, sport: Dumbbell, formal: Gem } as const;

export function OccasionPicker({ value, onChange }: { value: Occasion; onChange: (o: Occasion) => void }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{copy.studio.occasionLabel}</legend>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap">
        {OCCASIONS.map((o) => {
          const Icon = ICONS[o];
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                active ? "bg-ink text-paper" : "bg-surface text-ink ring-1 ring-line hover:bg-sand"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {occasionLabels[o]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
