"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subcategory {
  _id: string;
  name: string;
  categoryId: string;
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 45%)`;
}

function lightenColor(color: string, amount = 0.92): string {
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#f3f4f6";
  const h = match[1];
  const s = match[2];
  const l = Math.min(95, parseInt(match[3]) + amount * 40);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

async function fetchSubcategories(categoryId: string): Promise<Subcategory[]> {
  const res = await fetch(`/api/subcategories?categoryId=${categoryId}`);
  const json = await res.json();
  return json.ok ? json.data : [];
}

export default function CategoryMasterPage() {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subCategoryList, setSubCategoryList] = useState<Subcategory[]>([]);
  const [subCategoryCategoryId, setSubCategoryCategoryId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ name: "" });
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});

  const { data, error, mutate, isLoading } = useSWR("/api/categories", mastersFetcher);

  const allCategories: Category[] = data?.success ? data.data : [];

  const categories = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = search.toLowerCase();
    return allCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
    );
  }, [allCategories, search]);

  useEffect(() => {
    if (!allCategories.length) return;
    allCategories.forEach(async (cat) => {
      const subs = await fetchSubcategories(cat._id);
      setSubCounts((prev) => ({ ...prev, [cat._id]: subs.length }));
    });
  }, [allCategories]);

  const loadSubCount = async (categoryId: string) => {
    const subs = await fetchSubcategories(categoryId);
    setSubCounts((prev) => ({ ...prev, [categoryId]: subs.length }));
    return subs;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Category archived");
        mutate();
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("Failed to archive category");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Category created");
        mutate();
        setShowCreateModal(false);
        setFormData({ name: "", description: "" });
      } else {
        toast.error(json.error || "Failed to create");
      }
    } catch {
      toast.error("Failed to create category");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch(`/api/categories/${editingCategory._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Category updated");
        mutate();
        setShowEditModal(false);
        setEditingCategory(null);
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update category");
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setShowEditModal(true);
  };

  const openSubModal = async (categoryId: string) => {
    const subs = await loadSubCount(categoryId);
    setSubCategoryList(subs);
    setSubCategoryCategoryId(categoryId);
    setShowSubModal(true);
    setEditingSub(null);
    setSubForm({ name: "" });
  };

  if (error) return <div className="p-10 text-center text-rose-500">Failed to load categories</div>;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Categories</h1>
            <p className="text-gray-600 mt-2 text-sm font-medium">Manage inventory categories and subcategories</p>
          </div>
          <button
            onClick={() => { setFormData({ name: "", description: "" }); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" /> Create Category
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-white border border-gray-300 rounded-xl py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-600 animate-pulse">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl text-center py-16">
            <p className="text-gray-600 mb-4">No categories found</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">Create First Category</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const color = hashColor(category.name);
              const bgColor = lightenColor(color);
              return (
                <div key={category._id} className="border-2 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all" style={{ backgroundColor: bgColor, borderColor: color }}>
                  <div className="p-6" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{new Date(category.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{category.description}</p>
                    )}
                    <button
                      onClick={() => openSubModal(category._id)}
                      className="w-full px-4 py-2.5 text-sm bg-white/70 text-gray-900 rounded-lg hover:bg-white border border-gray-300 font-medium mb-3"
                    >
                      🧩 Manage Subcategories {subCounts[category._id] !== undefined ? `(${subCounts[category._id]})` : ""}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(category)} className="flex-1 px-4 py-2.5 text-sm bg-white/70 text-gray-900 rounded-lg hover:bg-white border border-gray-300 font-medium">Edit</button>
                      <button onClick={() => handleDelete(category._id)} className="flex-1 px-4 py-2.5 text-sm bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 border border-rose-200 font-medium">Archive</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{showEditModal ? "Edit Category" : "Create Category"}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setEditingCategory(null); }} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={showEditModal ? handleEdit : handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 resize-none focus:ring-2 focus:ring-gray-400 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-lg active:scale-95">{showEditModal ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubModal && subCategoryCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Manage Subcategories</h2>
              <button onClick={() => setShowSubModal(false)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              <div className="space-y-2 mb-6">
                {subCategoryList.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">No subcategories yet.</p>
                )}
                {subCategoryList.map((sub) => (
                  <div key={sub._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                    <div className="font-medium text-gray-900">{sub.name}</div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingSub(sub); setSubForm({ name: sub.name }); }} className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-xs font-medium hover:bg-gray-200">Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm("Archive this subcategory?")) return;
                          const res = await fetch(`/api/subcategories/${sub._id}`, { method: "DELETE" });
                          const json = await res.json();
                          if (json.ok) {
                            toast.success("Subcategory archived");
                            const fresh = await fetchSubcategories(subCategoryCategoryId);
                            setSubCategoryList(fresh);
                            setSubCounts((prev) => ({ ...prev, [subCategoryCategoryId]: fresh.length }));
                            mutate();
                          } else {
                            toast.error(json.error || "Failed to archive");
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold mb-4 text-gray-900">{editingSub ? "Edit Subcategory" : "Add Subcategory"}</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!subForm.name.trim()) return;
                    const url = editingSub ? `/api/subcategories/${editingSub._id}` : "/api/subcategories";
                    const method = editingSub ? "PATCH" : "POST";
                    const body = editingSub ? { name: subForm.name } : { categoryId: subCategoryCategoryId, name: subForm.name };
                    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                    const json = await res.json();
                    if (json.ok) {
                      toast.success(editingSub ? "Subcategory updated" : "Subcategory created");
                      const fresh = await fetchSubcategories(subCategoryCategoryId);
                      setSubCategoryList(fresh);
                      setSubCounts((prev) => ({ ...prev, [subCategoryCategoryId]: fresh.length }));
                      setEditingSub(null);
                      setSubForm({ name: "" });
                      mutate();
                    } else {
                      toast.error(json.error || "Failed to save");
                    }
                  }}
                  className="space-y-4"
                >
                  <input type="text" placeholder="Name *" required value={subForm.name} onChange={(e) => setSubForm({ name: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
                  <div className="flex justify-end gap-3">
                    {editingSub && (
                      <button type="button" onClick={() => { setEditingSub(null); setSubForm({ name: "" }); }} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">Cancel Edit</button>
                    )}
                    <button type="submit" className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold">{editingSub ? "Update" : "Add"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
