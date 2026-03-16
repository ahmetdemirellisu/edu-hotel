// src/components/admin/pages/SettingsPage.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Save, Building, Mail, Phone, Clock, Calendar, Bell } from "lucide-react";

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

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false }: any) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center h-10 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all">
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className={`flex-1 h-full bg-transparent text-sm text-gray-700 outline-none ${Icon ? "pr-3" : "px-3"} disabled:opacity-50`} />
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-3">
      <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
      <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.settings.title", "Settings")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t("settings.subtitle", "Hotel configuration and system preferences")}</p>
      </div>

      {/* General */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5"><Settings className="h-4 w-4 text-gray-400" /><h3 className="text-[15px] font-semibold text-gray-900">{t("settings.generalSettings", "General Settings")}</h3></div>
        <div className="space-y-4">
          <InputField label={t("settings.hotelName", "Hotel name")} icon={Building} value={hotelName} onChange={setHotelName} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label={t("settings.contactEmail", "Contact e-mail")} icon={Mail} value={contactEmail} onChange={setContactEmail} type="email" />
            <InputField label={t("settings.contactPhone", "Contact phone")} icon={Phone} value={contactPhone} onChange={setContactPhone} type="tel" />
          </div>
        </div>
      </div>

      {/* Booking */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5"><Calendar className="h-4 w-4 text-gray-400" /><h3 className="text-[15px] font-semibold text-gray-900">{t("settings.bookingSettings", "Booking Settings")}</h3></div>
        <div className="space-y-1 border-b border-gray-100 mb-4">
          <Toggle checked={autoApprove} onChange={setAutoApprove} label={t("settings.autoApprove", "Auto-approve reservations")} desc={t("settings.autoApproveDesc", "Automatically approve reservations that match the rules.")} />
          <Toggle checked={emailNotifications} onChange={setEmailNotifications} label={t("settings.emailNotifications", "Email Notifications")} desc={t("settings.emailNotificationsDesc", "Send email notifications for reservation status changes.")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t("settings.minBookingAdvance", "Minimum booking notice (hours)")} icon={Clock} value={minAdvance} onChange={setMinAdvance} type="number" />
          <InputField label={t("settings.maxBookingDuration", "Maximum stay duration (days)")} icon={Calendar} value={maxDuration} onChange={setMaxDuration} type="number" />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold transition-all hover:shadow-lg">
          <Save className="h-4 w-4" />{t("settings.saveSettings", "Save settings")}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium animate-pulse">{t("settings.saved", "Settings saved!")}</span>}
      </div>
    </div>
  );
}
