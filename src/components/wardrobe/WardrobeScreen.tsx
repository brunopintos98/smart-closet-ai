"use client";

import { CloudRain, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryLabels, colorLabels, copy, warmthLabels } from "@/copy/es-AR";
import { COLORS } from "@/lib/recommendation/colors";
import { deletePhoto } from "@/lib/storage/photos";
import { garmentsStore, useActiveWardrobe, wardrobeSourceStore } from "@/lib/store/appStore";
import { GARMENT_CATEGORIES, type Garment, type GarmentCategory } from "@/types/wardrobe";
import { GarmentImage } from "../GarmentImage";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toast";
import { GarmentForm } from "./GarmentForm";

type Filter = GarmentCategory | "all";
type FormState = { open: false } | { open: true; garment: Garment | null; nonce: number };

function GarmentCard({ garment, onEdit, onDelete }: { garment: Garment; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <li className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
      <GarmentImage garment={garment} className="aspect-[4/5]" />
      <div className="space-y-1 p-3">
        <p className="text-sm leading-snug">{garment.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span className="size-2.5 rounded-full ring-1 ring-black/15" style={{ backgroundColor: COLORS[garment.color].hex }} aria-hidden="true" />
          {colorLabels[garment.color]} · {warmthLabels[garment.warmth]} · F{garment.formality}
          {garment.rainFriendly && (garment.category === "footwear" || garment.category === "outerwear") && (
            <CloudRain className="size-3.5" aria-label={copy.wardrobe.rainFriendly} />
          )}
        </p>
        {(onEdit || onDelete) && (
          <div className="-ml-2 flex gap-1 pt-1">
            <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={onEdit} aria-label={`${copy.common.edit} ${garment.name}`}>
              <Pencil className="size-3.5" /> {copy.common.edit}
            </button>
            <button type="button" className="btn btn-ghost px-2 py-1 text-xs text-danger" onClick={onDelete} aria-label={`${copy.common.delete} ${garment.name}`}>
              <Trash2 className="size-3.5" /> {copy.common.delete}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function WardrobeScreen() {
  const toast = useToast();
  const { source, garments } = useActiveWardrobe();
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<FormState>({ open: false });

  const openAdd = () => {
    wardrobeSourceStore.set("mine");
    setForm({ open: true, garment: null, nonce: Date.now() });
  };

  // "Agregar prendas" from the cold-start notice links here with ?add=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname);
    Promise.resolve().then(openAdd);
  }, []);

  const remove = async (g: Garment) => {
    if (!window.confirm(copy.wardrobe.deleteConfirm(g.name))) return;
    if (g.photoId) await deletePhoto(g.photoId);
    garmentsStore.set((list) => list.filter((x) => x.id !== g.id));
    toast.show(copy.wardrobe.deleted);
  };

  const visible = filter === "all" ? garments : garments.filter((g) => g.category === filter);
  const isMine = source === "mine";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow">{copy.wardrobe.eyebrow}</p>
          <StatusBadge status="working" />
        </div>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-serif text-4xl tracking-tight">{copy.wardrobe.title}</h1>
          <span className="pb-1 text-sm text-muted">{copy.wardrobe.count(garments.length)}</span>
        </div>
      </header>

      <div className="grid grid-cols-2 rounded-full bg-sand p-1 text-sm" role="radiogroup" aria-label={copy.wardrobe.title}>
        {(["sample", "mine"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={source === s}
            onClick={() => wardrobeSourceStore.set(s)}
            className={`rounded-full py-2 transition ${source === s ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
          >
            {s === "sample" ? copy.wardrobe.sourceSample : copy.wardrobe.sourceMine}
          </button>
        ))}
      </div>

      {!isMine && (
        <p className="flex items-start gap-2 text-xs text-muted">
          <StatusBadge status="simulated" />
          <span className="pt-0.5">{copy.wardrobe.sampleNote} {copy.wardrobe.sampleReadOnly}</span>
        </p>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]" role="group" aria-label="Filtros">
        {(["all", ...GARMENT_CATEGORIES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
              filter === f ? "bg-ink text-paper" : "bg-surface ring-1 ring-line hover:bg-sand"
            }`}
          >
            {f === "all" ? copy.wardrobe.all : categoryLabels[f].plural}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-primary w-full" onClick={openAdd}>
        <Plus className="size-4" /> {copy.wardrobe.add}
      </button>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-serif text-lg">{garments.length === 0 ? copy.wardrobe.empty : copy.wardrobe.emptyFiltered}</p>
          {garments.length === 0 && <p className="mt-1 text-sm text-muted">{copy.wardrobe.emptyHint}</p>}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((g) => (
            <GarmentCard
              key={g.id}
              garment={g}
              onEdit={isMine ? () => setForm({ open: true, garment: g, nonce: Date.now() }) : undefined}
              onDelete={isMine ? () => remove(g) : undefined}
            />
          ))}
        </ul>
      )}

      {form.open && (
        <GarmentForm key={form.nonce} open garment={form.garment} onClose={() => setForm({ open: false })} />
      )}
    </div>
  );
}
