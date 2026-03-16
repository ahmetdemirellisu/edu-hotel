// src/api/users.ts
export type UserType = "STUDENT" | "STAFF" | "SPECIAL_GUEST" | "OTHER";
export type UserRole = "USER" | "ADMIN" | "HOTEL_STAFF";

export interface BlacklistInfo {
  id: number;
  reason: string;
  addedAt: string;
  expiresAt: string | null;
}

export interface GuestReservation {
  id: number;
  checkIn: string;
  checkOut: string;
  status: string;
  roomId: number | null;
}

export interface AdminGuest {
  id: number;
  email: string;
  name: string | null;
  userType: UserType;
  role: UserRole;
  createdAt: string;
  blacklist: BlacklistInfo | null;
  reservations: GuestReservation[];
}

/**
 * Fetch all guests for admin, with optional filters.
 */
export async function getAdminGuests(params?: {
  type?: UserType | "ALL";
  search?: string;
  blacklisted?: "all" | "true" | "false";
}): Promise<AdminGuest[]> {
  const query = new URLSearchParams();

  if (params?.type && params.type !== "ALL") {
    query.set("type", params.type);
  }
  if (params?.search) {
    query.set("search", params.search);
  }
  if (params?.blacklisted && params.blacklisted !== "all") {
    query.set("blacklisted", params.blacklisted);
  }

  const qs = query.toString();
  const res = await fetch(
    `/ehp/api/users/admin${qs ? `?${qs}` : ""}`
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load guests.");
  }

  return res.json();
}

/**
 * Add user to blacklist (simple permanent block – reason only).
 */
export async function blacklistUser(userId: number, reason: string) {
  const res = await fetch(`/ehp/api/blacklist/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, reason, expiresAt: null }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to blacklist user.");
  }
  return data as BlacklistInfo;
}

/**
 * Remove user from blacklist.
 */
export async function unblacklistUser(userId: number) {
  const res = await fetch(
    `/ehp/api/blacklist/remove/${userId}`,
    { method: "DELETE" }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to remove from blacklist.");
  }
  return true;
}
