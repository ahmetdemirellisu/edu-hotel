// src/components/admin/pages/AdminProfilePage.tsx
import { useState, useRef } from "react";
import {
  Shield, Key, Clock, Monitor, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, User, Lock, Activity,
  Globe, Cpu, Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ADMIN_PASS = "EduH0tel@2026";
const SESSION_KEY = "adminSession";

export function AdminProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  // Password change state
  const [currentPass, setCurrentPass]   = useState("");
  const [newPass, setNewPass]           = useState("");
  const [confirmPass, setConfirmPass]   = useState("");
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passMsg, setPassMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Session started at (approx page load)
  const sessionStart = useRef(new Date());
  const sessionTime  = sessionStart.current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sessionDate  = sessionStart.current.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });

  const passwordStrength = (p: string) => {
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const labels  = [
      "",
      t("profile.changePassword.strength.weak"),
      t("profile.changePassword.strength.fair"),
      t("profile.changePassword.strength.good"),
      t("profile.changePassword.strength.strong"),
      t("profile.changePassword.strength.veryStrong"),
    ];
    const colors  = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
    return { score: s, label: labels[s], color: colors[s] };
  };

  const strength = passwordStrength(newPass);

  const handleChangePassword = () => {
    setPassMsg(null);
    if (currentPass !== ADMIN_PASS) {
      setPassMsg({ type: "error", text: t("profile.changePassword.errors.wrongCurrent") });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ type: "error", text: t("profile.changePassword.errors.tooShort") });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: "error", text: t("profile.changePassword.errors.noMatch") });
      return;
    }
    if (newPass === ADMIN_PASS) {
      setPassMsg({ type: "error", text: t("profile.changePassword.errors.sameAsCurrent") });
      return;
    }
    setPassMsg({ type: "success", text: t("profile.changePassword.success") });
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate("/admin-login", { replace: true });
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color="#94a3b8" />
        </div>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{value}</span>
    </div>
  );

  const InputField = ({
    label, value, onChange, show, onToggle, type = "password", placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    show?: boolean; onToggle?: () => void; type?: string; placeholder?: string;
  }) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {label}
        </label>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: focused ? "rgba(59,130,246,0.04)" : "#f8fafc",
          border: `1.5px solid ${focused ? "rgba(59,130,246,0.4)" : "#e2e8f0"}`,
          borderRadius: 10, padding: "0 12px",
          transition: "all .2s",
          boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
        }}>
          <Lock size={14} color={focused ? "#3b82f6" : "#94a3b8"} />
          <input
            type={show !== undefined ? (show ? "text" : "password") : type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 13, color: "#0f172a", padding: "11px 0",
              fontFamily: "inherit",
            }}
          />
          {onToggle && (
            <button type="button" onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  const browser = navigator.userAgent.includes("Firefox") ? "Firefox"
    : navigator.userAgent.includes("Safari") ? "Safari"
    : "Chrome";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── Hero banner ── */}
      <div style={{
        borderRadius: 20,
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)",
        padding: "36px 40px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* bg pattern */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 200 + i * 60, height: 200 + i * 60,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            top: "50%", left: "60%",
            transform: `translate(-50%, -50%) scale(${1 + i * 0.25})`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative", zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(99,102,241,0.3))",
            border: "2px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
          }}>
            AD
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ margin: 0, color: "white", fontSize: 22, fontWeight: 700 }}>
                EDU Hotel Admin
              </h2>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 20, padding: "2px 10px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
                <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 600 }}>{t("profile.activeSession")}</span>
              </div>
            </div>
            <p style={{ margin: 0, color: "rgba(148,163,184,0.8)", fontSize: 13 }}>eduhotel_admin · {t("profile.accountInfo.roleValue")}</p>
            <p style={{ margin: "6px 0 0", color: "rgba(148,163,184,0.5)", fontSize: 12 }}>
              {t("profile.sessionStarted", { date: sessionDate, time: sessionTime })}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 12, color: "#f87171", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all .2s", fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; }}
          >
            <LogOut size={14} />
            {t("profile.signOut")}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Account Info ── */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={16} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t("profile.accountInfo.title")}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{t("profile.accountInfo.subtitle")}</p>
            </div>
          </div>
          <InfoRow icon={User}     label={t("profile.accountInfo.username")}    value="eduhotel_admin" />
          <InfoRow icon={Shield}   label={t("profile.accountInfo.role")}        value={t("profile.accountInfo.roleValue")} />
          <InfoRow icon={Globe}    label={t("profile.accountInfo.email")}       value="admin@sabanciuniv.edu" />
          <InfoRow icon={Calendar} label={t("profile.accountInfo.memberSince")} value={t("profile.accountInfo.memberSinceValue")} />
          <InfoRow icon={Activity} label={t("profile.accountInfo.status")}      value={t("profile.accountInfo.statusValue")} />
        </div>

        {/* ── Session Info ── */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Monitor size={16} color="#22c55e" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t("profile.sessionInfo.title")}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{t("profile.sessionInfo.subtitle")}</p>
            </div>
          </div>
          <InfoRow icon={Clock}    label={t("profile.sessionInfo.loginTime")}    value={sessionTime} />
          <InfoRow icon={Calendar} label={t("profile.sessionInfo.loginDate")}    value={sessionDate} />
          <InfoRow icon={Monitor}  label={t("profile.sessionInfo.browser")}      value={browser} />
          <InfoRow icon={Cpu}      label={t("profile.sessionInfo.platform")}     value={navigator.platform || "Web"} />
          <InfoRow icon={Globe}    label={t("profile.sessionInfo.sessionType")}  value={t("profile.sessionInfo.sessionTypeValue")} />
        </div>

        {/* ── Change Password ── */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #faf5ff, #ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Key size={16} color="#8b5cf6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t("profile.changePassword.title")}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{t("profile.changePassword.subtitle")}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <InputField
              label={t("profile.changePassword.currentPassword")}
              value={currentPass}
              onChange={setCurrentPass}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder={t("profile.changePassword.currentPlaceholder")}
            />
            <div>
              <InputField
                label={t("profile.changePassword.newPassword")}
                value={newPass}
                onChange={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder={t("profile.changePassword.newPlaceholder")}
              />
              {/* Strength bar */}
              {newPass && (
                <div style={{ marginTop: -8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= strength.score ? strength.color : "#e2e8f0",
                        transition: "background .3s",
                      }} />
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</p>
                </div>
              )}
            </div>
            <InputField
              label={t("profile.changePassword.confirmPassword")}
              value={confirmPass}
              onChange={setConfirmPass}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder={t("profile.changePassword.confirmPlaceholder")}
            />
          </div>

          {passMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: passMsg.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${passMsg.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
              {passMsg.type === "success"
                ? <CheckCircle2 size={14} color="#22c55e" />
                : <AlertCircle size={14} color="#ef4444" />
              }
              <span style={{ fontSize: 13, color: passMsg.type === "success" ? "#16a34a" : "#dc2626" }}>
                {passMsg.text}
              </span>
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={!currentPass || !newPass || !confirmPass}
            style={{
              padding: "11px 28px",
              borderRadius: 10, border: "none",
              background: (!currentPass || !newPass || !confirmPass) ? "#f1f5f9" : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              color: (!currentPass || !newPass || !confirmPass) ? "#94a3b8" : "white",
              fontSize: 13, fontWeight: 600,
              cursor: (!currentPass || !newPass || !confirmPass) ? "not-allowed" : "pointer",
              transition: "all .2s", fontFamily: "inherit",
              boxShadow: (!currentPass || !newPass || !confirmPass) ? "none" : "0 4px 14px rgba(139,92,246,0.35)",
            }}
          >
            {t("profile.changePassword.updateBtn")}
          </button>
        </div>

        {/* ── Security note ── */}
        <div style={{
          gridColumn: "1 / -1",
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px",
          background: "rgba(59,130,246,0.04)",
          border: "1px solid rgba(59,130,246,0.12)",
          borderRadius: 12,
        }}>
          <Shield size={16} color="#3b82f6" />
          <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            <strong style={{ color: "#475569" }}>{t("profile.securityNote.label")}</strong>{" "}
            {t("profile.securityNote.text")}
          </p>
        </div>
      </div>
    </div>
  );
}
