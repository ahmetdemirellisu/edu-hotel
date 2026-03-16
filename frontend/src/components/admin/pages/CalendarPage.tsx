import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { useTranslation } from "react-i18next";
import { getRooms, type Room } from "../../../api/rooms";
import {
  getAdminReservations,
  type ReservationStatus,
  type Reservation,
} from "../../../api/reservations";

type AdminReservation = Reservation & {
  room?: {
    id: number;
    name: string;
    type: string;
  } | null;
};

function diffInDays(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  PENDING: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  CANCELLED: { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

export function CalendarPage() {
  const { t, i18n } = useTranslation("admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBooking, setHoveredBooking] = useState<number | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [roomData, reservationData] = await Promise.all([
          getRooms(),
          getAdminReservations(),
        ]);
        setRooms(roomData);
        setReservations(reservationData as AdminReservation[]);
      } catch (err: any) {
        setError(err.message || "Failed to load calendar data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const locale = i18n.language === "tr" ? "tr-TR" : "en-US";

  const { daysInMonth, dayLabels, monthLabel } = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const days = new Date(year, m + 1, 0).getDate();

    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(year, m, i + 1);
      const day = d.getDate();
      const weekday = d.toLocaleDateString(locale, { weekday: "narrow" });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      return { text: `${day}`, weekday, isWeekend, isToday: false };
    });

    // Mark today
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() === m) {
      const idx = today.getDate() - 1;
      if (labels[idx]) labels[idx].isToday = true;
    }

    const monthText = month.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });

    return { daysInMonth: days, dayLabels: labels, monthLabel: monthText };
  }, [month, locale]);

  const bookingsByRoom = useMemo(() => {
    const monthStart = month;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    const map: Record<number, Array<{
      id: number;
      startIndex: number;
      duration: number;
      status: ReservationStatus;
      guestLabel: string;
      tooltip: string;
    }>> = {};

    reservations
      .filter(
        (r) =>
          ["APPROVED", "PENDING"].includes(r.status) &&
          r.room &&
          r.room.id &&
          new Date(r.checkIn) < monthEnd &&
          new Date(r.checkOut) > monthStart
      )
      .forEach((r) => {
        const roomId = r.room!.id;
        const resCheckIn = new Date(r.checkIn);
        const resCheckOut = new Date(r.checkOut);

        const visibleStart = resCheckIn < monthStart ? monthStart : resCheckIn;
        const visibleEnd = resCheckOut > monthEnd ? monthEnd : resCheckOut;

        const startIndex = diffInDays(visibleStart, monthStart);
        const duration = diffInDays(visibleEnd, visibleStart) || 1;

        // Build guest label from reservation fields
        const firstName = (r as any).firstName || "";
        const lastName = (r as any).lastName || "";
        const guestName = `${firstName} ${lastName}`.trim();
        const guestLabel = guestName || r.eventCode || `#${r.id}`;

        const checkInStr = resCheckIn.toISOString().slice(0, 10);
        const checkOutStr = resCheckOut.toISOString().slice(0, 10);
        const tooltip = `#${r.id} · ${guestLabel}\n${checkInStr} → ${checkOutStr}\n${r.guests} guest(s) · ${r.status}`;

        if (!map[roomId]) map[roomId] = [];
        map[roomId].push({ id: r.id, startIndex, duration, status: r.status, guestLabel, tooltip });
      });

    return map;
  }, [reservations, month]);

  const goPrevMonth = () => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNextMonth = () => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToday = () => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); };

  // Stats for this month
  const totalBookings = Object.values(bookingsByRoom).reduce((sum, arr) => sum + arr.length, 0);
  const occupiedRoomCount = Object.keys(bookingsByRoom).length;

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900 text-lg font-semibold">
                {t("pages.calendar.roomOccupancyCalendar", "Room Occupancy Calendar")}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {monthLabel} · {t("pages.calendar.bookings", { count: totalBookings, defaultValue: `${totalBookings} bookings` })} · {t("pages.calendar.roomsOccupied", { occupied: occupiedRoomCount, total: rooms.length, defaultValue: `${occupiedRoomCount}/${rooms.length} rooms occupied` })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden md:flex items-center gap-3 mr-4">
                {[
                  { label: t("pages.calendar.legend.approved", "Approved"), color: STATUS_COLORS.APPROVED },
                  { label: t("pages.calendar.legend.pending", "Pending"), color: STATUS_COLORS.PENDING },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded" style={{ background: color.bg, border: `1px solid ${color.border}` }} />
                    <span className="text-gray-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1.5">
                <button onClick={goPrevMonth} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {t("pages.calendar.prev", "← Prev")}
                </button>
                <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {t("pages.calendar.today", "Today")}
                </button>
                <button onClick={goNextMonth} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  {t("pages.calendar.next", "Next →")}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">
              {t("pages.calendar.empty", "No rooms found.")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div style={{ minWidth: `${130 + daysInMonth * 44}px` }}>
                {/* Date header */}
                <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <div className="w-[130px] flex-shrink-0 px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    {t("pages.calendar.room", "Room")}
                  </div>
                  {dayLabels.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[44px] py-2 text-center border-r border-gray-100 last:border-r-0 ${
                        day.isToday ? "bg-blue-50" : day.isWeekend ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <div className={`text-[10px] font-medium ${day.isWeekend ? "text-red-400" : "text-gray-400"}`}>
                        {day.weekday}
                      </div>
                      <div className={`text-xs font-semibold ${day.isToday ? "text-blue-600" : "text-gray-700"}`}>
                        {day.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Room rows */}
                {rooms.map((room) => {
                  const roomBookings = bookingsByRoom[Number(room.id)] || [];
                  return (
                    <div key={room.id} className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                      {/* Room label */}
                      <div className="w-[130px] flex-shrink-0 px-3 py-2.5 border-r border-gray-200 flex items-center gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{room.name}</p>
                          <p className="text-[10px] text-gray-400">{room.type}</p>
                        </div>
                      </div>

                      {/* Day cells with bookings */}
                      <div className="flex-1 relative" style={{ height: 44 }}>
                        {/* Grid lines */}
                        <div className="grid h-full absolute inset-0" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(44px, 1fr))` }}>
                          {dayLabels.map((day, idx) => (
                            <div
                              key={idx}
                              className={`border-r border-gray-50 ${day.isToday ? "bg-blue-50/30" : ""}`}
                            />
                          ))}
                        </div>

                        {/* Booking bars */}
                        {roomBookings.map((booking) => {
                          const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.APPROVED;
                          const isHovered = hoveredBooking === booking.id;

                          return (
                            <div
                              key={booking.id}
                              className="absolute top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium cursor-pointer transition-all duration-150 truncate"
                              style={{
                                left: `${(booking.startIndex / daysInMonth) * 100}%`,
                                width: `${(booking.duration / daysInMonth) * 100}%`,
                                background: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                height: 28,
                                lineHeight: "26px",
                                zIndex: isHovered ? 20 : 10,
                                transform: isHovered ? "scale(1.02)" : "scale(1)",
                                boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                              }}
                              title={booking.tooltip}
                              onMouseEnter={() => setHoveredBooking(booking.id)}
                              onMouseLeave={() => setHoveredBooking(null)}
                            >
                              {booking.guestLabel}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
