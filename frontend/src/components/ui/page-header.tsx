import React from "react";

/* ── Inject keyframes once (shared with PageHeader) ─── */
void (document.getElementById("page-header-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "page-header-anim";
  s.textContent = `
    @keyframes phBannerShimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes phPulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.8; transform: scale(1.25); }
    }
    @keyframes phAurora1 {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(25px,-15px) scale(1.07); }
      100% { transform: translate(0,0) scale(1); }
    }
    @keyframes phAurora2 {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(-20px,12px) scale(0.96); }
      100% { transform: translate(0,0) scale(1); }
    }
  `;
  document.head.appendChild(s);
})());

interface PageHeaderProps {
  title: string;
  subtitle: string;
  category?: string;
  icon?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, category }: PageHeaderProps) => {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #000e1f 0%, #001f40 35%, #003366 65%, #004d80 100%)" }}
    >
      {/* Aurora orbs */}
      <div
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", animation: "phAurora1 14s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-20 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(77,166,255,0.08) 0%, transparent 70%)", animation: "phAurora2 18s ease-in-out infinite" }}
      />

      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="phGrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#phGrid)" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
        {category && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-px inline-block" style={{ background: "#c9a84c" }} />
            <span className="text-[#c9a84c]/90 text-[10px] font-bold tracking-[4px] uppercase">
              {category}
            </span>
          </div>
        )}

        <h1
          className="text-2xl sm:text-3xl font-light tracking-tight mb-2"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            background: "linear-gradient(90deg, #fff, #c9a84c, #f0d080, #fff)",
            backgroundSize: "300% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "phBannerShimmer 7s linear infinite",
          }}
        >
          {title}
        </h1>

        <p className="text-blue-200/55 text-sm leading-relaxed max-w-md">
          {subtitle}
        </p>

        <div className="flex items-center gap-1.5 mt-3">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: "phPulseDot 1.8s ease-in-out infinite", boxShadow: "0 0 4px #34d39980" }}
          />
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-emerald-400/80">Live</span>
        </div>
      </div>
    </div>
  );
};
