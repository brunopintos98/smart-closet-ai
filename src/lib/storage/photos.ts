import { createStore, del, get, set, type UseStore } from "idb-keyval";

/**
 * Garment photos live in IndexedDB (localStorage is too small for images).
 * If IndexedDB is unavailable, photos are kept in memory for this visit only.
 */
let store: UseStore | null = null;
let available: Promise<boolean> | null = null;
const memory = new Map<string, Blob>();

function getStore(): UseStore {
  store ??= createStore("smart-closet", "photos");
  return store;
}

export function isIndexedDBAvailable(): Promise<boolean> {
  available ??= (async () => {
    if (typeof indexedDB === "undefined") return false;
    try {
      await set("__probe__", 1, getStore());
      await del("__probe__", getStore());
      return true;
    } catch {
      return false;
    }
  })();
  return available;
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  if (await isIndexedDBAvailable()) {
    try {
      await set(id, blob, getStore());
      return;
    } catch {
      // Quota or transient error: fall through to memory.
    }
  }
  memory.set(id, blob);
}

export async function loadPhoto(id: string): Promise<Blob | undefined> {
  if (memory.has(id)) return memory.get(id);
  if (!(await isIndexedDBAvailable())) return undefined;
  try {
    return await get<Blob>(id, getStore());
  } catch {
    return undefined;
  }
}

export async function deletePhoto(id: string): Promise<void> {
  memory.delete(id);
  if (await isIndexedDBAvailable()) {
    try {
      await del(id, getStore());
    } catch {
      // Nothing else to do; an orphan blob is harmless.
    }
  }
}
