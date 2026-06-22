import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  UserCheck,
  UserPlus,
  Calendar,
  CalendarDays,
  Users,
  CheckCircle,
  AlertCircle,
  Mail,
  User as UserIcon,
  Hash,
  Briefcase,
  Tag,
  Banknote,
  Wallet,
  Sparkles,
  Shield,
} from "lucide-react";
import {
  adminCreateReservation,
  type InvoiceType,
  type GuestType,
} from "../../../api/reservations";
import { PhoneInput } from "../../ui/PhoneInput";

type Mode = "self" | "guest";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateReservationPage() {
  const { t } = useTranslation("admin");

  // Mode toggle
  const [mode, setMode] = useState<Mode>("guest");

  // Dates
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("");

  // Guest contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState<number>(1);

  // Stay
  const [eventType, setEventType] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [priceType, setPriceType] = useState("");
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [freeAccommodation, setFreeAccommodation] = useState(false);

  // Billing
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("INDIVIDUAL");
  const [nationalId, setNationalId] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [billingTitle, setBillingTitle] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  // Pricing
  const [price, setPrice] = useState<string>("");

  // Optional guest type override (defaults set by mode)
  const [guestType, setGuestType] = useState<GuestType | "">("");

  // Submit state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minimalReady = useMemo(
    () =>
      Boolean(
        checkIn &&
          checkOut &&
          new Date(checkOut) > new Date(checkIn) &&
          guests > 0 &&
          email.trim() &&
          EMAIL_RE.test(email.trim())
      ),
    [checkIn, checkOut, guests, email]
  );

  const resetAfterSuccess = () => {
    setCheckIn(""); setCheckOut(""); setCheckInTime("");
    setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setGuests(1);
    setEventType(""); setEventCode(""); setPriceType("");
    setNote(""); setAdminNote(""); setFreeAccommodation(false);
    setInvoiceType("INDIVIDUAL");
    setNationalId(""); setTaxNumber(""); setBillingTitle(""); setBillingAddress("");
    setPrice("");
    setGuestType("");
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!checkIn || !checkOut) {
      const msg = t("createReservation.errors.datesRequired", { defaultValue: "Check-in and check-out dates are required." });
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      const msg = t("createReservation.errors.checkoutAfter", { defaultValue: "Check-out must be after check-in." });
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      const msg = t("createReservation.errors.emailRequired", { defaultValue: "A valid guest email is required so the reservation can be linked to a user." });
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!guests || guests < 1) {
      const msg = t("createReservation.errors.guestsRequired", { defaultValue: "Guest count must be at least 1." });
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const parsedPrice = price.trim() ? parseFloat(price) : undefined;
      const created = await adminCreateReservation({
        forSelf: mode === "self",
        guestType: guestType || undefined,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        contactEmail: email.trim(),
        checkIn,
        checkOut,
        checkInTime: checkInTime.trim() || undefined,
        guests,
        eventType: eventType.trim() || undefined,
        eventCode: eventCode.trim() || undefined,
        priceType: priceType.trim() || undefined,
        note: note.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
        freeAccommodation,
        invoiceType,
        nationalId: nationalId.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        billingTitle: billingTitle.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        price: parsedPrice !== undefined && !isNaN(parsedPrice) ? parsedPrice : undefined,
      });

      toast.success(
        t("createReservation.toasts.created", {
          defaultValue: `Reservation #${created.id} created.`,
          id: `#${created.id}`,
        })
      );
      resetAfterSuccess();
    } catch (err: any) {
      const msg = err?.message || t("createReservation.errors.generic", { defaultValue: "Failed to create reservation." });
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────── UI ─────────────────────────── */

  const SectionCard = ({
    icon: Icon, title, hint, children,
  }: { icon: any; title: string; hint?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #003366, #0055aa)" }}
        >
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">{title}</h3>
          {hint && <p className="text-[12px] text-gray-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );

  const Field = ({
    label, optional = true, children, hint,
  }: { label: string; optional?: boolean; children: React.ReactNode; hint?: string }) => (
    <label className="block">
      <span className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-[1.5px] mb-1.5">
        {label}{" "}
        {optional && (
          <span className="text-[9px] font-bold text-gray-300 ml-1">
            {t("createReservation.optional", { defaultValue: "OPTIONAL" })}
          </span>
        )}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );

  const inputCls =
    "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all";
  const textareaCls = inputCls.replace("h-10", "h-auto py-2.5");
  // For inputs with a leading icon — the icon and the <input> are real flex
  // siblings, so the row centers vertically without any absolute positioning.
  const iconBoxCls =
    "flex items-center h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all";
  const bareInputCls =
    "flex-1 h-full bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(to bottom right, #003366, #0055aa)" }}
          >
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t("pages.createReservation.title", { defaultValue: "Create Reservation" })}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("pages.createReservation.description", {
                defaultValue: "Add a reservation on behalf of a special guest or for yourself.",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mode toggle ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 inline-flex w-full sm:w-auto">
        {[
          {
            key: "self" as Mode,
            label: t("createReservation.mode.self", { defaultValue: "For yourself" }),
            icon: UserCheck,
          },
          {
            key: "guest" as Mode,
            label: t("createReservation.mode.guest", { defaultValue: "For special guest" }),
            icon: UserPlus,
          },
        ].map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{
                background: active
                  ? "linear-gradient(135deg, #003366 0%, #0055aa 100%)"
                  : "transparent",
              }}
            >
              <Icon className="h-4 w-4" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Form sections ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Dates */}
        <SectionCard
          icon={Calendar}
          title={t("createReservation.sections.dates", { defaultValue: "Dates" })}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("createReservation.fields.checkIn", { defaultValue: "Check-in" })} optional={false}>
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("createReservation.fields.checkOut", { defaultValue: "Check-out" })} optional={false}>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label={t("createReservation.fields.checkInTime", { defaultValue: "Check-in time" })}>
            <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputCls} />
          </Field>
        </SectionCard>

        {/* Guest info */}
        <SectionCard
          icon={UserIcon}
          title={
            mode === "self"
              ? t("createReservation.sections.yourInfo", { defaultValue: "Your information" })
              : t("createReservation.sections.guestInfo", { defaultValue: "Guest information" })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("createReservation.fields.firstName", { defaultValue: "First name" })}>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Elmar" />
            </Field>
            <Field label={t("createReservation.fields.lastName", { defaultValue: "Last name" })}>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Alasgarov" />
            </Field>
          </div>
          <Field
            label={t("createReservation.fields.email", { defaultValue: "Email" })}
            optional={false}
            hint={t("createReservation.hints.email", {
              defaultValue: "Used to find or create the underlying user record.",
            })}
          >
            <div className={iconBoxCls}>
              <Mail className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={bareInputCls}
                placeholder="name@sabanciuniv.edu"
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("createReservation.fields.phone", { defaultValue: "Phone" })}>
              <PhoneInput value={phone} onChange={setPhone} />
            </Field>
            <Field label={t("createReservation.fields.guests", { defaultValue: "Number of guests" })} optional={false}>
              <div className={iconBoxCls}>
                <Users className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className={bareInputCls}
                />
              </div>
            </Field>
          </div>
          {mode === "guest" && (
            <Field label={t("createReservation.fields.guestType", { defaultValue: "Guest type" })}>
              <select
                value={guestType}
                onChange={(e) => setGuestType(e.target.value as GuestType | "")}
                className={inputCls}
              >
                <option value="">{t("createReservation.fields.guestTypeDefault", { defaultValue: "Default: Special guest" })}</option>
                <option value="STUDENT">STUDENT</option>
                <option value="STAFF">STAFF</option>
                <option value="SPECIAL_GUEST">SPECIAL_GUEST</option>
                <option value="PARENT">PARENT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </Field>
          )}
        </SectionCard>

        {/* Stay details */}
        <SectionCard
          icon={Tag}
          title={t("createReservation.sections.stayDetails", { defaultValue: "Stay details" })}
          hint={t("createReservation.sections.stayHint", {
            defaultValue: "Accommodation type is not collected here — leave any field blank if it doesn't apply.",
          })}
        >
          <Field label={t("createReservation.fields.eventType", { defaultValue: "Event type" })}>
            <input value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputCls} placeholder="Conference, training…" />
          </Field>
          <Field label={t("createReservation.fields.eventCode", { defaultValue: "Program code" })}>
            <input value={eventCode} onChange={(e) => setEventCode(e.target.value)} className={inputCls} placeholder="EVT-2026-001" />
          </Field>
          <Field label={t("createReservation.fields.priceType", { defaultValue: "Price type" })}>
            <input value={priceType} onChange={(e) => setPriceType(e.target.value)} className={inputCls} placeholder="Standard, discounted…" />
          </Field>
          <Field label={t("createReservation.fields.note", { defaultValue: "Guest note" })}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={textareaCls} placeholder={t("createReservation.placeholders.note", { defaultValue: "Any preferences from the guest…" })} />
          </Field>
          <Field label={t("createReservation.fields.adminNote", { defaultValue: "Admin note" })}>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className={textareaCls} placeholder={t("createReservation.placeholders.adminNote", { defaultValue: "Visible to the guest in confirmation emails." })} />
          </Field>
          <label className="flex items-center gap-2.5 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={freeAccommodation}
              onChange={(e) => setFreeAccommodation(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
            />
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[13px] text-gray-700">
              {t("createReservation.fields.freeAccommodation", { defaultValue: "Free accommodation" })}
            </span>
          </label>
        </SectionCard>

        {/* Billing */}
        <SectionCard
          icon={Wallet}
          title={t("createReservation.sections.billing", { defaultValue: "Billing" })}
        >
          <Field label={t("createReservation.fields.invoiceType", { defaultValue: "Invoice type" })}>
            <div className="grid grid-cols-2 gap-2">
              {(["INDIVIDUAL", "CORPORATE"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setInvoiceType(opt)}
                  className={`h-10 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    invoiceType === opt
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-white"
                  }`}
                >
                  {opt === "INDIVIDUAL" ? <UserIcon className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          {invoiceType === "INDIVIDUAL" ? (
            <Field label={t("createReservation.fields.nationalId", { defaultValue: "National ID / Passport" })}>
              <div className={iconBoxCls}>
                <Hash className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
                <input value={nationalId} onChange={(e) => setNationalId(e.target.value)} className={bareInputCls} placeholder="TC Kimlik No / Passport No" />
              </div>
            </Field>
          ) : (
            <>
              <Field label={t("createReservation.fields.taxNumber", { defaultValue: "Tax number" })}>
                <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t("createReservation.fields.billingTitle", { defaultValue: "Billing title" })}>
                <input value={billingTitle} onChange={(e) => setBillingTitle(e.target.value)} className={inputCls} placeholder="Company name" />
              </Field>
              <Field label={t("createReservation.fields.billingAddress", { defaultValue: "Billing address" })}>
                <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} className={textareaCls} />
              </Field>
            </>
          )}
          <Field label={t("createReservation.fields.price", { defaultValue: "Price (TL)" })}>
            <div className={iconBoxCls}>
              <Banknote className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={bareInputCls}
                placeholder="0.00"
              />
            </div>
          </Field>
        </SectionCard>
      </div>

      {/* ── Submit row ───────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="text-[12px] text-gray-500 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          {t("createReservation.statusHint", {
            defaultValue: "Created as APPROVED. Visible in Reservations and Guests immediately.",
          })}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !minimalReady}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          style={{
            background: "linear-gradient(135deg, #003366 0%, #0055aa 100%)",
          }}
        >
          <CheckCircle className="h-4 w-4" />
          {loading
            ? t("createReservation.submitting", { defaultValue: "Creating…" })
            : t("createReservation.submit", { defaultValue: "Create Reservation" })}
        </button>
      </div>
    </div>
  );
}
