// src/components/admin/pages/AdminUsersPage.tsx
import React, { useEffect, useState } from "react";
import { Plus, Shield, AlertCircle, Crown, UserCog, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

type AdminUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  userType: string;
};

export function AdminUsersPage() {
  const { t } = useTranslation("admin");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/ehp/api/users/search?query=&role=ADMIN,HOTEL_STAFF");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally { setLoading(false); }
    })();
  }, []);

  const getRoleConfig = (role: string) => {
    const map: Record<string, { label: string; gradient: string; pillBg: string; pillText: string; pillBorder: string; icon: typeof Crown }> = {
      ADMIN:       { label: t("adminUsers.roleSuperAdmin", "Super Admin"), gradient: "from-violet-500 to-purple-700", pillBg: "bg-violet-50", pillText: "text-violet-700", pillBorder: "border-violet-200", icon: Crown },
      HOTEL_STAFF: { label: t("adminUsers.roleHotelStaff", "Hotel Staff"), gradient: "from-blue-500 to-blue-700",   pillBg: "bg-blue-50",   pillText: "text-blue-700",   pillBorder: "border-blue-200",   icon: UserCog },
      USER:        { label: t("adminUsers.roleUser", "User"),              gradient: "from-gray-400 to-gray-600",   pillBg: "bg-gray-50",   pillText: "text-gray-600",   pillBorder: "border-gray-200",   icon: Shield },
    };
    return map[role] || map.USER;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
    catch { return iso.slice(0, 10); }
  };

  const adminCount = users.filter(u => u.role === "ADMIN").length;
  const staffCount = users.filter(u => u.role === "HOTEL_STAFF").length;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes auIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .au-card { animation: auIn 0.35s ease-out both; }
      `}</style>

      {/* ── Page Header ───────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ animation: "auIn 0.3s ease-out" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003366] to-[#0055aa] flex items-center justify-center shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#003366] tracking-tight leading-tight">
              {t("pages.adminUsers.title", "Admin Users")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("adminUsers.subtitle", "System administrators and staff accounts")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats pills */}
          {!loading && (
            <>
              <div className="flex items-center gap-1.5 bg-white border border-violet-100 shadow-sm rounded-xl px-3.5 py-2">
                <Crown className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-gray-600">{adminCount} admin{adminCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-blue-100 shadow-sm rounded-xl px-3.5 py-2">
                <UserCog className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-600">{staffCount} staff</span>
              </div>
            </>
          )}
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 opacity-60 cursor-not-allowed border border-white/30"
            disabled
            title="Coming soon"
            style={{ background: "linear-gradient(135deg, #003366, #0055aa)" }}
          >
            <Plus className="h-4 w-4" />{t("adminUsers.addNewAdmin", "Invite Admin")}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* ── Content ──────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
            >
              <div className="h-1 bg-gray-100" />
              <div className="p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-28" />
                    <div className="h-3 bg-gray-100 rounded-lg w-36" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-100 rounded-full w-24" />
                  <div className="h-3 bg-gray-100 rounded-lg w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div
          className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shield className="h-8 w-8 text-violet-300" />
          </div>
          <p className="text-base font-semibold text-gray-600">{t("adminUsers.noUsers", "No admin users found.")}</p>
          <p className="text-sm text-gray-400 mt-1">{t("adminUsers.noUsersDesc", "Admin user management will be available when the user search API supports role filtering.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user, idx) => {
            const roleCfg = getRoleConfig(user.role);
            const initials = getInitials(user.name);
            const RoleIcon = roleCfg.icon;

            return (
              <div
                key={user.id}
                className="au-card bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                style={{
                  animationDelay: `${idx * 0.07}s`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,51,102,0.04)",
                }}
              >
                {/* Gradient accent bar */}
                <div className={`h-1 bg-gradient-to-r ${roleCfg.gradient}`} />

                <div className="p-6">
                  {/* Avatar + online indicator */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleCfg.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="text-lg font-extrabold text-white">{initials}</span>
                      </div>
                      {/* Online dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-gray-900 truncate">{user.name || "—"}</h3>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${roleCfg.pillBg} ${roleCfg.pillText} ${roleCfg.pillBorder}`}>
                      <RoleIcon className="h-3 w-3" />
                      {roleCfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                      {user.userType}
                    </span>
                  </div>

                  {/* Member since */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-[11px] text-gray-400 font-medium">
                      Member since {formatDate(user.createdAt)}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">#{user.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Invite Section ────────────────────────── */}
      {!loading && users.length > 0 && (
        <div
          className="au-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg overflow-hidden relative"
          style={{
            animationDelay: "0.4s",
            background: "linear-gradient(135deg, #003366, #0055aa)",
            boxShadow: "0 4px 20px rgba(0,51,102,0.3)",
          }}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

          <div className="text-center sm:text-left relative">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-300" />
              <h3 className="text-base font-bold text-white">Need to add a new team member?</h3>
            </div>
            <p className="text-sm text-blue-200">Invite admins and staff via the invitation system (coming soon)</p>
          </div>
          <button
            disabled
            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 text-white text-sm font-bold cursor-not-allowed border border-white/25 backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
            Send Invite
          </button>
        </div>
      )}
    </div>
  );
}
