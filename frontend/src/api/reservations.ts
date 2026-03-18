// src/api/reservations.ts
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/ehp/api";
import { adminFetch } from "./adminFetch";
import { userFetch } from "./userFetch";

export type AccommodationType = "PERSONAL" | "CORPORATE" | "EDUCATION";
export type InvoiceType = "INDIVIDUAL" | "CORPORATE";

export type ReservationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export type PaymentStatus =
  | "NONE"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED";

export type GuestType = "STUDENT" | "STAFF" | "SPECIAL_GUEST" | "OTHER";

export type GuestListItem = {
  firstName: string;
  lastName: string;
};

/**
 * Payload sent to POST /reservations
 * Matches updated backend reservations.js
 */
export interface ReservationPayload {
  userId: number;

  // Dates
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD"
  checkInTime: string; // "HH:MM" (required)

  guests: number;
  accommodationType: AccommodationType;
  invoiceType: InvoiceType;

  // Code required for CORPORATE/EDUCATION
  eventCode?: string;

  // Form fields (stored in Reservation table)
  firstName: string;
  lastName: string;
  phone: string;
  contactEmail: string;

  // Billing identifiers
  // Required depending on invoiceType (validated in backend)
  nationalId?: string; // T.C. Kimlik No / Pasaport No
  taxNumber?: string;
  billingTitle?: string; // Fatura Unvanı (corporate)
  billingAddress?: string; // Fatura Adresi (corporate)

  // Pricing/event metadata
  eventType: string; // required (validated in backend)
  priceType?: string;

  // Free accommodation request
  freeAccommodation?: boolean;

  // Additional guests (excluding the main guest)
  guestList?: GuestListItem[];

  // Extra notes shown to admin
  note?: string;
}

/**
 * Reservation object returned from backend.
 * Keep it aligned with schema.prisma fields.
 */
export interface Reservation extends ReservationPayload {
  id: number;
  roomId: number | null;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  price?: number | null;
  createdAt: string;

  // snapshot fields from backend
  guestType?: GuestType;

  // user/room might be included in admin endpoint
  user?: {
    id: number;
    email: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    userType?: GuestType;
    role?: string;
  };

  room?: {
    id: number;
    name: string;
    type: string;
    status: string;
  } | null;
}

async function parseError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({} as any));
  return data?.error || fallback;
}

export async function createReservation(
  payload: ReservationPayload
): Promise<Reservation> {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to create reservation"));
  }

  return res.json();
}

export async function getUserReservations(
  userId: number
): Promise<Reservation[]> {
  const res = await userFetch(`${API_BASE_URL}/reservations/user/${userId}`);

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to fetch reservations"));
  }

  return res.json();
}

/**
 * GET /reservations/admin
 * Backend supports query params: status, guestType
 */
export async function getAdminReservations(params?: {
  status?: ReservationStatus;
  guestType?: GuestType;
}): Promise<Reservation[]> {
  const q = new URLSearchParams();

  if (params?.status) q.set("status", params.status);
  if (params?.guestType) q.set("guestType", params.guestType);

  const url =
    q.toString().length > 0
      ? `${API_BASE_URL}/reservations/admin?${q.toString()}`
      : `${API_BASE_URL}/reservations/admin`;

  const res = await adminFetch(url);

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to fetch admin reservations"));
  }

  return res.json();
}

export async function approveReservation(
  id: number,
  price?: number
): Promise<Reservation> {
  const res = await adminFetch(`${API_BASE_URL}/reservations/admin/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(price !== undefined ? { price } : {}),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to approve reservation"));
  }

  return res.json();
}

export async function rejectReservation(
  id: number,
  note?: string
): Promise<Reservation> {
  const res = await adminFetch(`${API_BASE_URL}/reservations/admin/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note ? { note } : {}),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to reject reservation"));
  }

  return res.json();
}

/**
 * GET /reservations/my/latest
 * Fetch latest reservation for dashboard
 */
export async function getMyLatestReservation(userId: number) {
  const res = await userFetch(
    `${API_BASE_URL}/reservations/my/latest?userId=${userId}`
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch latest reservation");
  }

  return res.json();
}

/**
 * PATCH /reservations/:id/cancel
 * Cancel a reservation (user-side).
 */
export async function cancelReservation(
  id: number,
  userId: number,
  reason?: string
): Promise<Reservation> {
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, reason }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to cancel reservation"));
  }

  return res.json();
}
