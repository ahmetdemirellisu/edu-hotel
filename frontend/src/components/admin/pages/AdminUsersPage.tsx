// src/components/admin/pages/AdminUsersPage.tsx
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Plus, Edit, Shield, Users, X, AlertCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Try to load admin/staff users from the API
        const res = await fetch("http://localhost:9004/users/search?query=&role=ADMIN,HOTEL_STAFF");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          // Fallback to showing current logged-in admin info
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally { setLoading(false); }
    })();
  }, []);

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      ADMIN: { label: "Super Admin", bg: "bg-violet-50", text: "text-violet-700" },
      HOTEL_STAFF: { label: "Hotel Staff", bg: "bg-blue-50", text: "text-blue-700" },
      USER: { label: "User", bg: "bg-gray-50", text: "text-gray-600" },
    };
    const cfg = map[role] || map.USER;
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t("pages.adminUsers.title", "Admin Users")}</h2><p className="text-sm text-gray-500 mt-0.5">System administrators and staff accounts</p></div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold transition-all hover:shadow-lg" disabled>
          <Plus className="h-4 w-4" />{t("adminUsers.addNewAdmin", "Add Admin")}
        </button>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No admin users found.</p>
            <p className="text-xs text-gray-400 mt-1">Admin user management will be available when the user search API supports role filtering.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["ID", "Name", "Email", "Role", "Type", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3.5 pl-6 pr-4 text-xs font-mono text-gray-500">{user.id}</td>
                    <td className="py-3.5 px-4 text-[13px] font-medium text-gray-800">{user.name || "—"}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{user.email}</td>
                    <td className="py-3.5 px-4">{roleBadge(user.role)}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{user.userType}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{user.createdAt?.slice(0, 10) || "—"}</td>
                    <td className="py-3.5 pr-6 px-4">
                      <button className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors opacity-60 group-hover:opacity-100" title="Edit" disabled>
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}