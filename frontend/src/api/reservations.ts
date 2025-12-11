// src/api/reservations.ts
const API_BASE_URL = 'http://localhost:3000';

export type AccommodationType = 'PERSONAL' | 'CORPORATE' | 'EDUCATION';
export type InvoiceType = 'INDIVIDUAL' | 'CORPORATE';

export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export interface ReservationPayload {
  userId: number;
  checkIn: string;   // ISO date string, e.g. "2025-07-15"
  checkOut: string;  // ISO date string
  guests: number;
  accommodationType: AccommodationType;
  invoiceType: InvoiceType;
  eventCode?: string;
  note?: string;
}

export interface Reservation extends ReservationPayload {
  id: number;
  roomId: number | null;
  status: ReservationStatus;
  createdAt: string;
}

export async function createReservation(payload: ReservationPayload): Promise<Reservation> {
  const res = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create reservation');
  }

  return res.json();
}

export async function getUserReservations(userId: number): Promise<Reservation[]> {
  const res = await fetch(`${API_BASE_URL}/reservations/user/${userId}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch reservations');
  }

  return res.json();
}

export async function getAdminReservations(status?: ReservationStatus): Promise<Reservation[]> {
  const url = status
    ? `${API_BASE_URL}/reservations/admin?status=${status}`
    : `${API_BASE_URL}/reservations/admin`;

  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch admin reservations');
  }

  return res.json();
}

export async function approveReservation(id: number, roomId?: number): Promise<Reservation> {
  const res = await fetch(`${API_BASE_URL}/reservations/admin/${id}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roomId ? { roomId } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to approve reservation');
  }

  return res.json();
}

export async function rejectReservation(id: number, note?: string): Promise<Reservation> {
  const res = await fetch(`${API_BASE_URL}/reservations/admin/${id}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note ? { note } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to reject reservation');
  }

  return res.json();
}
