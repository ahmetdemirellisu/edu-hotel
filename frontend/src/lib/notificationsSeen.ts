// Persists which notification IDs the current user has marked as "seen".
// Backend notifications are derived from reservation state and have no read
// persistence; this stores the seen set in localStorage per user.

const KEY_PREFIX = "notif_seen_";
const EVENT_NAME = "notif:seen-changed";

function keyFor(userId: number | string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function loadSeenIds(userId: number | string): Set<string> {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function persist(userId: number | string, set: Set<string>): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(Array.from(set)));
  } catch {
    // localStorage quota / disabled — silently no-op
  }
  // Tell other live components (bell + page) to recompute their unread counts.
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { userId } }));
}

export function markSeen(userId: number | string, id: string): void {
  const set = loadSeenIds(userId);
  if (set.has(id)) return;
  set.add(id);
  persist(userId, set);
}

export function markManySeen(userId: number | string, ids: string[]): void {
  if (ids.length === 0) return;
  const set = loadSeenIds(userId);
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) {
      set.add(id);
      changed = true;
    }
  }
  if (changed) persist(userId, set);
}

// Subscribe to seen-state changes (same tab via CustomEvent, other tabs via storage event).
export function subscribeSeenChanges(userId: number | string, cb: () => void): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail || String(detail.userId) === String(userId)) cb();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === keyFor(userId)) cb();
  };
  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
