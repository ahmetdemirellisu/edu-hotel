import React from "react";
import { CreditCard } from "lucide-react";

/**
 * CardNumberInput — formatted card-number input with live brand detection.
 *
 * Detects Visa, Mastercard, American Express, and Discover from the leading
 * digits as the user types, then shows a small inline brand badge on the right
 * side of the input. Formats the number with spaces (4-4-4-4 for most brands,
 * 4-6-5 for Amex) and caps length per brand.
 *
 * Caller manages the raw value (digits + spaces) via `value` / `onChange`.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

interface CardNumberInputProps {
  value: string;
  onChange: (next: string) => void;
  onBrandChange?: (brand: CardBrand) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  id?: string;
}

/** Detect the brand from the leading digits using standard BIN rules. */
export function detectCardBrand(rawDigits: string): CardBrand {
  const d = rawDigits.replace(/\D/g, "");
  if (!d) return "unknown";

  // Visa: starts with 4
  if (d.startsWith("4")) return "visa";

  // Amex: 34 or 37
  if (/^3[47]/.test(d)) return "amex";

  // Discover: 6011, 65, 644-649
  if (/^(6011|65|64[4-9])/.test(d)) return "discover";

  // Mastercard: 51-55 (legacy) or 2221-2720 (2017+)
  if (/^5[1-5]/.test(d)) return "mastercard";
  if (d.length >= 4) {
    const n = parseInt(d.slice(0, 4), 10);
    if (n >= 2221 && n <= 2720) return "mastercard";
  } else if (d.length >= 2 && (d.startsWith("22") || d.startsWith("23") || d.startsWith("24") || d.startsWith("25") || d.startsWith("26") || d.startsWith("27"))) {
    // Optimistic match while user is still typing
    return "mastercard";
  }

  return "unknown";
}

/** Brand-specific maximum digit count (excluding spaces). */
function maxDigits(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

/** Format raw digits into groups based on brand. 4-6-5 for Amex, 4-4-4-4 otherwise. */
function formatDigits(digits: string, brand: CardBrand): string {
  if (brand === "amex") {
    // 4-6-5
    return [
      digits.slice(0, 4),
      digits.slice(4, 10),
      digits.slice(10, 15),
    ]
      .filter(Boolean)
      .join(" ");
  }
  // 4-4-4-4
  return [
    digits.slice(0, 4),
    digits.slice(4, 8),
    digits.slice(8, 12),
    digits.slice(12, 16),
  ]
    .filter(Boolean)
    .join(" ");
}

export function CardNumberInput({
  value,
  onChange,
  onBrandChange,
  placeholder = "1234 5678 9012 3456",
  className = "",
  inputClassName,
  disabled = false,
  id,
}: CardNumberInputProps) {
  const rawDigits = (value || "").replace(/\D/g, "");
  const brand = detectCardBrand(rawDigits);

  // Notify the parent of the detected brand (e.g. for analytics or a 3DS step).
  React.useEffect(() => {
    onBrandChange?.(brand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = e.target.value.replace(/\D/g, "");
    const detected = detectCardBrand(incoming);
    const trimmed = incoming.slice(0, maxDigits(detected));
    onChange(formatDigits(trimmed, detected));
  };

  const baseInputCls =
    inputClassName ??
    "w-full h-11 pl-11 pr-24 rounded-xl border border-gray-200 text-sm font-mono tracking-wider bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all";

  return (
    <div className={`relative ${className}`}>
      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={baseInputCls}
        maxLength={19}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <CardBrandBadge brand={brand} />
      </div>
    </div>
  );
}

/** Visual badge that shows the detected brand (or a neutral placeholder). */
export function CardBrandBadge({ brand }: { brand: CardBrand }) {
  if (brand === "visa") return <VisaBadge />;
  if (brand === "mastercard") return <MastercardBadge />;
  if (brand === "amex") return <AmexBadge />;
  if (brand === "discover") return <DiscoverBadge />;
  return <UnknownBadge />;
}

/* ─────────────────── brand SVGs (compact inline) ─────────────────── */

function badgeWrap(children: React.ReactNode, extra?: React.CSSProperties) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 32,
        borderRadius: 6,
        background: "#FFFFFF",
        boxShadow: "0 1px 2px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.06)",
        ...extra,
      }}
    >
      {children}
    </span>
  );
}

function VisaBadge() {
  return badgeWrap(
    <svg width="42" height="14" viewBox="0 0 42 14" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="12"
        fontFamily="Verdana, Geneva, sans-serif"
        fontSize="14"
        fontWeight="900"
        fill="#1A1F71"
        fontStyle="italic"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardBadge() {
  return badgeWrap(
    <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="12" r="11" fill="#EB001B" />
      <circle cx="25" cy="12" r="11" fill="#F79E1B" />
      {/* Overlap blends to orange */}
      <path
        d="M 19 3 a 11 11 0 0 0 0 18 a 11 11 0 0 0 0 -18 Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexBadge() {
  return badgeWrap(
    <svg width="40" height="24" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="40" height="24" rx="3" fill="#1F72CD" />
      <text
        x="20"
        y="11"
        textAnchor="middle"
        fontFamily="Verdana, Geneva, sans-serif"
        fontSize="6.4"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.4"
      >
        AMERICAN
      </text>
      <text
        x="20"
        y="20"
        textAnchor="middle"
        fontFamily="Verdana, Geneva, sans-serif"
        fontSize="6.4"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.4"
      >
        EXPRESS
      </text>
    </svg>
  );
}

function DiscoverBadge() {
  return badgeWrap(
    <svg width="44" height="14" viewBox="0 0 44 14" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="12"
        fontFamily="Verdana, Geneva, sans-serif"
        fontSize="11"
        fontWeight="800"
        fill="#231F20"
      >
        DISC
      </text>
      <circle cx="35" cy="7" r="6" fill="#FF6000" />
    </svg>
  );
}

function UnknownBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 32,
        borderRadius: 6,
        background: "rgba(0,0,0,0.04)",
        color: "#94A3B8",
      }}
      title="Card brand"
      aria-label="Unknown card brand"
    >
      <CreditCard className="h-4 w-4" />
    </span>
  );
}
