import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Star, Wifi, Map, AlertTriangle, Clock, MessageSquare, Send, Bot, X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DashboardHeroProps {
  userName?: string;
  totalReservations?: number;
  upcomingStays?: number;
  pendingApprovals?: number;
  loading?: boolean;
}

const QUICK_ACTIONS = [
  {
    icon: Wifi,
    label: "Get Wi-Fi Password",
    desc: "Campus network credentials",
    color: "#4da6ff",
    bg: "rgba(77,166,255,0.08)",
    border: "rgba(77,166,255,0.18)",
  },
  {
    icon: Map,
    label: "View Campus Map",
    desc: "Buildings & facilities",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.18)",
  },
  {
    icon: AlertTriangle,
    label: "Report an Issue",
    desc: "Maintenance & support",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.18)",
  },
  {
    icon: Clock,
    label: "Request Late Check-out",
    desc: "Extend your stay time",
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.08)",
    border: "rgba(201,168,76,0.18)",
  },
];

export function DashboardHero({
  userName = "Guest",
  totalReservations = 0,
  upcomingStays = 0,
  pendingApprovals = 0,
  loading = false,
}: DashboardHeroProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ from: "user" | "atlas"; text: string }[]>([
    { from: "atlas", text: "Hello! I'm Atlas, your EDU Concierge. How can I help you today?" },
  ]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting.morning", { defaultValue: "Good morning" });
    if (h < 18) return t("dashboard.greeting.afternoon", { defaultValue: "Good afternoon" });
    return t("dashboard.greeting.evening", { defaultValue: "Good evening" });
  };

  const speechText = pendingApprovals > 0
    ? `You have ${pendingApprovals} pending approval${pendingApprovals > 1 ? "s" : ""} today. Click me for quick actions!`
    : upcomingStays > 0
    ? `Welcome back! You have ${upcomingStays} upcoming stay${upcomingStays > 1 ? "s" : ""}. Need anything?`
    : "Welcome back! I'm Atlas, your EDU Concierge. Click me for quick actions!";

  const stats = [
    { label: t("dashboard.stats.totalReservations", { defaultValue: "Total" }),  value: totalReservations, color: "#4da6ff" },
    { label: t("dashboard.stats.upcoming",          { defaultValue: "Upcoming" }), value: upcomingStays,    color: "#10b981" },
    { label: t("dashboard.stats.pending",           { defaultValue: "Pending" }),  value: pendingApprovals, color: "#f59e0b" },
  ];

  const sendMessage = () => {
    const text = chatMessage.trim();
    if (!text) return;
    setChatLog(prev => [
      ...prev,
      { from: "user", text },
      { from: "atlas", text: "Thank you for your message! A member of the reception team will follow up shortly." },
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

            {/* Clickable robot container */}
            <div
              className="pointer-events-auto w-full h-full cursor-pointer group"
              onClick={() => setDrawerOpen(true)}
              title="Chat with Atlas"
            >
              {/* Hover ring hint */}
              <div
                className="absolute inset-0 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 60% 50%, rgba(201,168,76,0.06) 0%, transparent 65%)",
                }}
              />
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
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
                    Atlas – EDU Concierge
                  </SheetTitle>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online · Ready to help
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
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="flex flex-col items-start gap-2 p-3.5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: action.bg,
                      border: `1px solid ${action.border}`,
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
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/[0.06] flex-shrink-0" />

          {/* Chat log */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-1">
              Chat with Reception
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
                placeholder="Type a message to reception..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
