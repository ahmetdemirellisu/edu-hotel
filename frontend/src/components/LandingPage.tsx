import React, { useRef, useState, useEffect } from "react";
import {
  motion, useMotionValue, useSpring, useTransform, AnimatePresence,
} from "framer-motion";
import { Link } from "react-router-dom";
import { TextReveal } from "./ui/text-reveal";
import campusBg from "@/assets/campus.png";
import {
  Star, Wifi, Coffee, BookOpen, Building2, MapPin,
  BedDouble, ChevronDown, ArrowRight, Menu, X as XIcon,
} from "lucide-react";

/* ─── Inject CSS once ────────────────────────────────────── */
void (document.getElementById("landing-css") ?? (() => {
  const s = document.createElement("style");
  s.id = "landing-css";
  s.textContent = `
    @keyframes landingPan {
      0%   { transform: scale(1.08) translateX(0); }
      100% { transform: scale(1.08) translateX(-4%); }
    }
    @keyframes landingPulseGlow {
      0%, 100% { box-shadow: 0 0 22px rgba(201,168,76,0.45), 0 0 50px rgba(201,168,76,0.15); }
      50%       { box-shadow: 0 0 38px rgba(201,168,76,0.75), 0 0 80px rgba(201,168,76,0.3); }
    }
    @keyframes landingScrollBounce {
      0%, 100% { transform: translateY(0); opacity: 0.5; }
      50%       { transform: translateY(8px); opacity: 1; }
    }
    @keyframes marqueeScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .landing-cta {
      animation: landingPulseGlow 3s ease-in-out infinite;
    }
    .landing-scroll-indicator {
      animation: landingScrollBounce 2s ease-in-out infinite;
    }
    .marquee-track {
      display: flex;
      animation: marqueeScroll 28s linear infinite;
    }
    .marquee-track:hover { animation-play-state: paused; }
  `;
  document.head.appendChild(s);
  return s;
})());

/* ─── 3D Tilt Card ───────────────────────────────────────── */
function TiltCard({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), { stiffness: 320, damping: 28 });
  const rotY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), { stiffness: 320, damping: 28 });
  const scale = useSpring(1, { stiffness: 320, damping: 28 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    scale.set(1.025);
  };
  const onMouseLeave = () => { rawX.set(0); rawY.set(0); scale.set(1); };

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX: rotX, rotateY: rotY, scale, transformStyle: "preserve-3d", ...style }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Feature card data ──────────────────────────────────── */
const FEATURES = [
  {
    icon: BedDouble,
    title: "Modern Odalar",
    desc: "Geniş, klimalı ve yüksek hızlı Wi-Fi ile donatılmış konforlu odalarımızda kendinizi evinizde hissedeceksiniz.",
    accent: "#c9a84c",
    bg: "rgba(201,168,76,0.06)",
    border: "rgba(201,168,76,0.15)",
  },
  {
    icon: BookOpen,
    title: "Akademik Konfor",
    desc: "Kampüs içi konumunuz sayesinde kütüphane, konferans salonları ve akademik birimlere yürüme mesafesinde erişim.",
    accent: "#60a5fa",
    bg: "rgba(96,165,250,0.06)",
    border: "rgba(96,165,250,0.15)",
  },
  {
    icon: Building2,
    title: "Kampüs Yaşamı",
    desc: "Sabancı'nın eşsiz yeşil kampüsünün tam kalbinde konaklayın. Doğa ile akademinin buluştuğu nokta.",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
  {
    icon: Wifi,
    title: "Premium Wi-Fi",
    desc: "Üniversite fiber altyapısına bağlı yüksek hızlı internet bağlantısı — konferans, araştırma ve video görüşmeleri için ideal.",
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  {
    icon: Coffee,
    title: "Şık Ortak Alanlar",
    desc: "Kahve köşeleri, çalışma odaları ve sosyal alanlar ile günün her saati enerji dolu bir konaklama deneyimi.",
    accent: "#f97316",
    bg: "rgba(249,115,22,0.06)",
    border: "rgba(249,115,22,0.15)",
  },
  {
    icon: MapPin,
    title: "Merkezi Konum",
    desc: "İstanbul'un Anadolu yakasında, doğayla iç içe ama şehre yakın. Tuzla kampüsünün eşsiz coğrafyasında.",
    accent: "#f43f5e",
    bg: "rgba(244,63,94,0.06)",
    border: "rgba(244,63,94,0.15)",
  },
];

const MARQUEE_ITEMS = [
  "Sabancı University",
  "Est. 1994",
  "5 Yıldızlı Akademik Değerlendirme",
  "Modern Konaklama",
  "Tuzla · İstanbul",
  "Premium Konfor",
  "Akademik Mükemmellik",
  "Uluslararası Standartlar",
];

/* ══════════════════════════════════════════════════════════
   Landing Page
   ══════════════════════════════════════════════════════════ */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Odalar", href: "#odalar" },
    { label: "Özellikler", href: "#ozellikler" },
    { label: "Hakkımızda", href: "#hakkimizda" },
    { label: "İletişim", href: "#iletisim" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#000a1f", color: "#fff", overflowX: "hidden" }}>

      {/* ══ FIXED CAMPUS BACKGROUND ══════════════════════════ */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <img
          src={campusBg}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            animation: "landingPan 60s ease-in-out infinite alternate",
          }}
        />
        {/* layered gradient: top dark, middle softer, bottom dark */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,5,20,0.82) 0%, rgba(0,10,30,0.55) 40%, rgba(0,5,20,0.78) 100%)",
        }} />
      </div>

      {/* Scrollable content on top */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ NAVBAR ═══════════════════════════════════════════ */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
          style={{
            background: scrolled ? "rgba(0,8,25,0.88)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
            boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
          }}
        >
          {/* Gold accent line */}
          {scrolled && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "1px",
              background: "linear-gradient(90deg, transparent, #c9a84c 40%, #c9a84c 60%, transparent)",
              opacity: 0.4,
            }} />
          )}
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className="border px-3 py-1.5 rounded-lg transition-all duration-300 group-hover:border-[#c9a84c] group-hover:shadow-[0_0_14px_rgba(201,168,76,0.25)]"
                style={{ borderColor: "rgba(201,168,76,0.5)", background: "rgba(201,168,76,0.07)" }}
              >
                <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                <div className="text-[10px] text-[#c9a84c]/70 leading-tight">Üniversitesi</div>
              </div>
              <div className="hidden sm:block w-px h-8" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span
                className="hidden sm:block text-white font-light tracking-[6px] uppercase text-base"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                EDU HOTEL
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium transition-colors duration-200 hover:text-[#c9a84c]"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                  onClick={e => {
                    e.preventDefault();
                    document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #f0d080, #c9a84c)",
                  color: "#001428",
                  boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
                }}
              >
                Giriş Yap
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => setMobileMenuOpen(v => !v)}
              >
                {mobileMenuOpen ? <XIcon className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
                style={{ background: "rgba(0,8,25,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="px-6 py-4 space-y-3">
                  {navLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-sm py-2 font-medium"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  <Link
                    to="/login"
                    className="block text-center mt-2 px-5 py-3 rounded-xl text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #f0d080, #c9a84c)", color: "#001428" }}
                  >
                    Giriş Yap
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>

        {/* ══ HERO ════════════════════════════════════════════ */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6"
          style={{ minHeight: "100vh", paddingTop: 80 }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-px" style={{ background: "#c9a84c" }} />
            <span
              className="text-[11px] font-bold tracking-[4px] uppercase"
              style={{ color: "#c9a84c" }}
            >
              Sabancı Üniversitesi
            </span>
            <div className="w-8 h-px" style={{ background: "#c9a84c" }} />
          </motion.div>

          {/* Main heading via TextReveal */}
          <div className="max-w-4xl mx-auto mb-6">
            <TextReveal
              text="EDU Hotel: Sabancı Üniversitesi'nin Kalbinde Lüks Bir Konaklama."
              className="justify-center text-4xl sm:text-5xl lg:text-6xl font-light leading-tight"
              /* @ts-ignore – className forwarded via framer wrapper */
            />
            {/* Use an inline style override since TextReveal renders a motion.div */}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)", fontWeight: 300 }}
          >
            Akademik dünya ile konfor bir arada. Araştırmacılar, konuklar ve eğitimciler için 5 yıldızlı bir konaklama deneyimi.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              to="/login"
              className="landing-cta inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, #f0d080 0%, #c9a84c 55%, #e0b840 100%)",
                color: "#001428",
              }}
            >
              Hemen Rezervasyon Yap
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#ozellikler"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
              onClick={e => {
                e.preventDefault();
                document.querySelector("#ozellikler")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Daha Fazla Keşfet
            </a>
          </motion.div>

          {/* Star rating strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.3 }}
            className="flex items-center gap-2 mt-10"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" style={{ color: "#c9a84c" }} />
            ))}
            <span className="text-xs ml-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Akademik Konaklama Standardı
            </span>
          </motion.div>

          {/* Scroll indicator */}
          <div
            className="landing-scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => document.querySelector("#ozellikler")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="text-[10px] tracking-[3px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Kaydır</span>
            <ChevronDown className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
        </section>

        {/* ══ FEATURES SECTION ════════════════════════════════ */}
        <section id="ozellikler" style={{ position: "relative" }}>
          {/* Top gradient fade: transparent → dark so cards feel like they "emerge" */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 180, zIndex: 0,
            background: "linear-gradient(to bottom, transparent, rgba(0,5,20,0.0))",
            pointerEvents: "none",
          }} />

          <div
            className="relative px-6 pt-10 pb-24"
            style={{ zIndex: 1 }}
          >
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  <div className="h-px w-10" style={{ background: "rgba(201,168,76,0.5)" }} />
                  <span className="text-[10px] font-bold tracking-[4px] uppercase" style={{ color: "#c9a84c" }}>
                    Neden EDU Hotel?
                  </span>
                  <div className="h-px w-10" style={{ background: "rgba(201,168,76,0.5)" }} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <TextReveal
                    text="Her Detayda Mükemmellik."
                    className="justify-center text-3xl sm:text-4xl font-light text-white"
                  />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  viewport={{ once: true }}
                  className="text-sm mt-4 max-w-md mx-auto leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Akademik bir ortamda lüks konforun ayrıcalığını yaşayın.
                </motion.p>
              </div>

              {/* Feature cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 60 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: idx * 0.09, ease: [0.22, 1, 0.36, 1] }}
                      viewport={{ once: true, margin: "-60px" }}
                    >
                      <TiltCard>
                        <div
                          className="relative h-full rounded-2xl p-6 overflow-hidden"
                          style={{
                            background: "rgba(0,10,30,0.65)",
                            backdropFilter: "blur(28px)",
                            WebkitBackdropFilter: "blur(28px)",
                            border: `1px solid ${feat.border}`,
                            boxShadow: `0 0 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                          }}
                        >
                          {/* Background glow orb */}
                          <div
                            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${feat.bg.replace("0.06", "0.18")} 0%, transparent 70%)` }}
                          />

                          {/* Icon */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative"
                            style={{ background: feat.bg, border: `1px solid ${feat.border}` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: feat.accent }} />
                          </div>

                          {/* Content */}
                          <h3
                            className="text-base font-bold mb-2.5"
                            style={{ color: "#fff" }}
                          >
                            {feat.title}
                          </h3>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            {feat.desc}
                          </p>

                          {/* Bottom accent line */}
                          <div
                            className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
                            style={{ background: `linear-gradient(90deg, transparent, ${feat.accent}40, transparent)` }}
                          />
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ══ TRUST MARQUEE ════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            background: "rgba(0,5,20,0.85)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(201,168,76,0.12)",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            overflow: "hidden",
            padding: "18px 0",
          }}
        >
          {/* fade masks */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, rgba(0,5,20,0.9), transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, rgba(0,5,20,0.9), transparent)", zIndex: 2, pointerEvents: "none" }} />

          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="flex-shrink-0 flex items-center gap-6 px-10 text-sm font-bold tracking-[2px] uppercase"
                style={{ color: "#c9a84c" }}
              >
                {item}
                <span style={{ color: "rgba(201,168,76,0.3)", fontSize: 18 }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══ ABOUT SECTION ════════════════════════════════════ */}
        <section
          id="hakkimizda"
          className="px-6 py-28"
          style={{ background: "rgba(0,5,20,0.92)", backdropFilter: "blur(20px)" }}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="h-px w-8" style={{ background: "#c9a84c" }} />
                <span className="text-[10px] font-bold tracking-[4px] uppercase" style={{ color: "#c9a84c" }}>Hakkımızda</span>
              </div>
              <TextReveal
                text="Sabancı Kampüsünde Benzersiz Bir Deneyim."
                className="text-2xl sm:text-3xl font-light text-white mb-6"
              />
              <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                EDU Hotel, Sabancı Üniversitesi'nin 1994'te kuruluşundan bu yana akademisyenlere, araştırmacılara ve kurumsal misafirlere ev sahipliği yapmaktadır.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Modern mimarisi ve yeşil kampüs dokusunun içindeki konumuyla, iş ve akademiyi konforla birleştiren eşsiz bir konaklama deneyimi sunuyoruz.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mt-8 text-sm font-bold transition-all duration-200 hover:gap-3"
                style={{ color: "#c9a84c" }}
              >
                Rezervasyon Yap
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { val: "30+", label: "Yıllık Deneyim" },
                { val: "5★",  label: "Akademik Puan" },
                { val: "200+", label: "Misafir Odası" },
                { val: "%98", label: "Memnuniyet" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="text-3xl font-bold mb-1" style={{ color: "#c9a84c" }}>{s.val}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ CONTACT / CTA BANNER ═════════════════════════════ */}
        <section
          id="iletisim"
          className="px-6 py-20 text-center"
          style={{ background: "rgba(0,8,28,0.95)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <TextReveal
                text="Bir Sonraki Konaklamanızı Planlayın."
                className="justify-center text-3xl sm:text-4xl font-light text-white mb-5"
              />
              <p className="text-sm mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Rezervasyonunuzu hemen yapın veya daha fazla bilgi için bizimle iletişime geçin.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="landing-cta inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(135deg, #f0d080, #c9a84c)",
                    color: "#001428",
                  }}
                >
                  Rezervasyon Yap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <footer
          className="px-6 py-10"
          style={{
            background: "rgba(0,5,15,0.98)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className="border px-3 py-1.5 rounded-lg"
                style={{ borderColor: "rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.06)" }}
              >
                <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
                <div className="text-[10px] text-[#c9a84c]/60 leading-tight">Üniversitesi</div>
              </div>
              <span
                className="text-white font-light tracking-[5px] uppercase text-sm"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                EDU HOTEL
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} Sabancı Üniversitesi EDU Hotel. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-5">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[11px] transition-colors hover:text-[#c9a84c]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>

      </div>{/* /scrollable content */}
    </div>
  );
}
