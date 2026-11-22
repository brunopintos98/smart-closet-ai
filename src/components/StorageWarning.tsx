"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { copy } from "@/copy/es-AR";
import { isLocalStorageAvailable } from "@/lib/storage/local";
import { isIndexedDBAvailable } from "@/lib/storage/photos";

export function StorageWarning() {
  const [state, setState] = useState<{ local: boolean; idb: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    isIndexedDBAvailable().then((idb) => {
      if (!cancelled) setState({ local: isLocalStorageAvailable(), idb });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || (state.local && state.idb)) return null;
  const message = !state.local ? copy.storage.unavailable : copy.storage.photosUnavailable;

  return (
    <div role="alert" className="border-b border-status-simulated/20 bg-status-simulated-bg">
      <p className="mx-auto flex max-w-3xl items-start gap-2 px-4 py-2.5 text-sm text-status-simulated">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        {message}
      </p>
    </div>
  );
}
