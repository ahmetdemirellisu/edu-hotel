import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import {
  Mail,
  Phone,
  Clock,
  User,
  LayoutGrid,
  ChevronRight,
  ArrowLeft,
  FileText,
  CreditCard,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "./ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function ContactSupportPage() {
  const { t, i18n } = useTranslation();
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const topics = [
    {
      icon: FileText,
      title: t("contact.topics.reservations"),
      desc: t("contact.topics.reservationsDesc"),
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      icon: CreditCard,
      title: t("contact.topics.payment"),
      desc: t("contact.topics.paymentDesc"),
      color: "#10b981",
      bg: "#f0fdf4",
    },
    {
      icon: XCircle,
      title: t("contact.topics.cancellation"),
      desc: t("contact.topics.cancellationDesc"),
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)" }}>

      {/* ═══ HEADER ═══════════════════════════════════════ */}
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

      <PageHeader
        title={t("contact.pageTitle")}
        subtitle={t("contact.subtitle")}
        category="SABANCI ÜNİVERSİTESİ"
        icon={<Mail className="h-8 w-8" />}
      />

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Contact channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-6 text-center"
            style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-1">{t("contact.emailTitle")}</h3>
            <a
              href="mailto:support@sabanciuniv.edu"
              className="text-[13px] text-blue-600 hover:underline font-medium"
            >
              support@sabanciuniv.edu
            </a>
            <p className="text-[11px] text-slate-400 mt-2">{t("contact.emailNote")}</p>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="bg-white rounded-2xl p-6 text-center"
            style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-1">{t("contact.phoneTitle")}</h3>
            <a
              href="tel:+902164839000"
              className="text-[13px] text-emerald-600 hover:underline font-medium"
            >
              +90 (216) 483 9000
            </a>
            <p className="text-[11px] text-slate-400 mt-2">{t("contact.phoneNote")}</p>
          </motion.div>

          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="bg-white rounded-2xl p-6 text-center"
            style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-800 mb-1">{t("contact.hoursTitle")}</h3>
            <p className="text-[13px] text-slate-700 font-medium">{t("contact.hours")}</p>
            <p className="text-[11px] text-slate-400 mt-2">hotel@sabanciuniv.edu</p>
          </motion.div>
        </div>

        {/* Topics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
        >
          <div
            className="px-6 py-5 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 100%)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-[15px] font-bold">{t("dashboard.help.title")}</h2>
              <p className="text-white/40 text-[11px]">{t("contact.subtitle")}</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {topics.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 py-5 flex items-center gap-4 group cursor-default"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: topic.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: topic.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-800 mb-0.5">{topic.title}</p>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{topic.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                </motion.div>
              );
            })}
          </div>
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">
            <p className="text-[12px] text-slate-500 text-center">
              {t("footer.emailAddress")} &nbsp;·&nbsp; {t("footer.phone")}
            </p>
          </div>
        </motion.div>

        {/* Back link */}
        <div className="flex justify-center">
          <Link
            to="/main"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#003366] font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("contact.backToDashboard")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
