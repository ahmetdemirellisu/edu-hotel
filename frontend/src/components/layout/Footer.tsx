import { useTranslation } from "react-i18next";

/* ── Inject keyframes once ─────────────────────────────── */
const _footerStyle = document.getElementById("footer-anim") ?? (() => {
  const s = document.createElement("style");
  s.id = "footer-anim";
  s.textContent = `
    @keyframes footerShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes footerGlow {
      0%, 100% { opacity: 0.5; transform: scaleX(1); }
      50%       { opacity: 1;   transform: scaleX(1.02); }
    }
    @keyframes footerDiamondPulse {
      0%, 100% { transform: rotate(45deg) scale(1); }
      50%       { transform: rotate(45deg) scale(1.2); }
    }
    .footer-link-item {
      position: relative;
      cursor: pointer;
      transition: color 0.2s ease, padding-left 0.2s ease;
    }
    .footer-link-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 0;
      height: 1px;
      background: #c9a84c;
      transition: width 0.25s ease;
      transform: translateY(-50%);
    }
    .footer-link-item:hover {
      color: white;
      padding-left: 14px;
    }
    .footer-link-item:hover::before {
      width: 10px;
    }
    .footer-contact-item {
      transition: color 0.2s ease;
    }
    .footer-contact-item:hover {
      color: #c9a84c;
    }
    .footer-brand-text {
      background: linear-gradient(90deg, rgba(255,255,255,0.4), white, #c9a84c, white, rgba(255,255,255,0.4));
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: footerShimmer 6s linear infinite;
    }
  `;
  document.head.appendChild(s);
  return s;
})();

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="text-white mt-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #001428 0%, #001f3f 30%, #002952 70%, #001428 100%)",
      }}
    >
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }}
      />

      {/* Top aurora glow */}
      <div
        className="absolute top-0 left-1/4 w-1/2 h-32 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(77,166,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 right-1/4 w-1/3 h-24 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Gold accent top decoration */}
      <div className="relative flex items-center justify-center pt-10 pb-6 px-4">
        <div
          className="flex-1 h-px max-w-xs"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), rgba(201,168,76,0.7))",
            animation: "footerGlow 4s ease-in-out infinite",
          }}
        />
        {/* Diamond center */}
        <div className="mx-4 flex items-center gap-3">
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: "rgba(201,168,76,0.5)" }}
          />
          <div
            className="w-2.5 h-2.5"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #f0d080)",
              transform: "rotate(45deg)",
              animation: "footerDiamondPulse 3s ease-in-out infinite",
              boxShadow: "0 0 8px rgba(201,168,76,0.5)",
            }}
          />
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: "rgba(201,168,76,0.5)" }}
          />
        </div>
        <div
          className="flex-1 h-px max-w-xs"
          style={{
            background: "linear-gradient(90deg, rgba(201,168,76,0.7), rgba(201,168,76,0.3), transparent)",
            animation: "footerGlow 4s ease-in-out infinite",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-4 gap-8 mb-10">

          {/* Logo and Address */}
          <div>
            <div
              className="border border-[#c9a84c]/50 px-3 py-1.5 inline-block mb-5 rounded transition-all duration-300 hover:border-[#c9a84c] hover:shadow-[0_0_14px_rgba(201,168,76,0.2)]"
              style={{ background: "rgba(201,168,76,0.06)" }}
            >
              <div className="text-[11px] font-bold text-[#c9a84c] leading-tight tracking-wider uppercase">Sabancı</div>
              <div className="text-[9px] text-[#c9a84c]/70 leading-tight tracking-widest">Üniversitesi</div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed footer-contact-item">
              {t("footer.address.line1")}
              <br />
              {t("footer.address.line2")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="mb-5 text-[10px] font-bold uppercase tracking-[3px] flex items-center gap-2"
              style={{ color: "#c9a84c" }}
            >
              <span
                className="w-3 h-px inline-block"
                style={{ background: "#c9a84c" }}
              />
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li className="footer-link-item">{t("footer.about")}</li>
              <li className="footer-link-item">{t("footer.academic")}</li>
              <li className="footer-link-item">{t("footer.research")}</li>
              <li className="footer-link-item">{t("footer.campusLife")}</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3
              className="mb-5 text-[10px] font-bold uppercase tracking-[3px] flex items-center gap-2"
              style={{ color: "#c9a84c" }}
            >
              <span
                className="w-3 h-px inline-block"
                style={{ background: "#c9a84c" }}
              />
              {t("footer.resources")}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li className="footer-link-item">{t("footer.library")}</li>
              <li className="footer-link-item">{t("footer.sucourse")}</li>
              <li className="footer-link-item">{t("footer.email")}</li>
              <li className="footer-link-item">{t("footer.support")}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="mb-5 text-[10px] font-bold uppercase tracking-[3px] flex items-center gap-2"
              style={{ color: "#c9a84c" }}
            >
              <span
                className="w-3 h-px inline-block"
                style={{ background: "#c9a84c" }}
              />
              {t("footer.contactTitle")}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li className="footer-contact-item">{t("footer.phone")}</li>
              <li className="footer-contact-item">{t("footer.emailAddress")}</li>
            </ul>
          </div>
        </div>

        {/* Animated EDU HOTEL brand at bottom center */}
        <div className="flex flex-col items-center pb-8">
          <div
            className="h-px w-full mb-7"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), rgba(77,166,255,0.15), rgba(201,168,76,0.25), transparent)",
            }}
          />

          <h2
            className="footer-brand-text text-[11px] font-light tracking-[12px] uppercase mb-4 select-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            EDU HOTEL
          </h2>

          {/* Bottom bar */}
          <p className="text-[11px] text-white/30 font-medium tracking-wider text-center">
            &copy; {currentYear} &nbsp; {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
