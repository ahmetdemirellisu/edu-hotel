import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Wifi, Coffee, Tv, Wind, Users as GuestsIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  createReservation,
  type AccommodationType,
  type InvoiceType,
} from "../api/reservations";

export function BookRoomPage() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLDivElement | null>(null);

  // ✅ Safe load of logged-in user from localStorage (only once!)
  let storedUser: any = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("user");
      storedUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse stored user:", e);
    }
  }

  // User ID → ensure it's a number OR undefined
  const userId: number | undefined =
    storedUser?.id ? Number(storedUser.id) : undefined;

  // ----- state variables -----
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  const [accommodationType, setAccommodationType] =
    useState<AccommodationType>("PERSONAL");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("INDIVIDUAL");
  const [eventCode, setEventCode] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rooms = [
    {
      id: 1,
      name: t("dashboard.rooms.single"),
      price: 120,
      capacity: 1,
      image: "bedroom single",
      description: t("dashboard.rooms.singleDesc"),
      amenities: ["Wifi", "TV", "AC", "Coffee"],
    },
    {
      id: 2,
      name: t("dashboard.rooms.double"),
      price: 180,
      capacity: 2,
      image: "bedroom double",
      description: t("dashboard.rooms.doubleDesc"),
      amenities: ["Wifi", "TV", "AC", "Coffee"],
    },
  ];

  const icons: Record<string, any> = {
    Wifi,
    TV: Tv,
    AC: Wind,
    Coffee,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!userId) {
      setErrorMessage(
        t(
          "dashboard.validation.notLoggedIn",
          "Please log in to make a reservation."
        )
      );
      return;
    }

    if (!checkIn || !checkOut) {
      setErrorMessage(
        t("dashboard.validation.datesRequired") ||
          "Please select check-in and check-out dates."
      );
      return;
    }

    if (Number.isNaN(parseInt(guests))) {
      setErrorMessage(
        t("dashboard.validation.guestsRequired") ||
          "Please select number of guests."
      );
      return;
    }

    try {
      setLoading(true);

      await createReservation({
        userId: Number(userId),
        checkIn,
        checkOut,
        guests: parseInt(guests, 10),
        accommodationType,
        invoiceType,
        eventCode: eventCode || undefined,
        note: note || undefined,
      });

      setSuccessMessage(
        t("dashboard.reservation.success",
          "Your reservation request has been submitted for approval.")
      );
      setCheckIn("");
      setCheckOut("");
      setGuests("1");
      setEventCode("");
      setNote("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create reservation.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Page header */}
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("bookingRequest.title", "Reservation Request for EDU Hotel")}
          </h1>

          {storedUser?.userType && (
            <p className="text-sm text-gray-500">
               You are logged in as:{" "} 
               <span className="font-medium">{storedUser.userType}</span>
            </p>
           )}

          <p className="text-gray-600 max-w-2xl">
            {t(
              "bookingRequest.subtitle",
              "Submit a pre-reservation request for EDU Hotel. Your request will be reviewed and approved by the administration. Final room assignment will be done by the hotel staff."
            )}
          </p>
        </header>

        {/* STEP 1 */}
        <section ref={formRef} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003366] text-white text-sm font-semibold">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t(
                  "bookingRequest.step1Title",
                  "Step 1 – Submit your reservation request"
                )}
              </h2>
              <p className="text-sm text-gray-600">
                {t(
                  "bookingRequest.step1Description",
                  "Please fill in your stay dates and basic information. This is a request form, not an instant booking."
                )}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dates & Guests */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("bookingRequest.form.checkIn")}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-md p-2 text-sm"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("bookingRequest.form.checkOut")}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-md p-2 text-sm"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("bookingRequest.form.guests")}
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full bg-[#003366] text-white"
                    disabled={loading}
                  >
                    {loading
                      ? t("bookingRequest.form.submitting", "Submitting...")
                      : t(
                          "bookingRequest.form.submitButton",
                          "Submit reservation request"
                        )}
                  </Button>
                </div>
              </div>

              {/* Accommodation type & invoice type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t(
                      "bookingRequest.form.accommodationType",
                      "Accommodation Type"
                    )}
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={accommodationType}
                    onChange={(e) =>
                      setAccommodationType(
                        e.target.value as AccommodationType
                      )
                    }
                  >
                    <option value="PERSONAL">
                      {t(
                        "bookingRequest.form.accommodation.personal",
                        "Personal"
                      )}
                    </option>
                    <option value="CORPORATE">
                      {t(
                        "bookingRequest.form.accommodation.corporate",
                        "Corporate"
                      )}
                    </option>
                    <option value="EDUCATION">
                      {t(
                        "bookingRequest.form.accommodation.education",
                        "Education"
                      )}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("bookingRequest.form.invoiceType", "Invoice Type")}
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={invoiceType}
                    onChange={(e) =>
                      setInvoiceType(e.target.value as InvoiceType)
                    }
                  >
                    <option value="INDIVIDUAL">
                      {t(
                        "bookingRequest.form.invoice.individual",
                        "Individual"
                      )}
                    </option>
                    <option value="CORPORATE">
                      {t(
                        "bookingRequest.form.invoice.corporate",
                        "Corporate"
                      )}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("bookingRequest.form.eventCode", "Event / Training Code")}
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2 text-sm"
                    placeholder="SAT-KAF"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Note / explanation */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t(
                    "bookingRequest.form.explanation",
                    "Explanation / Reason"
                  )}
                </label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm min-h-[80px]"
                  placeholder={t(
                    "bookingRequest.form.explanationPlaceholder",
                    "Please briefly explain the purpose of your stay (especially for education-related reservations)."
                  )}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* STEP 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-800 text-sm font-semibold">
              2
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t("bookingRequest.step2Title", "Step 2 – Explore room types")}
              </h2>
              <p className="text-sm text-gray-600">
                {t(
                  "bookingRequest.step2Description",
                  "These are example room types available at EDU Hotel. Final room assignment will be made by the hotel administration after your request is approved."
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="shadow-sm rounded-xl overflow-hidden"
              >
                <div className="aspect-video bg-gray-200">
                  <img
                    className="w-full h-full object-cover"
                    src={`https://source.unsplash.com/800x600/?${room.image}`}
                    alt={room.name}
                  />
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="text-lg font-semibold">{room.name}</h3>
                  <p className="text-sm text-gray-600">{room.description}</p>

                  <div className="flex items-center gap-2 text-gray-700">
                    <GuestsIcon className="h-4 w-4" />
                    <span>
                      {t("dashboard.roomsSection.capacity", {
                        count: room.capacity,
                      })}
                    </span>
                  </div>

                  <div className="flex gap-3 text-gray-600">
                    {room.amenities.map((a) => {
                      const Icon = icons[a];
                      if (!Icon) return null;
                      return (
                        <div
                          key={a}
                          className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200"
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <p className="font-semibold text-gray-900">
                      ${room.price}
                      <span className="text-xs text-gray-500 ml-1">
                        {t("dashboard.roomsSection.perNight", "/night")}
                      </span>
                    </p>
                    <Button
                      type="button"
                      className="bg-[#003366] text-white"
                      onClick={scrollToForm}
                    >
                      {t(
                        "dashboard.roomsSection.bookNow",
                        "Request this room type"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
