import { useEffect, useMemo, useState } from "react";
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
  const diff = a.getTime() - b.getTime();
  return Math.floor(diff / msPerDay);
}

export function CalendarPage() {
  const { t } = useTranslation("admin");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const { daysInMonth, dayLabels, monthLabel } = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const days = new Date(year, m + 1, 0).getDate();

    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date(year, m, i + 1);
      const day = d.getDate();
      const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
      return `${day} ${weekday}`;
    });

    const monthText = month.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    return { daysInMonth: days, dayLabels: labels, monthLabel: monthText };
  }, [month]);

  const bookingsByRoom = useMemo(() => {
    const monthStart = month;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

    const map: Record<number, Array<{
      startIndex: number;
      duration: number;
      status: ReservationStatus;
      guestLabel: string;
    }>> = {};

    reservations
      .filter(
        (r) =>
          r.status === "APPROVED" &&
          r.room &&
          r.room.id &&
          new Date(r.checkIn) < monthEnd &&
          new Date(r.checkOut) > monthStart
      )
      .forEach((r) => {
        const roomId = r.room!.id;

        const resCheckIn = new Date(r.checkIn);
        const resCheckOut = new Date(r.checkOut);

        // clamp to visible month
        const visibleStart =
          resCheckIn < monthStart ? monthStart : resCheckIn;
        const visibleEnd =
          resCheckOut > monthEnd ? monthEnd : resCheckOut;

        const startIndex = diffInDays(visibleStart, monthStart);
        const duration = diffInDays(visibleEnd, visibleStart) || 1;

        if (!map[roomId]) map[roomId] = [];
        map[roomId].push({
          startIndex,
          duration,
          status: r.status,
          guestLabel: r.userName || r.userEmail || r.eventCode || `#${r.id}`, // adjust if you store these
        });
      });

    return map;
  }, [reservations, month]);

  const goPrevMonth = () => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900">
                {t("pages.calendar.roomOccupancyCalendar")}
              </h3>
              <p className="text-sm text-gray-600">{monthLabel}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-gray-600">
                  {t("pages.calendar.legend.confirmed")}
                </span>
              </div>
              {/* later you can add pending/checked-in/canceled based on status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrevMonth}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                >
                  {t("pages.calendar.prevMonth", "Prev")}
                </button>
                <button
                  onClick={goNextMonth}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                >
                  {t("pages.calendar.nextMonth", "Next")}
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
            <p className="text-sm text-gray-600">
              {t("pages.calendar.loading", "Loading calendar...")}
            </p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t("pages.calendar.empty", "No rooms found.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header with dates */}
                <div className="flex border-b border-gray-200">
                  <div className="w-32 flex-shrink-0 p-3 text-sm text-gray-900 border-r border-gray-200">
                    {t("pages.calendar.room")}
                  </div>
                  {dayLabels.map((label, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[60px] p-2 text-center text-xs text-gray-600 border-r border-gray-200"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Rooms with bookings */}
                {rooms.map((room) => {
                  const roomBookings = bookingsByRoom[room.id] || [];
                  return (
                    <div
                      key={room.id}
                      className="flex border-b border-gray-100"
                    >
                      <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200">
                        <p className="text-sm text-gray-900">{room.name}</p>
                        <p className="text-xs text-gray-500">{room.type}</p>
                      </div>
                      <div
                        className="flex-1 relative"
                        style={{ height: "50px" }}
                      >
                        <div
                          className="grid h-full"
                          style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(40px, 1fr))` }}
                        >
                          {dayLabels.map((_, idx) => (
                            <div
                              key={idx}
                              className="border-r border-gray-100"
                            />
                          ))}
                        </div>

                        {roomBookings.map((booking, idx) => (
                          <div
                            key={idx}
                            className="absolute top-2 rounded px-2 py-1 text-[10px] text-white cursor-pointer hover:opacity-80 bg-green-500"
                            style={{
                              left: `${(booking.startIndex / daysInMonth) * 100}%`,
                              width: `${(booking.duration / daysInMonth) * 100}%`,
                            }}
                            title={booking.guestLabel}
                          >
                            {booking.guestLabel}
                          </div>
                        ))}
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
