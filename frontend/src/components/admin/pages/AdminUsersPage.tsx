// src/components/admin/pages/AdminUsersPage.tsx
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Plus, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AdminUsersPage() {
  const { t } = useTranslation("admin"); // use admin namespace

  const adminUsers = [
    {
      name: "Admin User",
      email: "admin@sabanciuniv.edu",
      role: "Super Admin",
      lastLogin: "2025-12-02 10:30",
      status: "Active",
    },
    {
      name: "Reservation Admin",
      email: "res.admin@sabanciuniv.edu",
      role: "Reservation Admin",
      lastLogin: "2025-12-02 09:15",
      status: "Active",
    },
    {
      name: "Finance Admin",
      email: "finance@sabanciuniv.edu",
      role: "Finance Admin",
      lastLogin: "2025-12-01 16:45",
      status: "Active",
    },
    {
      name: "John Viewer",
      email: "viewer@sabanciuniv.edu",
      role: "Viewer",
      lastLogin: "2025-11-30 14:20",
      status: "Inactive",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">
              {t("pages.adminUsers.title")}
            </h3>
            <Button className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t("adminUsers.addNewAdmin")}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.name")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.email")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("adminUsers.role")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("adminUsers.lastLogin")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("adminUsers.status")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm text-gray-600">
                    {t("tables.actions")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {adminUsers.map((user, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Name */}
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {user.name}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {user.role}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {user.lastLogin}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-gray-600 hover:text-gray-700"
                          title={t("common.edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <Button className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white">
                          {t("adminUsers.disable")}
                        </Button>

                        <Button className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white">
                          {t("adminUsers.resetPassword")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
