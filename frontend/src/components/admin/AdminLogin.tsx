// src/components/admin/AdminLogin.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Lock, User, AlertCircle, ChevronRight } from "lucide-react";

/* ─── Hardcoded admin credentials ─────────────────────────── */
const ADMIN_USER = "eduhotel_admin";
const ADMIN_PASS = "EduH0tel@2026";
const SESSION_KEY = "adminSession";

/* ─── Inject keyframes once ───────────────────────────────── */
const _s = document.getElementById("admin-login-styles") ?? (() => {
  const s = document.createElement("style");
  s.id = "admin-login-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    @keyframes al-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
    @keyframes al-spin    { to{transform:rotate(360deg)} }
    @keyframes al-fadein  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes al-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
    @keyframes al-pulse   { 0%,100%{opacity:.35} 50%{opacity:.7} }
    @keyframes al-scan    { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
    @keyframes al-glow    { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,.3)} 50%{box-shadow:0 0 40px rgba(59,130,246,.6)} }
    @keyframes al-orbit   { to{transform:rotate(360deg) translateX(110px) rotate(-360deg)} }
    @keyframes al-orbit2  { to{transform:rotate(-360deg) translateX(80px) rotate(360deg)} }
    @keyframes al-success { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
    .al-fadein  { animation: al-fadein .7s cubic-bezier(.22,1,.36,1) both; }
    .al-shake   { animation: al-shake .4s ease; }
  `;
  document.head.appendChild(s);
  return s;
})();

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [shake, setShake]         = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const [locked, setLocked]       = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Already logged in?
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") navigate("/admin", { replace: true });
  }, [navigate]);

  // Lockout countdown
  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setInterval(() => {
        setLockTimer(t => {
          if (t <= 1) { setLocked(false); setAttempts(0); clearInterval(timerRef.current!); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [locked, lockTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    setLoading(true);
    setError("");

    // Artificial delay for realism
    await new Promise(r => setTimeout(r, 900));

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setSuccess(true);
      sessionStorage.setItem(SESSION_KEY, "1");
      setTimeout(() => navigate("/admin", { replace: true }), 1200);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (newAttempts >= 5) {
        setLocked(true);
        setLockTimer(30);
        setError("Too many failed attempts. Locked for 30 seconds.");
      } else {
        setError(`Invalid credentials. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? "s" : ""} remaining.`);
      }
    }
    setLoading(false);
  };

  /* ── Parallax tilt ── */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -12;
    cardRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg) translateZ(0)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(135deg, #020817 0%, #0a1628 40%, #0d1f3c 70%, #091428 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Animated background orbs ── */}
      {[
        { w:500, h:500, top:"-15%", left:"-10%", c:"rgba(59,130,246,0.07)", delay:"0s",  dur:"8s"  },
        { w:400, h:400, top:"60%",  left:"70%",  c:"rgba(99,102,241,0.06)", delay:"2s",  dur:"10s" },
        { w:300, h:300, top:"30%",  left:"50%",  c:"rgba(14,165,233,0.05)", delay:"4s",  dur:"12s" },
        { w:250, h:250, top:"80%",  left:"10%",  c:"rgba(139,92,246,0.05)", delay:"1s",  dur:"9s"  },
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", width:o.w, height:o.h,
          top:o.top, left:o.left,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
          animation:`al-float ${o.dur} ${o.delay} ease-in-out infinite`,
          pointerEvents:"none",
        }} />
      ))}

      {/* ── Grid overlay ── */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
        backgroundSize:"50px 50px",
      }} />

      {/* ── Orbiting particles ── */}
      <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0 }}>
        {[
          { size:6,  color:"rgba(59,130,246,0.6)",  dur:"12s", delay:"0s"  },
          { size:4,  color:"rgba(99,102,241,0.5)",  dur:"18s", delay:"-6s" },
          { size:5,  color:"rgba(14,165,233,0.4)",  dur:"15s", delay:"-3s" },
        ].map((p, i) => (
          <div key={i} style={{
            position:"absolute",
            animation:`al-orbit${i === 1 ? "2" : ""} ${p.dur} ${p.delay} linear infinite`,
          }}>
            <div style={{
              width:p.size, height:p.size, borderRadius:"50%",
              background:p.color,
              boxShadow:`0 0 ${p.size * 3}px ${p.color}`,
            }} />
          </div>
        ))}
      </div>

      {/* ── Main card ── */}
      <div className="al-fadein" style={{ position:"relative", zIndex:10, width:"100%", maxWidth:460, padding:"0 20px" }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transition:"transform 0.15s ease", willChange:"transform" }}
        >
          {success ? (
            /* ── Success state ── */
            <div style={{
              background:"rgba(15,23,42,0.85)",
              backdropFilter:"blur(24px)",
              borderRadius:24,
              border:"1px solid rgba(34,197,94,0.3)",
              padding:"60px 48px",
              textAlign:"center",
              boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              animation:"al-success .5s cubic-bezier(.22,1,.36,1) both",
            }}>
              <div style={{
                width:72, height:72, borderRadius:"50%",
                background:"linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
                border:"2px solid rgba(34,197,94,0.5)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 20px",
                boxShadow:"0 0 30px rgba(34,197,94,0.3)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ color:"#22c55e", fontSize:18, fontWeight:600, margin:"0 0 8px" }}>Access Granted</p>
              <p style={{ color:"rgba(148,163,184,0.8)", fontSize:14 }}>Redirecting to admin panel…</p>
            </div>
          ) : (
            /* ── Login form ── */
            <div style={{
              background:"rgba(15,23,42,0.85)",
              backdropFilter:"blur(24px)",
              borderRadius:24,
              border:"1px solid rgba(59,130,246,0.15)",
              padding:"48px 48px 44px",
              boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}>

              {/* Header */}
              <div style={{ textAlign:"center", marginBottom:36 }}>
                {/* Logo mark */}
                <div style={{
                  width:64, height:64, borderRadius:18,
                  background:"linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 20px",
                  boxShadow:"0 8px 32px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                  position:"relative", overflow:"hidden",
                }}>
                  {/* scan line */}
                  <div style={{
                    position:"absolute", inset:0,
                    background:"linear-gradient(transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                    height:"30%", animation:"al-scan 3s linear infinite",
                  }} />
                  <Shield size={28} color="white" strokeWidth={1.8} />
                </div>

                <h1 style={{ margin:"0 0 6px", color:"#f1f5f9", fontSize:22, fontWeight:700, letterSpacing:"-0.3px" }}>
                  Admin Portal
                </h1>
                <p style={{ margin:0, color:"rgba(148,163,184,0.7)", fontSize:13, letterSpacing:"0.3px" }}>
                  EDU Hotel Management System
                </p>

                {/* Divider */}
                <div style={{
                  marginTop:20,
                  height:1,
                  background:"linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
                }} />
              </div>

              {/* Security badge */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                marginBottom:28,
                padding:"6px 14px",
                background:"rgba(59,130,246,0.07)",
                border:"1px solid rgba(59,130,246,0.15)",
                borderRadius:20, width:"fit-content", margin:"0 auto 28px",
              }}>
                <div style={{
                  width:6, height:6, borderRadius:"50%",
                  background:"#22c55e",
                  boxShadow:"0 0 8px rgba(34,197,94,0.8)",
                  animation:"al-pulse 2s ease-in-out infinite",
                }} />
                <span style={{ color:"rgba(148,163,184,0.8)", fontSize:11, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>
                  Secured Connection
                </span>
                <Lock size={10} color="rgba(148,163,184,0.6)" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={shake ? "al-shake" : ""}>
                {/* Username */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", color:"rgba(148,163,184,0.8)", fontSize:12, fontWeight:500, letterSpacing:"0.4px", textTransform:"uppercase", marginBottom:8 }}>
                    Username
                  </label>
                  <div style={{
                    display:"flex", alignItems:"center", gap:10,
                    background:userFocus ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                    border:`1.5px solid ${userFocus ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:12, padding:"0 14px",
                    transition:"all 0.2s ease",
                    boxShadow:userFocus ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                  }}>
                    <User size={16} color={userFocus ? "rgba(59,130,246,0.8)" : "rgba(100,116,139,0.6)"} />
                    <input
                      type="text"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError(""); }}
                      onFocus={() => setUserFocus(true)}
                      onBlur={() => setUserFocus(false)}
                      placeholder="Enter your username"
                      autoComplete="username"
                      disabled={locked || loading}
                      style={{
                        flex:1, background:"transparent", border:"none", outline:"none",
                        color:"#e2e8f0", fontSize:14, padding:"13px 0",
                        fontFamily:"'Inter', sans-serif",
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom:24 }}>
                  <label style={{ display:"block", color:"rgba(148,163,184,0.8)", fontSize:12, fontWeight:500, letterSpacing:"0.4px", textTransform:"uppercase", marginBottom:8 }}>
                    Password
                  </label>
                  <div style={{
                    display:"flex", alignItems:"center", gap:10,
                    background:passFocus ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                    border:`1.5px solid ${passFocus ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:12, padding:"0 14px",
                    transition:"all 0.2s ease",
                    boxShadow:passFocus ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                  }}>
                    <Lock size={16} color={passFocus ? "rgba(59,130,246,0.8)" : "rgba(100,116,139,0.6)"} />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      onFocus={() => setPassFocus(true)}
                      onBlur={() => setPassFocus(false)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={locked || loading}
                      style={{
                        flex:1, background:"transparent", border:"none", outline:"none",
                        color:"#e2e8f0", fontSize:14, padding:"13px 0",
                        fontFamily:"'Inter', sans-serif",
                      }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"rgba(100,116,139,0.6)", display:"flex", alignItems:"center" }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:8,
                    background:"rgba(239,68,68,0.08)",
                    border:"1px solid rgba(239,68,68,0.2)",
                    borderRadius:10, padding:"10px 14px",
                    marginBottom:20,
                    animation:"al-fadein .3s ease",
                  }}>
                    <AlertCircle size={14} color="#f87171" />
                    <span style={{ color:"#f87171", fontSize:13 }}>{error}</span>
                  </div>
                )}

                {/* Attempts indicator */}
                {attempts > 0 && !locked && (
                  <div style={{ display:"flex", gap:4, marginBottom:16, justifyContent:"center" }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{
                        width:28, height:3, borderRadius:2,
                        background:i < attempts ? "#ef4444" : "rgba(255,255,255,0.1)",
                        transition:"background .3s",
                      }} />
                    ))}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || locked || !username || !password}
                  style={{
                    width:"100%",
                    padding:"14px 24px",
                    borderRadius:12,
                    border:"none",
                    cursor:loading || locked || !username || !password ? "not-allowed" : "pointer",
                    background:loading || locked || !username || !password
                      ? "rgba(59,130,246,0.2)"
                      : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
                    color:loading || locked || !username || !password ? "rgba(148,163,184,0.5)" : "white",
                    fontSize:14, fontWeight:600, letterSpacing:"0.2px",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    transition:"all 0.25s ease",
                    boxShadow:loading || locked || !username || !password
                      ? "none"
                      : "0 4px 20px rgba(59,130,246,0.4)",
                    fontFamily:"'Inter', sans-serif",
                    animation:(!loading && !locked && username && password) ? "al-glow 3s ease-in-out infinite" : "none",
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width:16, height:16, border:"2px solid rgba(255,255,255,0.3)",
                        borderTopColor:"white", borderRadius:"50%",
                        animation:"al-spin .7s linear infinite",
                      }} />
                      Verifying…
                    </>
                  ) : locked ? (
                    <>
                      <Lock size={14} />
                      Locked — {lockTimer}s
                    </>
                  ) : (
                    <>
                      Sign in to Admin
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div style={{
                marginTop:28,
                paddingTop:20,
                borderTop:"1px solid rgba(255,255,255,0.05)",
                textAlign:"center",
              }}>
                <p style={{ margin:0, color:"rgba(100,116,139,0.5)", fontSize:11, letterSpacing:"0.3px" }}>
                  EDU Hotel © 2026 · Restricted Access · All activity is logged
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Back to site link */}
        <div style={{ textAlign:"center", marginTop:20 }}>
          <a href="./" style={{
            color:"rgba(100,116,139,0.5)", fontSize:12, textDecoration:"none",
            transition:"color .2s", letterSpacing:"0.2px",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,184,0.8)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,116,139,0.5)")}
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}
