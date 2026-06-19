import React, { useState, useEffect } from "react";

/**
 * EduConcierge — animated bellhop mascot for the EDU Hotel dashboard.
 *
 * Sabancı palette: deep navy + gold. Idle animations: gentle float, blinking,
 * a welcoming wave. Click the golden bell on his tray for a "ding" with ring
 * ripples. Respects prefers-reduced-motion.
 *
 * Renders the figure to fill its parent container (DashboardHero already
 * provides a speech bubble of its own, so `showBubble` defaults to false).
 */

interface EduConciergeProps {
  className?: string;
  pendingCount?: number;
  message?: string;
  onBubbleClick?: () => void;
  /** Render the built-in speech bubble. Off by default — DashboardHero supplies its own. */
  showBubble?: boolean;
}

const NAVY = "#0E2A4E";
const NAVY_DARK = "#081B33";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0D77B";
const GOLD_DEEP = "#A8862A";
const SKIN = "#F2C9A1";
const SKIN_SHADE = "#E0B286";
const HAIR = "#3A2A1E";
const WHITE = "#FFF8EC";

export function EduConcierge({
  className,
  pendingCount = 6,
  message,
  onBubbleClick,
  showBubble = false,
}: EduConciergeProps) {
  const [ding, setDing] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);

  useEffect(() => {
    if (!showBubble) return;
    const t = setTimeout(() => setBubbleVisible(true), 900);
    return () => clearTimeout(t);
  }, [showBubble]);

  const bubbleText =
    message ??
    `You have ${pendingCount} pending approval${pendingCount === 1 ? "" : "s"} today. Click me for quick actions!`;

  return (
    <div className={`edu-concierge ${className ?? ""}`}>
      <style>{`
        .edu-concierge {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, 'Times New Roman', serif;
          user-select: none;
        }
        .edu-concierge__stage {
          width: auto;
          height: 100%;
          max-width: 100%;
          animation: edu-float 4.5s ease-in-out infinite;
          transform-origin: 50% 100%;
          /* Soft gold rim so the navy uniform reads on the dark hero background. */
          filter: drop-shadow(0 18px 28px rgba(8, 27, 51, 0.55))
                  drop-shadow(0 0 22px rgba(212, 175, 55, 0.18));
        }
        .edu-concierge__bubble {
          position: absolute;
          top: 8px;
          left: 4%;
          max-width: 215px;
          background: ${WHITE};
          color: ${NAVY};
          border: 1px solid rgba(212, 175, 55, 0.55);
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13.5px;
          line-height: 1.45;
          box-shadow: 0 10px 28px rgba(8, 27, 51, 0.35);
          opacity: 0;
          transform: translateY(8px) scale(0.96);
          transition: opacity 0.5s ease, transform 0.5s ease;
          cursor: pointer;
          z-index: 2;
        }
        .edu-concierge__bubble.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .edu-concierge__bubble::after {
          content: "";
          position: absolute;
          bottom: -8px;
          right: 36px;
          width: 16px;
          height: 16px;
          background: ${WHITE};
          border-right: 1px solid rgba(212, 175, 55, 0.55);
          border-bottom: 1px solid rgba(212, 175, 55, 0.55);
          transform: rotate(45deg);
        }
        .edu-concierge__bubble strong { color: ${GOLD_DEEP}; }

        /* ---- part animations ---- */
        .edu-concierge .anim {
          transform-box: fill-box;
          transform-origin: center;
        }
        .edu-concierge .eyes {
          animation: edu-blink 4.2s ease-in-out infinite;
          transform-origin: center;
        }
        .edu-concierge .wave-arm {
          transform-origin: 18% 85%;
          animation: edu-wave 2.6s ease-in-out infinite;
        }
        .edu-concierge .brow-l, .edu-concierge .brow-r {
          animation: edu-brows 4.2s ease-in-out infinite;
        }
        .edu-concierge .bell-group { cursor: pointer; }
        .edu-concierge .bell-group:hover .bell-body { filter: brightness(1.12); }
        .edu-concierge .bell-ding {
          transform-origin: 50% 90%;
          animation: edu-bell-rock 0.55s ease-in-out;
        }
        .edu-concierge .ring {
          transform-origin: center;
          animation: edu-ring 0.8s ease-out forwards;
          opacity: 0;
        }
        .edu-concierge .ring:nth-of-type(2) { animation-delay: 0.12s; }
        .edu-concierge .ring:nth-of-type(3) { animation-delay: 0.24s; }
        .edu-concierge .glow {
          animation: edu-glow 5s ease-in-out infinite;
        }

        @keyframes edu-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-9px); }
        }
        @keyframes edu-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%           { transform: scaleY(0.08); }
        }
        @keyframes edu-brows {
          0%, 92%, 100% { transform: translateY(0); }
          95%           { transform: translateY(1.5px); }
        }
        @keyframes edu-wave {
          0%, 100% { transform: rotate(-4deg); }
          50%      { transform: rotate(14deg); }
        }
        @keyframes edu-bell-rock {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-14deg); }
          55%  { transform: rotate(11deg); }
          80%  { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes edu-ring {
          0%   { opacity: 0.9; transform: scale(0.4); }
          100% { opacity: 0;   transform: scale(2.1); }
        }
        @keyframes edu-glow {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .edu-concierge__stage, .edu-concierge .eyes, .edu-concierge .wave-arm,
          .edu-concierge .brow-l, .edu-concierge .brow-r, .edu-concierge .glow,
          .edu-concierge .bell-ding, .edu-concierge .ring {
            animation: none !important;
          }
        }
      `}</style>

      {showBubble && (
        <div
          className={`edu-concierge__bubble${bubbleVisible ? " is-visible" : ""}`}
          onClick={onBubbleClick}
          role="button"
        >
          {bubbleText}
        </div>
      )}

      <svg
        className="edu-concierge__stage"
        viewBox="0 0 360 460"
        role="img"
        aria-label="EDU Hotel concierge"
      >
        <defs>
          <radialGradient id="edu-halo" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.42" />
            <stop offset="60%" stopColor={GOLD} stopOpacity="0.16" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edu-jacket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16385F" />
            <stop offset="100%" stopColor={NAVY_DARK} />
          </linearGradient>
          <linearGradient id="edu-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD_LIGHT} />
            <stop offset="55%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DEEP} />
          </linearGradient>
        </defs>

        {/* halo */}
        <ellipse className="glow" cx="180" cy="225" rx="158" ry="180" fill="url(#edu-halo)" />

        {/* ===== waving arm (behind body, viewer right) ===== */}
        <g className="wave-arm">
          <path
            d="M 232 230 Q 268 212 284 176 L 300 188 Q 282 232 244 252 Z"
            fill="url(#edu-jacket)"
            stroke={NAVY_DARK}
            strokeWidth="2"
          />
          {/* gold cuff */}
          <path d="M 280 182 L 302 198 L 296 212 L 274 196 Z" fill="url(#edu-gold)" />
          {/* white glove, open hand */}
          <g>
            <ellipse cx="296" cy="168" rx="15" ry="17" fill={WHITE} />
            <path
              d="M 286 154 q -2 -10 4 -11 q 5 -1 5 9 M 295 151 q 0 -11 6 -11 q 6 0 4 12 M 304 154 q 3 -9 8 -7 q 5 2 0 12"
              fill="none"
              stroke={WHITE}
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* ===== body / jacket ===== */}
        <path
          d="M 180 198
             C 138 198 116 216 110 246
             C 102 290 100 350 102 412
             Q 180 432 258 412
             C 260 350 258 290 250 246
             C 244 216 222 198 180 198 Z"
          fill="url(#edu-jacket)"
          stroke={NAVY_DARK}
          strokeWidth="2"
        />
        {/* center gold piping */}
        <rect x="176" y="216" width="8" height="200" rx="4" fill="url(#edu-gold)" opacity="0.95" />
        {/* double-breasted buttons */}
        {[248, 286, 324, 362].map((y) => (
          <g key={y}>
            <circle cx="150" cy={y} r="6" fill="url(#edu-gold)" stroke={GOLD_DEEP} strokeWidth="1" />
            <circle cx="210" cy={y} r="6" fill="url(#edu-gold)" stroke={GOLD_DEEP} strokeWidth="1" />
          </g>
        ))}
        {/* epaulettes */}
        <rect x="112" y="204" width="46" height="14" rx="7" fill="url(#edu-gold)" />
        <rect x="202" y="204" width="46" height="14" rx="7" fill="url(#edu-gold)" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} stroke={GOLD_DEEP} strokeWidth="2" strokeLinecap="round">
            <line x1={118 + i * 11} y1="218" x2={118 + i * 11} y2="227" />
            <line x1={208 + i * 11} y1="218" x2={208 + i * 11} y2="227" />
          </g>
        ))}

        {/* collar + bow tie */}
        <path d="M 160 200 L 180 222 L 200 200 L 192 194 L 180 206 L 168 194 Z" fill={WHITE} />
        <g>
          <path d="M 180 212 l -17 -8 q -5 14 0 18 Z" fill="url(#edu-gold)" />
          <path d="M 180 212 l 17 -8 q 5 14 0 18 Z" fill="url(#edu-gold)" />
          <circle cx="180" cy="213" r="4.5" fill={GOLD_DEEP} />
        </g>

        {/* ===== tray arm (viewer left) ===== */}
        <path
          d="M 126 232 Q 104 252 100 280 L 86 300 L 78 286 Q 84 248 112 224 Z"
          fill="url(#edu-jacket)"
          stroke={NAVY_DARK}
          strokeWidth="2"
        />
        <path d="M 74 282 L 96 296 L 90 310 L 68 296 Z" fill="url(#edu-gold)" />
        {/* glove holding tray */}
        <ellipse cx="76" cy="312" rx="14" ry="13" fill={WHITE} />

        {/* ===== bell on tray (clickable) ===== */}
        <g
          className="bell-group"
          onClick={(e) => {
            // Don't let the bell click bubble up to the parent (which opens the drawer).
            e.stopPropagation();
            setDing((d) => d + 1);
          }}
          aria-label="Ring the service bell"
        >
          {/* tray */}
          <ellipse cx="76" cy="304" rx="42" ry="10" fill="url(#edu-gold)" stroke={GOLD_DEEP} strokeWidth="1.5" />
          <ellipse cx="76" cy="300" rx="42" ry="10" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.5" />
          {/* bell (re-mounts on each ding to restart animation) */}
          <g key={ding} className={ding ? "bell-ding" : ""}>
            <path
              d="M 50 296 Q 50 266 76 266 Q 102 266 102 296 Z"
              className="bell-body"
              fill="url(#edu-gold)"
              stroke={GOLD_DEEP}
              strokeWidth="1.5"
            />
            <circle cx="76" cy="262" r="5" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.5" />
            <path
              d="M 58 288 Q 60 274 72 271"
              fill="none"
              stroke={GOLD_LIGHT}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
          {/* ring ripples */}
          {ding > 0 && (
            <g key={`r${ding}`} fill="none" stroke={GOLD_LIGHT} strokeWidth="2.5">
              <circle className="ring" cx="76" cy="282" r="26" />
              <circle className="ring" cx="76" cy="282" r="26" />
              <circle className="ring" cx="76" cy="282" r="26" />
            </g>
          )}
        </g>

        {/* ===== head ===== */}
        <rect x="166" y="172" width="28" height="26" rx="10" fill={SKIN_SHADE} />
        <ellipse cx="180" cy="136" rx="52" ry="49" fill={SKIN} />
        {/* ears */}
        <circle cx="127" cy="140" r="9" fill={SKIN} />
        <circle cx="233" cy="140" r="9" fill={SKIN} />
        {/* sideburns */}
        <path d="M 132 116 q -4 16 2 28 q 6 -2 7 -8 q -6 -8 -9 -20 Z" fill={HAIR} />
        <path d="M 228 116 q 4 16 -2 28 q -6 -2 -7 -8 q 6 -8 9 -20 Z" fill={HAIR} />

        {/* eyebrows */}
        <path
          className="brow-l anim"
          d="M 148 118 q 12 -7 24 -1"
          fill="none"
          stroke={HAIR}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          className="brow-r anim"
          d="M 188 117 q 12 -6 24 1"
          fill="none"
          stroke={HAIR}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* eyes */}
        <g className="eyes">
          <ellipse cx="160" cy="134" rx="8.5" ry="9.5" fill="#FFFFFF" />
          <ellipse cx="200" cy="134" rx="8.5" ry="9.5" fill="#FFFFFF" />
          <circle cx="161.5" cy="135" r="4.4" fill={NAVY_DARK} />
          <circle cx="201.5" cy="135" r="4.4" fill={NAVY_DARK} />
          <circle cx="163" cy="133" r="1.5" fill="#FFFFFF" />
          <circle cx="203" cy="133" r="1.5" fill="#FFFFFF" />
        </g>

        {/* nose */}
        <path
          d="M 180 138 q 5 8 0 13 q -4 2 -7 -1"
          fill="none"
          stroke={SKIN_SHADE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* mustache — the concierge signature */}
        <path
          d="M 180 158
             q -10 -7 -22 -2 q -8 3 -12 -2 q 2 9 12 9 q 13 1 22 -5 Z"
          fill={HAIR}
        />
        <path
          d="M 180 158
             q 10 -7 22 -2 q 8 3 12 -2 q -2 9 -12 9 q -13 1 -22 -5 Z"
          fill={HAIR}
        />

        {/* smile + cheeks */}
        <path d="M 166 168 q 14 11 28 0" fill="none" stroke="#B5694A" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="143" cy="152" r="7" fill="#E89B7D" opacity="0.35" />
        <circle cx="217" cy="152" r="7" fill="#E89B7D" opacity="0.35" />

        {/* ===== pillbox cap ===== */}
        <g>
          <path d="M 128 96 Q 128 58 180 58 Q 232 58 232 96 Z" fill={NAVY} stroke={NAVY_DARK} strokeWidth="2" />
          {/* gold band with EDU HOTEL */}
          <rect
            x="126"
            y="88"
            width="108"
            height="20"
            rx="6"
            fill="url(#edu-gold)"
            stroke={GOLD_DEEP}
            strokeWidth="1.5"
          />
          <text
            x="180"
            y="102.5"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontWeight="bold"
            fontSize="11.5"
            letterSpacing="2.5"
            fill={NAVY_DARK}
          >
            EDU HOTEL
          </text>
          {/* cap button + piping */}
          <circle cx="180" cy="60" r="4.5" fill="url(#edu-gold)" />
          <path d="M 136 76 Q 180 64 224 76" fill="none" stroke={GOLD} strokeWidth="2" opacity="0.7" />
        </g>

        {/* small star — Sabancı touch */}
        <path
          d="M 256 84 l 3.2 6.6 7.2 1 -5.2 5.1 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5.1 7.2 -1 Z"
          fill={GOLD}
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
