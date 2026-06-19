// Frontend helper for reading public hotel settings.
// Calls the authenticated /settings endpoint (guest auth, not admin auth).
// Caches the result in-memory for the session so repeat callers are cheap.

import { userFetch } from "./userFetch";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

export type PublicSettings = {
  hotelName: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  checkInTime: string;
  checkOutTime: string;
  wifiSsid: string;
  wifiPassword: string;
  breakfastHours: string;
  receptionHours: string;
};

export const SETTINGS_FALLBACK: PublicSettings = {
  hotelName: "EDU Hotel",
  contactEmail: "hotel@sabanciuniv.edu",
  contactPhone: "+90 (216) 483 9000",
  bankName: "Akbank T.A.Ş.",
  accountHolder: "Sabtek A.Ş.",
  iban: "TR85 0004 6007 1388 8000 1139 89",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  wifiSsid: "EDU-Hotel-Guest",
  wifiPassword: "Welcome2026",
  breakfastHours: "07:30 – 10:00",
  receptionHours: "24/7",
};

let cache: PublicSettings | null = null;
let pending: Promise<PublicSettings> | null = null;

export async function fetchPublicSettings(force = false): Promise<PublicSettings> {
  if (!force && cache) return cache;
  if (!force && pending) return pending;
  pending = (async () => {
    try {
      const res = await userFetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as Partial<PublicSettings>;
      cache = { ...SETTINGS_FALLBACK, ...data };
      return cache;
    } catch (err) {
      console.warn("settings: falling back to defaults —", err);
      cache = { ...SETTINGS_FALLBACK };
      return cache;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export function clearSettingsCache() {
  cache = null;
  pending = null;
}
