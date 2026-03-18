import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { Footer } from "./layout/Footer";

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
  ArrowRight,
  Home,
  ChevronRight,
  BedDouble,
  CreditCard,
  Sparkles,
  MapPin,
} from "lucide-react";

import {
  createReservation,
  type AccommodationType,
  type InvoiceType,
} from "../api/reservations";

/* ═══════════════════════════════════════════════════════════
   Animations
   ═══════════════════════════════════════════════════════════ */
if (!document.getElementById("book-anim")) {
  const s = document.createElement("style");
  s.id = "book-anim";
  s.textContent = `
    @keyframes bookFadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatDot {
      0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
      50% { transform: translateY(-8px) scale(1.1); opacity: 0.7; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════════
   Helpers
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
  "h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/15 shadow-sm";

const selectTriggerClass =
  "h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-blue-400/15 focus:border-blue-400/60 transition-all shadow-sm";

const labelClass = "text-[11px] font-bold text-slate-400 uppercase tracking-widest";

/* ═══════════════════════════════════════════════════════════
   Step Indicator
   ═══════════════════════════════════════════════════════════ */
const steps = [
  { id: 1, labelKey: "bookingRequest.steps.stayDetails", icon: CalendarIcon },
  { id: 2, labelKey: "bookingRequest.steps.guestInfo", icon: User },
  { id: 3, labelKey: "bookingRequest.steps.billingSubmit", icon: CreditCard },
];

function StepIndicator({ active }: { active: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = step.id === active;
        const isDone = step.id < active;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : isActive
                    ? "bg-[#003366] text-white shadow-lg shadow-blue-200 scale-110"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider hidden sm:block ${
                  isActive ? "text-[#003366]" : isDone ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 max-w-[60px] transition-all duration-500 ${
                  step.id < active ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */
export function BookRoomPage() {
  const { t } = useTranslation();
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const storedUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const userId: number | undefined = storedUser?.id ? Number(storedUser.id) : undefined;

  // ── State ──────────────────────
  const [accommodationTypeUI, setAccommodationTypeUI] = useState<"personal" | "corporate" | "education" | "">("");
  const [billingTypeUI, setBillingTypeUI] = useState<"individual" | "corporate" | "">("");
  const [requestFreeAccommodation, setRequestFreeAccommodation] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInDisplay, setCheckInDisplay] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutDisplay, setCheckOutDisplay] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [guestList, setGuestList] = useState<Array<{ firstName: string; lastName: string }>>([]);
  const [eventCode, setEventCode] = useState("");
  const [eventType, setEventType] = useState<string>("");
  const [priceType, setPriceType] = useState<string>("");
  const [firstName, setFirstName] = useState(storedUser?.firstName || storedUser?.name || "");
  const [lastName, setLastName] = useState(storedUser?.lastName || storedUser?.surname || "");
  const [phone, setPhone] = useState(storedUser?.phone || "");
  const [email, setEmail] = useState(storedUser?.email || "");
  const [nationalIdType, setNationalIdType] = useState<"tc" | "passport">("tc");
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [billingTitle, setBillingTitle] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showCorporateCode = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";
  const showPriceType = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";

  const nights = daysBetween(checkInDate, checkOutDate);

  // ── Handlers ───────────────────
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
    if (billingTypeUI === "corporate" && !billingTitle.trim()) return t("bookingRequest.validation.billingTitleRequired", "Fatura unvanı is required for corporate billing.");
    if (billingTypeUI === "corporate" && !billingAddress.trim()) return t("bookingRequest.validation.billingAddressRequired", "Fatura adresi is required for corporate billing.");
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
        billingTitle: billingTitle?.trim() || undefined, billingAddress: billingAddress?.trim() || undefined,
        note: notes?.trim() || undefined,
      });
      setSuccessMessage(t("dashboard.reservation.success", "Your reservation request has been submitted for approval."));
      setAccommodationTypeUI(""); setBillingTypeUI(""); setRequestFreeAccommodation(false);
      setCheckInDate(""); setCheckInDisplay(""); setCheckInTime(""); setCheckOutDate(""); setCheckOutDisplay(""); setNumberOfGuests("1"); setGuestList([]); setNationalIdType("tc");
      setEventCode(""); setEventType(""); setPriceType(""); setTcKimlikNo(""); setTaxNumber(""); setBillingTitle(""); setBillingAddress(""); setNotes(""); setConsentChecked(false);
      scrollToTopOfForm();
    } catch (err: any) { setErrorMessage(err?.message || "Failed to create reservation."); scrollToTopOfForm(); }
    finally { setLoading(false); }
  };

  const stagger = (i: number): React.CSSProperties => ({ animation: `bookFadeUp 0.5s ease-out ${0.1 + i * 0.06}s both` });

  // ── DD/MM/YYYY date helpers ─────────────────
  const handleDateTyping = (
    raw: string,
    setDisplay: (v: string) => void,
    setISO: (v: string) => void
  ) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let display = digits;
    if (digits.length > 4) display = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) display = digits.slice(0, 2) + "/" + digits.slice(2);
    setDisplay(display);
    if (digits.length === 8) {
      const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
      setISO(`${y}-${m}-${d}`);
    } else {
      setISO("");
    }
  };

  /* ── Section header helper ──────────────── */
  const SectionHeader = ({ title, accent = "#003366", subtitle }: { title: string; accent?: string; subtitle?: string }) => (
    <div className="flex items-start gap-3 pb-5 mb-6 border-b border-slate-100">
      <div className="w-1 h-6 rounded-full mt-0.5 flex-shrink-0" style={{ background: accent }} />
      <div>
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  /* ── Required star ──────────────────────── */
  const Req = () => <span className="text-red-400 ml-0.5">*</span>;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)" }}>

      {/* ═══ HERO BANNER ══════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #001a3a 0%, #003366 40%, #004080 70%, #0052a3 100%)",
          minHeight: "220px",
        }}
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating decorative dots */}
        {[
          { size: 6, x: "8%", y: "20%", delay: "0s" },
          { size: 4, x: "15%", y: "70%", delay: "0.8s" },
          { size: 8, x: "75%", y: "15%", delay: "0.3s" },
          { size: 5, x: "88%", y: "65%", delay: "1.2s" },
          { size: 3, x: "55%", y: "80%", delay: "0.6s" },
          { size: 7, x: "32%", y: "25%", delay: "1.5s" },
          { size: 4, x: "92%", y: "35%", delay: "0.4s" },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: dot.size,
              height: dot.size,
              left: dot.x,
              top: dot.y,
              animation: `floatDot ${3 + i * 0.5}s ease-in-out ${dot.delay} infinite`,
            }}
          />
        ))}

        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #c9a84c 30%, #e8c96d 50%, #c9a84c 70%, transparent)" }} />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center" style={{ minHeight: "220px" }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <Link to="/main" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs font-medium transition-colors">
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[#c9a84c] text-xs font-semibold">
              {t("bookingRequest.pageTitle", "Book a Room")}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}>
                  <BedDouble className="h-5 w-5 text-[#c9a84c]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                  <span className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest">EDU Hotel</span>
                </div>
              </div>
              <h2
                className="text-white mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(28px, 4vw, 44px)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                }}
              >
                {t("bookingRequest.pageTitle", "Book a Room")}
              </h2>
              <p className="text-white/50 text-sm max-w-md">
                {t("bookingRequest.pageSubtitle", "Submit your pre-reservation request. The EDU team will review and confirm.")}
              </p>
            </div>

            {/* Location badge */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <MapPin className="h-4 w-4 text-[#c9a84c]" />
              <span className="text-white/60 text-xs font-medium">Sabancı University Campus</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div ref={formTopRef} />

        {/* Step Indicator */}
        <div style={stagger(0)}>
          <StepIndicator active={1} />
        </div>

        {/* Success / Error */}
        <AnimatePresence>
          {(successMessage || errorMessage) && (
            <motion.div
              className="mb-7"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {successMessage && (
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold mb-0.5 text-emerald-900">{t("common.success", "Success")}</p>
                    <p className="text-emerald-700">{successMessage}</p>
                    <button type="button" className="mt-2 text-xs font-semibold underline underline-offset-2 text-emerald-600 hover:text-emerald-800 transition-colors" onClick={() => setSuccessMessage(null)}>{t("common.dismiss", "Dismiss")}</button>
                  </div>
                </div>
              )}
              {errorMessage && (
                <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold mb-0.5 text-red-900">{t("common.error", "Error")}</p>
                    <p className="text-red-700">{errorMessage}</p>
                    <button type="button" className="mt-2 text-xs font-semibold underline underline-offset-2 text-red-600 hover:text-red-800 transition-colors" onClick={() => setErrorMessage(null)}>{t("common.dismiss", "Dismiss")}</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* ── Main Form (2/3) ───────────────────────── */}
          <div className="lg:col-span-2" style={stagger(1)}>
            <div
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
            >
              <div className="p-7 sm:p-9">
                <form onSubmit={handleSubmit} className="space-y-10">

                  {/* ── Reservation Information ─────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.reservationInfo", "Reservation Information")}
                      subtitle="Select your accommodation type and preferences"
                    />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>{t("bookingRequest.form.accommodationType", "Accommodation Type")}<Req /></Label>
                        <Select value={accommodationTypeUI} onValueChange={(v) => setAccommodationTypeUI(v as any)}>
                          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">{t("bookingRequest.accommodation.personal", "Personal")}</SelectItem>
                            <SelectItem value="corporate">{t("bookingRequest.accommodation.corporate", "Corporate (SU)")}</SelectItem>
                            <SelectItem value="education">{t("bookingRequest.accommodation.education", "Education")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AnimatePresence>
                        {showCorporateCode && (
                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <Label className={labelClass}>{t("bookingRequest.form.eventCode", "Event / Education Code")}<Req /></Label>
                            <Input placeholder={t("bookingRequest.form.eventCodePlaceholder", "Enter SAT-KAF or Education Code")} className={inputClass} value={eventCode} onChange={(e) => setEventCode(e.target.value)} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ── Stay Details ─────────────────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.stayDetails", "Stay Details")}
                      accent="#22c55e"
                      subtitle="Choose your check-in and check-out dates"
                    />
                    <div className="space-y-4">
                      {/* Date cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/50 space-y-2 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <CalendarIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <Label className={labelClass}>{t("bookingRequest.form.checkIn", "Check-in Date")}<Req /></Label>
                          </div>
                          <Input
                            type="text"
                            placeholder={t("bookingRequest.form.datePlaceholder", "DD/MM/YYYY")}
                            value={checkInDisplay}
                            onChange={(e) => handleDateTyping(e.target.value, setCheckInDisplay, setCheckInDate)}
                            className={inputClass}
                            maxLength={10}
                          />
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/50 space-y-2 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <CalendarIcon className="h-4 w-4 text-orange-600" />
                            </div>
                            <Label className={labelClass}>{t("bookingRequest.form.checkOut", "Check-out Date")}<Req /></Label>
                          </div>
                          <Input
                            type="text"
                            placeholder={t("bookingRequest.form.datePlaceholder", "DD/MM/YYYY")}
                            value={checkOutDisplay}
                            onChange={(e) => handleDateTyping(e.target.value, setCheckOutDisplay, setCheckOutDate)}
                            className={inputClass}
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <Label className={labelClass}>{t("bookingRequest.form.checkInTime", "Check-in Time")}<Req /></Label>
                        </div>
                        <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputClass} />
                      </div>

                      {/* Rules inline */}
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2.5">
                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Reservation Rules
                        </p>
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

                  {/* ── Guest Information ────────────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.guestInfo", "Guest Information")}
                      accent="#8b5cf6"
                      subtitle="Enter details for all guests"
                    />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>{t("bookingRequest.form.guests", "Number of Guests")}<Req /></Label>
                        <Input type="number" min="1" max="10" value={numberOfGuests} onChange={(e) => handleNumberOfGuestsChange(e.target.value)} className={inputClass} />
                        <p className="text-[11px] text-slate-400">{t("bookingRequest.form.guestsHint", "Main guest information below + additional guests")}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={labelClass}>{t("bookingRequest.form.firstName", "First Name")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.firstNamePlaceholder", "Enter first name")} className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>{t("bookingRequest.form.lastName", "Last Name")}<Req /></Label>
                          <Input placeholder={t("bookingRequest.form.lastNamePlaceholder", "Enter last name")} className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={labelClass}>{t("bookingRequest.form.phone", "Phone Number")}<Req /></Label>
                          <Input type="tel" placeholder={t("bookingRequest.form.phonePlaceholder", "+90 (5xx) xxx xx xx")} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>{t("bookingRequest.form.email", "Email Address")}<Req /></Label>
                          <Input type="email" placeholder={t("bookingRequest.form.emailPlaceholder", "example@email.com")} className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {parseInt(numberOfGuests, 10) > 1 && (
                          <motion.div
                            className="space-y-3 pl-5 border-l-2 border-violet-200 mt-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{t("bookingRequest.form.additionalGuests", "Additional Guests")} ({guestList.length})</p>
                            {guestList.map((guest, index) => (
                              <div key={index} className="space-y-1.5">
                                <p className="text-[11px] text-slate-400 font-medium">{t("bookingRequest.form.guest", "Guest")} {index + 2}</p>
                                <div className="flex gap-3">
                                  <Input placeholder={t("bookingRequest.form.firstName", "First Name")} value={guest.firstName} onChange={(e) => updateGuestInList(index, "firstName", e.target.value)} className={inputClass} />
                                  <Input placeholder={t("bookingRequest.form.lastName", "Last Name")} value={guest.lastName} onChange={(e) => updateGuestInList(index, "lastName", e.target.value)} className={inputClass} />
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ── Room Assignment ──────────────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.roomAssignment", "Room Assignment")}
                      accent="#8b5cf6"
                    />
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Info className="h-4.5 w-4.5 text-violet-600" style={{ width: "18px", height: "18px" }} />
                      </div>
                      <p className="text-[13px] text-violet-800 leading-relaxed">{t("bookingRequest.roomAssignmentInfo", "Rooms are assigned by the EDU reception after approval. Users cannot select rooms.")}</p>
                    </div>
                  </div>

                  {/* ── Event & Billing ──────────────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.eventBilling", "Event & Billing")}
                      accent="#f59e0b"
                      subtitle="Select your event type and billing preferences"
                    />
                    <div className="space-y-4">
                      <div className="space-y-2">
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
                      <AnimatePresence>
                        {showPriceType && (
                          <motion.div
                            className="space-y-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Label className={labelClass}>{t("bookingRequest.form.priceType", "Price Type")}<Req /></Label>
                            <Select value={priceType} onValueChange={setPriceType}>
                              <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">{t("bookingRequest.priceTypes.standard", "Standard")}</SelectItem>
                                <SelectItem value="corporate">{t("bookingRequest.priceTypes.corporate", "Corporate Rate")}</SelectItem>
                                <SelectItem value="discounted">{t("bookingRequest.priceTypes.discounted", "Discounted")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="space-y-2">
                        <Label className={labelClass}>{t("bookingRequest.form.invoiceType", "Billing Type")}<Req /></Label>
                        <Select value={billingTypeUI} onValueChange={(v) => setBillingTypeUI(v as any)}>
                          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">{t("bookingRequest.billing.individual", "Individual")}</SelectItem>
                            <SelectItem value="corporate">{t("bookingRequest.billing.corporate", "Corporate")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AnimatePresence>
                        {billingTypeUI === "individual" && (
                          <motion.div
                            className="space-y-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Label className={labelClass}>{t("bookingRequest.form.idType", "ID Type")}<Req /></Label>
                            <div className="flex gap-5">
                              {(["tc", "passport"] as const).map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="nationalIdType"
                                    value={type}
                                    checked={nationalIdType === type}
                                    onChange={() => { setNationalIdType(type); setTcKimlikNo(""); }}
                                    className="accent-[#003366]"
                                  />
                                  <span className="text-sm text-slate-700">
                                    {type === "tc" ? t("bookingRequest.form.tcKimlik", "T.C. Identity No") : t("bookingRequest.form.passport", "Passport No")}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <Input
                              placeholder={nationalIdType === "tc"
                                ? t("bookingRequest.form.tcKimlikPlaceholder", "Enter your T.C. Identity Number")
                                : t("bookingRequest.form.passportPlaceholder", "Enter your Passport Number")}
                              className={inputClass}
                              value={tcKimlikNo}
                              onChange={(e) => setTcKimlikNo(e.target.value)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {billingTypeUI === "corporate" && (
                          <motion.div
                            className="space-y-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="space-y-2">
                              <Label className={labelClass}>{t("bookingRequest.form.taxNumber", "Tax Number")}<Req /></Label>
                              <Input placeholder={t("bookingRequest.form.taxNumberPlaceholder", "Enter Tax Number")} className={inputClass} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelClass}>{t("bookingRequest.form.billingTitle", "Billing Title")}<Req /></Label>
                              <Input placeholder={t("bookingRequest.form.billingTitlePlaceholder", "Enter company / institution name")} className={inputClass} value={billingTitle} onChange={(e) => setBillingTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className={labelClass}>{t("bookingRequest.form.billingAddress", "Billing Address")}<Req /></Label>
                              <Input placeholder={t("bookingRequest.form.billingAddressPlaceholder", "Enter billing address")} className={inputClass} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center space-x-3 pt-1">
                        <Checkbox id="free-accommodation" checked={requestFreeAccommodation} onCheckedChange={(checked) => setRequestFreeAccommodation(checked as boolean)} />
                        <Label htmlFor="free-accommodation" className="text-sm cursor-pointer text-slate-600">{t("bookingRequest.form.freeAccommodation", "Free Accommodation (No payment required)")}</Label>
                      </div>
                      <AnimatePresence>
                        {requestFreeAccommodation && (
                          <motion.div
                            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <p className="text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" />{t("bookingRequest.form.freeAccommodationHint", "If approved, payment will not be requested for this reservation.")}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ── Extra Information ────────────────── */}
                  <div>
                    <SectionHeader
                      title={t("bookingRequest.sections.extraInfo", "Extra Information")}
                      accent="#64748b"
                    />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>
                          {t("bookingRequest.form.explanation", "Explanation / Reason")}
                          {accommodationTypeUI === "education" && <Req />}
                        </Label>
                        <Textarea
                          placeholder={t("bookingRequest.form.explanationPlaceholder", "Enter any special requests or additional information (required for education-related stays).")}
                          className="rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder:text-slate-400 min-h-[100px] transition-all duration-200 focus:bg-white focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/15 shadow-sm"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      {/* Post-submission info */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-[13px] text-blue-800">
                          <p className="font-semibold mb-1">{t("bookingRequest.afterSubmitInfo", "After submission, your request will be reviewed by the EDU team. You will receive an email or push notification after review.")}</p>
                          <p className="text-[11px] text-blue-500">{t("bookingRequest.afterSubmitPaymentNote", "Payment will be requested only after approval if applicable.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Consent + Submit ─────────────────── */}
                  <div className="space-y-5 pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox id="consent" checked={consentChecked} onCheckedChange={(checked) => setConsentChecked(checked as boolean)} required className="mt-0.5" />
                      <Label htmlFor="consent" className="text-sm cursor-pointer text-slate-600 leading-relaxed">
                        {t("bookingRequest.form.consent", "I confirm that the information provided is correct and I accept the reservation rules.")}<Req />
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !consentChecked}
                      className="w-full h-14 rounded-2xl text-white text-base font-bold relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 40%, #0052a3 100%)" }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2.5">
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t("bookingRequest.form.submitting", "Submitting...")}
                          </>
                        ) : (
                          <>
                            {t("bookingRequest.form.submitButton", "Submit Pre-Reservation")}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ── Sidebar (1/3) ─────────────────────────── */}
          <div className="lg:col-span-1" style={stagger(2)}>
            <div className="sticky top-20 space-y-5">

              {/* Price Summary Card */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.1)" }}
              >
                <div
                  className="px-6 py-5"
                  style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 60%, #004080 100%)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white text-[14px] font-bold tracking-tight">Price Summary</h3>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)" }}>
                      <CreditCard className="h-3.5 w-3.5 text-[#c9a84c]" />
                    </div>
                  </div>
                  <p className="text-white/40 text-[11px]">Estimate based on your selection</p>
                </div>
                <div className="bg-white p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Check-in</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {checkInDisplay || <span className="text-slate-300 font-normal">—</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Check-out</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {checkOutDisplay || <span className="text-slate-300 font-normal">—</span>}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-sm">Duration</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-bold text-[#003366] tabular-nums">{nights > 0 ? nights : "—"}</span>
                          {nights > 0 && <span className="text-slate-400 text-sm">{nights === 1 ? "night" : "nights"}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 border border-slate-100 bg-slate-50/60">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-2">Guests</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-800 font-semibold text-sm">{numberOfGuests} {parseInt(numberOfGuests) === 1 ? "guest" : "guests"}</span>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-4"
                    style={{ background: "linear-gradient(135deg, #003366 0%, #0052a3 100%)" }}
                  >
                    <p className="text-white/60 text-xs mb-1">Estimated Total</p>
                    <p className="text-white/50 text-[11px]">Price set by EDU team after approval</p>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/70 text-xs">Room price will be confirmed upon approval of your pre-reservation request.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules card */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}
              >
                <div className="px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, #003366 0%, #004d99 100%)" }}>
                  <div className="flex items-center gap-2.5">
                    <Info className="h-4.5 w-4.5 opacity-80" style={{ width: "18px", height: "18px" }} />
                    <h3 className="text-[14px] font-bold tracking-tight">{t("bookingRequest.rules.title", "Reservation Rules")}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 space-y-4">
                  {[
                    { icon: XCircle, color: "#ef4444", bg: "bg-red-50", border: "border-red-100", text: t("bookingRequest.rules.noSunday", "No Sunday check-in") },
                    { icon: Clock, color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-100", text: t("bookingRequest.rules.max5short", "Max 5-day consecutive stay (personal)") },
                    { icon: CalendarIcon, color: "#3b82f6", bg: "bg-blue-50", border: "border-blue-100", text: t("bookingRequest.rules.max30short", "30-day advance reservation limit") },
                    { icon: CheckCircle2, color: "#22c55e", bg: "bg-emerald-50", border: "border-emerald-100", text: t("bookingRequest.rules.emailAuto", "Email notifications sent automatically") },
                  ].map((rule, idx) => {
                    const Icon = rule.icon;
                    return (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${rule.bg} ${rule.border}`}>
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Icon className="h-4 w-4" style={{ color: rule.color }} />
                        </div>
                        <p className="text-[12px] text-slate-700 font-medium">{rule.text}</p>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <div className="flex items-start gap-2.5">
                        <Users className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-amber-900 font-bold mb-1">{t("common.note", "Note")}</p>
                          <p className="text-[11px] text-amber-700 leading-relaxed">{t("bookingRequest.rules.manualApproval", "All pre-reservations require manual approval by the EDU team.")}</p>
                          <p className="text-[11px] text-amber-500 mt-1">{t("bookingRequest.rules.confirmationTime", "You will receive confirmation after review.")}</p>
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