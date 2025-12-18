import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer } from "./layout/Footer";
import { Navbar } from "./layout/Navbar";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";

import {
  AlertCircle,
  Bell,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Globe,
  Info,
  LogOut,
  User,
  Users,
  XCircle,
} from "lucide-react";

import {
  createReservation,
  type AccommodationType,
  type InvoiceType,
} from "../api/reservations";

function isSunday(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0; // Sunday
}
function isSaturday(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 6; // Saturday
}
function daysBetween(checkIn: string, checkOut: string) {
  // returns nights (difference in days)
  if (!checkIn || !checkOut) return 0;
  const inD = new Date(checkIn + "T00:00:00");
  const outD = new Date(checkOut + "T00:00:00");
  const ms = outD.getTime() - inD.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
function isMoreThanDaysAhead(dateStr: string, days: number) {
  if (!dateStr) return false;
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const max = new Date(today);
  max.setDate(max.getDate() + days);
  // allow same day/timezone safe compare by date
  return target.getTime() > max.getTime();
}

export function BookRoomPage() {
  const { t, i18n } = useTranslation();
  const formTopRef = useRef<HTMLDivElement | null>(null);

  // ✅ Safe load of logged-in user from localStorage (only once!)
  const storedUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId: number | undefined = storedUser?.id ? Number(storedUser.id) : undefined;

  // ---- UI state (Figma design) ----
  const [language, setLanguage] = useState(i18n.language?.toUpperCase() === "TR" ? "TR" : "EN");

  const [accommodationTypeUI, setAccommodationTypeUI] = useState<
    "personal" | "corporate" | "education" | ""
  >("");

  const [billingTypeUI, setBillingTypeUI] = useState<"individual" | "corporate" | "">("");
  const [requestFreeAccommodation, setRequestFreeAccommodation] = useState(false);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [guestList, setGuestList] = useState<Array<{ firstName: string; lastName: string }>>([]);

  const [eventCode, setEventCode] = useState("");
  const [eventType, setEventType] = useState<string>("");
  const [priceType, setPriceType] = useState<string>("");

  // identity / invoice info (shown in Figma)
  const [firstName, setFirstName] = useState(storedUser?.firstName || storedUser?.name || "");
  const [lastName, setLastName] = useState(storedUser?.lastName || storedUser?.surname || "");
  const [phone, setPhone] = useState(storedUser?.phone || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const [notes, setNotes] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // ---- async state ----
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showCorporateCode = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";
  const showPriceType = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";

  const handleNumberOfGuestsChange = (value: string) => {
    const num = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    setNumberOfGuests(String(num));

    if (num > 1) {
      const newGuestList = Array.from({ length: num - 1 }, (_, i) => guestList[i] || { firstName: "", lastName: "" });
      setGuestList(newGuestList);
    } else {
      setGuestList([]);
    }
  };

  const updateGuestInList = (index: number, field: "firstName" | "lastName", value: string) => {
    const updated = [...guestList];
    updated[index] = { ...updated[index], [field]: value };
    setGuestList(updated);
  };

  const scrollToTopOfForm = () => {
    if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const mapToApiTypes = (): { accommodationType: AccommodationType; invoiceType: InvoiceType } => {
    const accommodationType: AccommodationType =
      accommodationTypeUI === "corporate"
        ? "CORPORATE"
        : accommodationTypeUI === "education"
        ? "EDUCATION"
        : "PERSONAL";

    const invoiceType: InvoiceType =
      billingTypeUI === "corporate" ? "CORPORATE" : "INDIVIDUAL";

    return { accommodationType, invoiceType };
  };

  const buildNotePayload = () => {
    // We keep your API contract intact (createReservation supports: note, eventCode, guests, dates, types).
    // To satisfy document-required fields without breaking backend, we embed extra details into note.
    const extra: string[] = [];

    extra.push(`MainGuest: ${firstName || "-"} ${lastName || "-"}`);
    extra.push(`Phone: ${phone || "-"}`);
    extra.push(`Email: ${email || "-"}`);

    if (checkInTime) extra.push(`CheckInTime: ${checkInTime}`);

    if (eventType) extra.push(`EventType: ${eventType}`);
    if (showPriceType && priceType) extra.push(`PriceType: ${priceType}`);

    extra.push(`FreeAccommodationRequested: ${requestFreeAccommodation ? "YES" : "NO"}`);

    if (billingTypeUI === "individual" && tcKimlikNo) extra.push(`TC_Kimlik_No: ${tcKimlikNo}`);
    if (billingTypeUI === "corporate" && taxNumber) extra.push(`TaxNumber: ${taxNumber}`);

    if (guestList.length > 0) {
      const guestsStr = guestList
        .map((g, idx) => `Guest${idx + 2}: ${g.firstName || "-"} ${g.lastName || "-"}`)
        .join("; ");
      extra.push(guestsStr);
    }

    const base = notes?.trim();
    const extraBlock = extra.join("\n");
    return base ? `${base}\n\n---\n${extraBlock}` : extraBlock;
  };

  const validateAgainstRules = () => {
    if (!userId) {
      return t("dashboard.validation.notLoggedIn", "Please log in to make a reservation.");
    }

    if (!accommodationTypeUI) {
      return t("bookingRequest.validation.accommodationTypeRequired", "Please select an accommodation type.");
    }

    if (!billingTypeUI) {
      return t("bookingRequest.validation.billingTypeRequired", "Please select a billing type.");
    }

    if (!checkInDate || !checkOutDate) {
      return t("dashboard.validation.datesRequired", "Please select check-in and check-out dates.");
    }

    const nights = daysBetween(checkInDate, checkOutDate);
    if (nights <= 0) {
      return t("bookingRequest.validation.dateOrder", "Check-out date must be after check-in date.");
    }

    // Rules from your documents:
    // - No Sunday check-in
    if (isSunday(checkInDate)) {
      return t("bookingRequest.validation.noSundayCheckin", "Sunday check-in is not allowed.");
    }

    // - No Saturday check-in + Sunday check-out combination
    if (isSaturday(checkInDate) && isSunday(checkOutDate)) {
      return t(
        "bookingRequest.validation.noSatInSunOut",
        "Saturday check-in and Sunday check-out reservations are not allowed."
      );
    }

    // - Individual reservations up to 30 days ahead (we enforce for all external users)
    if (isMoreThanDaysAhead(checkInDate, 30)) {
      return t(
        "bookingRequest.validation.max30Days",
        "Reservations are allowed up to 30 days in advance."
      );
    }

    // - Personal bookings max 5 consecutive days (nights)
    if (accommodationTypeUI === "personal" && nights > 5) {
      return t(
        "bookingRequest.validation.max5Nights",
        "Personal bookings cannot exceed 5 consecutive nights."
      );
    }

    // Conditional requirements:
    if (showCorporateCode && !eventCode.trim()) {
      return t(
        "bookingRequest.validation.codeRequired",
        "Event / Education code is required for Corporate or Education stays."
      );
    }

    // Education stays require explanation/reason
    if (accommodationTypeUI === "education" && !notes.trim()) {
      return t(
        "bookingRequest.validation.explanationRequired",
        "Please provide an explanation for education-related reservations."
      );
    }

    // Invoice identification requirement
    if (billingTypeUI === "individual" && !tcKimlikNo.trim()) {
      return t(
        "bookingRequest.validation.tcRequired",
        "T.C. Kimlik No is required for individual billing."
      );
    }
    if (billingTypeUI === "corporate" && !taxNumber.trim()) {
      return t(
        "bookingRequest.validation.taxRequired",
        "Tax Number is required for corporate billing."
      );
    }

    // guests
    const g = parseInt(numberOfGuests, 10);
    if (!g || Number.isNaN(g) || g < 1) {
      return t("dashboard.validation.guestsRequired", "Please select number of guests.");
    }

    // consent
    if (!consentChecked) {
      return t(
        "bookingRequest.validation.consentRequired",
        "Please confirm the information and accept the reservation rules."
      );
    }

    // Basic identity display fields (not strictly required if auto-fetched, but helps correctness)
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      return t(
        "bookingRequest.validation.identityRequired",
        "Please ensure your name, phone, and email are filled."
      );
    }

    // additional guests names (optional but recommended; we enforce if > 1)
    if (g > 1) {
      for (let i = 0; i < guestList.length; i++) {
        if (!guestList[i].firstName.trim() || !guestList[i].lastName.trim()) {
          return t(
            "bookingRequest.validation.additionalGuestsRequired",
            "Please fill first and last names for all additional guests."
          );
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const ruleError = validateAgainstRules();
    if (ruleError) {
      setErrorMessage(ruleError);
      scrollToTopOfForm();
      return;
    }

    const { accommodationType, invoiceType } = mapToApiTypes();

    try {
      setLoading(true);

      await createReservation({
        userId: Number(userId),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        checkInTime: checkInTime.trim(),
      
        guests: parseInt(numberOfGuests, 10),
        accommodationType,
        invoiceType,
      
        eventCode: showCorporateCode ? eventCode.trim() : undefined,
      
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        contactEmail: email.trim(),
      
        eventType: eventType.trim(),
        priceType: priceType?.trim() || undefined,
      
        freeAccommodation: requestFreeAccommodation,
      
        guestList,
      
        nationalId: tcKimlikNo?.trim() || undefined,
        taxNumber: taxNumber?.trim() || undefined,
      
        note: notes?.trim() || undefined,
      });

      setSuccessMessage(
        t(
          "dashboard.reservation.success",
          "Your reservation request has been submitted for approval."
        )
      );

      // reset
      setAccommodationTypeUI("");
      setBillingTypeUI("");
      setRequestFreeAccommodation(false);
      setCheckInDate("");
      setCheckInTime("");
      setCheckOutDate("");
      setNumberOfGuests("1");
      setGuestList([]);
      setEventCode("");
      setEventType("");
      setPriceType("");
      setTcKimlikNo("");
      setTaxNumber("");
      setNotes("");
      setConsentChecked(false);

      scrollToTopOfForm();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to create reservation.");
      scrollToTopOfForm();
    } finally {
      setLoading(false);
    }
  };

  const switchLanguage = async (val: "EN" | "TR") => {
    setLanguage(val);
    // Align with your existing i18n setup
    const next = val === "TR" ? "tr" : "en";
    if (i18n.language !== next) await i18n.changeLanguage(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Keep your app shell (optional). If you want ONLY the Figma header, remove Navbar/Footer below. */}
    

      {/* Figma-style header (design) */}
      <Navbar />
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8" ref={formTopRef}>
          <h2 className="text-3xl text-[#003366] mb-2">
            {t("bookingRequest.pageTitle", "Book a Room")}
          </h2>
          <p className="text-gray-600">
            {t(
              "bookingRequest.pageSubtitle",
              "Submit your pre-reservation request. The EDU team will review and confirm."
            )}
          </p>
        </div>

        {/* Success / Error */}
        {(successMessage || errorMessage) && (
          <div className="mb-6">
            {successMessage && (
              <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">{t("common.success", "Success")}</div>
                  <div>{successMessage}</div>
                  <button
                    type="button"
                    className="mt-2 text-xs underline"
                    onClick={() => setSuccessMessage(null)}
                  >
                    {t("common.dismiss", "Dismiss")}
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">{t("common.error", "Error")}</div>
                  <div>{errorMessage}</div>
                  <button
                    type="button"
                    className="mt-2 text-xs underline"
                    onClick={() => setErrorMessage(null)}
                  >
                    {t("common.dismiss", "Dismiss")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Reservation Information */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.reservationInfo", "Reservation Information")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accommodation-type" className="text-gray-700">
                        {t("bookingRequest.form.accommodationType", "Accommodation Type")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select value={accommodationTypeUI} onValueChange={(v) => setAccommodationTypeUI(v as any)}>
                        <SelectTrigger id="accommodation-type" className="border-gray-300">
                          <SelectValue placeholder={t("common.select", "Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">{t("bookingRequest.form.accommodation.personal", "Personal")}</SelectItem>
                          <SelectItem value="corporate">{t("bookingRequest.form.accommodation.corporate", "Corporate (SU)")}</SelectItem>
                          <SelectItem value="education">{t("bookingRequest.form.accommodation.education", "Education")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {showCorporateCode && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label htmlFor="code" className="text-gray-700">
                          {t("bookingRequest.form.eventCode", "Event / Education Code")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="code"
                          placeholder={t("bookingRequest.form.eventCodePlaceholder", "Enter SAT-KAF or Education Code")}
                          className="border-gray-300"
                          value={eventCode}
                          onChange={(e) => setEventCode(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Guest Information */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.guestInfo", "Guest Information")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number-of-guests" className="text-gray-700">
                        {t("bookingRequest.form.guests", "Number of Guests")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="number-of-guests"
                        type="number"
                        min="1"
                        max="10"
                        value={numberOfGuests}
                        onChange={(e) => handleNumberOfGuestsChange(e.target.value)}
                        placeholder={t("bookingRequest.form.guestsPlaceholder", "Enter number of guests")}
                        className="border-gray-300"
                      />
                      <p className="text-xs text-gray-500">
                        {t("bookingRequest.form.guestsHint", "Main guest information below + additional guests")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-gray-700">
                          {t("bookingRequest.form.firstName", "First Name")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="first-name"
                          placeholder={t("bookingRequest.form.firstNamePlaceholder", "Enter first name")}
                          className="border-gray-300"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-gray-700">
                          {t("bookingRequest.form.lastName", "Last Name")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="last-name"
                          placeholder={t("bookingRequest.form.lastNamePlaceholder", "Enter last name")}
                          className="border-gray-300"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700">
                          {t("bookingRequest.form.phone", "Phone Number")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t("bookingRequest.form.phonePlaceholder", "+90 (5xx) xxx xx xx")}
                          className="border-gray-300"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">
                          {t("bookingRequest.form.email", "Email Address")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("bookingRequest.form.emailPlaceholder", "example@email.com")}
                          className="border-gray-300"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Billing ID fields (required based on billing type) */}
                    {billingTypeUI === "individual" && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label htmlFor="tc-kimlik" className="text-gray-700">
                          {t("bookingRequest.form.tcKimlik", "T.C. Kimlik No")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tc-kimlik"
                          placeholder={t("bookingRequest.form.tcKimlikPlaceholder", "Enter T.C. Kimlik No")}
                          className="border-gray-300"
                          value={tcKimlikNo}
                          onChange={(e) => setTcKimlikNo(e.target.value)}
                        />
                      </div>
                    )}

                    {billingTypeUI === "corporate" && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label htmlFor="tax-number" className="text-gray-700">
                          {t("bookingRequest.form.taxNumber", "Tax Number")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tax-number"
                          placeholder={t("bookingRequest.form.taxNumberPlaceholder", "Enter Tax Number")}
                          className="border-gray-300"
                          value={taxNumber}
                          onChange={(e) => setTaxNumber(e.target.value)}
                        />
                      </div>
                    )}

                    {parseInt(numberOfGuests, 10) > 1 && (
                      <div className="space-y-3 pl-6 border-l-2 border-blue-200 animate-in fade-in duration-300 mt-4">
                        <p className="text-sm text-gray-600 mb-3">
                          {t("bookingRequest.form.additionalGuests", "Additional Guests")} ({guestList.length})
                        </p>
                        {guestList.map((guest, index) => (
                          <div key={index} className="space-y-2">
                            <p className="text-xs text-gray-500">
                              {t("bookingRequest.form.guest", "Guest")} {index + 2}
                            </p>
                            <div className="flex gap-3">
                              <Input
                                placeholder={t("bookingRequest.form.firstName", "First Name")}
                                value={guest.firstName}
                                onChange={(e) => updateGuestInList(index, "firstName", e.target.value)}
                                className="border-gray-300"
                              />
                              <Input
                                placeholder={t("bookingRequest.form.lastName", "Last Name")}
                                value={guest.lastName}
                                onChange={(e) => updateGuestInList(index, "lastName", e.target.value)}
                                className="border-gray-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stay Details */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.stayDetails", "Stay Details")}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="check-in-date" className="text-gray-700">
                          {t("bookingRequest.form.checkIn", "Check-in Date")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="check-in-date"
                            type="date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            className="border-gray-300"
                          />
                          <CalendarIcon className="absolute right-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="check-in-time" className="text-gray-700">
                          {t("bookingRequest.form.checkInTime", "Check-in Time")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="check-in-time"
                            type="time"
                            value={checkInTime}
                            onChange={(e) => setCheckInTime(e.target.value)}
                            className="border-gray-300"
                          />
                          <Clock className="absolute right-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="check-out-date" className="text-gray-700">
                        {t("bookingRequest.form.checkOut", "Check-out Date")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="check-out-date"
                          type="date"
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="border-gray-300"
                        />
                        <CalendarIcon className="absolute right-3 top-[10px] h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Validation Notes (Design + rules) */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-blue-900">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{t("bookingRequest.rules.noSunday", "No Sunday check-in")}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-900">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{t("bookingRequest.rules.max5", "Max 5 nights for personal bookings")}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-900">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{t("bookingRequest.rules.max30", "Reservations allowed up to 30 days ahead")}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-900">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{t("bookingRequest.rules.noSatInSunOut", "No Saturday check-in + Sunday check-out")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Assignment */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.roomAssignment", "Room Assignment")}
                      </h3>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-800">
                          {t(
                            "bookingRequest.roomAssignmentInfo",
                            "Rooms are assigned by the EDU reception after approval. Users cannot select rooms."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event & Billing */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.eventBilling", "Event & Billing")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-type" className="text-gray-700">
                        {t("bookingRequest.form.eventType", "Event Type")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger id="event-type" className="border-gray-300">
                          <SelectValue placeholder={t("common.select", "Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conference">{t("bookingRequest.eventTypes.conference", "Conference")}</SelectItem>
                          <SelectItem value="seminar">{t("bookingRequest.eventTypes.seminar", "Seminar")}</SelectItem>
                          <SelectItem value="workshop">{t("bookingRequest.eventTypes.workshop", "Workshop")}</SelectItem>
                          <SelectItem value="training">{t("bookingRequest.eventTypes.training", "Training")}</SelectItem>
                          <SelectItem value="meeting">{t("bookingRequest.eventTypes.meeting", "Meeting")}</SelectItem>
                          <SelectItem value="other">{t("bookingRequest.eventTypes.other", "Other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {showPriceType && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label htmlFor="price-type" className="text-gray-700">
                          {t("bookingRequest.form.priceType", "Price Type")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={priceType} onValueChange={setPriceType}>
                          <SelectTrigger id="price-type" className="border-gray-300">
                            <SelectValue placeholder={t("common.select", "Select")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">{t("bookingRequest.priceTypes.standard", "Standard")}</SelectItem>
                            <SelectItem value="corporate">{t("bookingRequest.priceTypes.corporate", "Corporate Rate")}</SelectItem>
                            <SelectItem value="discounted">{t("bookingRequest.priceTypes.discounted", "Discounted")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="billing-type" className="text-gray-700">
                        {t("bookingRequest.form.invoiceType", "Billing Type")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select value={billingTypeUI} onValueChange={(v) => setBillingTypeUI(v as any)}>
                        <SelectTrigger id="billing-type" className="border-gray-300">
                          <SelectValue placeholder={t("common.select", "Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">{t("bookingRequest.billing.individual", "Individual")}</SelectItem>
                          <SelectItem value="corporate">{t("bookingRequest.billing.corporate", "Corporate")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="free-accommodation"
                        checked={requestFreeAccommodation}
                        onCheckedChange={(checked) => setRequestFreeAccommodation(checked as boolean)}
                      />
                      <Label htmlFor="free-accommodation" className="text-sm cursor-pointer text-gray-700">
                        {t("bookingRequest.form.freeAccommodation", "Free Accommodation (No payment required)")}
                      </Label>
                    </div>

                    {requestFreeAccommodation && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in fade-in duration-300">
                        <p className="text-xs text-green-800">
                          {t("bookingRequest.form.freeAccommodationHint", "✓ If approved, payment will not be requested for this reservation.")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Extra Information */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3 mb-6">
                      <h3 className="text-xl text-[#003366]">
                        {t("bookingRequest.sections.extraInfo", "Extra Information")}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-gray-700">
                        {t("bookingRequest.form.explanation", "Explanation / Reason")}
                        {accommodationTypeUI === "education" && <span className="text-red-500"> *</span>}
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder={t(
                          "bookingRequest.form.explanationPlaceholder",
                          "Enter any special requests or additional information (required for education-related stays)."
                        )}
                        className="border-gray-300 min-h-[100px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Post-submission info note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <p className="mb-2">
                          {t(
                            "bookingRequest.afterSubmitInfo",
                            "After submission, your request will be reviewed by the EDU team. You will receive an email or push notification after review."
                          )}
                        </p>
                        <p className="text-xs text-blue-700">
                          {t(
                            "bookingRequest.afterSubmitPaymentNote",
                            "Payment will be requested only after approval if applicable."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start space-x-2 pt-2 pb-4">
                    <Checkbox
                      id="consent"
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                      required
                    />
                    <Label htmlFor="consent" className="text-sm cursor-pointer text-gray-700">
                      {t(
                        "bookingRequest.form.consent",
                        "I confirm that the information provided is correct and I accept the reservation rules."
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !consentChecked}
                      className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white py-6 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? t("bookingRequest.form.submitting", "Submitting...")
                        : t("bookingRequest.form.submitButton", "Submit Pre-Reservation")}
                    </Button>
                  </div>

                  {/* Small helper button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-[#003366] underline"
                      onClick={scrollToTopOfForm}
                    >
                      {t("common.backToTop", "Back to top")}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Reservation Rules */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-8">
              <CardHeader className="bg-gradient-to-r from-[#003366] to-[#0066cc] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {t("bookingRequest.rules.title", "Reservation Rules")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-800">
                      {t("bookingRequest.rules.noSunday", "No Sunday check-in")}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-800">
                      {t("bookingRequest.rules.max5short", "Max 5-day consecutive stay (personal)")}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-800">
                      {t("bookingRequest.rules.max30short", "30-day advance reservation limit")}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-800">
                      {t("bookingRequest.rules.emailAuto", "Email notifications sent automatically")}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-amber-900">
                            <strong>{t("common.note", "Note")}:</strong>{" "}
                            {t(
                              "bookingRequest.rules.manualApproval",
                              "All pre-reservations require manual approval by the EDU team."
                            )}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            {t(
                              "bookingRequest.rules.confirmationTime",
                              "You will receive confirmation after review."
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-[#003366] text-white mt-4"
                    onClick={scrollToTopOfForm}
                  >
                    {t("bookingRequest.sidebar.goToForm", "Go to form")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}