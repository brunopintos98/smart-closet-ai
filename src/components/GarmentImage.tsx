"use client";

import { useEffect, useState } from "react";
import { loadPhoto } from "@/lib/storage/photos";
import type { Garment } from "@/types/wardrobe";
import { GarmentIllustration } from "./GarmentIllustration";

export function usePhotoUrl(photoId: string | undefined): string | null {
  const [state, setState] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (!photoId) return;
    let url: string | null = null;
    let cancelled = false;
    loadPhoto(photoId).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setState({ id: photoId, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoId]);

  return state && state.id === photoId ? state.url : null;
}

export function GarmentImage({ garment, className = "" }: { garment: Garment; className?: string }) {
  const url = usePhotoUrl(garment.photoId);
  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {url ? (
        // Object URLs from IndexedDB blobs cannot go through next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={garment.name} className="size-full object-cover" />
      ) : (
        <GarmentIllustration
          kind={garment.kind}
          category={garment.category}
          color={garment.color}
          className="size-full p-[14%]"
        />
      )}
    </div>
  );
}
