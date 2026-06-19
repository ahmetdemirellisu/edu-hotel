import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Star, Wifi, Map, AlertTriangle, Clock, MessageSquare, Send, Bot, X,
  Copy, Check, ZoomIn, ZoomOut, ChevronLeft, Maximize2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { EduConcierge } from "./EduConcierge";
import { Spotlight } from "@/components/ui/spotlight";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import campusMap from "@/assets/campus-map.jpg";
import { fetchPublicSettings, SETTINGS_FALLBACK, type PublicSettings } from "@/api/settings";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";

type ConciergePanel = "none" | "wifi" | "issue" | "late";

interface DashboardHeroProps {
  userName?: string;
  totalReservations?: number;
  upcomingStays?: number;
  pendingApprovals?: number;
  loading?: boolean;
}

export function DashboardHero({
  userName = "Guest",
  totalReservations = 0,
  upcomingStays = 0,
  pendingApprovals = 0,
  loading = false,
}: DashboardHeroProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Live hotel settings — Wi-Fi credentials, check-in/out times, etc. Edit them
  // from the admin Settings page; they refresh on next mount.
  const [hotelSettings, setHotelSettings] = useState<PublicSettings>(SETTINGS_FALLBACK);
  React.useEffect(() => { fetchPublicSettings().then(setHotelSettings).catch(() => {}); }, []);
  const WIFI = { ssid: hotelSettings.wifiSsid, password: hotelSettings.wifiPassword };
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ from: "user" | "atlas"; text: string }[]>(() => [
    { from: "atlas", text: t("dashboardHero.chat.greeting") },
  ]);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  // Which inline panel is open inside the drawer (mutually exclusive)
  const [panel, setPanel] = useState<ConciergePanel>("none");
  // Campus map modal (rendered outside the drawer so it can fill the viewport)
  const [mapOpen, setMapOpen] = useState(false);
  const [mapZoomed, setMapZoomed] = useState(false);
  // Wi-Fi copy feedback
  const [copied, setCopied] = useState<"ssid" | "password" | null>(null);
  // Issue / late-checkout form state
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const togglePanel = (next: ConciergePanel) => {
    setPanel((cur) => (cur === next ? "none" : next));
    setFormStatus(null);
  };

  const copy = (kind: "ssid" | "password", value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const submitConciergeRequest = async (type: "issue" | "late-checkout") => {
    if (formSubmitting) return;
    if (!formMessage.trim()) {
      setFormStatus({ kind: "error", text: t("dashboardHero.forms.errorEmpty", { defaultValue: "Please describe your request." }) });
      return;
    }
    setFormSubmitting(true);
    setFormStatus(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/concierge/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          subject: formSubject.trim() || undefined,
          message: formMessage.trim(),
          requestedTime: type === "late-checkout" ? formTime.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send request.");
      }
      setFormStatus({
        kind: "success",
        text: t("dashboardHero.forms.successSent", {
          defaultValue: "Sent! Reception will follow up shortly.",
        }),
      });
      setFormSubject("");
      setFormMessage("");
      setFormTime("");
    } catch (err: any) {
      setFormStatus({
        kind: "error",
        text: err?.message || t("dashboardHero.forms.errorSend", { defaultValue: "Failed to send. Please try again." }),
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Esc closes the campus-map modal
  React.useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapOpen]);

  // Keep the chat scrolled to the latest message
  React.useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog]);

  /* ─────────────────────────── Smart FAQ chat ───────────────────────────
   * Keyword-matched reception responses. Each rule lists bilingual trigger
   * keywords (EN + TR) and an i18n key for the localized reply. The first
   * rule that matches wins. Rules are ordered by specificity so e.g.
   * "late check-out" matches the checkOut rule rather than the generic
   * "checkOut" topic. */
  const FAQ_RULES: { triggers: string[]; key: string; fallback: string }[] = [
    // Greetings / pleasantries (run first so "hi, what's the wifi?" still falls through to wifi rule)
    {
      triggers: ["thank you", "thanks", "thx", "teşekkür", "tesekkur", "sağ ol", "sagol"],
      key: "dashboardHero.faq.thanks",
      fallback: "You're very welcome! Anything else I can help with?",
    },
    // Core hotel topics
    {
      triggers: ["wifi", "wi-fi", "wi fi", "password", "şifre", "sifre", "internet", "ağ", "ag "],
      key: "dashboardHero.faq.wifi",
      fallback: `The Wi-Fi network is "${WIFI.ssid}" and the password is "${WIFI.password}". Open Wi-Fi from the Quick Actions for one-tap copy.`,
    },
    {
      triggers: ["map", "harita", "campus", "kampüs", "kampus", "where is", "nasıl gelirim", "nerede"],
      key: "dashboardHero.faq.map",
      fallback: "Open the Campus Map quick action to view the Tuzla campus layout.",
    },
    {
      triggers: ["breakfast", "kahvaltı", "kahvalti"],
      key: "dashboardHero.faq.breakfast",
      fallback: "Breakfast is served at the University Center cafeteria between 07:30 and 10:00.",
    },
    {
      triggers: ["lunch", "dinner", "food", "restaurant", "cafeteria", "yemek", "akşam", "öğle", "ogle"],
      key: "dashboardHero.faq.food",
      fallback: "On-campus dining: University Center cafeteria (lunch 11:30–14:00, dinner 17:30–20:00), SU Café for snacks and coffee, and Starbucks at the FASS building.",
    },
    // Stay logistics
    {
      triggers: ["late check-out", "late checkout", "late check out", "geç çıkış", "gec cikis"],
      key: "dashboardHero.faq.lateCheckout",
      fallback: "Need a late check-out? Tap the Late Check-out quick action above and I'll forward the request to reception.",
    },
    {
      triggers: ["check-in", "checkin", "check in", "giriş saati", "giris saati", "arrival"],
      key: "dashboardHero.faq.checkIn",
      fallback: "Standard check-in is from 14:00. For arrivals before that, please leave luggage at reception.",
    },
    {
      triggers: ["check-out", "checkout", "check out", "çıkış saati", "cikis saati", "departure"],
      key: "dashboardHero.faq.checkOut",
      fallback: "Check-out is by 12:00. Need a late check-out? Use the Late Check-out quick action.",
    },
    {
      triggers: ["key", "anahtar", "kart", "card", "envelope", "zarf"],
      key: "dashboardHero.faq.key",
      fallback: "Before 16:30, collect your room key card from reception in person. After 16:30, it's in a sealed envelope at the main security gate.",
    },
    {
      triggers: ["luggage", "baggage", "bagaj", "valiz", "store my bag", "left my bag"],
      key: "dashboardHero.faq.luggage",
      fallback: "Reception can hold your luggage before check-in or after check-out at no charge. Just bring your reservation ID.",
    },
    {
      triggers: ["housekeeping", "cleaning", "towel", "havlu", "temizlik", "extra blanket", "extra pillow"],
      key: "dashboardHero.faq.housekeeping",
      fallback: "Rooms are cleaned daily between 10:00 and 14:00. For extra towels or amenities, tap Report an Issue and describe what you need.",
    },
    {
      triggers: ["laundry", "çamaşır", "camasir", "iron", "ütü", "utu"],
      key: "dashboardHero.faq.laundry",
      fallback: "Same-day laundry can be arranged at reception (drop off before 09:00). An iron and ironing board are available on request.",
    },
    {
      triggers: ["smoke", "smoking", "sigara"],
      key: "dashboardHero.faq.smoking",
      fallback: "The EDU Hotel is non-smoking inside all rooms and common areas. Designated outdoor smoking areas are by the courtyard and near the campus shuttle stop.",
    },
    {
      triggers: ["quiet", "noise", "silence", "sessizlik", "gürültü", "gurultu"],
      key: "dashboardHero.faq.quiet",
      fallback: "Quiet hours are observed between 22:00 and 08:00. If a neighbour is being noisy, tap Report an Issue and we'll handle it discreetly.",
    },
    // Campus services
    {
      triggers: ["parking", "park", "otopark", "araba"],
      key: "dashboardHero.faq.parking",
      fallback: "Guest parking is at the Main Gate (marker 9 on the campus map). Show your reservation ID to security.",
    },
    {
      triggers: ["shuttle", "servis", "bus", "metro", "ulaşım", "ulasim", "tuzla", "transport"],
      key: "dashboardHero.faq.shuttle",
      fallback: "The campus shuttle (marker SH on the map) runs to Tuzla metro station. The current timetable is on the reception noticeboard.",
    },
    {
      triggers: ["airport", "havalimanı", "havalimani", "sabiha", "ist airport"],
      key: "dashboardHero.faq.airport",
      fallback: "Sabiha Gökçen is the closest airport (~20 min by taxi). For Istanbul Airport allow 70+ minutes. Reception can book a taxi for you.",
    },
    {
      triggers: ["taxi", "uber", "bitaksi", "car ride"],
      key: "dashboardHero.faq.taxi",
      fallback: "Reception can call a licensed taxi (~5 min wait). BiTaksi and Uber both serve the campus area.",
    },
    {
      triggers: ["atm", "bank", "banka", "money", "para çekme", "para cekme"],
      key: "dashboardHero.faq.atm",
      fallback: "There's a Garanti BBVA ATM by the Main Gate and an İş Bankası ATM at the University Center. Both accept international cards.",
    },
    {
      triggers: ["pharmacy", "eczane", "medicine", "ilaç", "ilac"],
      key: "dashboardHero.faq.pharmacy",
      fallback: "The campus pharmacy is next to the Health Center (marker 16). After hours, the nearest 24-hour pharmacy is in Tuzla town centre.",
    },
    {
      triggers: ["library", "kütüphane", "kutuphane", "study", "ders çalışma"],
      key: "dashboardHero.faq.library",
      fallback: "The Information Center library (marker 6) is open 24/7 during the academic term. Show your reservation ID to enter.",
    },
    {
      triggers: ["gym", "spor", "sports", "swim", "yüzme", "yuzme", "pool"],
      key: "dashboardHero.faq.gym",
      fallback: "The Sports Center (marker 19) has a gym, indoor pool, and courts. Day passes for hotel guests are available at reception.",
    },
    {
      triggers: ["mosque", "namaz", "prayer", "mescit", "cami"],
      key: "dashboardHero.faq.mosque",
      fallback: "There is a prayer room (mescit) in the basement of the University Center. The nearest mosque is in Tuzla town, ~10 min by shuttle.",
    },
    // Reservation / payment
    {
      triggers: ["my reservation", "my booking", "rezervasyonum", "booking status"],
      key: "dashboardHero.faq.reservation",
      fallback: "You can see your reservation status under My Reservations in the dashboard. For changes, tap Report an Issue and describe what you need.",
    },
    {
      triggers: ["cancel", "cancellation", "iptal"],
      key: "dashboardHero.faq.cancellation",
      fallback: "You can cancel from My Reservations up to 24 hours before check-in. After that, contact reception via the Report an Issue button.",
    },
    {
      triggers: ["payment", "pay", "invoice", "fatura", "ödeme", "odeme", "receipt", "dekont"],
      key: "dashboardHero.faq.payment",
      fallback: "Payment is by bank transfer. Once your reservation is approved you'll see the IBAN and amount on the Payment page — upload your receipt there.",
    },
    {
      triggers: ["lost", "found", "kayıp", "kayip", "missing item"],
      key: "dashboardHero.faq.lost",
      fallback: "For lost items in the hotel, tap Report an Issue and describe what you lost. For items lost elsewhere on campus, check with campus security at extension 9000.",
    },
    // Emergencies & reception (lowest priority — catch-all phrasings)
    {
      triggers: ["emergency", "acil", "security", "güvenlik", "guvenlik", "ambulance"],
      key: "dashboardHero.faq.emergency",
      fallback: "For emergencies dial campus security from any room phone (extension 9000). For medical: Health Center (marker 16 on the map).",
    },
    {
      triggers: ["reception", "resepsiyon", "hours", "open", "front desk"],
      key: "dashboardHero.faq.reception",
      fallback: "Reception is staffed 24/7. After 16:30, room key cards are at the main security gate.",
    },
    // Greetings — last so they don't shadow content questions
    {
      triggers: ["hello", "hi ", "hey", "merhaba", "selam", "good morning", "good afternoon", "good evening", "günaydın", "gunaydin"],
      key: "dashboardHero.faq.hello",
      fallback: "Hello! I'm Atlas, your EDU Hotel concierge. Ask me about Wi-Fi, breakfast, the campus, your reservation — or use the quick actions above.",
    },
  ];

  const matchFaq = (raw: string): string | null => {
    // Lowercase, then normalise common Turkish chars so "şifre" matches "sifre" etc.
    const text = (" " + raw + " ").toLowerCase();
    for (const rule of FAQ_RULES) {
      if (rule.triggers.some((tr) => text.includes(tr))) {
        return t(rule.key, { defaultValue: rule.fallback });
      }
    }
    return null;
  };

  // i18n-aware quick actions. Each entry includes the action key wired below.
  const QUICK_ACTIONS = [
    {
      key: "wifi" as const,
      icon: Wifi,
      label: t("dashboardHero.quickActions.wifi.label"),
      desc:  t("dashboardHero.quickActions.wifi.desc"),
      color: "#4da6ff",
      bg: "rgba(77,166,255,0.08)",
      border: "rgba(77,166,255,0.18)",
      onClick: () => togglePanel("wifi"),
    },
    {
      key: "map" as const,
      icon: Map,
      label: t("dashboardHero.quickActions.map.label"),
      desc:  t("dashboardHero.quickActions.map.desc"),
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.18)",
      onClick: () => { setMapOpen(true); setMapZoomed(false); },
    },
    {
      key: "issue" as const,
      icon: AlertTriangle,
      label: t("dashboardHero.quickActions.issue.label"),
      desc:  t("dashboardHero.quickActions.issue.desc"),
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.18)",
      onClick: () => togglePanel("issue"),
    },
    {
      key: "late" as const,
      icon: Clock,
      label: t("dashboardHero.quickActions.late.label"),
      desc:  t("dashboardHero.quickActions.late.desc"),
      color: "#c9a84c",
      bg: "rgba(201,168,76,0.08)",
      border: "rgba(201,168,76,0.18)",
      onClick: () => togglePanel("late"),
    },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting.morning", { defaultValue: "Good morning" });
    if (h < 18) return t("dashboard.greeting.afternoon", { defaultValue: "Good afternoon" });
    return t("dashboard.greeting.evening", { defaultValue: "Good evening" });
  };

  const speechText = pendingApprovals > 0
    ? t("dashboardHero.speech.pendingApprovals", { count: pendingApprovals })
    : upcomingStays > 0
    ? t("dashboardHero.speech.upcomingStays", { count: upcomingStays })
    : t("dashboardHero.speech.welcome");

  const stats = [
    { label: t("dashboard.stats.totalReservations", { defaultValue: "Total" }),  value: totalReservations, color: "#4da6ff" },
    { label: t("dashboard.stats.upcoming",          { defaultValue: "Upcoming" }), value: upcomingStays,    color: "#10b981" },
    { label: t("dashboard.stats.pending",           { defaultValue: "Pending" }),  value: pendingApprovals, color: "#f59e0b" },
  ];

  const sendMessage = () => {
    const text = chatMessage.trim();
    if (!text) return;
    const reply = matchFaq(text) ?? t("dashboardHero.chat.autoReply");
    setChatLog((prev) => [
      ...prev,
      { from: "user", text },
      { from: "atlas", text: reply },
    ]);
    setChatMessage("");
  };

  return (
    <>
      {/* ── Hero card ──────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden rounded-3xl mb-10"
        style={{
          height: "clamp(260px, 32vw, 380px)",
          background: "linear-gradient(135deg, #000e1f 0%, #001f40 30%, #003366 60%, #004d80 85%, #001f40 100%)",
          boxShadow: "0 24px 70px rgba(0,30,70,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        {/* Spotlight */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#c9a84c" />

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" />
        </svg>

        {/* Gold top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.7) 40%, rgba(201,168,76,0.7) 60%, transparent)" }}
        />

        {/* Aurora orbs */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", animation: "dashAurora1 12s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(77,166,255,0.08) 0%, transparent 70%)", animation: "dashAurora2 15s ease-in-out infinite" }}
        />

        {/* Main layout */}
        <div className="relative z-10 flex h-full">

          {/* Left: text content */}
          <div className="flex flex-col justify-center px-8 py-8 sm:px-12 sm:py-10 w-full md:w-[55%] lg:w-[50%]">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-2 mb-3"
            >
              <Star className="h-3 w-3 text-[#c9a84c]" fill="#c9a84c" />
              <span className="text-[#c9a84c]/90 text-[10px] font-bold tracking-[4px] uppercase">
                Sabancı Üniversitesi
              </span>
            </motion.div>

            {/* Greeting */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-light text-white tracking-tight mb-2"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(22px, 3.2vw, 40px)",
                lineHeight: 1.15,
              }}
            >
              {getGreeting()},{" "}
              <span
                className="font-semibold"
                style={{
                  background: "linear-gradient(90deg, #fff 0%, #c9a84c 40%, #f0d080 60%, #fff 100%)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "dashGoldShimmer 5s linear infinite",
                }}
              >
                {userName.split(" ")[0]}
              </span>
              !
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42, duration: 0.55 }}
              className="text-blue-200/55 text-[13px] leading-relaxed max-w-sm mb-5 hidden sm:block"
            >
              {t("dashboard.subtitle", { defaultValue: "Track your reservation requests, approvals, payments, and notifications in one place." })}
            </motion.p>

            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {stats.map((pill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pill.color, boxShadow: `0 0 6px ${pill.color}` }} />
                  <span className="text-[11px] text-white/50 font-medium">{pill.label}</span>
                  <span className="text-[13px] font-bold text-white">{loading ? "—" : pill.value}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to="/book-room"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#001f40] transition-all duration-200 hover:scale-105 hover:shadow-[0_12px_30px_rgba(201,168,76,0.45)]"
                style={{
                  background: "linear-gradient(135deg, #f0d080 0%, #c9a84c 60%, #e0b840 100%)",
                  boxShadow: "0 6px 20px rgba(201,168,76,0.3)",
                }}
              >
                <Plus className="h-4 w-4" />
                {t("main.quick.bookRoom", { defaultValue: "Book a Room" })}
              </Link>
            </motion.div>
          </div>

          {/* Right: 3D Spline scene — hidden on mobile */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[50%] lg:w-[52%]">
            {/* Left-side fade */}
            <div
              className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, #001f40, transparent)" }}
            />
            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to top, #001a3a, transparent)" }}
            />

            {/* Speech bubble */}
            <AnimatePresence>
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  onClick={() => setDrawerOpen(true)}
                  className="absolute top-5 left-[12%] z-20 max-w-[200px] cursor-pointer select-none"
                  style={{ animation: "atlasBubbleFloat 4s ease-in-out infinite" }}
                >
                  <div
                    className="relative px-3.5 py-2.5 rounded-2xl text-[11px] leading-snug font-medium text-white"
                    style={{
                      background: "rgba(0,20,50,0.72)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(201,168,76,0.35)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
                    }}
                  >
                    {speechText}
                    {/* Tail pointing down-right toward robot */}
                    <span
                      className="absolute -bottom-2 right-8 w-0 h-0"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "8px solid rgba(201,168,76,0.35)",
                      }}
                    />
                    <span
                      className="absolute -bottom-[7px] right-[33px] w-0 h-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "7px solid rgba(0,20,50,0.72)",
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clickable mascot container */}
            <div
              className="pointer-events-auto w-full h-full cursor-pointer group relative"
              onClick={() => setDrawerOpen(true)}
              title={t("dashboardHero.atlasTooltip")}
            >
              {/* Hover ring hint — brightens when hovering over the bellhop */}
              <div
                className="absolute inset-0 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 60% 50%, rgba(201,168,76,0.16) 0%, transparent 60%)",
                }}
              />
              {/* Branded SVG bellhop (the concierge brings his own animated halo) */}
              <EduConcierge className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Atlas Concierge Drawer ──────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] p-0 flex flex-col overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #000e1f 0%, #001530 60%, #000e1f 100%)",
            border: "none",
            borderLeft: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #c9a84c 0%, #f0d080 100%)",
                    boxShadow: "0 4px 12px rgba(201,168,76,0.35)",
                  }}
                >
                  <Bot className="h-5 w-5 text-[#001f40]" />
                </div>
                <div>
                  <SheetTitle className="text-white text-base font-semibold leading-tight">
                    {t("dashboardHero.atlasTitle")}
                  </SheetTitle>
                  <p className="text-[11px] text-[#c9a84c] flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] inline-block" />
                    {t("dashboardHero.atlasStatus")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/08 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          {/* Quick actions grid */}
          <div className="px-6 pt-5 pb-4 flex-shrink-0">
            <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-3">
              {t("dashboardHero.quickActions.heading")}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = panel === action.key;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    className="flex flex-col items-start gap-2 p-3.5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: isActive ? `${action.color}22` : action.bg,
                      border: `1px solid ${isActive ? action.color : action.border}`,
                      boxShadow: isActive ? `0 0 0 1px ${action.color}55` : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${action.color}18`, border: `1px solid ${action.color}30` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: action.color }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white leading-tight">{action.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{action.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Inline panels (Wi-Fi / Issue / Late check-out) — driven by `panel` state */}
            <AnimatePresence initial={false}>
              {panel !== "none" && (
                <motion.div
                  key={panel}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  {panel === "wifi" && (
                    <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(77,166,255,0.06)", border: "1px solid rgba(77,166,255,0.20)" }}>
                      <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#4da6ff]">
                        {t("dashboardHero.wifi.title", { defaultValue: "Wi-Fi access" })}
                      </p>
                      {[
                        { kind: "ssid" as const, label: t("dashboardHero.wifi.network", { defaultValue: "Network" }), value: WIFI.ssid },
                        { kind: "password" as const, label: t("dashboardHero.wifi.password", { defaultValue: "Password" }), value: WIFI.password },
                      ].map((row) => (
                        <div key={row.kind} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="min-w-0">
                            <p className="text-[10px] text-white/35 font-bold tracking-widest uppercase">{row.label}</p>
                            <p className="text-[13.5px] text-white font-mono mt-0.5 truncate">{row.value}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copy(row.kind, row.value)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: copied === row.kind ? "rgba(16,185,129,0.18)" : "rgba(77,166,255,0.15)",
                              color: copied === row.kind ? "#86efac" : "#bfdbfe",
                            }}
                          >
                            {copied === row.kind ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied === row.kind
                              ? t("dashboardHero.wifi.copied", { defaultValue: "Copied" })
                              : t("dashboardHero.wifi.copy", { defaultValue: "Copy" })}
                          </button>
                        </div>
                      ))}
                      <p className="text-[10.5px] text-white/40 leading-relaxed">
                        {t("dashboardHero.wifi.hint", { defaultValue: "Available throughout the EDU Hotel building and the campus common areas." })}
                      </p>
                    </div>
                  )}

                  {(panel === "issue" || panel === "late") && (
                    <div className="rounded-2xl p-4 space-y-3" style={{
                      background: panel === "issue" ? "rgba(245,158,11,0.06)" : "rgba(201,168,76,0.06)",
                      border: `1px solid ${panel === "issue" ? "rgba(245,158,11,0.20)" : "rgba(201,168,76,0.22)"}`,
                    }}>
                      <p className="text-[10px] font-bold tracking-[2.5px] uppercase" style={{ color: panel === "issue" ? "#f59e0b" : "#c9a84c" }}>
                        {panel === "issue"
                          ? t("dashboardHero.issue.title", { defaultValue: "Report an issue" })
                          : t("dashboardHero.late.title", { defaultValue: "Request late check-out" })}
                      </p>

                      <input
                        type="text"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder={panel === "issue"
                          ? t("dashboardHero.issue.subjectPlaceholder", { defaultValue: "Short title (e.g. Broken lamp in 312)" })
                          : t("dashboardHero.late.subjectPlaceholder", { defaultValue: "Reservation ID (optional)" })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12.5px] text-white placeholder-white/30 outline-none focus:border-white/25 transition-colors"
                      />

                      {panel === "late" && (
                        <input
                          type="time"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          placeholder="HH:MM"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12.5px] text-white placeholder-white/30 outline-none focus:border-white/25 transition-colors"
                        />
                      )}

                      <textarea
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        rows={3}
                        placeholder={panel === "issue"
                          ? t("dashboardHero.issue.messagePlaceholder", { defaultValue: "Describe what's wrong and where." })
                          : t("dashboardHero.late.messagePlaceholder", { defaultValue: "Why do you need a late check-out?" })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12.5px] text-white placeholder-white/30 outline-none focus:border-white/25 transition-colors resize-none"
                      />

                      {formStatus && (
                        <p
                          className="text-[11.5px] leading-relaxed"
                          style={{ color: formStatus.kind === "success" ? "#86efac" : "#fca5a5" }}
                        >
                          {formStatus.text}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPanel("none")}
                          className="text-[11.5px] font-semibold text-white/45 hover:text-white/80 transition-colors"
                        >
                          {t("dashboardHero.forms.cancel", { defaultValue: "Cancel" })}
                        </button>
                        <button
                          type="button"
                          onClick={() => submitConciergeRequest(panel === "issue" ? "issue" : "late-checkout")}
                          disabled={formSubmitting}
                          className="px-4 py-2 rounded-xl text-[12px] font-bold text-[#001f40] transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)" }}
                        >
                          {formSubmitting
                            ? t("dashboardHero.forms.sending", { defaultValue: "Sending…" })
                            : t("dashboardHero.forms.send", { defaultValue: "Send to reception" })}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/[0.06] flex-shrink-0" />

          {/* Chat log */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-1">
              {t("dashboardHero.chat.heading")}
            </p>
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.from === "atlas" && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 self-end mb-0.5"
                    style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080)" }}
                  >
                    <Bot className="h-3.5 w-3.5 text-[#001f40]" />
                  </div>
                )}
                <div
                  className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-snug"
                  style={
                    msg.from === "user"
                      ? {
                          background: "linear-gradient(135deg, #c9a84c 0%, #e0b840 100%)",
                          color: "#001f40",
                          fontWeight: 500,
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.82)",
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div
            className="px-4 py-4 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <MessageSquare className="h-4 w-4 text-white/25 flex-shrink-0" />
              <input
                className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none"
                placeholder={t("dashboardHero.chat.placeholder")}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatMessage.trim()}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 hover:scale-110"
                style={{
                  background: chatMessage.trim()
                    ? "linear-gradient(135deg, #c9a84c, #f0d080)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <Send className="h-3.5 w-3.5 text-[#001f40]" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Campus Map Modal (fills viewport, click image to zoom 1×/2×) ── */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: "rgba(0, 14, 31, 0.92)", backdropFilter: "blur(6px)" }}
            onClick={() => setMapOpen(false)}
          >
            {/* Header bar */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3.5 border-b"
              style={{ background: "linear-gradient(180deg, rgba(0,14,31,0.95), rgba(0,14,31,0.6))", borderColor: "rgba(201,168,76,0.18)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <Map className="h-5 w-5 text-[#c9a84c]" />
                <div>
                  <h3 className="text-white text-sm font-semibold leading-tight">
                    {t("dashboardHero.mapModal.title", { defaultValue: "Sabancı University · Tuzla Campus Map" })}
                  </h3>
                  <p className="text-[11px] text-white/45 leading-tight">
                    {t("dashboardHero.mapModal.hint", { defaultValue: "Click the map to zoom — Esc / outside click to close." })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapZoomed((v) => !v)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={mapZoomed ? "Zoom out" : "Zoom in"}
                >
                  {mapZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Map viewport — scrolls when zoomed */}
            <div
              className="relative w-full h-full pt-16 pb-6 px-4 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                src={campusMap}
                alt="Sabancı University Tuzla Campus map"
                draggable={false}
                onClick={() => setMapZoomed((v) => !v)}
                animate={{ scale: mapZoomed ? 1.9 : 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "block",
                  margin: "0 auto",
                  maxWidth: "100%",
                  maxHeight: mapZoomed ? "none" : "calc(100vh - 90px)",
                  cursor: mapZoomed ? "zoom-out" : "zoom-in",
                  borderRadius: 12,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble float keyframe */}
      <style>{`
        @keyframes atlasBubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
