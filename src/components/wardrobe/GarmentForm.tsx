"use client";

import { Camera, ImageOff, Loader2, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { categoryLabels, colorLabels, copy, formalityLabels, occasionLabels, warmthLabels } from "@/copy/es-AR";
import { compressImage, ImageProcessingError } from "@/lib/image/compress";
import { COLORS } from "@/lib/recommendation/colors";
import { deletePhoto, loadPhoto, savePhoto } from "@/lib/storage/photos";
import { fetchCatalogEnabled, requestCatalog } from "@/lib/catalog/client";
import type { CatalogSuggestion } from "@/lib/catalog/schema";
import { garmentsStore, newId } from "@/lib/store/appStore";
import {
  COLOR_IDS,
  GARMENT_CATEGORIES,
  OCCASIONS,
  WARMTH_LEVELS,
  type Formality,
  type Garment,
  type GarmentCategory,
  type GarmentKind,
} from "@/types/wardrobe";
import { usePhotoUrl } from "../GarmentImage";
import { GarmentIllustration, KINDS_BY_CATEGORY } from "../GarmentIllustration";
import { Sheet } from "../Sheet";
import { StatusBadge } from "../StatusBadge";
import { useToast } from "../Toast";

const KIND_LABELS: Record<GarmentKind, string> = {
  tshirt: "Remera", shirt: "Camisa", sweater: "Sweater o buzo",
  pants: "Pantalón", jeans: "Jean", skirt: "Pollera", shorts: "Short",
  jacket: "Campera", blazer: "Blazer", coat: "Tapado", raincoat: "Impermeable",
  sneakers: "Zapatillas", boots: "Botas", loafers: "Zapatos o mocasines", heels: "Tacos",
  dress: "Vestido o enterito",
};

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {children}
      {error && <p className="mt-1 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}

const chip = (active: boolean) =>
  `rounded-full px-3 py-2 text-sm transition ${active ? "bg-ink text-paper" : "bg-surface ring-1 ring-line hover:bg-sand"}`;

type Draft = Omit<Garment, "id" | "createdAt">;

const EMPTY: Draft = {
  name: "",
  category: "top",
  kind: "tshirt",
  color: "black",
  warmth: "medium",
  formality: 3,
  occasions: [],
  rainFriendly: false,
};

export function GarmentForm({
  open,
  onClose,
  garment,
}: {
  open: boolean;
  onClose: () => void;
  garment: Garment | null;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(garment ?? EMPTY);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoState, setPhotoState] = useState<{ busy: boolean; message?: string; error?: boolean }>({ busy: false });
  const [errors, setErrors] = useState<{ name?: string; occasions?: string }>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const existingUrl = usePhotoUrl(removePhoto ? undefined : garment?.photoId);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [ai, setAi] = useState<{ busy: boolean; message?: string; error?: boolean }>({ busy: false });

  useEffect(() => {
    let cancelled = false;
    fetchCatalogEnabled().then((enabled) => !cancelled && setAiEnabled(enabled));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoState({ busy: true, message: copy.garmentForm.processing });
    try {
      const blob = await compressImage(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setRemovePhoto(false);
      setPhotoState({ busy: false, message: copy.garmentForm.photoCompressed(Math.round(blob.size / 1024)) });
    } catch (error) {
      const notImage = error instanceof ImageProcessingError && error.code === "notImage";
      setPhotoState({
        busy: false,
        error: true,
        message: notImage ? copy.garmentForm.photoNotImage : copy.garmentForm.photoUnreadable,
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      name: draft.name.trim() ? undefined : copy.garmentForm.nameRequired,
      occasions: draft.occasions.length ? undefined : copy.garmentForm.occasionsRequired,
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.occasions) return;

    let photoId = removePhoto ? undefined : garment?.photoId;
    if (photo) {
      photoId = newId("photo");
      await savePhoto(photoId, photo.blob);
    }
    if (garment?.photoId && garment.photoId !== photoId) await deletePhoto(garment.photoId);

    const value: Garment = {
      ...draft,
      name: draft.name.trim(),
      photoId,
      id: garment?.id ?? newId("garment"),
      createdAt: garment?.createdAt ?? new Date().toISOString(),
    };
    garmentsStore.set((list) => (garment ? list.map((g) => (g.id === garment.id ? value : g)) : [value, ...list]));
    toast.show(garment ? copy.garmentForm.updated : copy.garmentForm.saved);
    onClose();
  };

  const previewUrl = photo?.url ?? existingUrl;
  const hasPhoto = Boolean(photo || (!removePhoto && garment?.photoId));

  const applySuggestion = (s: CatalogSuggestion) =>
    setDraft((d) => ({
      ...d,
      ...s,
      // Keep what the user already typed or picked.
      name: d.name.trim() ? d.name : s.name,
      occasions: s.occasions.length ? s.occasions : d.occasions,
    }));

  const catalogWithAi = async () => {
    const blob = photo?.blob ?? (garment?.photoId && !removePhoto ? await loadPhoto(garment.photoId) : undefined);
    if (!blob) {
      setAi({ busy: false, error: true, message: copy.garmentForm.aiNeedsPhoto });
      return;
    }
    setAi({ busy: true, message: copy.garmentForm.aiWorking });
    const result = await requestCatalog(blob);
    if (result.ok) {
      applySuggestion(result.suggestion);
      setErrors({});
      setAi({ busy: false, message: copy.garmentForm.aiDone });
    } else {
      setAi({ busy: false, error: true, message: copy.garmentForm.aiErrors[result.code] });
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={garment ? copy.garmentForm.editTitle : copy.garmentForm.addTitle}>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <Field label={copy.garmentForm.photo}>
          <div className="flex items-center gap-4">
            <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-sand ring-1 ring-line">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <GarmentIllustration kind={draft.kind} category={draft.category} color={draft.color} className="size-full p-3" />
              )}
            </div>
            <div className="space-y-1">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                id="garment-photo"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <label htmlFor="garment-photo" className="btn btn-secondary cursor-pointer py-2 text-sm">
                {photoState.busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                {previewUrl ? copy.garmentForm.changePhoto : copy.garmentForm.takePhoto}
              </label>
              {previewUrl && (
                <button
                  type="button"
                  className="btn btn-ghost py-1 text-sm text-muted"
                  onClick={() => {
                    setPhoto(null);
                    setRemovePhoto(true);
                    setPhotoState({ busy: false });
                  }}
                >
                  <ImageOff className="size-4" /> {copy.garmentForm.removePhoto}
                </button>
              )}
              {photoState.message && (
                <p className={`text-xs ${photoState.error ? "text-danger" : "text-muted"}`} role={photoState.error ? "alert" : undefined}>
                  {photoState.message}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={!aiEnabled || !hasPhoto || ai.busy || photoState.busy}
                onClick={catalogWithAi}
                className="btn btn-secondary py-2 text-sm"
              >
                {ai.busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {copy.garmentForm.aiButton}
              </button>
              {aiEnabled !== null && <StatusBadge status={aiEnabled ? "working" : "comingSoon"} />}
            </div>
            <p className="mt-2 text-xs text-muted">
              {aiEnabled === null
                ? copy.garmentForm.aiChecking
                : !aiEnabled
                  ? copy.garmentForm.aiNote
                  : hasPhoto
                    ? copy.garmentForm.aiConsent
                    : copy.garmentForm.aiNeedsPhoto}
            </p>
            {ai.message && (
              <p
                className={`mt-2 text-sm ${ai.error ? "text-danger" : "text-status-working"}`}
                role={ai.error ? "alert" : "status"}
              >
                {ai.message}
              </p>
            )}
          </div>
        </Field>

        <Field label={copy.garmentForm.name} error={errors.name}>
          <input
            className="field"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={copy.garmentForm.namePlaceholder}
            maxLength={60}
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field label={copy.garmentForm.category}>
          <div className="flex flex-wrap gap-2">
            {GARMENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={draft.category === c}
                className={chip(draft.category === c)}
                onClick={() => setDraft((d) => ({ ...d, category: c as GarmentCategory, kind: KINDS_BY_CATEGORY[c][0] }))}
              >
                {categoryLabels[c].singular}
              </button>
            ))}
          </div>
          {KINDS_BY_CATEGORY[draft.category].length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS_BY_CATEGORY[draft.category].map((k) => (
                <button key={k} type="button" aria-pressed={draft.kind === k} className={`${chip(draft.kind === k)} !py-1.5 text-xs`} onClick={() => set("kind", k)}>
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label={`${copy.garmentForm.color}: ${colorLabels[draft.color]}`}>
          <div className="flex flex-wrap gap-2">
            {COLOR_IDS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={colorLabels[c]}
                aria-pressed={draft.color === c}
                onClick={() => set("color", c)}
                className={`size-9 rounded-full ring-1 ring-black/15 transition ${draft.color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`}
                style={{ backgroundColor: COLORS[c].hex }}
              />
            ))}
          </div>
        </Field>

        <Field label={copy.garmentForm.warmth}>
          <div className="grid grid-cols-3 gap-2">
            {WARMTH_LEVELS.map((w) => (
              <button key={w} type="button" aria-pressed={draft.warmth === w} className={chip(draft.warmth === w)} onClick={() => set("warmth", w)}>
                {warmthLabels[w]}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`${copy.garmentForm.formality}: ${draft.formality} · ${formalityLabels[draft.formality]}`}>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={draft.formality}
            onChange={(e) => set("formality", Number(e.target.value) as Formality)}
            className="w-full accent-ink"
            aria-label={copy.garmentForm.formality}
          />
          <div className="flex justify-between text-xs text-muted"><span>1</span><span>5</span></div>
        </Field>

        <Field label={copy.garmentForm.occasions} error={errors.occasions}>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => {
              const active = draft.occasions.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={active}
                  className={chip(active)}
                  onClick={() => set("occasions", active ? draft.occasions.filter((x) => x !== o) : [...draft.occasions, o])}
                >
                  {occasionLabels[o]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={copy.garmentForm.rainFriendly}>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" aria-pressed={draft.rainFriendly === v} className={chip(draft.rainFriendly === v)} onClick={() => set("rainFriendly", v)}>
                {v ? copy.garmentForm.yes : copy.garmentForm.no}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{copy.garmentForm.rainHint}</p>
        </Field>

        <div className="sticky bottom-0 -mx-5 flex gap-2 bg-paper px-5 pt-2">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>{copy.common.cancel}</button>
          <button type="submit" className="btn btn-primary flex-1" disabled={photoState.busy || ai.busy}>{copy.garmentForm.save}</button>
        </div>
      </form>
    </Sheet>
  );
}

