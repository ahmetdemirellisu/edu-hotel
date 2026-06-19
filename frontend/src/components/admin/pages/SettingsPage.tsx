// src/components/admin/pages/SettingsPage.tsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Save, Building, Mail, Phone, Clock, Calendar, Bell, CheckCircle, Sliders,
  Landmark, Wifi, Coffee, ConciergeBell, AlertCircle, Loader2,
} from "lucide-react";
import { adminFetch } from "../../../api/adminFetch";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

type SettingsShape = {
  hotelName: string;
  contactEmail: string;
  contactPhone: string;
  maxAdvanceDays: number;
  maxStayNights: number;
  autoApprove: boolean;
  emailNotifications: boolean;
  bankName: string;
  accountHolder: string;
  iban: string;
  checkInTime: string;
  checkOutTime: string;
  wifiSsid: string;
  wifiPassword: string;
  breakfastHours: string;
  receptionHours: string;
};

const FALLBACK: SettingsShape = {
  hotelName: "EDU Hotel",
  contactEmail: "hotel@sabanciuniv.edu",
  contactPhone: "+90 (216) 483 9000",
  maxAdvanceDays: 30,
  maxStayNights: 5,
  autoApprove: false,
  emailNotifications: true,
  bankName: "Akbank T.A.Ş.",
  accountHolder: "Sabtek A.Ş.",
  iban: "TR85 0004 6007 1388 8000 1139 89",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  wifiSsid: "EDU-Hotel-Guest",
  wifiPassword: "Welcome2026",
  breakfastHours: "07:30 – 10:00",
  receptionHours: "24/7",
};

export function SettingsPage() {
  const { t } = useTranslation("admin");

  const [settings, setSettings] = useState<SettingsShape>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Load on mount.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminFetch(`${API_BASE}/admin/settings`);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        // Merge over FALLBACK so any missing field stays sensible.
        setSettings({ ...FALLBACK, ...data });
        setLoadError(null);
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        setLoadError(err?.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setSettings({ ...FALLBACK, ...data });
      setDirty(false);
      toast.success(t("settings.saved", "Settings saved!"));
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err?.message || t("settings.saveFailed", "Failed to save settings."));
    } finally {
      setSaving(false);
    }
  };

  // ── Small UI primitives (kept inline; shared style with the old page). ──

  const InputField = ({ label, icon: Icon, value, onChange, type = "text", hint, placeholder }: any) => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center h-11 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 hover:border-gray-300 transition-all duration-150">
        {Icon && (
          <div className="flex items-center justify-center w-11 h-11 flex-shrink-0 border-r border-gray-100 bg-gray-100/50">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent text-sm text-gray-700 outline-none px-3 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  const Toggle = ({ checked, onChange, label, desc, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string; icon?: any }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${checked ? "bg-blue-50" : "bg-gray-50"}`}>
            <Icon className={`h-4 w-4 ${checked ? "text-blue-500" : "text-gray-400"}`} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${checked ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md" : "bg-gray-200"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>
    </div>
  );

  const SectionCard = ({ icon: Icon, title, gradient, children }: { icon: any; title: string; gradient: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1" style={{ background: gradient }} />
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: gradient }}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );

  // Loading skeleton.
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        {t("settings.loading", "Loading settings…")}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <style>{`
        @keyframes settIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sett-card { animation: settIn 0.3s ease-out both; }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div className="flex items-center justify-between sett-card">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(to bottom right, #003366, #0055aa)" }}
          >
            <Sliders className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">{t("pages.settings.title", "Settings")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("settings.subtitle", "Hotel configuration and system preferences")}</p>
          </div>
        </div>
        {dirty && !saving && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t("settings.unsaved", "Unsaved changes")}
          </span>
        )}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── Hotel Identity ─────────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.05s" }}>
        <SectionCard icon={Building} title={t("settings.generalSettings", "Hotel Identity")} gradient="linear-gradient(to right, #3b82f6, #2563eb)">
          <div className="space-y-4">
            <InputField
              label={t("settings.hotelName", "Hotel name")}
              icon={Building}
              value={settings.hotelName}
              onChange={(v: string) => update("hotelName", v)}
              hint={t("settings.hints.platformName", "The name displayed across the platform")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t("settings.contactEmail", "Contact e-mail")}
                icon={Mail}
                value={settings.contactEmail}
                onChange={(v: string) => update("contactEmail", v)}
                type="email"
                hint={t("settings.hints.contactEmail", "Shown in all guest-facing emails and support pages.")}
              />
              <InputField
                label={t("settings.contactPhone", "Contact phone")}
                icon={Phone}
                value={settings.contactPhone}
                onChange={(v: string) => update("contactPhone", v)}
                type="tel"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Booking Rules ──────────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.10s" }}>
        <SectionCard icon={Calendar} title={t("settings.bookingSettings", "Booking Rules")} gradient="linear-gradient(to right, #8b5cf6, #9333ea)">
          <div className="mb-2">
            <Toggle
              checked={settings.autoApprove}
              onChange={(v) => update("autoApprove", v)}
              label={t("settings.autoApprove", "Auto-approve reservations")}
              desc={t("settings.autoApproveDesc", "New reservations are created as APPROVED instead of PENDING.")}
              icon={CheckCircle}
            />
            <Toggle
              checked={settings.emailNotifications}
              onChange={(v) => update("emailNotifications", v)}
              label={t("settings.emailNotifications", "Email Notifications")}
              desc={t("settings.emailNotificationsDesc", "When off, transactional emails are suppressed. Security emails (password reset) still send.")}
              icon={Bell}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InputField
              label={t("settings.minBookingAdvance", "Max advance booking (days)")}
              icon={Clock}
              value={settings.maxAdvanceDays}
              onChange={(v: number) => update("maxAdvanceDays", v)}
              type="number"
              hint={t("settings.hints.maxAdvance", "Furthest into the future a guest may book.")}
            />
            <InputField
              label={t("settings.maxBookingDuration", "Max consecutive nights (personal)")}
              icon={Calendar}
              value={settings.maxStayNights}
              onChange={(v: number) => update("maxStayNights", v)}
              type="number"
              hint={t("settings.hints.maxNights", "Cap for personal accommodation type.")}
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Guest-facing info ─────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.15s" }}>
        <SectionCard icon={ConciergeBell} title={t("settings.guestInfo", "Guest-facing Info")} gradient="linear-gradient(to right, #10b981, #047857)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("settings.checkInTime", "Check-in time")}
              icon={Clock}
              value={settings.checkInTime}
              onChange={(v: string) => update("checkInTime", v)}
              placeholder="14:00"
              hint={t("settings.hints.checkInTime", "Shown in confirmation emails and the concierge.")}
            />
            <InputField
              label={t("settings.checkOutTime", "Check-out time")}
              icon={Clock}
              value={settings.checkOutTime}
              onChange={(v: string) => update("checkOutTime", v)}
              placeholder="12:00"
            />
            <InputField
              label={t("settings.breakfastHours", "Breakfast hours")}
              icon={Coffee}
              value={settings.breakfastHours}
              onChange={(v: string) => update("breakfastHours", v)}
              placeholder="07:30 – 10:00"
            />
            <InputField
              label={t("settings.receptionHours", "Reception hours")}
              icon={ConciergeBell}
              value={settings.receptionHours}
              onChange={(v: string) => update("receptionHours", v)}
              placeholder="24/7"
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Wi-Fi ─────────────────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.20s" }}>
        <SectionCard icon={Wifi} title={t("settings.wifi", "Guest Wi-Fi")} gradient="linear-gradient(to right, #06b6d4, #0891b2)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("settings.wifiSsid", "Network (SSID)")}
              icon={Wifi}
              value={settings.wifiSsid}
              onChange={(v: string) => update("wifiSsid", v)}
            />
            <InputField
              label={t("settings.wifiPassword", "Password")}
              icon={Wifi}
              value={settings.wifiPassword}
              onChange={(v: string) => update("wifiPassword", v)}
              hint={t("settings.hints.wifi", "Shown in the EduConcierge quick-action panel.")}
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Banking ───────────────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.25s" }}>
        <SectionCard icon={Landmark} title={t("settings.banking", "Bank Transfer Details")} gradient="linear-gradient(to right, #f59e0b, #ea580c)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t("settings.bankName", "Bank name")}
                icon={Landmark}
                value={settings.bankName}
                onChange={(v: string) => update("bankName", v)}
              />
              <InputField
                label={t("settings.accountHolder", "Account holder")}
                icon={Building}
                value={settings.accountHolder}
                onChange={(v: string) => update("accountHolder", v)}
              />
            </div>
            <InputField
              label={t("settings.iban", "IBAN")}
              icon={Landmark}
              value={settings.iban}
              onChange={(v: string) => update("iban", v)}
              hint={t("settings.hints.iban", "Shown to guests on the Payment page after their reservation is approved.")}
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Save row ──────────────────────────────── */}
      <div className="sett-card flex items-center gap-3" style={{ animationDelay: "0.30s" }}>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: "linear-gradient(to right, #003366, #0055aa)" }}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("settings.saving", "Saving…")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("settings.saveSettings", "Save settings")}
            </>
          )}
        </button>
        {!dirty && !saving && (
          <span className="text-[12px] text-gray-400">{t("settings.upToDate", "All changes saved")}</span>
        )}
      </div>
    </div>
  );
}
