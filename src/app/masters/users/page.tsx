"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Plus, Search, Edit2, Trash2, X, Save, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "staff" | "viewer";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function StatCard({ label, value, color, subValue }: { label: string; value: number | string; color: string; subValue?: string }) {
  const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-gradient-to-br from-blue-50 to-blue-100/50", border: "border-blue-200/60", text: "text-blue-700", iconBg: "bg-blue-500" },
    green: { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50", border: "border-emerald-200/60", text: "text-emerald-700", iconBg: "bg-emerald-500" },
    purple: { bg: "bg-gradient-to-br from-purple-50 to-purple-100/50", border: "border-purple-200/60", text: "text-purple-700", iconBg: "bg-purple-500" },
    cyan: { bg: "bg-gradient-to-br from-cyan-50 to-cyan-100/50", border: "border-cyan-200/60", text: "text-cyan-700", iconBg: "bg-cyan-500" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`${c.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}>
          <Users className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200",
    staff: "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border border-blue-200",
    viewer: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200",
  };
  return (
    <span className={`${styles[role] || styles.staff} px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
      {role}
    </span>
  );
}

function UserAvatar({ name }: { name: string }) {
  const colors = ["from-blue-400 to-blue-600", "from-purple-400 to-purple-600", "from-emerald-400 to-emerald-600", "from-rose-400 to-rose-600", "from-amber-400 to-amber-600"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

const PAGE_SIZE = 20;

export default function UserMasterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "staff" as "admin" | "staff" | "viewer", notes: "" });

  const { data, error, mutate, isLoading } = useSWR("/api/users", mastersFetcher);

  const allUsers: User[] = data?.success ? data.data : [];

  const filtered = useMemo(() => {
    let list = allUsers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").includes(q)
      );
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    return list;
  }, [allUsers, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const users = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const roleStats = {
    admins: allUsers.filter((u) => u.role === "admin").length,
    staff: allUsers.filter((u) => u.role === "staff").length,
    viewers: allUsers.filter((u) => u.role === "viewer").length,
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email || "", phone: user.phone || "", role: user.role, notes: user.notes || "" });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", phone: "", role: "staff", notes: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const json = await res.json();
      if (json.ok) {
        toast.success(editingUser ? "User updated" : "User created");
        setIsModalOpen(false);
        mutate();
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("User archived");
        mutate();
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const hasActiveFilters = search || roleFilter;

  if (error) return <div className="p-10 text-center text-red-500">Failed to load users</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-500">Manage staff members for audit trails and access control</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border shadow-sm ${showFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                <Search className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
              {hasActiveFilters && (
                <button onClick={() => { setSearch(""); setRoleFilter(""); setPage(1); }} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total Users" value={allUsers.length} color="blue" />
          <StatCard label="Admins" value={roleStats.admins} color="purple" subValue="Full access" />
          <StatCard label="Staff" value={roleStats.staff} color="green" subValue="Standard access" />
          <StatCard label="On This Page" value={users.length} color="cyan" subValue={`Page ${page} of ${totalPages}`} />
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none">
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Users List</h3>
            <span className="text-sm text-gray-500">Showing {users.length} of {filtered.length} users</span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500 animate-pulse">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
              <p className="text-gray-500 mb-4">{hasActiveFilters ? "Try adjusting your filters" : "Add your first user to get started"}</p>
              {!hasActiveFilters && (
                <button onClick={() => openModal()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Add User</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} />
                          <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email || <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.phone || <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={user.role} /></td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{user.notes || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(user)} className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg text-sm font-medium"><Edit2 className="w-4 h-4" /> Edit</button>
                          <button onClick={() => handleDelete(user._id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-500 rounded-lg text-sm font-medium"><Trash2 className="w-4 h-4" /> Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-gray-700 bg-white border border-gray-200 disabled:opacity-40 font-medium text-sm">Previous</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl text-white bg-gray-900 disabled:opacity-40 font-medium text-sm">Next</button>
              </div>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">{editingUser ? "Edit User" : "Add User"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-600 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "staff" | "viewer" })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-gray-400">
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 resize-none outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 active:scale-95">
                  <Save className="w-4 h-4" /> Save User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
