// src/api/rooms.ts
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  capacity: number;
  description: string;
  image?: string | null;
  amenities: string;
  status: RoomStatus;
  createdAt: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

export async function getRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/rooms`);
  if (!res.ok) {
    throw new Error("Failed to load rooms");
  }
  return res.json();
}
