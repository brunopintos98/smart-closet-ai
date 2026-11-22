"use client";

import Link from "next/link";
import { ChevronRight, Cloud, LogIn, Ruler, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { copy } from "@/copy/es-AR";
import { garmentsStore, savedOutfitsStore, wardrobeSourceStore } from "@/lib/store/appStore";
import { deletePhoto } from "@/lib/storage/photos";
import { Sheet } from "./Sheet";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "./Toast";

function DisabledRow({ icon, label, note }: { icon: ReactNode; label: string; note?: string }) {
  return (
    <li>
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left opacity-70 ring-1 ring-line"
      >
        <span className="text-muted">{icon}</span>
        <span className="flex-1">
          <span className="block text-sm font-medium">{label}</span>
          {note && <span className="block text-xs text-muted">{note}</span>}
        </span>
        <StatusBadge status="comingSoon" />
      </button>
    </li>
  );
}

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();

  const clearData = async () => {
    if (!window.confirm(copy.profile.clearConfirm)) return;
    const photoIds = garmentsStore.get().map((g) => g.photoId).filter(Boolean) as string[];
    await Promise.all(photoIds.map(deletePhoto));
    garmentsStore.set([]);
    savedOutfitsStore.set([]);
    wardrobeSourceStore.set("sample");
    toast.show(copy.profile.cleared);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={copy.profile.title}>
      <ul className="space-y-2">
        <DisabledRow icon={<Ruler className="size-5" />} label={copy.profile.avatar} note={copy.profile.avatarNote} />
        <DisabledRow icon={<LogIn className="size-5" />} label={copy.profile.login} note={copy.profile.loginNote} />
        <DisabledRow icon={<Cloud className="size-5" />} label={copy.profile.sync} />
      </ul>
      <div className="mt-6 space-y-2">
        <Link
          href="/about"
          onClick={onClose}
          className="flex items-center justify-between rounded-2xl bg-surface p-4 text-sm font-medium ring-1 ring-line hover:bg-sand"
        >
          {copy.profile.about}
          <ChevronRight className="size-4 text-muted" />
        </Link>
        <button
          type="button"
          onClick={clearData}
          className="flex w-full items-center gap-2 rounded-2xl p-4 text-left text-sm text-danger hover:bg-sand"
        >
          <Trash2 className="size-4" />
          {copy.profile.clearData}
        </button>
      </div>
    </Sheet>
  );
}
