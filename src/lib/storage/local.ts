/**
 * localStorage wrapper. When storage is blocked (some private modes, strict
 * privacy settings, quota errors) everything keeps working in memory and the
 * UI shows a warning that data will not be kept.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const key = "__sca_probe__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export interface PersistentStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  getServerSnapshot(): T;
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  isValid: (value: unknown) => value is T,
): PersistentStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed: unknown = raw === null ? initial : JSON.parse(raw);
      cache = isValid(parsed) ? parsed : initial;
    } catch {
      cache = initial;
    }
    return cache;
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    get: read,
    getServerSnapshot: () => initial,
    set(next) {
      const value = typeof next === "function" ? (next as (prev: T) => T)(read()) : next;
      cache = value;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Kept in memory only; the storage warning banner explains this.
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          cache = undefined;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
