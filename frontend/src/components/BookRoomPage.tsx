import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { SlideTransition } from "./ui/slide-transition";
import campusBg from "@/assets/campus.png";

import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Check,
  Building2,
  LayoutGrid,
  Info,
  Sparkles,
  Mail,
  ShieldCheck,
  BanIcon,
} from "lucide-react";

import {
  createReservation,
  type AccommodationType,
  type InvoiceType,
} from "../api/reservations";

/* ══════════════════════════════════════════════════════════
   Inject keyframes once
   ══════════════════════════════════════════════════════════ */
if (!document.getElementById("book-wizard-anim")) {
  const s = document.createElement("style");
  s.id = "book-wizard-anim";
  s.textContent = `
    @keyframes wizardFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes campusPanBook {
      0%   { background-position-x: 0%; }
      50%  { background-position-x: 100%; }
      100% { background-position-x: 0%; }
    }
    .tile-accom {
      transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: pointer;
    }
    .tile-accom:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 30px rgba(201,168,76,0.2), 0 0 0 1.5px rgba(201,168,76,0.35);
    }
    .tile-accom.selected {
      box-shadow: 0 0 0 2.5px #c9a84c, 0 8px 30px rgba(201,168,76,0.25);
    }
    .wiz-input {
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.18);
      color: white;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      outline: none;
    }
    .wiz-input::placeholder { color: rgba(255,255,255,0.35); }
    .wiz-input:hover { background: rgba(255,255,255,0.10); }
    .wiz-input:focus {
      border-color: rgba(201,168,76,0.65) !important;
      box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important;
      background: rgba(255,255,255,0.11) !important;
    }
    .date-picker-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; height: 56px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      padding: 0 16px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      text-align: left;
    }
    .date-picker-btn:hover {
      background: rgba(255,255,255,0.10);
      border-color: rgba(255,255,255,0.28);
    }
    .date-picker-btn[data-state=open],
    .date-picker-btn:focus {
      border-color: rgba(201,168,76,0.65) !important;
      box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important;
      background: rgba(255,255,255,0.11) !important;
      outline: none;
    }
    .bp-dash {
      background-image: repeating-linear-gradient(
        90deg,
        rgba(255,255,255,0.18) 0px,
        rgba(255,255,255,0.18) 6px,
        transparent 6px,
        transparent 12px
      );
    }
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */
function toDisplayDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ══════════════════════════════════════════════════════════
   Premium DatePicker
   ══════════════════════════════════════════════════════════ */
function DatePickerField({
  value,
  onChange,
  placeholder,
  minDate,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder: string;
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const minDateObj = minDate ? parseISO(minDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="date-picker-btn" data-state={open ? "open" : "closed"}>
          <CalendarIcon className="h-4 w-4 flex-shrink-0" style={{ color: "#c9a84c" }} />
          <span style={{ color: selected ? "white" : "rgba(255,255,255,0.35)", fontWeight: selected ? 400 : 300 }}>
            {selected ? format(selected, "dd/MM/yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 border-0 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #001428 0%, #002244 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)",
          width: "auto",
        }}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          disabled={(date) => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (date < today) return true;
            if (minDateObj && date < minDateObj) return true;
            return false;
          }}
          initialFocus
          classNames={{
            months: "flex flex-col",
            month: "flex flex-col gap-3 p-4",
            caption: "flex justify-center items-center relative",
            caption_label: "text-sm font-semibold text-white tracking-wide",
            nav: "flex items-center gap-1",
            nav_button: "h-7 w-7 bg-white/5 hover:bg-white/15 border border-white/15 rounded-lg flex items-center justify-center transition-colors",
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-[#c9a84c]/60 rounded-md w-9 font-medium text-[0.75rem] text-center",
            row: "flex w-full mt-1",
            cell: "relative p-0 text-center",
            day: "h-9 w-9 p-0 font-normal text-sm text-white/75 hover:bg-white/10 hover:text-white rounded-lg transition-colors",
            day_selected: "bg-[#c9a84c] text-black font-bold hover:bg-[#d4b45a] hover:text-black rounded-lg",
            day_today: "text-[#c9a84c] font-semibold underline decoration-dotted",
            day_outside: "text-white/20",
            day_disabled: "text-white/20 cursor-not-allowed hover:bg-transparent",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ══════════════════════════════════════════════════════════
   Premium TimePicker
   ══════════════════════════════════════════════════════════ */
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function TimePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (hhmm: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(value || "14:00");
  const [hh, mm] = (typed.match(/^(\d{2}):(\d{2})$/) ? typed : (value || "14:00")).split(":");

  // Sync typed input when external value changes (e.g. reset)
  React.useEffect(() => { if (value) setTyped(value); }, [value]);

  const selectGrid = (newHh: string, newMm: string) => {
    const t = `${newHh}:${newMm}`;
    setTyped(t);
    onChange(t);
    setOpen(false);
  };

  const handleTyped = (raw: string) => {
    setTyped(raw);
    // Auto-insert colon after 2 digits
    const cleaned = raw.replace(/[^0-9:]/g, "");
    if (/^(\d{2}):(\d{2})$/.test(cleaned)) {
      const [h, m] = cleaned.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(cleaned);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="date-picker-btn" data-state={open ? "open" : "closed"}>
          <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "#c9a84c" }} />
          <span style={{ color: value ? "white" : "rgba(255,255,255,0.35)", fontWeight: value ? 400 : 300 }}>
            {value || "HH:MM"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 border-0 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #001428 0%, #002244 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)",
          width: "260px",
        }}
      >
        <div className="p-4">
          <p className="text-[10px] font-bold text-[#c9a84c]/60 uppercase tracking-[3px] mb-3">{t("bookRoom.timePicker.label", "Select or Type Time")}</p>
          {/* Manual input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={typed}
              onChange={e => handleTyped(e.target.value)}
              placeholder="14:00"
              maxLength={5}
              className="wiz-input w-full h-10 rounded-xl text-sm text-center font-mono tracking-widest"
              style={{ letterSpacing: "0.2em" }}
            />
          </div>
          {/* Hour grid */}
          <div className="grid grid-cols-6 gap-1 mb-3">
            {HOURS.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => selectGrid(h, mm || "00")}
                className="h-8 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: hh === h ? "#c9a84c" : "rgba(255,255,255,0.05)",
                  color: hh === h ? "#000" : "rgba(255,255,255,0.6)",
                  border: hh === h ? "none" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {h}
              </button>
            ))}
          </div>
          {/* Divider */}
          <div className="h-px bg-white/10 mb-3" />
          {/* Minute row */}
          <div className="flex gap-2">
            {MINUTES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => selectGrid(hh || "14", m)}
                className="flex-1 h-9 rounded-lg text-sm font-bold transition-colors"
                style={{
                  background: mm === m ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)",
                  color: mm === m ? "#c9a84c" : "rgba(255,255,255,0.55)",
                  border: mm === m ? "1.5px solid rgba(201,168,76,0.5)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                :{m}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ══════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════ */
export function BookRoomPage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());
  const userName = localStorage.getItem("userName") || "";

  // ── Wizard navigation ──────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);

  // ── Stored user ────────────────────────────────────────
  const storedUser = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return {
        id: u.id || u.userId || localStorage.getItem("userId"),
        firstName: u.firstName || u.name?.split(" ")[0] || "",
        lastName: u.lastName || u.surname || u.name?.split(" ").slice(1).join(" ") || "",
        email: u.email || localStorage.getItem("userEmail") || "",
        phone: u.phone || "",
      };
    } catch {
      return { id: null, firstName: "", lastName: "", email: "", phone: "" };
    }
  }, []);

  // ── Step 1 state ───────────────────────────────────────
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutDate, setCheckOutDate] = useState("");
  const nights = useMemo(() => daysBetween(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

  // ── Step 2 state ───────────────────────────────────────
  const [accommodationTypeUI, setAccommodationTypeUI] = useState<"personal" | "corporate" | "education" | "">("");
  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [firstName, setFirstName] = useState(storedUser.firstName);
  const [lastName, setLastName] = useState(storedUser.lastName);
  const [phone, setPhone] = useState(storedUser.phone);
  const [email, setEmail] = useState(storedUser.email);
  const [guestList, setGuestList] = useState<{ firstName: string; lastName: string }[]>([]);
  const [eventCode, setEventCode] = useState("");
  const [eventType, setEventType] = useState("");
  const [priceType, setPriceType] = useState("");
  const [notes, setNotes] = useState("");

  const showCorporateCode = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";
  const showPriceType = accommodationTypeUI === "corporate" || accommodationTypeUI === "education";
  const numGuests = parseInt(numberOfGuests) || 1;

  const syncGuestList = (n: number) => {
    const extra = Math.max(0, n - 1);
    setGuestList(prev => {
      const next = [...prev];
      while (next.length < extra) next.push({ firstName: "", lastName: "" });
      return next.slice(0, extra);
    });
  };

  // ── Step 3 state ───────────────────────────────────────
  const [billingTypeUI, setBillingTypeUI] = useState<"individual" | "corporate" | "">("");
  const [nationalIdType, setNationalIdType] = useState<"tc" | "passport">("tc");
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [billingTitle, setBillingTitle] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [requestFreeAccommodation, setRequestFreeAccommodation] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // ���─ Submit state ───────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Validation ─────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!checkInDate || !checkOutDate)
      return t("bookRoom.validation.datesRequired", "Please select check-in and check-out dates.");
    if (daysBetween(checkInDate, checkOutDate) <= 0)
      return t("bookRoom.validation.checkoutAfterCheckin", "Check-out must be after check-in.");
    const dow = new Date(checkInDate).getDay();
    if (dow === 0)
      return t("bookRoom.validation.noSundayCheckin", "Check-in on Sundays is not available.");
    if (dow === 6 && new Date(checkOutDate).getDay() === 0)
      return t("bookRoom.validation.noSatSunStay", "Saturday check-in with Sunday check-out is not allowed.");
    if (daysBetween(todayISO(), checkInDate) > 30)
      return t("bookRoom.validation.tooFarAhead", "Reservations can only be made up to 30 days in advance.");
    if (!checkInTime.trim())
      return t("bookRoom.validation.timeRequired", "Please select a check-in time.");
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!accommodationTypeUI)
      return t("bookRoom.validation.accommodationRequired", "Please select an accommodation type.");
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim())
      return t("bookRoom.validation.guestInfoRequired", "Please fill all guest information fields.");
    if (numGuests < 1 || numGuests > 10)
      return t("bookRoom.validation.guestCount", "Number of guests must be between 1 and 10.");
    if (numGuests > 1) {
      for (const g of guestList) {
        if (!g.firstName.trim() || !g.lastName.trim())
          return t("bookRoom.validation.guestListIncomplete", "Please fill all guest names.");
      }
    }
    if (accommodationTypeUI === "personal" && nights > 5)
      return t("bookRoom.validation.personalMaxNights", "Personal stays cannot exceed 5 consecutive nights.");
    if (showCorporateCode && !eventCode.trim())
      return t("bookRoom.validation.eventCodeRequired", "Event code is required for this accommodation type.");
    if (accommodationTypeUI === "education" && !notes.trim())
      return t("bookRoom.validation.notesRequired", "Please provide an explanation for educational stays.");
    if (!eventType.trim())
      return t("bookRoom.validation.eventTypeRequired", "Please select a purpose of stay.");
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!billingTypeUI)
      return t("bookRoom.validation.billingRequired", "Please select a billing type.");
    if (billingTypeUI === "individual" && !tcKimlikNo.trim())
      return t("bookRoom.validation.idRequired", "National ID or Passport number is required.");
    if (billingTypeUI === "corporate") {
      if (!taxNumber.trim()) return t("bookRoom.validation.taxRequired", "Tax number is required.");
      if (!billingTitle.trim()) return t("bookRoom.validation.billingTitleRequired", "Company name is required.");
      if (!billingAddress.trim()) return t("bookRoom.validation.billingAddressRequired", "Billing address is required.");
    }
    if (!consentChecked)
      return t("bookRoom.validation.consent", "Please accept the terms and conditions.");
    return null;
  };

  // ── Navigation ─────────────────────────────────────────
  const goNext = () => {
    let err: string | null = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (err) { setErrorMessage(err); return; }
    setErrorMessage(null);
    setDirection(1);
    setStep(s => (s + 1) as 1 | 2 | 3);
  };
  const goBack = () => {
    setErrorMessage(null);
    setDirection(-1);
    setStep(s => (s - 1) as 1 | 2 | 3);
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep3();
    if (err) { setErrorMessage(err); return; }
    const userId = storedUser.id;
    if (!userId) { setErrorMessage(t("bookRoom.validation.notLoggedIn", "You must be logged in.")); return; }

    const accommodationType: AccommodationType =
      accommodationTypeUI === "corporate" ? "CORPORATE"
      : accommodationTypeUI === "education" ? "EDUCATION"
      : "PERSONAL";
    const invoiceType: InvoiceType = billingTypeUI === "corporate" ? "CORPORATE" : "INDIVIDUAL";

    setLoading(true);
    setErrorMessage(null);
    try {
      await createReservation({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        checkInTime: checkInTime.trim(),
        guests: numGuests,
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
        billingTitle: billingTitle?.trim() || undefined,
        billingAddress: billingAddress?.trim() || undefined,
        note: notes?.trim() || undefined,
      });
      setSuccessMessage(t("bookRoom.successMessage", "Your reservation has been submitted! The reception will review your request and assign you a room."));
      // Reset
      setStep(1); setDirection(1);
      setCheckInDate(""); setCheckInTime("14:00"); setCheckOutDate("");
      setAccommodationTypeUI(""); setNumberOfGuests("1"); setGuestList([]);
      setFirstName(storedUser.firstName); setLastName(storedUser.lastName);
      setPhone(storedUser.phone); setEmail(storedUser.email);
      setEventCode(""); setEventType(""); setPriceType(""); setNotes("");
      setBillingTypeUI(""); setTcKimlikNo(""); setTaxNumber(""); setBillingTitle(""); setBillingAddress("");
      setRequestFreeAccommodation(false); setConsentChecked(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Unknown error";
      setErrorMessage(`${t("bookRoom.errorMessage", "Reservation failed")}: ${msg}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // ── Accommodation tiles data ────────────────────────────
  const accommodationTiles = [
    { key: "personal" as const, icon: User, label: t("bookRoom.accommodationType.personal", "Personal"), desc: t("bookRoom.accommodationType.personalDesc", "Individual stay") },
    { key: "corporate" as const, icon: Briefcase, label: t("bookRoom.accommodationType.corporate", "Corporate"), desc: t("bookRoom.accommodationType.corporateDesc", "Business & events") },
    { key: "education" as const, icon: GraduationCap, label: t("bookRoom.accommodationType.education", "Academic"), desc: t("bookRoom.accommodationType.educationDesc", "Seminars & workshops") },
  ];

  const stepLabels = [
    t("bookRoom.step1.label", "Stay Dates"),
    t("bookRoom.step2.label", "Guest & Purpose"),
    t("bookRoom.step3.label", "Billing & Confirm"),
  ];

  // ── Common input class ─────────────────────────────────
  const wi = "wiz-input w-full rounded-xl text-sm";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Campus panoramic background */}
      <div
        className="fixed inset-0 z-[-2] bg-[#001428]"
        style={{
          backgroundImage: `url(${campusBg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0% 50%",
          transform: "scale(1.05)",
          transformOrigin: "center center",
          animation: "campusPanBook 90s ease-in-out infinite",
        }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-[#001428]/97 via-[#002244]/92 to-[#001428]/97" />

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,25,51,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 6px 28px rgba(0,20,50,0.4)",
        }}
      >
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5px",
          background: "linear-gradient(90deg, transparent, #c9a84c 30%, #4da6ff 60%, #c9a84c 80%, transparent)",
          opacity: 0.55,
        }} />
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/main" className="flex items-center gap-4">
                <div
                  className="border border-[#c9a84c]/55 px-3 py-1.5 rounded transition-all duration-300 hover:border-[#c9a84c] hover:shadow-[0_0_14px_rgba(201,168,76,0.2)]"
                  style={{ background: "rgba(201,168,76,0.07)" }}
                >
                  <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                  <div className="text-[10px] text-[#c9a84c]/70 leading-tight">Üniversitesi</div>
                </div>
                <div className="w-px h-8 bg-white/15 hidden sm:block" />
                <h1 className="text-white text-lg font-light tracking-[7px] uppercase hidden sm:block"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  EDU HOTEL
                </h1>
              </Link>
            </div>
            <h1 className="sm:hidden text-white text-base font-light tracking-[5px] uppercase">EDU HOTEL</h1>
            <div className="flex items-center gap-3 sm:gap-5">
              <Link to="/main" className="hidden md:flex items-center gap-1.5 text-xs text-white/55 hover:text-white transition-colors tracking-wide">
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("header.mainPage", { defaultValue: "Main Page" })}
              </Link>
              <Select value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/6 border-white/18 text-white text-xs font-semibold hover:bg-white/10 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </Select>
              <NotificationBell lang={currentLang} />
              <Link to="/profile" className="flex items-center gap-2.5 pl-1 group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <User className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-xs text-white/70 group-hover:text-white font-medium hidden md:block max-w-[100px] truncate transition-colors">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Success screen ──────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)] p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="max-w-md w-full rounded-3xl p-10 text-center"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-wide mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {t("bookRoom.successTitle", "Reservation Submitted")}
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-8">{successMessage}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/reservations"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #001f40, #003366)" }}>
                {t("bookRoom.viewReservations", "View Reservations")}
              </Link>
              <button onClick={() => setSuccessMessage(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/60 border border-white/15 hover:bg-white/5 transition-colors">
                {t("bookRoom.bookAnother", "Book Another")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Wizard ─────────────────────────────────────────── */}
      {!successMessage && (
        <main className="flex justify-center min-h-[calc(100vh-65px)] p-4 sm:p-6 py-10">
          <div className="w-full max-w-2xl" style={{ animation: "wizardFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>

            {/* Progress header */}
            <div className="mb-6 px-1">
              <div className="flex items-center justify-between mb-3">
                {stepLabels.map((label, i) => {
                  const s = i + 1;
                  const isActive = step === s;
                  const isDone = step > s;
                  return (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 flex-shrink-0"
                          style={{
                            background: isDone ? "#10b981" : isActive ? "#c9a84c" : "rgba(255,255,255,0.22)",
                            color: isDone || isActive ? "#000" : "rgba(255,255,255,0.85)",
                            boxShadow: isActive ? "0 0 14px rgba(201,168,76,0.4)" : isDone ? "0 0 10px rgba(16,185,129,0.3)" : "none",
                          }}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : s}
                        </div>
                        <span className={`text-xs font-bold transition-colors ${isActive ? "text-[#c9a84c]" : isDone ? "text-emerald-400" : "text-white/80"}`}>
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className="flex-1 mx-3 hidden sm:block">
                          <div className="h-px bg-white/10 relative">
                            <div className="h-px absolute left-0 top-0 transition-all duration-500"
                              style={{ background: "#c9a84c", width: isDone ? "100%" : "0%" }} />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #c9a84c, #f0d080)" }}
                  animate={{ width: `${((step - 1) / 2) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Frosted glass card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, rgba(0,30,65,0.82) 0%, rgba(0,20,45,0.88) 100%)",
                backdropFilter: "blur(48px)",
                WebkitBackdropFilter: "blur(48px)",
                border: "1px solid rgba(201,168,76,0.22)",
                boxShadow: "0 32px 96px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,76,0.08), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25)",
              }}
            >
              {/* Card header */}
              <div className="px-8 pt-8 pb-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0"
                    style={{ background: "linear-gradient(180deg, #c9a84c, #f0d080)" }} />
                  <div>
                    <p className="text-[10px] font-bold text-[#c9a84c]/65 uppercase tracking-[3px]">
                      {t("bookRoom.wizard.title", "Room Reservation")} · {t("bookRoom.wizard.step", "Step")} {step} {t("bookRoom.wizard.of", "of")} 3
                    </p>
                    <h2 className="text-xl font-light text-white mt-0.5"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {step === 1 ? t("bookRoom.step1.title", "Select Your Dates")
                        : step === 2 ? t("bookRoom.step2.title", "Guest & Purpose")
                        : t("bookRoom.step3.title", "Billing & Confirm")}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div className="mx-8 mt-5 flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {/* Step content */}
              <div className="p-8 pt-6">
                <SlideTransition step={step} direction={direction}>

                  {/* ════════════════════════════════════════
                      STEP 1 — When?
                      ════════════════════════════════════════ */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Check-in date */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                            {t("bookRoom.checkIn", "Check-In Date")}
                          </Label>
                          <DatePickerField
                            value={checkInDate}
                            onChange={setCheckInDate}
                            placeholder="DD/MM/YYYY"
                            minDate={todayISO()}
                          />
                        </div>

                        {/* Check-out date */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                            {t("bookRoom.checkOut", "Check-Out Date")}
                          </Label>
                          <DatePickerField
                            value={checkOutDate}
                            onChange={setCheckOutDate}
                            placeholder="DD/MM/YYYY"
                            minDate={checkInDate || todayISO()}
                          />
                        </div>
                      </div>

                      {/* Check-in time */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.checkInTime", "Expected Check-In Time")}
                        </Label>
                        <TimePickerField value={checkInTime} onChange={setCheckInTime} />
                      </div>

                      {/* Nights summary */}
                      {nights > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-2xl"
                          style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-[#c9a84c]"
                              style={{ background: "rgba(201,168,76,0.12)" }}>
                              {nights}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {nights} {nights === 1 ? t("bookRoom.night", "night") : t("bookRoom.nights", "nights")}
                              </p>
                              <p className="text-xs text-white/35 mt-0.5">
                                {toDisplayDate(checkInDate)} → {toDisplayDate(checkOutDate)}
                              </p>
                            </div>
                          </div>
                          <Sparkles className="h-4 w-4 text-[#c9a84c]/40" />
                        </motion.div>
                      )}

                      {/* Reservation Rules card */}
                      <div className="rounded-2xl overflow-hidden"
                        style={{ border: "1px solid rgba(255,255,255,0.09)" }}>

                        {/* Header */}
                        <div className="px-5 py-3 flex items-center gap-2.5"
                          style={{ background: "rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          <ShieldCheck className="h-4 w-4 text-[#c9a84c]" />
                          <p className="text-xs font-bold text-[#c9a84c] uppercase tracking-[2px]">
                            {t("dashboard.rules.title", "Reservation Rules")}
                          </p>
                        </div>

                        {/* Rule rows */}
                        <div className="px-5 py-4 space-y-3"
                          style={{ background: "rgba(255,255,255,0.025)" }}>
                          {[
                            { icon: BanIcon,      color: "text-red-400",     bg: "rgba(239,68,68,0.1)",    text: t("dashboard.rules.r1", "No check-in on Sundays.") },
                            { icon: Clock,        color: "text-amber-400",   bg: "rgba(251,191,36,0.1)",   text: t("dashboard.rules.r2", "Personal stays: max 5 consecutive nights.") },
                            { icon: CalendarIcon, color: "text-blue-400",    bg: "rgba(96,165,250,0.1)",   text: t("dashboard.rules.r3", "Reservations: max 30 days in advance.") },
                            { icon: Mail,         color: "text-emerald-400", bg: "rgba(52,211,153,0.1)",   text: t("bookRoom.rules.emailNotif", "Email notifications sent automatically after review.") },
                          ].map(({ icon: Icon, color, bg, text }, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: bg }}>
                                <Icon className={`h-3.5 w-3.5 ${color}`} />
                              </div>
                              <p className="text-xs text-white/60 leading-relaxed mt-0.5">{text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Note / approval info */}
                        <div className="px-5 py-4 flex gap-3"
                          style={{ background: "rgba(77,166,255,0.04)", borderTop: "1px solid rgba(77,166,255,0.1)" }}>
                          <Info className="h-4 w-4 text-blue-400/65 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-200/55 leading-relaxed space-y-1.5">
                            <p>
                              <span className="font-semibold text-blue-200/75">
                                {t("bookRoom.rules.approvalTitle", "All pre-reservations require manual approval")}
                              </span>
                              {" "}{t("bookRoom.rules.approvalDesc", "by the EDU team. You will receive confirmation after review.")}
                            </p>
                            <p>{t("bookRoom.rules.notifDesc", "After submission, your request will be reviewed. You will receive an email or push notification after review.")}</p>
                            <p>{t("bookRoom.rules.paymentNote", "Payment will be requested only after approval if applicable.")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════
                      STEP 2 — Who & Why?
                      ════════════════════════════════════════ */}
                  {step === 2 && (
                    <div className="space-y-7">
                      {/* Accommodation type tiles */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.accommodationType.label", "Accommodation Type")}
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          {accommodationTiles.map((tile) => {
                            const Icon = tile.icon;
                            const isSelected = accommodationTypeUI === tile.key;
                            return (
                              <button
                                key={tile.key}
                                type="button"
                                onClick={() => setAccommodationTypeUI(tile.key)}
                                className={`tile-accom relative flex flex-col items-center gap-2.5 p-4 rounded-2xl text-center ${isSelected ? "selected" : ""}`}
                                style={{
                                  background: isSelected ? "rgba(201,168,76,0.09)" : "rgba(255,255,255,0.04)",
                                  border: isSelected ? "2px solid #c9a84c" : "1.5px solid rgba(255,255,255,0.09)",
                                }}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#c9a84c] flex items-center justify-center">
                                    <Check style={{ width: 9, height: 9, color: "#000" }} />
                                  </div>
                                )}
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                  style={{ background: isSelected ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.06)" }}>
                                  <Icon className="h-5 w-5" style={{ color: isSelected ? "#c9a84c" : "rgba(255,255,255,0.45)" }} />
                                </div>
                                <div>
                                  <p className={`text-xs font-bold ${isSelected ? "text-[#c9a84c]" : "text-white/60"}`}>{tile.label}</p>
                                  <p className="text-[10px] text-white/25 mt-0.5 leading-tight hidden sm:block">{tile.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Number of guests */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.numberOfGuests", "Number of Guests")}
                        </Label>
                        <div className="flex gap-2 flex-wrap items-center">
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => { setNumberOfGuests(String(n)); syncGuestList(n); }}
                              className="w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200"
                              style={{
                                background: numGuests === n ? "rgba(201,168,76,0.13)" : "rgba(255,255,255,0.05)",
                                border: numGuests === n ? "2px solid #c9a84c" : "1.5px solid rgba(255,255,255,0.09)",
                                color: numGuests === n ? "#c9a84c" : "rgba(255,255,255,0.45)",
                                boxShadow: numGuests === n ? "0 0 12px rgba(201,168,76,0.18)" : "none",
                              }}
                            >
                              {n}
                            </button>
                          ))}
                          {/* 7+ tile */}
                          {numGuests <= 6 ? (
                            <button
                              type="button"
                              onClick={() => { setNumberOfGuests("7"); syncGuestList(7); }}
                              className="px-3 h-11 rounded-xl text-xs font-bold transition-all duration-200"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1.5px solid rgba(255,255,255,0.09)",
                                color: "rgba(255,255,255,0.35)",
                              }}
                            >7+</button>
                          ) : (
                            <input
                              type="number"
                              min="7" max="10"
                              value={numberOfGuests}
                              onChange={e => { setNumberOfGuests(e.target.value); syncGuestList(parseInt(e.target.value) || 7); }}
                              className="wiz-input w-16 h-11 rounded-xl text-sm text-center"
                            />
                          )}
                        </div>
                      </div>

                      {/* Primary guest info */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.guestInfo", "Primary Guest")}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={firstName} onChange={e => setFirstName(e.target.value)}
                            placeholder={t("signup.firstNamePlaceholder", "First Name")}
                            className={`${wi} h-12 px-4`} />
                          <input value={lastName} onChange={e => setLastName(e.target.value)}
                            placeholder={t("signup.lastNamePlaceholder", "Last Name")}
                            className={`${wi} h-12 px-4`} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder={t("login.email", "Email")}
                            className={`${wi} h-12 px-4`} />
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder={t("account.profile.phone", "Phone")}
                            className={`${wi} h-12 px-4`} />
                        </div>
                      </div>

                      {/* Additional guests */}
                      {guestList.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                            {t("bookRoom.additionalGuests", "Additional Guests")}
                          </Label>
                          {guestList.map((g, i) => (
                            <div key={i} className="grid grid-cols-2 gap-3">
                              <input
                                value={g.firstName}
                                onChange={e => setGuestList(prev => prev.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))}
                                placeholder={t("bookRoom.additionalGuestFirstName", "Guest {{n}} — First Name", { n: i + 2 })}
                                className={`${wi} h-11 px-4`}
                              />
                              <input
                                value={g.lastName}
                                onChange={e => setGuestList(prev => prev.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))}
                                placeholder={t("bookRoom.additionalGuestLastName", "Last Name")}
                                className={`${wi} h-11 px-4`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Event code */}
                      {showCorporateCode && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                            {t("bookRoom.eventCode", "Event / Education Code")} <span className="text-red-400 ml-1">*</span>
                          </Label>
                          <input
                            value={eventCode}
                            onChange={e => setEventCode(e.target.value)}
                            placeholder="e.g. CONF-2026-001"
                            className={`${wi} h-12 px-4`}
                          />
                        </div>
                      )}

                      {/* Purpose of stay */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.eventType", "Purpose of Stay")}
                        </Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger className="h-12 rounded-xl border-white/[0.14] text-white text-sm focus:ring-0 focus:ring-offset-0"
                            style={{ background: "rgba(255,255,255,0.04)" }}>
                            <SelectValue placeholder={t("bookRoom.eventTypePlaceholder", "Select purpose...")} />
                          </SelectTrigger>
                          <SelectContent>
                            {["conference", "seminar", "workshop", "training", "meeting", "personal", "other"].map(v => (
                              <SelectItem key={v} value={v}>
                                {t(`bookRoom.eventTypes.${v}`, v.charAt(0).toUpperCase() + v.slice(1))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price type */}
                      {showPriceType && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                            {t("bookRoom.priceType", "Price Type")}
                          </Label>
                          <Select value={priceType} onValueChange={setPriceType}>
                            <SelectTrigger className="h-12 rounded-xl border-white/[0.14] text-white text-sm focus:ring-0 focus:ring-offset-0"
                              style={{ background: "rgba(255,255,255,0.04)" }}>
                              <SelectValue placeholder={t("bookRoom.priceTypePlaceholder", "Select price type...")} />
                            </SelectTrigger>
                            <SelectContent>
                              {["standard", "corporate", "discounted"].map(v => (
                                <SelectItem key={v} value={v}>
                                  {t(`bookRoom.priceTypes.${v}`, v.charAt(0).toUpperCase() + v.slice(1))}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.notes", "Notes / Explanation")}
                          {accommodationTypeUI === "education" && <span className="text-red-400 ml-1">*</span>}
                        </Label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          rows={3}
                          placeholder={t("bookRoom.notesPlaceholder", "Purpose of your stay, special requirements...")}
                          className={`${wi} px-4 py-3 resize-none`}
                        />
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════
                      STEP 3 — Billing & Confirm
                      ════════════════════════════════════════ */}
                  {step === 3 && (
                    <div className="space-y-7">
                      {/* ── Boarding pass ── */}
                      <div
                        className="rounded-2xl overflow-visible"
                        style={{
                          background: "linear-gradient(135deg, #000e1f 0%, #001f40 50%, #001428 100%)",
                          border: "1px solid rgba(201,168,76,0.22)",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                        }}
                      >
                        {/* Top half */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <p className="text-[9px] font-black text-[#c9a84c]/60 tracking-[3px] uppercase">Sabancı University</p>
                              <p className="text-[13px] font-light text-white tracking-[4px] uppercase mt-0.5"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>EDU HOTEL</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-white/25 uppercase tracking-[2px]">{t("bookRoom.boardingPass.reservation", "Reservation")}</p>
                              <p className="text-xs font-black text-[#c9a84c] tracking-[3px] mt-0.5">PASS</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.checkIn", "Check-In")}</p>
                              <p className="text-sm font-bold text-white">{toDisplayDate(checkInDate)}</p>
                              <p className="text-[10px] text-white/35 mt-0.5">{checkInTime}</p>
                            </div>
                            <div className="flex flex-col items-center pt-1">
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-px bg-white/20" />
                                <ArrowRight className="h-3 w-3 text-[#c9a84c]/55" />
                                <div className="w-5 h-px bg-white/20" />
                              </div>
                              <p className="text-xs font-black text-[#c9a84c] mt-1.5">{nights}N</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.checkOut", "Check-Out")}</p>
                              <p className="text-sm font-bold text-white">{toDisplayDate(checkOutDate)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Perforation */}
                        <div className="relative h-5 flex items-center">
                          <div className="absolute -left-2.5 w-5 h-5 rounded-full"
                            style={{ background: "rgba(0,36,77,0.8)", border: "1px solid rgba(201,168,76,0.1)" }} />
                          <div className="w-full bp-dash h-px mx-3" />
                          <div className="absolute -right-2.5 w-5 h-5 rounded-full"
                            style={{ background: "rgba(0,36,77,0.8)", border: "1px solid rgba(201,168,76,0.1)" }} />
                        </div>

                        {/* Bottom half */}
                        <div className="p-6 pt-3">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.boardingPass.guest", "Guest")}</p>
                              <p className="text-xs font-bold text-white truncate">{firstName} {lastName}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.boardingPass.type", "Type")}</p>
                              <p className="text-xs font-bold text-[#c9a84c] uppercase">{accommodationTypeUI}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.numberOfGuests", "Guests")}</p>
                              <p className="text-xs font-bold text-white">{numberOfGuests}</p>
                            </div>
                          </div>
                          {eventType && (
                            <div className="pt-3 border-t border-white/[0.07]">
                              <p className="text-[9px] text-[#c9a84c]/60 uppercase tracking-[2px] mb-1">{t("bookRoom.eventType", "Purpose")}</p>
                              <p className="text-xs text-white/55 capitalize">{eventType}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Billing type */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-white/45 uppercase tracking-[2px]">
                          {t("bookRoom.billingType", "Billing Type")}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {([
                            { key: "individual" as const, icon: User, label: t("bookRoom.billing.individual", "Individual") },
                            { key: "corporate" as const, icon: Building2, label: t("bookRoom.billing.corporate", "Corporate") },
                          ] as const).map(({ key, icon: Icon, label }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setBillingTypeUI(key)}
                              className="tile-accom flex items-center gap-3 p-4 rounded-2xl"
                              style={{
                                background: billingTypeUI === key ? "rgba(201,168,76,0.09)" : "rgba(255,255,255,0.04)",
                                border: billingTypeUI === key ? "2px solid #c9a84c" : "1.5px solid rgba(255,255,255,0.09)",
                              }}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0"
                                style={{ color: billingTypeUI === key ? "#c9a84c" : "rgba(255,255,255,0.4)" }} />
                              <span className={`text-sm font-semibold ${billingTypeUI === key ? "text-[#c9a84c]" : "text-white/55"}`}>{label}</span>
                              {billingTypeUI === key && <Check className="h-4 w-4 ml-auto text-[#c9a84c]" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Individual billing fields */}
                      {billingTypeUI === "individual" && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {(["tc", "passport"] as const).map(t2 => (
                              <button key={t2} type="button" onClick={() => setNationalIdType(t2)}
                                className="px-4 h-9 rounded-lg text-xs font-bold transition-all"
                                style={{
                                  background: nationalIdType === t2 ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
                                  border: nationalIdType === t2 ? "1.5px solid rgba(201,168,76,0.45)" : "1px solid rgba(255,255,255,0.09)",
                                  color: nationalIdType === t2 ? "#c9a84c" : "rgba(255,255,255,0.35)",
                                }}>
                                {t2 === "tc" ? t("bookRoom.tcId", "T.C. Kimlik") : t("bookRoom.passport", "Passport")}
                              </button>
                            ))}
                          </div>
                          <input
                            value={tcKimlikNo}
                            onChange={e => setTcKimlikNo(e.target.value)}
                            placeholder={nationalIdType === "tc" ? "T.C. Kimlik No" : t("bookRoom.passportNo", "Passport Number")}
                            className={`${wi} h-12 px-4`}
                          />
                        </div>
                      )}

                      {/* Corporate billing fields */}
                      {billingTypeUI === "corporate" && (
                        <div className="space-y-3">
                          <input value={taxNumber} onChange={e => setTaxNumber(e.target.value)}
                            placeholder={t("bookRoom.taxNumber", "Tax Number")}
                            className={`${wi} h-12 px-4`} />
                          <input value={billingTitle} onChange={e => setBillingTitle(e.target.value)}
                            placeholder={t("bookRoom.billingTitle", "Company / Institution Name")}
                            className={`${wi} h-12 px-4`} />
                          <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)}
                            rows={2}
                            placeholder={t("bookRoom.billingAddress", "Billing Address")}
                            className={`${wi} px-4 py-3 resize-none`} />
                        </div>
                      )}

                      {/* Free accommodation checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox
                          checked={requestFreeAccommodation}
                          onCheckedChange={(v: boolean | "indeterminate") => setRequestFreeAccommodation(v === true)}
                          className="mt-0.5 border-white/25 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                        />
                        <div>
                          <p className="text-sm text-white/65 font-medium group-hover:text-white/85 transition-colors">
                            {t("bookRoom.freeAccommodation.label", "Request Free Accommodation")}
                          </p>
                          <p className="text-xs text-white/28 mt-0.5">{t("bookRoom.freeAccommodation.desc", "Subject to approval by reception")}</p>
                        </div>
                      </label>

                      {/* Consent */}
                      <label className="flex items-start gap-3 cursor-pointer group pt-4 border-t border-white/[0.07]">
                        <Checkbox
                          checked={consentChecked}
                          onCheckedChange={(v: boolean | "indeterminate") => setConsentChecked(v === true)}
                          className="mt-0.5 border-white/25 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                        />
                        <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/75 transition-colors">
                          {t("bookRoom.consent", "I confirm that all provided information is accurate and I agree to the reservation terms and hotel policies.")}
                        </p>
                      </label>
                    </div>
                  )}

                </SlideTransition>
              </div>

              {/* ── Navigation footer ───────────────────────────── */}
              <div className="px-8 pb-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/45 border border-white/10 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
                  style={{ visibility: step === 1 ? "hidden" : "visible" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("bookRoom.back", "Back")}
                </button>

                {/* Step dots */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(s => (
                    <div key={s}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: step === s ? 20 : 6,
                        height: 6,
                        background: step === s ? "#c9a84c" : step > s ? "#10b981" : "rgba(255,255,255,0.18)",
                      }} />
                  ))}
                </div>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-black text-[#001428] transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #c9a84c, #f0d080)",
                      boxShadow: "0 4px 16px rgba(201,168,76,0.25)",
                    }}
                  >
                    {t("bookRoom.next", "Next")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-black text-[#001428] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #c9a84c, #f0d080)",
                      boxShadow: "0 4px 16px rgba(201,168,76,0.25)",
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#001428]/30 border-t-[#001428] rounded-full animate-spin" />
                        {t("bookRoom.submitting", "Submitting...")}
                      </>
                    ) : (
                      <>
                        {t("bookRoom.submitBtn", "Confirm Reservation")}
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
