// src/api/admin.ts
export interface AdminDashboardStats {
    pendingReservations: number;
    approvedReservations: number;
    guestsStaying: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    totalRooms: number;
    occupancyRate: number; // 0–100
    expectedCheckinsToday: number;
  }
  
  export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp";
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load dashboard stats.");
    }
    return res.json();
  }
  
