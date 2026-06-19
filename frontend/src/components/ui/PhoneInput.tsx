import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

/**
 * PhoneInput — country selector + national-number input.
 *
 * Value is stored as a single string in international format
 *   "+90 5551234567"
 * The component handles parsing / formatting / persistence; the caller just
 * needs to keep a string state and pass `value` / `onChange`.
 *
 * Country list covers the ~70 countries most relevant to a Sabancı-University
 * hotel (TR + EU + GCC + neighbouring + major source countries for students).
 * The list is inline so there's no JSON fetch on first render.
 */

export interface Country {
  /** ISO 3166-1 alpha-2 code, used to derive the flag */
  code: string;
  /** Display name */
  name: string;
  /** International dial code, including the leading "+" */
  dial: string;
}

export const COUNTRIES: Country[] = [
  { code: "TR", name: "Türkiye",          dial: "+90"  },
  { code: "US", name: "United States",    dial: "+1"   },
  { code: "GB", name: "United Kingdom",   dial: "+44"  },
  { code: "DE", name: "Germany",          dial: "+49"  },
  { code: "FR", name: "France",           dial: "+33"  },
  { code: "ES", name: "Spain",            dial: "+34"  },
  { code: "IT", name: "Italy",            dial: "+39"  },
  { code: "NL", name: "Netherlands",      dial: "+31"  },
  { code: "BE", name: "Belgium",          dial: "+32"  },
  { code: "CH", name: "Switzerland",      dial: "+41"  },
  { code: "AT", name: "Austria",          dial: "+43"  },
  { code: "SE", name: "Sweden",           dial: "+46"  },
  { code: "NO", name: "Norway",           dial: "+47"  },
  { code: "DK", name: "Denmark",          dial: "+45"  },
  { code: "FI", name: "Finland",          dial: "+358" },
  { code: "PL", name: "Poland",           dial: "+48"  },
  { code: "GR", name: "Greece",           dial: "+30"  },
  { code: "PT", name: "Portugal",         dial: "+351" },
  { code: "IE", name: "Ireland",          dial: "+353" },
  { code: "CZ", name: "Czechia",          dial: "+420" },
  { code: "HU", name: "Hungary",          dial: "+36"  },
  { code: "RO", name: "Romania",          dial: "+40"  },
  { code: "BG", name: "Bulgaria",         dial: "+359" },
  { code: "RS", name: "Serbia",           dial: "+381" },
  { code: "HR", name: "Croatia",          dial: "+385" },
  { code: "SI", name: "Slovenia",         dial: "+386" },
  { code: "SK", name: "Slovakia",         dial: "+421" },
  { code: "LT", name: "Lithuania",        dial: "+370" },
  { code: "LV", name: "Latvia",           dial: "+371" },
  { code: "EE", name: "Estonia",          dial: "+372" },
  { code: "UA", name: "Ukraine",          dial: "+380" },
  { code: "RU", name: "Russia",           dial: "+7"   },
  { code: "AZ", name: "Azerbaijan",       dial: "+994" },
  { code: "AM", name: "Armenia",          dial: "+374" },
  { code: "GE", name: "Georgia",          dial: "+995" },
  { code: "KZ", name: "Kazakhstan",       dial: "+7"   },
  { code: "UZ", name: "Uzbekistan",       dial: "+998" },
  { code: "IL", name: "Israel",           dial: "+972" },
  { code: "IR", name: "Iran",             dial: "+98"  },
  { code: "IQ", name: "Iraq",             dial: "+964" },
  { code: "SY", name: "Syria",            dial: "+963" },
  { code: "JO", name: "Jordan",           dial: "+962" },
  { code: "LB", name: "Lebanon",          dial: "+961" },
  { code: "SA", name: "Saudi Arabia",     dial: "+966" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "QA", name: "Qatar",            dial: "+974" },
  { code: "KW", name: "Kuwait",           dial: "+965" },
  { code: "BH", name: "Bahrain",          dial: "+973" },
  { code: "OM", name: "Oman",             dial: "+968" },
  { code: "EG", name: "Egypt",            dial: "+20"  },
  { code: "MA", name: "Morocco",          dial: "+212" },
  { code: "DZ", name: "Algeria",          dial: "+213" },
  { code: "TN", name: "Tunisia",          dial: "+216" },
  { code: "ZA", name: "South Africa",     dial: "+27"  },
  { code: "AU", name: "Australia",        dial: "+61"  },
  { code: "NZ", name: "New Zealand",      dial: "+64"  },
  { code: "JP", name: "Japan",            dial: "+81"  },
  { code: "KR", name: "South Korea",      dial: "+82"  },
  { code: "CN", name: "China",            dial: "+86"  },
  { code: "IN", name: "India",            dial: "+91"  },
  { code: "PK", name: "Pakistan",         dial: "+92"  },
  { code: "BD", name: "Bangladesh",       dial: "+880" },
  { code: "VN", name: "Vietnam",          dial: "+84"  },
  { code: "TH", name: "Thailand",         dial: "+66"  },
  { code: "ID", name: "Indonesia",        dial: "+62"  },
  { code: "MY", name: "Malaysia",         dial: "+60"  },
  { code: "SG", name: "Singapore",        dial: "+65"  },
  { code: "PH", name: "Philippines",      dial: "+63"  },
  { code: "BR", name: "Brazil",           dial: "+55"  },
  { code: "AR", name: "Argentina",        dial: "+54"  },
  { code: "MX", name: "Mexico",           dial: "+52"  },
  { code: "CA", name: "Canada",           dial: "+1"   },
];

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "TR")!;

/** Convert an ISO 3166-1 alpha-2 code into its regional-indicator emoji flag. */
function flag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

/** Parse "+90 5551234567" → { country, national } */
function parseValue(value: string): { country: Country; national: string } {
  const trimmed = (value || "").trim();
  if (!trimmed) return { country: DEFAULT_COUNTRY, national: "" };
  // Find the longest matching dial prefix; longer dials (+994, +358) match before +9, +3.
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((c) => trimmed.startsWith(c.dial));
  if (match) {
    return {
      country: match,
      national: trimmed.slice(match.dial.length).replace(/^\s+/, ""),
    };
  }
  return { country: DEFAULT_COUNTRY, national: trimmed };
}

interface PhoneInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Override the input's CSS classes — useful when matching admin vs user form theme. */
  inputClassName?: string;
  /** Override the country-picker trigger button's CSS classes. */
  triggerClassName?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "555 123 4567",
  className = "",
  inputClassName,
  triggerClassName,
  disabled = false,
}: PhoneInputProps) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [country, setCountry] = useState<Country>(parsed.country);
  const [national, setNational] = useState<string>(parsed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // If the parent overwrites the value externally, sync our local state.
  useEffect(() => {
    setCountry(parsed.country);
    setNational(parsed.national);
  }, [parsed.country.code, parsed.national]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus the search box when the menu opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const emit = (nextCountry: Country, nextNational: string) => {
    const cleaned = nextNational.replace(/[^\d ]/g, "");
    onChange(`${nextCountry.dial} ${cleaned}`.trim());
  };

  const pickCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    emit(c, national);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  const baseInputCls =
    inputClassName ??
    "flex-1 h-10 px-3 rounded-r-xl border border-l-0 border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all";

  return (
    <div ref={wrapRef} className={`relative flex items-stretch ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={
          triggerClassName ??
          "flex items-center gap-2 h-10 px-3 rounded-l-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-all disabled:opacity-60"
        }
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none" aria-hidden="true">{flag(country.code)}</span>
        <span className="text-[12px] text-gray-600 tabular-nums">{country.dial}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      <input
        type="tel"
        value={national}
        disabled={disabled}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d ]/g, "");
          setNational(cleaned);
          emit(country, cleaned);
        }}
        placeholder={placeholder}
        className={baseInputCls}
        inputMode="tel"
        autoComplete="tel-national"
      />

      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1.5 w-[300px] max-w-[calc(100vw-32px)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ animation: "fadeIn 0.12s ease-out" }}
        >
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-[12px] text-gray-400 text-center">No match</li>
            ) : (
              filtered.map((c) => {
                const active = c.code === country.code && c.dial === country.dial;
                return (
                  <li key={`${c.code}-${c.dial}`}>
                    <button
                      type="button"
                      onClick={() => pickCountry(c)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                        active ? "bg-blue-50 text-blue-800" : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden="true">{flag(c.code)}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-[12px] text-gray-400 tabular-nums">{c.dial}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
