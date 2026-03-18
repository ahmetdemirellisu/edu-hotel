import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "./layout/Footer";
import { NotificationBell } from "./NotificationBell";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { getMyLatestReservation, type Reservation } from "../api/reservations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

import {
  CalendarDays,
  Moon,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Building2,
  CreditCard,
  X,
  CheckCircle2,
  Hash,
  ArrowRight,
  Shield,
  Copy,
  Sparkles,
  User,
  LayoutGrid,
} from "lucide-react";

/* ── Inject styles ───────────────────────────────────── */
if (!document.getElementById("payment-anim")) {
  const s = document.createElement("style");
  s.id = "payment-anim";
  s.textContent = `
    @keyframes dashDraw {
      from { stroke-dashoffset: 100; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes borderPulse {
      0%, 100% { border-color: rgba(201,168,76,0.4); }
      50%       { border-color: rgba(201,168,76,0.9); }
    }
    @keyframes uploadBounce {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }
    @keyframes progressFill {
      from { width: 0%; }
      to   { width: 100%; }
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes pulse-ring {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
  `;
  document.head.appendChild(s);
}

export function Payment() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";
  const currentLang = i18n.language?.toUpperCase() === "TR" ? "TR" : "EN";
  const switchLanguage = (val: string) => i18n.changeLanguage(val.toLowerCase());

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReservation() {
      if (!userId || isNaN(userId)) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMyLatestReservation(userId);
        setReservation(res);
      } catch (err) {
        console.error("Failed to load reservation", err);
      } finally {
        setLoading(false);
      }
    }
    loadReservation();
  }, [userId]);

  const calculateNights = () => {
    if (!reservation) return 0;
    const start = new Date(reservation.checkIn);
    const end = new Date(reservation.checkOut);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalAmount = (reservation as any)?.price ?? null;

  const formatDate = (dateStr: string) => {
    const currentLang = i18n.language === "tr" ? "tr-TR" : "en-GB";
    return new Date(dateStr).toLocaleDateString(currentLang, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setUploadError(t("payment.errors.invalidFormat"));
      return;
    }
    if (file.size > maxSize) {
      setUploadError(t("payment.errors.tooLarge"));
      return;
    }

    setUploadedFile(file);
    setUploadError("");
    // Simulate brief progress animation
    setUploadProgress(0);
    const timer = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(timer); return 100; }
        return p + 20;
      });
    }, 80);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !reservation) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("dekont", uploadedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/payment/upload-dekont/${reservation.id}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert(t("payment.success"));
        navigate("/dashboard");
      } else {
        const errData = await response.json();
        setUploadError(errData.error || "Upload failed");
      }
    } catch (err) {
      setUploadError("Could not connect to server. Check if backend is running on port 3000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyIban = () => {
    navigator.clipboard.writeText("TR33 0004 6004 8888 8000 0123 45").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Loading / empty states ─────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 100%)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium">{t("payment.errors.noReservation")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)" }}>
      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-white/10"
        style={{
          background: "rgba(0,28,60,0.96)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 6px 28px rgba(0,20,50,0.35)",
        }}
      >
        {/* Animated gradient border bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, #c9a84c 30%, #4da6ff 60%, #c9a84c 80%, transparent)",
            opacity: 0.6,
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex justify-between items-center">
            <Link to="/main" className="flex items-center gap-4 group">
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="border border-[#c9a84c]/60 px-3 py-1.5 rounded transition-all duration-300 group-hover:border-[#c9a84c] group-hover:shadow-[0_0_14px_rgba(201,168,76,0.25)]"
                style={{ background: "rgba(201,168,76,0.08)" }}
              >
                <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                <div className="text-[9px] text-[#c9a84c]/70 leading-tight tracking-widest">Üniversitesi</div>
              </motion.div>
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2.5">
                <h1 className="text-white text-base font-light tracking-[8px] uppercase" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  EDU HOTEL
                </h1>
              </div>
            </Link>
            <h1 className="sm:hidden text-white text-sm font-light tracking-[5px] uppercase">EDU HOTEL</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <Select value={currentLang} onValueChange={switchLanguage}>
                <SelectTrigger className="w-[58px] h-8 bg-white/6 border-white/15 text-white text-xs font-semibold hover:bg-white/12 focus:ring-0 rounded-lg">
                  <SelectValue placeholder={currentLang} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">EN</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                </SelectContent>
              </Select>
              <NotificationBell lang={currentLang} />
              <Link to="/profile" className="flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.07, boxShadow: "0 0 14px rgba(255,255,255,0.12)" }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  <User className="h-4 w-4 text-white/70" />
                </motion.div>
                <span className="text-xs text-white/60 group-hover:text-white/90 font-medium hidden md:block max-w-[100px] truncate transition-colors duration-200">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ═══ HERO BANNER ══════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3d2800 0%, #7a5200 30%, #c9a84c 70%, #e8c96d 100%)",
          minHeight: "200px",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s ease-in-out infinite",
          }}
        />

        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center" style={{ minHeight: "200px" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Payment Portal</span>
              </div>
              <h1
                className="text-white mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(26px, 4vw, 40px)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                }}
              >
                {t("payment.title")}
              </h1>
              <p className="text-white/60 text-sm">{t("payment.subtitle")}</p>
            </div>

            {/* Reservation ID badge */}
            <div
              className="hidden sm:flex flex-col items-end gap-1 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
            >
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Reservation</span>
              <span className="text-white text-xl font-bold tabular-nums">#{reservation.id}</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1"
                style={{ background: "rgba(201,168,76,0.25)", color: "#e8c96d" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c96d] animate-pulse" />
                {t(`dashboard.status.${reservation.status.toLowerCase()}`, { defaultValue: reservation.status })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Reservation Summary ─────────────── */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary card */}
            <div
              className="bg-white rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
            >
              {/* Card header */}
              <div
                className="px-6 py-5 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)" }}>
                    <CheckCircle className="h-5 w-5 text-[#c9a84c]" />
                  </div>
                  <div>
                    <h2 className="text-white text-[15px] font-bold">{t("payment.summary")}</h2>
                    <p className="text-white/40 text-[11px]">{t("payment.awaiting")}</p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold sm:hidden"
                  style={{ background: "rgba(201,168,76,0.2)", color: "#e8c96d" }}
                >
                  #{reservation.id}
                </span>
              </div>

              {/* CSS room illustration */}
              <div className="relative overflow-hidden px-6 pt-6 pb-2">
                <div
                  className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center"
                  style={{ height: "120px", background: "linear-gradient(180deg, #e8eef5 0%, #d0dae8 100%)" }}
                >
                  {/* Sky gradient */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #bfd4ed 0%, #d8e8f4 60%, #e8eef5 100%)" }} />
                  {/* Building silhouette */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end gap-0">
                    {/* Main building */}
                    <div className="relative" style={{ width: "140px", height: "80px", background: "#1e3a5f", borderRadius: "4px 4px 0 0" }}>
                      {/* Windows grid */}
                      {[0,1,2].map(row => (
                        [0,1,2,3].map(col => (
                          <div
                            key={`${row}-${col}`}
                            className="absolute rounded-sm"
                            style={{
                              width: "18px", height: "14px",
                              left: `${10 + col * 30}px`,
                              top: `${10 + row * 22}px`,
                              background: (row + col) % 3 === 0 ? "rgba(201,168,76,0.9)" : "rgba(255,255,255,0.15)",
                            }}
                          />
                        ))
                      ))}
                      {/* Roof accent */}
                      <div className="absolute -top-3 left-0 right-0 h-3" style={{ background: "#c9a84c", borderRadius: "3px 3px 0 0" }} />
                    </div>
                    {/* Side wing */}
                    <div className="relative" style={{ width: "60px", height: "55px", background: "#254d7a", borderRadius: "3px 3px 0 0", marginLeft: "2px" }}>
                      {[0,1].map(row => (
                        [0,1].map(col => (
                          <div
                            key={`s${row}-${col}`}
                            className="absolute rounded-sm"
                            style={{
                              width: "14px", height: "10px",
                              left: `${8 + col * 22}px`,
                              top: `${10 + row * 18}px`,
                              background: "rgba(255,255,255,0.12)",
                            }}
                          />
                        ))
                      ))}
                    </div>
                  </div>
                  {/* Ground */}
                  <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: "#c8d8e8" }} />
                  {/* Stars */}
                  {[{ x: "15%", y: "20%" }, { x: "80%", y: "15%" }, { x: "60%", y: "30%" }].map((star, i) => (
                    <div key={i} className="absolute w-1 h-1 rounded-full bg-white/70" style={{ left: star.x, top: star.y, animation: `pulse-ring ${1.5 + i * 0.5}s ease-in-out infinite` }} />
                  ))}
                  {/* Label */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full" style={{ background: "rgba(0,51,102,0.7)", backdropFilter: "blur(4px)" }}>
                    <span className="text-white/90 text-[10px] font-bold tracking-widest">EDU HOTEL</span>
                  </div>
                </div>
              </div>

              {/* Date cards */}
              <div className="px-6 pt-4 pb-2 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                      <CalendarDays className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{t("payment.checkIn")}</span>
                  </div>
                  <p className="text-slate-800 font-bold text-[15px]">{formatDate(reservation.checkIn)}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                      <CalendarDays className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{t("payment.checkOut")}</span>
                  </div>
                  <p className="text-slate-800 font-bold text-[15px]">{formatDate(reservation.checkOut)}</p>
                </div>
              </div>

              {/* Night count */}
              <div className="px-6 pt-2 pb-2">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Moon className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">{t("payment.nights")}</p>
                      <p className="text-slate-700 text-sm font-medium mt-0.5">{t("payment.night", { count: nights })}</p>
                    </div>
                  </div>
                  <span
                    className="text-4xl font-black text-[#003366] tabular-nums"
                    style={{ animation: "countUp 0.5s ease-out both" }}
                  >
                    {nights}
                  </span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="px-6 pt-2 pb-6 space-y-3">
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Price Breakdown
                  </p>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Room rate × {nights} {nights === 1 ? "night" : "nights"}</span>
                      <span className="text-slate-400 font-medium">
                        {totalAmount !== null
                          ? `₺${totalAmount.toLocaleString()}`
                          : <span className="text-slate-300">TBD</span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span className="text-[12px]">Taxes & service fees</span>
                      <span className="text-[12px] text-slate-400">Included</span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-5 flex items-center justify-between"
                  style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 60%, #004d80 100%)" }}
                >
                  <div>
                    <p className="text-white/50 text-[11px] uppercase tracking-widest font-bold mb-1">{t("payment.total")}</p>
                    <p className="text-white/40 text-[10px]">{t("payment.currency")}</p>
                  </div>
                  {totalAmount !== null
                    ? (
                      <div className="text-right">
                        <span className="text-[#c9a84c] text-3xl font-black tabular-nums">₺{totalAmount.toLocaleString()}</span>
                      </div>
                    )
                    : <span className="text-blue-200/60 text-sm font-medium">{t("payment.priceNotSet", { defaultValue: "To be determined" })}</span>
                  }
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Bank Info + Upload ─────────────── */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Bank Info Card */}
            <div
              className="bg-white rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
            >
              <div
                className="px-6 py-5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #7a5200 0%, #c9a84c 100%)" }}
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-[15px] font-bold">{t("payment.bankInfo")}</h2>
                  <p className="text-white/60 text-[11px]">Bank transfer details</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">{t("payment.bankName")}</p>
                    <p className="text-slate-800 font-bold text-sm">Akbank T.A.Ş.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">{t("payment.accountHolder")}</p>
                    <p className="text-slate-800 font-bold text-sm leading-tight">Sabancı University EDU Hotel</p>
                  </div>
                </div>

                {/* IBAN with copy */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t("payment.iban")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-[14px] font-bold text-[#003366] tracking-wider">
                      TR33 0004 6004 8888 8000 0123 45
                    </code>
                    <button
                      type="button"
                      onClick={copyIban}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
                      style={{ background: copied ? "#22c55e" : "#003366" }}
                      title="Copy IBAN"
                    >
                      {copied
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <Copy className="h-4 w-4 text-white" />
                      }
                    </button>
                  </div>
                </div>

                {/* Payment reference */}
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.15)" }}>
                    <Hash className="h-4 w-4 text-[#7a5200]" />
                  </div>
                  <p className="text-[12px] text-[#7a5200] leading-relaxed font-medium">
                    {t("payment.paymentRef", { id: reservation.id })}
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Receipt Card */}
            <div
              className="bg-white rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -10px rgba(0,51,102,0.08)" }}
            >
              <div
                className="px-6 py-5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 100%)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <Upload className="h-5 w-5 text-[#c9a84c]" />
                </div>
                <div>
                  <h2 className="text-white text-[15px] font-bold">{t("payment.uploadTitle")}</h2>
                  <p className="text-white/40 text-[11px]">{t("payment.uploadLabel")}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <AnimatePresence mode="wait">
                  {!uploadedFile ? (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) validateAndSetFile(file); }}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
                        style={{
                          border: `2px dashed ${isDragging ? "#003366" : "rgba(0,51,102,0.2)"}`,
                          background: isDragging ? "rgba(0,51,102,0.04)" : "rgba(248,250,252,0.8)",
                          animation: isDragging ? undefined : "borderPulse 3s ease-in-out infinite",
                        }}
                      >
                        {/* Upload icon */}
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ background: "linear-gradient(135deg, #001a3a 0%, #003366 100%)" }}
                        >
                          <Upload
                            className="h-7 w-7 text-white"
                            style={{ animation: isDragging ? "uploadBounce 0.6s ease-in-out infinite" : undefined }}
                          />
                        </div>

                        <p className="text-[15px] font-bold text-slate-700 mb-1">
                          {isDragging ? "Release to upload" : t("payment.dragDrop")}
                        </p>
                        <p className="text-sm text-slate-400 mb-4">{t("payment.acceptedFormats")}</p>

                        {/* File type badges */}
                        <div className="flex items-center justify-center gap-2">
                          {["PDF", "JPG", "PNG"].map(ext => (
                            <span
                              key={ext}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                              style={{ background: "rgba(0,51,102,0.06)", color: "#003366" }}
                            >
                              {ext}
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-400">• Max 5MB</span>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) validateAndSetFile(file); }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ border: "2px solid #22c55e", background: "rgba(240,253,244,0.8)" }}
                    >
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                          <p className="text-[11px] text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setUploadedFile(null); setUploadProgress(0); }}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                      {/* Progress bar */}
                      {uploadProgress < 100 && (
                        <div className="px-4 pb-3">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{uploadProgress}% ready</p>
                        </div>
                      )}
                      {uploadProgress >= 100 && (
                        <div className="px-4 pb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-[11px] text-emerald-600 font-semibold">File ready to upload</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {uploadError && (
                  <motion.p
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-600 flex items-center gap-1.5 font-medium"
                  >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {uploadError}
                  </motion.p>
                )}

                <div className="rounded-2xl p-4 bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[12px] text-blue-800 leading-relaxed">{t("payment.adminReview")}</p>
                </div>

                <button
                  type="submit"
                  disabled={!uploadedFile || isSubmitting}
                  className="w-full py-4 rounded-2xl font-bold text-white text-[15px] relative overflow-hidden group transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-900/20 active:scale-[0.99]"
                  style={{
                    background: !uploadedFile || isSubmitting
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #001a3a 0%, #003366 50%, #0052a3 100%)",
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2.5">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("payment.submitting")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t("payment.submitBtn")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
