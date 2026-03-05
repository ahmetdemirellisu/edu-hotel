import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";

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
  CalendarIcon,
  CheckCircle2,
  Clock,
  Info,
  User,
  Users,
  XCircle,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

import {
  createReservation,
  type AccommodationType,
  type InvoiceType,
} from "../api/reservations";

/* ═══════════════════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════════════════ */
const _style = document.getElementById("book-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "book-anim";
  s.textContent = `
    @keyframes bookFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

/* ═══════════════════════════════════════════════════════════
   Helpers (unchanged)
   ═══════════════════════════════════════════════════════════ */
function isSunday(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00").getDay() === 0;
}
function isSaturday(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00").getDay() === 6;
}
function daysBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut + "T00:00:00").getTime() - new Date(checkIn + "T00:00:00").getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
function isMoreThanDaysAhead(dateStr: string, days: number) {
  if (!dateStr) return false;
  const max = new Date();
  max.setDate(max.getDate() + days);
  return new Date(dateStr + "T00:00:00").getTime() > max.getTime();
}

/* ═══════════════════════════════════════════════════════════
   Shared input class
   ═══════════════════════════════════════════════════════════ */
const inputClass =
  "h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400 transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20";

const selectTriggerClass =
  "h-11 rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]/40 transition-all";

const labelClass = "text-[11px] font-semibold text-gray-500 uppercase tracking-wider";

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */
export function BookRoomPage() {
  const { t, i18n } = useTranslation();
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const storedUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const userId: number | undefined = storedUser?.id ? Number(storedUser.id) : undefined;
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  // ── State (unchanged) ──────────────────────
  const [accommodationTypeUI, setAccommodationTypeUI] = useState<"personal" | "corporate" | "education" | "">("");
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
  const [firstName, setFirstName] = useState(storedUser?.firstName || storedUser?.name || "");
  const [lastName, setLastName] = useState(storedUser?.lastName || storedUser?.surname || "");
  const [phone, setPhone] = useState(storedUser?.phone || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showCorporateCode = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";
  const showPriceType = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";

  // ── Handlers (unchanged) ───────────────────
  const handleNumberOfGuestsChange = (value: string) => {
    const num = Math.max(1, Math.min(10, parseInt(value, 10) || 1));
    setNumberOfGuests(String(num));
    if (num > 1) {
      const newGuestList = Array.from({ length: num - 1 }, (_, i) => guestList[i] || { firstName: "", lastName: "" });
      setGuestList(newGuestList);
    } else { setGuestList([]); }
  };

  const updateGuestInList = (index: number, field: "firstName" | "lastName", value: string) => {
    const updated = [...guestList];
    updated[index] = { ...updated[index], [field]: value };
    setGuestList(updated);
  };

  const scrollToTopOfForm = () => { formTopRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const mapToApiTypes = (): { accommodationType: AccommodationType; invoiceType: InvoiceType } => ({
    accommodationType: accommodationTypeUI === "corporate" ? "CORPORATE" : accommodationTypeUI === "education" ? "EDUCATION" : "PERSONAL",
    invoiceType: billingTypeUI === "corporate" ? "CORPORATE" : "INDIVIDUAL",
  });

  const validateAgainstRules = () => {
    if (!userId) return t("dashboard.validation.notLoggedIn", "Please log in to make a reservation.");
    if (!accommodationTypeUI) return t("bookingRequest.validation.accommodationTypeRequired", "Please select an accommodation type.");
    if (!billingTypeUI) return t("bookingRequest.validation.billingTypeRequired", "Please select a billing type.");
    if (!checkInDate || !checkOutDate) return t("dashboard.validation.datesRequired", "Please select check-in and check-out dates.");
    const nights = daysBetween(checkInDate, checkOutDate);
    if (nights <= 0) return t("bookingRequest.validation.dateOrder", "Check-out date must be after check-in date.");
    if (isSunday(checkInDate)) return t("bookingRequest.validation.noSundayCheckin", "Sunday check-in is not allowed.");
    if (isSaturday(checkInDate) && isSunday(checkOutDate)) return t("bookingRequest.validation.noSatInSunOut", "Saturday check-in and Sunday check-out reservations are not allowed.");
    if (isMoreThanDaysAhead(checkInDate, 30)) return t("bookingRequest.validation.max30Days", "Reservations are allowed up to 30 days in advance.");
    if (accommodationTypeUI === "personal" && nights > 5) return t("bookingRequest.validation.max5Nights", "Personal bookings cannot exceed 5 consecutive nights.");
    if (showCorporateCode && !eventCode.trim()) return t("bookingRequest.validation.codeRequired", "Event / Education code is required for Corporate or Education stays.");
    if (accommodationTypeUI === "education" && !notes.trim()) return t("bookingRequest.validation.explanationRequired", "Please provide an explanation for education-related reservations.");
    if (billingTypeUI === "individual" && !tcKimlikNo.trim()) return t("bookingRequest.validation.tcRequired", "T.C. Kimlik No is required for individual billing.");
    if (billingTypeUI === "corporate" && !taxNumber.trim()) return t("bookingRequest.validation.taxRequired", "Tax Number is required for corporate billing.");
    const g = parseInt(numberOfGuests, 10);
    if (!g || Number.isNaN(g) || g < 1) return t("dashboard.validation.guestsRequired", "Please select number of guests.");
    if (!consentChecked) return t("bookingRequest.validation.consentRequired", "Please confirm the information and accept the reservation rules.");
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) return t("bookingRequest.validation.identityRequired", "Please ensure your name, phone, and email are filled.");
    if (g > 1) { for (let i = 0; i < guestList.length; i++) { if (!guestList[i].firstName.trim() || !guestList[i].lastName.trim()) return t("bookingRequest.validation.additionalGuestsRequired", "Please fill first and last names for all additional guests."); } }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    const ruleError = validateAgainstRules();
    if (ruleError) { setErrorMessage(ruleError); scrollToTopOfForm(); return; }
    const { accommodationType, invoiceType } = mapToApiTypes();
    try {
      setLoading(true);
      await createReservation({
        userId: Number(userId), checkIn: checkInDate, checkOut: checkOutDate, checkInTime: checkInTime.trim(),
        guests: parseInt(numberOfGuests, 10), accommodationType, invoiceType,
        eventCode: showCorporateCode ? eventCode.trim() : undefined,
        firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), contactEmail: email.trim(),
        eventType: eventType.trim(), priceType: priceType?.trim() || undefined,
        freeAccommodation: requestFreeAccommodation, guestList,
        nationalId: tcKimlikNo?.trim() || undefined, taxNumber: taxNumber?.trim() || undefined,
        note: notes?.trim() || undefined,
      });
      setSuccessMessage(t("dashboard.reservation.success", "Your reservation request has been submitted for approval."));
      setAccommodationTypeUI(""); setBillingTypeUI(""); setRequestFreeAccommodation(false);
      setCheckInDate(""); setCheckInTime(""); setCheckOutDate(""); setNumberOfGuests("1"); setGuestList([]);
      setEventCode(""); setEventType(""); setPriceType(""); setTcKimlikNo(""); setTaxNumber(""); setNotes(""); setConsentChecked(false);
      scrollToTopOfForm();
    } catch (err: any) { setErrorMessage(err?.message || "Failed to create reservation."); scrollToTopOfForm(); }
    finally { setLoading(false); }
  };

  const stagger = (i: number): React.CSSProperties => ({ animation: `bookFadeUp 0.5s ease-out ${0.1 + i * 0.06}s both` });

  /* ── Section header helper ──────────────── */
  const SectionHeader = ({ title, accent = "#003366" }: { title: string; accent?: string }) => (
    <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
      <div className="w-1 h-6 rounded-full" style={{ background: accent }} />
      <h3 className="text-base font-semibold text-[#003366] tracking-tight">{title}</h3>
    </div>
  );

  /* ── Required star ──────────────────────── */
  const Req = () => <span className="text-red-400 ml-0.5">*</span>;

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ background: "rgba(0,51,102,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div className="border border-[#c9a84c] px-3 py-1.5 rounded">
                  <div className="text-[11px] font-semibold text-[#c9a84c] leading-tight">Sabancı</div>
                  <div className="text-[10px] text-[#c9a84c]/80 leading-tight">Üniversitesi</div>
                </div>
                <div className="w-px h-8 bg-white/15 hidden sm:block" />
                <h1 className="text-white text-lg font-semibold tracking-[6px] hidden sm:block" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>EDU HOTEL</h1>
              </Link>
            </div>
            <h1 className="sm:hidden text-white text-base font-bold tracking-[4px]">EDU HOTEL</h1>
            <div className="flex items-center gap-3 sm:gap-5">
              <Link to="/main" className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors tracking-wide">
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("header.mainPage", { defaultValue: "Main Page" })}
              </Link>
              <Select value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/5 border-white/20 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </Select>
              <NotificationBell lang={currentLang} />
              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group">
                <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <User className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-xs text-white/70 group-hover:text-white font-medium hidden md:block max-w-[100px] truncate transition-colors">{userName}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title */}
        <div className="mb-9" ref={formTopRef} style={stagger(0)}>
          <h2 className="text-[28px] font-semibold text-[#003366] tracking-tight mb-1.5">
            {t("bookingRequest.pageTitle", "Book a Room")}
          </h2>
          <p className="text-[15px] text-gray-500">
            {t("bookingRequest.pageSubtitle", "Submit your pre-reservation request. The EDU team will review and confirm.")}
          </p>
        </div>

        {/* Success / Error */}
        {(successMessage || errorMessage) && (
          <div className="mb-7" style={stagger(0)}>
            {successMessage && (
              <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">{t("common.success", "Success")}</p>
                  <p className="text-emerald-700">{successMessage}</p>
                  <button type="button" className="mt-2 text-xs font-medium underline underline-offset-2 text-emerald-600" onClick={() => setSuccessMessage(null)}>{t("common.dismiss", "Dismiss")}</button>
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">{t("common.error", "Error")}</p>
                  <p className="text-red-700">{errorMessage}</p>
                  <button type="button" className="mt-2 text-xs font-medium underline underline-offset-2 text-red-600" onClick={() => setErrorMessage(null)}>{t("common.dismiss", "Dismiss")}</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* ── Main Form (2/3) ───────────────────────── */}
          <div className="lg:col-span-2" style={stagger(1)}>
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
            >
              <div className="p-7 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* ── Reservation Information ─────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.reservationInfo", "Reservation Information")} />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>{t("bookingRequest.form.accommodationType", "Accommodation Type")}<Req /></Label>
                        <Select value={accommodationTypeUI} onValueChange={(v) => setAccommodationTypeUI(v as any)}>
                          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">{t("bookingRequest.form.accommodation.personal", "Personal")}</SelectItem>
                            <SelectItem value="corporate">{t("bookingRequest.form.accommodation.corporate", "Corporate (SU)")}</SelectItem>
                            <SelectItem value="education">{t("bookingRequest.form.accommodation.education", "Education")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {showCorporateCode && (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.eventCode", "Event / Education Code")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.eventCodePlaceholder", "Enter SAT-KAF or Education Code")} className={inputClass} value={eventCode} onChange={(e) => setEventCode(e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Guest Information ────────────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.guestInfo", "Guest Information")} />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>{t("bookingRequest.form.guests", "Number of Guests")}<Req /></Label>
                        <Input type="number" min="1" max="10" value={numberOfGuests} onChange={(e) => handleNumberOfGuestsChange(e.target.value)} className={inputClass} />
                        <p className="text-[11px] text-gray-400">{t("bookingRequest.form.guestsHint", "Main guest information below + additional guests")}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.firstName", "First Name")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.firstNamePlaceholder", "Enter first name")} className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.lastName", "Last Name")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.lastNamePlaceholder", "Enter last name")} className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.phone", "Phone Number")}<Req /></Label>
                          <Input type="tel" placeholder={t("bookingRequest.form.phonePlaceholder", "+90 (5xx) xxx xx xx")} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.email", "Email Address")}<Req /></Label>
                          <Input type="email" placeholder={t("bookingRequest.form.emailPlaceholder", "example@email.com")} className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>

                      {parseInt(numberOfGuests, 10) > 1 && (
                        <div className="space-y-3 pl-5 border-l-2 border-blue-200 mt-4">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t("bookingRequest.form.additionalGuests", "Additional Guests")} ({guestList.length})</p>
                          {guestList.map((guest, index) => (
                            <div key={index} className="space-y-1.5">
                              <p className="text-[11px] text-gray-400 font-medium">{t("bookingRequest.form.guest", "Guest")} {index + 2}</p>
                              <div className="flex gap-3">
                                <Input placeholder={t("bookingRequest.form.firstName", "First Name")} value={guest.firstName} onChange={(e) => updateGuestInList(index, "firstName", e.target.value)} className={inputClass} />
                                <Input placeholder={t("bookingRequest.form.lastName", "Last Name")} value={guest.lastName} onChange={(e) => updateGuestInList(index, "lastName", e.target.value)} className={inputClass} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Stay Details ─────────────────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.stayDetails", "Stay Details")} accent="#22c55e" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.checkIn", "Check-in Date")}<Req /></Label>
                          <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.checkInTime", "Check-in Time")}<Req /></Label>
                          <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelClass}>{t("bookingRequest.form.checkOut", "Check-out Date")}<Req /></Label>
                        <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} className={inputClass} />
                      </div>

                      {/* Rules inline */}
                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-2.5">
                        {[
                          t("bookingRequest.rules.noSunday", "No Sunday check-in"),
                          t("bookingRequest.rules.max5", "Max 5 nights for personal bookings"),
                          t("bookingRequest.rules.max30", "Reservations allowed up to 30 days ahead"),
                          t("bookingRequest.rules.noSatInSunOut", "No Saturday check-in + Sunday check-out"),
                        ].map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-[13px] text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Room Assignment ──────────────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.roomAssignment", "Room Assignment")} accent="#8b5cf6" />
                    <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
                      <Info className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[13px] text-violet-800">{t("bookingRequest.roomAssignmentInfo", "Rooms are assigned by the EDU reception after approval. Users cannot select rooms.")}</p>
                    </div>
                  </div>

                  {/* ── Event & Billing ──────────────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.eventBilling", "Event & Billing")} accent="#f59e0b" />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>{t("bookingRequest.form.eventType", "Event Type")}<Req /></Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
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
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.priceType", "Price Type")}<Req /></Label>
                          <Select value={priceType} onValueChange={setPriceType}>
                            <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">{t("bookingRequest.priceTypes.standard", "Standard")}</SelectItem>
                              <SelectItem value="corporate">{t("bookingRequest.priceTypes.corporate", "Corporate Rate")}</SelectItem>
                              <SelectItem value="discounted">{t("bookingRequest.priceTypes.discounted", "Discounted")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className={labelClass}>{t("bookingRequest.form.invoiceType", "Billing Type")}<Req /></Label>
                        <Select value={billingTypeUI} onValueChange={(v) => setBillingTypeUI(v as any)}>
                          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">{t("bookingRequest.billing.individual", "Individual")}</SelectItem>
                            <SelectItem value="corporate">{t("bookingRequest.billing.corporate", "Corporate")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {billingTypeUI === "individual" && (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.tcKimlik", "T.C. Kimlik No")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.tcKimlikPlaceholder", "Enter T.C. Kimlik No")} className={inputClass} value={tcKimlikNo} onChange={(e) => setTcKimlikNo(e.target.value)} />
                        </div>
                      )}
                      {billingTypeUI === "corporate" && (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("bookingRequest.form.taxNumber", "Tax Number")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.taxNumberPlaceholder", "Enter Tax Number")} className={inputClass} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
                        </div>
                      )}
                      <div className="flex items-center space-x-3 pt-1">
                        <Checkbox id="free-accommodation" checked={requestFreeAccommodation} onCheckedChange={(checked) => setRequestFreeAccommodation(checked as boolean)} />
                        <Label htmlFor="free-accommodation" className="text-sm cursor-pointer text-gray-600">{t("bookingRequest.form.freeAccommodation", "Free Accommodation (No payment required)")}</Label>
                      </div>
                      {requestFreeAccommodation && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" />{t("bookingRequest.form.freeAccommodationHint", "If approved, payment will not be requested for this reservation.")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Extra Information ────────────────── */}
                  <div>
                    <SectionHeader title={t("bookingRequest.sections.extraInfo", "Extra Information")} accent="#64748b" />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>
                          {t("bookingRequest.form.explanation", "Explanation / Reason")}
                          {accommodationTypeUI === "education" && <Req />}
                        </Label>
                        <Textarea
                          placeholder={t("bookingRequest.form.explanationPlaceholder", "Enter any special requests or additional information (required for education-related stays).")}
                          className="rounded-xl bg-gray-50/80 border border-gray-200/80 text-gray-800 text-sm placeholder:text-gray-400 min-h-[100px] transition-all duration-200 focus:bg-white focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      {/* Post-submission info */}
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-[13px] text-blue-800">
                          <p className="mb-1">{t("bookingRequest.afterSubmitInfo", "After submission, your request will be reviewed by the EDU team. You will receive an email or push notification after review.")}</p>
                          <p className="text-[11px] text-blue-600">{t("bookingRequest.afterSubmitPaymentNote", "Payment will be requested only after approval if applicable.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Consent + Submit ─────────────────── */}
                  <div className="space-y-5 pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} required className="mt-0.5" />
                      <Label htmlFor="consent" className="text-sm cursor-pointer text-gray-600 leading-relaxed">
                        {t("bookingRequest.form.consent", "I confirm that the information provided is correct and I accept the reservation rules.")}<Req />
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !consentChecked}
                      className="w-full h-13 rounded-xl text-white text-base font-semibold relative overflow-hidden group transition-all duration-300 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed py-4"
                      style={{ background: "linear-gradient(135deg, #003366 0%, #004080 50%, #003366 100%)", backgroundSize: "200% 200%" }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? t("bookingRequest.form.submitting", "Submitting...") : t("bookingRequest.form.submitButton", "Submit Pre-Reservation")}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ── Sidebar (1/3) ─────────────────────────── */}
          <div className="lg:col-span-1" style={stagger(2)}>
            <div className="sticky top-20 space-y-7">
              {/* Rules card */}
              <div
                className="rounded-2xl border border-gray-100 overflow-hidden"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
              >
                <div className="px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, #003366 0%, #004d99 100%)" }}>
                  <div className="flex items-center gap-2.5">
                    <Info className="h-5 w-5 opacity-80" />
                    <h3 className="text-[15px] font-semibold tracking-tight">{t("bookingRequest.rules.title", "Reservation Rules")}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 space-y-5">
                  {[
                    { icon: XCircle, color: "#ef4444", bg: "bg-red-50", text: t("bookingRequest.rules.noSunday", "No Sunday check-in") },
                    { icon: Clock, color: "#f59e0b", bg: "bg-amber-50", text: t("bookingRequest.rules.max5short", "Max 5-day consecutive stay (personal)") },
                    { icon: CalendarIcon, color: "#3b82f6", bg: "bg-blue-50", text: t("bookingRequest.rules.max30short", "30-day advance reservation limit") },
                    { icon: CheckCircle2, color: "#22c55e", bg: "bg-emerald-50", text: t("bookingRequest.rules.emailAuto", "Email notifications sent automatically") },
                  ].map((rule, idx) => {
                    const Icon = rule.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${rule.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-4 w-4" style={{ color: rule.color }} />
                        </div>
                        <p className="text-[13px] text-gray-700">{rule.text}</p>
                      </div>
                    );
                  })}

                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
                      <div className="flex items-start gap-2.5">
                        <Users className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-amber-900 font-semibold mb-1">{t("common.note", "Note")}</p>
                          <p className="text-[11px] text-amber-700 leading-relaxed">{t("bookingRequest.rules.manualApproval", "All pre-reservations require manual approval by the EDU team.")}</p>
                          <p className="text-[11px] text-amber-600 mt-1">{t("bookingRequest.rules.confirmationTime", "You will receive confirmation after review.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}