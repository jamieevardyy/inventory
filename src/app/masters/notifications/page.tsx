"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Bell,
  Package,
  AlertTriangle,
  Mail,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface Category {
  _id: string;
  name: string;
}

interface Subcategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface NotificationRule {
  _id: string;
  name: string;
  type: "low_stock" | "reorder";
  categoryId: string | null;
  subcategoryId: string | null;
  threshold: number;
  notifyEmail: string;
  active: boolean;
  createdAt: string;
}

export default function NotificationMasterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "low_stock" as "low_stock" | "reorder",
    categoryId: "",
    subcategoryId: "",
    threshold: 10,
    notifyEmail: "",
    active: true,
  });

  const { data: rulesData, error, mutate, isLoading } = useSWR("/api/notifications", mastersFetcher);
  const { data: catData } = useSWR("/api/categories", mastersFetcher);
  const { data: subData } = useSWR("/api/subcategories", mastersFetcher);

  const rules: NotificationRule[] = rulesData?.success ? rulesData.data : [];
  const categories: Category[] = catData?.success ? catData.data : [];
  const allSubcategories: Subcategory[] = subData?.success ? subData.data : [];

  const subcategoriesForCategory = formData.categoryId
    ? allSubcategories.filter((s) => s.categoryId === formData.categoryId)
    : allSubcategories;

  const getCategoryName = (id: string | null) => categories.find((c) => c._id === id)?.name || null;
  const getSubcategoryName = (id: string | null) => allSubcategories.find((s) => s._id === id)?.name || null;

  const handleOpenModal = (rule?: NotificationRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        type: rule.type,
        categoryId: rule.categoryId || "",
        subcategoryId: rule.subcategoryId || "",
        threshold: rule.threshold,
        notifyEmail: rule.notifyEmail || "",
        active: rule.active,
      });
    } else {
      setEditingRule(null);
      setFormData({ name: "", type: "low_stock", categoryId: "", subcategoryId: "", threshold: 10, notifyEmail: "", active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        categoryId: formData.categoryId || null,
        subcategoryId: formData.subcategoryId || null,
        threshold: formData.threshold,
        notifyEmail: formData.notifyEmail,
        active: formData.active,
      };
      const url = editingRule ? `/api/notifications/${editingRule._id}` : "/api/notifications";
      const method = editingRule ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.ok) {
        toast.success(editingRule ? "Rule updated" : "Rule created");
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
    if (!confirm("Archive this notification rule?")) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Rule archived");
        mutate();
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const filteredRules = rules.filter((rule) =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.type.includes(searchTerm.toLowerCase()) ||
    (getCategoryName(rule.categoryId) || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <div className="p-10 text-center text-rose-500">Failed to load notifications.</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Notification Rules</h1>
            <p className="text-gray-600 mt-2 text-sm font-medium">Configure low-stock and reorder alert rules</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Rule
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-gray-300 rounded-xl py-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl">
                <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">No notification rules found</p>
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">
                  Create First Rule
                </button>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule._id}
                  className={`bg-white border rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group ${rule.active ? "border-gray-200" : "border-red-200 bg-red-50/30"}`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.type === "low_stock" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {rule.type === "low_stock" ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{rule.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${rule.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {rule.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(rule)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(rule._id)} className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bell className="w-4 h-4 text-gray-500" />
                        <span className="capitalize">{rule.type.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-gray-500" />
                        <span>Threshold: {rule.threshold}</span>
                      </div>
                      {rule.notifyEmail && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{rule.notifyEmail}</span>
                        </div>
                      )}
                      {(rule.categoryId || rule.subcategoryId) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">Scope</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rule.categoryId && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{getCategoryName(rule.categoryId)}</span>
                            )}
                            {rule.subcategoryId && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{getSubcategoryName(rule.subcategoryId)}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">{editingRule ? "Edit Rule" : "Add Notification Rule"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-600 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Rule Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900" placeholder="e.g. Low stock — Electronics" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Type *</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, type: "low_stock" })} className={`flex-1 p-3 rounded-xl border-2 font-medium ${formData.type === "low_stock" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600"}`}>
                      Low Stock
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, type: "reorder" })} className={`flex-1 p-3 rounded-xl border-2 font-medium ${formData.type === "reorder" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                      Reorder
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Category (optional)</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: "" })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Subcategory (optional)</label>
                  <select value={formData.subcategoryId} onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900" disabled={!formData.categoryId && subcategoriesForCategory.length === 0}>
                    <option value="">All subcategories</option>
                    {subcategoriesForCategory.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Threshold</label>
                  <input type="number" min={0} value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Notify Email</label>
                  <input type="email" value={formData.notifyEmail} onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900" placeholder="alerts@example.com" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Active</span>
                  <button type="button" onClick={() => setFormData({ ...formData, active: !formData.active })} className={`w-12 h-6 rounded-full transition-colors ${formData.active ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Rule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
