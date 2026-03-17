// src/components/admin/pages/SettingsPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, Building, Mail, Phone, Clock, Calendar, Bell, CheckCircle, Sliders } from "lucide-react";

export function SettingsPage() {
  const { t } = useTranslation("admin");

  const [hotelName, setHotelName] = useState("EDU HOTEL");
  const [contactEmail, setContactEmail] = useState("hotel@sabanciuniv.edu");
  const [contactPhone, setContactPhone] = useState("+90 (216) 483 9000");
  const [autoApprove, setAutoApprove] = useState(false);
  const [minAdvance, setMinAdvance] = useState("24");
  const [maxDuration, setMaxDuration] = useState("30");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false, hint }: any) => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className={`flex items-center h-11 bg-gray-50 border rounded-xl overflow-hidden transition-all duration-150 ${disabled ? "opacity-50" : "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 border-gray-200 hover:border-gray-300"}`}>
        {Icon && (
          <div className="flex items-center justify-center w-11 h-11 flex-shrink-0 border-r border-gray-100 bg-gray-100/50">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`flex-1 h-full bg-transparent text-sm text-gray-700 outline-none ${Icon ? "px-3" : "px-3"} disabled:opacity-50`}
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
      {/* Gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-r ${gradient}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <style>{`
        @keyframes settIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sett-card { animation: settIn 0.3s ease-out both; }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div className="flex items-center gap-3 sett-card">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-lg">
          <Sliders className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">{t("pages.settings.title", "Settings")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("settings.subtitle", "Hotel configuration and system preferences")}</p>
        </div>
      </div>

      {/* ── General Settings ─────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.07s" }}>
        <SectionCard icon={Building} title={t("settings.generalSettings", "General Settings")} gradient="from-blue-500 to-blue-600">
          <div className="space-y-4">
            <InputField
              label={t("settings.hotelName", "Hotel name")}
              icon={Building}
              value={hotelName}
              onChange={setHotelName}
              hint="The name displayed across the platform"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t("settings.contactEmail", "Contact e-mail")}
                icon={Mail}
                value={contactEmail}
                onChange={setContactEmail}
                type="email"
              />
              <InputField
                label={t("settings.contactPhone", "Contact phone")}
                icon={Phone}
                value={contactPhone}
                onChange={setContactPhone}
                type="tel"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Booking Settings ─────────────────────── */}
      <div className="sett-card" style={{ animationDelay: "0.14s" }}>
        <SectionCard icon={Calendar} title={t("settings.bookingSettings", "Booking Settings")} gradient="from-violet-500 to-purple-600">
          <div className="mb-2">
            <Toggle
              checked={autoApprove}
              onChange={setAutoApprove}
              label={t("settings.autoApprove", "Auto-approve reservations")}
              desc={t("settings.autoApproveDesc", "Automatically approve reservations that match the rules.")}
              icon={CheckCircle}
            />
            <Toggle
              checked={emailNotifications}
              onChange={setEmailNotifications}
              label={t("settings.emailNotifications", "Email Notifications")}
              desc={t("settings.emailNotificationsDesc", "Send email notifications for reservation status changes.")}
              icon={Bell}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InputField
              label={t("settings.minBookingAdvance", "Minimum booking notice (hours)")}
              icon={Clock}
              value={minAdvance}
              onChange={setMinAdvance}
              type="number"
              hint="Minimum hours before check-in"
            />
            <InputField
              label={t("settings.maxBookingDuration", "Maximum stay duration (days)")}
              icon={Calendar}
              value={maxDuration}
              onChange={setMaxDuration}
              type="number"
              hint="Maximum consecutive nights allowed"
            />
          </div>
        </SectionCard>
      </div>

      {/* ── Save Section ─────────────────────────── */}
      <div className="sett-card flex items-center gap-3" style={{ animationDelay: "0.21s" }}>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5 ${
            saved
              ? "bg-gradient-to-r from-emerald-500 to-green-600"
              : "bg-gradient-to-r from-[#003366] to-[#0055aa]"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              {t("settings.saved", "Saved!")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("settings.saveSettings", "Save settings")}
            </>
          )}
        </button>
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
            <CheckCircle className="h-4 w-4" />
            {t("settings.saved", "Settings saved successfully!")}
          </div>
        )}
      </div>
    </div>
  );
}
