// Shared CSS for the auth pages (Login + Signup).
//
// Design system: editorial split layout.
//   • Full-viewport campus photo as the base background — visible behind
//     the hero side, fully covered by the panel side.
//   • A solid ivory panel takes ~44% on desktop (left for Login, right for
//     Signup); the remaining ~56% is the campus hero with a navy tint, a
//     soft fade into the panel, the Sabancı badge, and a large EDU HOTEL
//     wordmark vertically centered.
//   • No floating-modal feel: the panel is full-height, edge-to-edge,
//     with only a subtle gold-rim border on its inner edge.
//   • On mobile (≤860px) the hero collapses and the panel becomes a
//     centered card on top of the dimmed campus photo.

export const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.auth {
  --navy: #0E2A4E;
  --navy-deep: #081B33;
  --navy-mid: #16385F;
  --ink: #1C2733;
  --ink-soft: #5A6675;
  --gold: #D4AF37;
  --gold-light: #F0D77B;
  --gold-deep: #A8862A;
  --ivory: #FAF7F0;
  --ivory-soft: #FFFCF5;
  --line: rgba(14, 42, 78, 0.16);
  --line-strong: rgba(14, 42, 78, 0.30);
  --error: #B23A48;
  --error-bg: rgba(178, 58, 72, 0.07);

  position: relative;
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* ============ full-screen campus background ============ */
.auth__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  animation: auth-kenburns 60s ease-in-out infinite alternate;
}

/* ============ editorial split (panel + hero) ============ */
.auth__split {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 44% 56%;
}
.auth__split--reverse { grid-template-columns: 56% 44%; }

/* ============ ivory auth panel ============ */
.auth__panel {
  grid-column: 1;
  position: relative;
  z-index: 2;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--ivory-soft) 0%, var(--ivory) 100%);
  border-right: 1px solid rgba(212, 175, 55, 0.22);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.4) inset;
  display: flex;
  align-items: stretch;
  overflow-y: auto;
}
.auth__split--reverse .auth__panel {
  grid-column: 2;
  border-right: 0;
  border-left: 1px solid rgba(212, 175, 55, 0.22);
  box-shadow: -1px 0 0 rgba(255, 255, 255, 0.4) inset;
}

.auth__panel-inner {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  padding: 36px 36px 28px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
  animation: auth-panel-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.auth__panel-inner[data-shake="true"] { animation: auth-shake 0.45s ease both; }

/* Top row: monogram + language switch on the same line */
.auth__panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.auth__monogram {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(150deg, var(--navy-mid) 0%, var(--navy-deep) 100%);
  color: var(--gold-light);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  display: grid; place-items: center;
  box-shadow: 0 6px 14px rgba(8, 27, 51, 0.22);
  text-decoration: none;
  letter-spacing: -0.01em;
}
.auth__lang {
  display: flex; gap: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px;
}
.auth__lang button {
  border: 0; background: transparent;
  font: 600 11px 'Inter', sans-serif;
  letter-spacing: 0.08em;
  padding: 5px 12px;
  border-radius: 999px;
  color: var(--navy);
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
}
.auth__lang button.is-active { background: var(--navy); color: var(--ivory); }

/* Form area — vertically centered inside the panel */
.auth__form-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 0 16px;
}

.auth__eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: var(--gold-deep);
  margin: 0 0 10px;
}
.auth__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 600;
  font-size: clamp(26px, 2.3vw, 32px);
  line-height: 1.14;
  margin: 0 0 8px;
  color: var(--navy-deep);
  letter-spacing: -0.01em;
}
.auth__sub {
  margin: 0 0 18px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.55;
}
.auth__rule {
  height: 2px;
  width: 56px;
  background: linear-gradient(90deg, var(--gold), rgba(212, 175, 55, 0));
  margin-bottom: 22px;
  border-radius: 1px;
}

/* ============ inputs ============ */
.field {
  display: block;
  margin-bottom: 18px;
  position: relative;
}
.field--tight { margin-bottom: 14px; }

.field__label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--navy);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1.5px solid var(--line-strong);
  padding: 10px 2px;
  font: 500 15.5px 'Inter', sans-serif;
  color: var(--ink);
  outline: none;
  border-radius: 0;
  transition: border-color 0.25s;
  box-sizing: border-box;
}
.field input::placeholder {
  color: #8995A6;
  font-weight: 400;
}
.field::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, var(--navy), var(--gold));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.field:focus-within::after { transform: scaleX(1); }
.field:focus-within .field__label { color: var(--gold-deep); }

.field__helper {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: var(--ink-soft);
  line-height: 1.4;
}

.field__link {
  border: 0;
  background: none;
  padding: 0;
  font: 600 11px 'Inter', sans-serif;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--gold-deep);
  cursor: pointer;
  text-decoration: none;
}
.field__link:hover { color: var(--navy); }

.field__pw { position: relative; }
.field__pw input { padding-right: 42px; }
.field__eye {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: none;
  cursor: pointer;
  color: #8995A6;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
  padding: 0;
}
.field__eye:hover { color: var(--navy); background: rgba(14, 42, 78, 0.05); }

.field--error input { border-bottom-color: var(--error) !important; }
.field--error::after { background: var(--error); }

/* ============ error banner ============ */
.auth__error {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--error-bg);
  border-left: 3px solid var(--error);
  color: var(--error);
  font-size: 12.5px;
  line-height: 1.45;
  padding: 10px 13px;
  margin: -2px 0 14px;
  border-radius: 0 8px 8px 0;
}
.auth__error-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--error);
  flex: none;
}

/* ============ primary button ============ */
.auth__btn {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 52px;
  border: 0;
  cursor: pointer;
  background: linear-gradient(150deg, var(--navy-mid) 0%, var(--navy-deep) 100%);
  color: var(--ivory);
  font: 600 13px 'Inter', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 13px;
  box-shadow:
    0 12px 24px rgba(8, 27, 51, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.18s, box-shadow 0.2s, opacity 0.2s;
  margin-top: 2px;
}
.auth__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 16px 32px rgba(8, 27, 51, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
.auth__btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 6px 14px rgba(8, 27, 51, 0.3);
}
.auth__btn:disabled { opacity: 0.55; cursor: not-allowed; }
.auth__btn::after {
  content: '';
  position: absolute;
  top: 0; left: -80%;
  width: 45%; height: 100%;
  background: linear-gradient(105deg,
    transparent,
    rgba(240, 215, 123, 0.30),
    transparent);
  transform: skewX(-20deg);
}
.auth__btn:hover:not(:disabled)::after { animation: auth-sheen 0.95s ease; }

.auth__btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.auth__spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--ivory);
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

/* ============ alt link row + panel footer ============ */
.auth__alt {
  text-align: center;
  font-size: 13px;
  color: var(--ink-soft);
  margin: 16px 0 0;
}
.auth__alt a, .auth__alt button {
  border: 0;
  background: none;
  padding: 0;
  font: 600 13px 'Inter', sans-serif;
  color: var(--gold-deep);
  cursor: pointer;
  text-decoration: none;
}
.auth__alt a:hover, .auth__alt button:hover {
  color: var(--navy);
  text-decoration: underline;
}

.auth__panel-foot {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  flex-shrink: 0;
}
.auth__protected {
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-soft);
  letter-spacing: 0.04em;
  margin: 0;
  text-align: center;
}
.auth__copyright {
  font-size: 10.5px;
  color: #8995A6;
  letter-spacing: 0.04em;
  margin: 0;
  text-align: center;
}

/* ============ hero side (image visible + branding) ============ */
.auth__hero {
  grid-column: 2;
  position: relative;
  min-height: 100vh;
  display: flex;
  overflow: hidden;
}
.auth__split--reverse .auth__hero { grid-column: 1; }

.auth__hero-tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(135deg,
      rgba(8, 27, 51, 0.55) 0%,
      rgba(14, 42, 78, 0.35) 50%,
      rgba(8, 27, 51, 0.65) 100%);
}
/* Smooth fade from the panel side into the photo */
.auth__hero-fade {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to right,
    rgba(250, 247, 240, 0.45) 0%,
    rgba(250, 247, 240, 0.15) 8%,
    transparent 22%);
  pointer-events: none;
}
.auth__split--reverse .auth__hero-fade {
  background: linear-gradient(to left,
    rgba(250, 247, 240, 0.45) 0%,
    rgba(250, 247, 240, 0.15) 8%,
    transparent 22%);
}

/* Position only — visual style lives on the SabanciLogo component itself */
.auth__hero-badge {
  position: absolute;
  top: 32px; right: 40px;
  z-index: 4;
}
.auth__split--reverse .auth__hero-badge { right: auto; left: 40px; }

.auth__hero-center {
  position: relative;
  z-index: 3;
  margin: auto;
  text-align: center;
  padding: 40px;
  max-width: 560px;
}
.auth__hero-eyebrow {
  color: var(--gold-light);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  margin: 0 0 18px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}
.auth__hero-wordmark {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: clamp(48px, 5.5vw, 84px);
  letter-spacing: 0.10em;
  color: #F3E3AE;
  margin: 0;
  text-shadow: 0 4px 28px rgba(0, 0, 0, 0.5);
  line-height: 1.05;
}
.auth__hero-rule {
  width: 96px; height: 1px;
  margin: 24px auto;
  background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
}
.auth__hero-tagline {
  color: rgba(250, 247, 240, 0.85);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.65;
  margin: 0;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.auth__hero-footer {
  position: absolute;
  bottom: 24px; left: 0; right: 0;
  z-index: 3;
  text-align: center;
  color: rgba(240, 215, 123, 0.65);
  font-size: 11px;
  letter-spacing: 0.12em;
  margin: 0;
}

/* ============ animations ============ */
@keyframes auth-kenburns {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.07) translate(-1.5%, -1.2%); }
}
@keyframes auth-panel-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes auth-sheen { to { left: 130%; } }
@keyframes auth-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  45% { transform: translateX(6px); }
  70% { transform: translateX(-4px); }
  90% { transform: translateX(2px); }
}
@keyframes auth-spin { to { transform: rotate(360deg); } }

/* ============ tablet ≤1180px: shift the split a little wider for the panel ============ */
@media (max-width: 1180px) {
  .auth__split { grid-template-columns: 50% 50%; }
  .auth__split--reverse { grid-template-columns: 50% 50%; }
  .auth__hero-wordmark { font-size: clamp(40px, 6vw, 64px); }
  .auth__hero-tagline { font-size: 14px; }
  .auth__panel-inner { padding: 32px 28px 24px; }
}

/* ============ mobile ≤860px: collapse hero, panel becomes a centered card ============ */
@media (max-width: 860px) {
  .auth { display: block; }
  .auth__split, .auth__split--reverse { display: block; min-height: 100vh; }
  .auth__hero { display: none; }
  .auth__bg {
    position: fixed;
  }
  .auth__bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(8, 27, 51, 0.78) 0%,
      rgba(14, 42, 78, 0.65) 50%,
      rgba(8, 27, 51, 0.85) 100%);
  }

  .auth__panel {
    background: transparent;
    border: 0;
    box-shadow: none;
    min-height: 100vh;
    padding: 24px 16px 32px;
    align-items: flex-start;
    justify-content: center;
    overflow: visible;
  }
  .auth__panel-inner {
    width: calc(100% - 0px);
    max-width: 440px;
    margin: auto;
    padding: 28px 24px 24px;
    background: linear-gradient(180deg, var(--ivory-soft) 0%, var(--ivory) 100%);
    border-radius: 22px;
    box-shadow:
      0 24px 50px rgba(0, 0, 0, 0.42),
      0 0 0 1px rgba(212, 175, 55, 0.18);
    min-height: 0;
  }

  .auth__title { font-size: clamp(24px, 7vw, 28px); }
  .auth__sub { font-size: 13.5px; }
  .auth__btn { height: 50px; font-size: 12.5px; }
}
`;

export const REGISTER_CSS = `
/* ============ KVKK consent — cleaner, smaller, clearly clickable ============ */
.reg__consent {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 10px;
  margin: 2px 0 16px;
  transition: background 0.2s, border-color 0.2s;
}
.reg__consent:hover { background: rgba(212, 175, 55, 0.08); }
.reg__consent--error {
  background: rgba(178, 58, 72, 0.05);
  border-color: rgba(178, 58, 72, 0.4);
}

.reg__check {
  flex: none;
  width: 22px; height: 22px;
  border-radius: 6px;
  border: 1.5px solid rgba(168, 134, 42, 0.55);
  background: #FFFCF5;
  color: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  margin-top: 1px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border-color 0.18s;
  padding: 0;
}
.reg__check:hover { box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.16); }
.reg__check.is-checked {
  background: linear-gradient(150deg, var(--gold-light) 0%, var(--gold) 100%);
  color: var(--navy-deep);
  border-color: var(--gold);
}

.reg__consent-text {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ink-soft);
  flex: 1;
}

.reg__consent-more {
  border: 0; background: none; padding: 0;
  margin-left: 4px;
  font: 600 12.5px 'Inter', sans-serif;
  color: var(--gold-deep);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(168, 134, 42, 0.5);
  text-underline-offset: 3px;
}
.reg__consent-more:hover {
  color: var(--navy);
  text-decoration-color: var(--navy);
}

.reg__consent-details {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-left: 2px solid var(--gold);
  background: rgba(212, 175, 55, 0.05);
  border-radius: 0 8px 8px 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--ink-soft);
}
`;
