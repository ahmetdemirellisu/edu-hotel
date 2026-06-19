import React from "react";

/**
 * Sabancı Üniversitesi wordmark — drawn entirely from HTML/CSS, no PNG.
 *
 * Approximates the official badge: two stacked serif lines ("Sabancı" on top,
 * "Üniversitesi" below) in dark navy, framed by an ivory chip with a thin gold
 * border and a tiny red accent dot — mirroring the look of the source asset.
 *
 * The serif typeface is Playfair Display (already loaded by the auth styles)
 * with Georgia as a system fallback. This gives a very close visual match to
 * the official wordmark while keeping the component fully scalable.
 *
 * Sizes:
 *   sm  → compact (headers, footer)
 *   md  → standard (auth hero badges)
 *   lg  → prominent (landing hero corner)
 */

interface SabanciLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

type SizeKey = NonNullable<SabanciLogoProps["size"]>;

interface SizeSpec {
  line1: number;   // font-size for "Sabancı"
  line2: number;   // font-size for "Üniversitesi"
  letterSpacing: number;
  padding: string;
  radius: number;
  dot: number;     // red accent dot diameter
}

const SIZES: Record<SizeKey, SizeSpec> = {
  sm: { line1: 13, line2: 11, letterSpacing: 0.3, padding: "6px 16px", radius: 6, dot: 3 },
  md: { line1: 17, line2: 14, letterSpacing: 0.4, padding: "9px 22px", radius: 8, dot: 4 },
  lg: { line1: 23, line2: 19, letterSpacing: 0.5, padding: "13px 30px", radius: 11, dot: 5 },
};

// Colors matched to the reference: deep navy chip, cream wordmark, red accent,
// with a thin cream border that echoes the frame in the official logo.
const NAVY = "#1B3A6B";          // chip background — a touch lighter than ink navy
const NAVY_DEEP = "#0E2A4E";     // shadow / hairline accent
const CREAM = "#F4ECD8";         // wordmark color (warm off-white, not pure)
const CREAM_BORDER = "#E8DCB8";  // frame border
const RED = "#C8102E";           // signature red accent dot

export function SabanciLogo({
  size = "md",
  className = "",
  style,
}: SabanciLogoProps) {
  const s = SIZES[size];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: NAVY,
        border: `1.5px solid ${CREAM_BORDER}`,
        boxShadow:
          `0 2px 5px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(244,236,216,0.18), inset 0 -8px 16px ${NAVY_DEEP}`,
        borderRadius: s.radius,
        padding: s.padding,
        fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
        lineHeight: 1,
        ...style,
      }}
      aria-label="Sabancı Üniversitesi"
      role="img"
    >
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
        {/* Top line: "Sabancı" with a tiny red accent dot above the right edge */}
        <span
          style={{
            position: "relative",
            fontSize: s.line1,
            fontWeight: 600,
            color: CREAM,
            letterSpacing: `${s.letterSpacing}px`,
            paddingTop: s.dot + 2,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              right: `-${s.dot + 1}px`,
              width: s.dot,
              height: s.dot,
              borderRadius: "50%",
              background: RED,
              boxShadow: `0 0 4px ${RED}`,
            }}
          />
          Sabancı
        </span>

        {/* Bottom line: "Üniversitesi" */}
        <span
          style={{
            fontSize: s.line2,
            fontWeight: 500,
            color: CREAM,
            letterSpacing: `${s.letterSpacing}px`,
            marginTop: Math.max(2, Math.round(s.line1 * 0.12)),
          }}
        >
          Üniversitesi
        </span>

        {/* Cream hairline under the wordmark — echoes the badge frame in the reference */}
        <span
          style={{
            display: "block",
            width: "55%",
            height: 1,
            marginTop: Math.max(3, Math.round(s.line2 * 0.18)),
            background: `linear-gradient(90deg, transparent, ${CREAM_BORDER}, transparent)`,
            opacity: 0.55,
          }}
        />
      </span>
    </span>
  );
}

