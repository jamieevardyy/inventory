"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  FileText,
  Building2,
  Layers,
  Tag,
  FolderTree,
  GitBranch,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
}

interface Supplier {
  _id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  categoryIds: string[];
  subcategoryIds: string[];
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 45%)`;
}

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartPopupOpen, setIsChartPopupOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    categoryIds: [] as string[],
    subcategoryIds: [] as string[],
  });

  const { data: suppliersData, mutate: mutateSuppliers, isLoading } = useSWR("/api/suppliers", mastersFetcher);
  const { data: catData } = useSWR("/api/categories", mastersFetcher);
  const { data: subData } = useSWR("/api/subcategories", mastersFetcher);

  const suppliers: Supplier[] = suppliersData?.success ? suppliersData.data : [];
  const categories: Category[] = catData?.success ? catData.data : [];
  const allSubCategories: SubCategory[] = subData?.success ? subData.data : [];

  const categoryTree = useMemo(
    () =>
      categories.map((cat) => ({
        ...cat,
        color: hashColor(cat.name),
        subCategories: allSubCategories.filter((sub) => sub.categoryId === cat._id),
      })),
    [categories, allSubCategories]
  );

  const getCategory = (id: string) => categories.find((c) => c._id === id);
  const getSubcategory = (id: string) => allSubCategories.find((s) => s._id === id);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone || "",
        email: supplier.email || "",
        notes: supplier.notes || "",
        categoryIds: supplier.categoryIds || [],
        subcategoryIds: supplier.subcategoryIds || [],
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", phone: "", email: "", notes: "", categoryIds: [], subcategoryIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier._id}` : "/api/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(editingSupplier ? "Supplier updated" : "Supplier created");
        setIsModalOpen(false);
        setIsChartPopupOpen(false);
        mutateSuppliers();
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Supplier archived");
        mutateSuppliers();
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const toggleSubCategorySelection = (subId: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategoryIds: prev.subcategoryIds.includes(subId)
        ? prev.subcategoryIds.filter((id) => id !== subId)
        : [...prev.subcategoryIds, subId],
    }));
  };

  const toggleCategorySelection = (catId: string) => {
    const subsInCategory = allSubCategories.filter((sub) => sub.categoryId === catId).map((sub) => sub._id);
    if (subsInCategory.length === 0) {
      setFormData((prev) => ({
        ...prev,
        categoryIds: prev.categoryIds.includes(catId)
          ? prev.categoryIds.filter((id) => id !== catId)
          : [...prev.categoryIds, catId],
      }));
      return;
    }
    setFormData((prev) => {
      const allSelected = subsInCategory.every((subId) => prev.subcategoryIds.includes(subId));
      if (allSelected) {
        return { ...prev, subcategoryIds: prev.subcategoryIds.filter((id) => !subsInCategory.includes(id)) };
      }
      const newSelection = [...prev.subcategoryIds];
      subsInCategory.forEach((subId) => {
        if (!newSelection.includes(subId)) newSelection.push(subId);
      });
      return { ...prev, subcategoryIds: newSelection };
    });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || "").includes(searchTerm) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupSubCategoriesByCategory = (subIds: string[]) => {
    const grouped: { category: Category; subs: SubCategory[] }[] = [];
    subIds.forEach((subId) => {
      const sub = getSubcategory(subId);
      if (!sub) return;
      const cat = getCategory(sub.categoryId);
      if (!cat) return;
      let group = grouped.find((g) => g.category._id === cat._id);
      if (!group) {
        group = { category: cat, subs: [] };
        grouped.push(group);
      }
      group.subs.push(sub);
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Supplier Master</h1>
            <p className="text-gray-600 mt-2 text-sm font-medium">Manage vendors and suppliers linked to categories</p>
          </div>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95">
            <Plus className="w-5 h-5" /> Add Supplier
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search by name, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full bg-white border border-gray-300 rounded-xl py-3 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No suppliers found</p>
            <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">Add First Supplier</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier._id} className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(supplier)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(supplier._id)} className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-500" /><span>{supplier.phone}</span></div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-500" /><span>{supplier.email}</span></div>
                    )}
                    {supplier.notes && (
                      <div className="flex items-start gap-2 text-gray-700 mt-3 pt-3 border-t border-gray-200">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" /><span className="text-xs">{supplier.notes}</span>
                      </div>
                    )}
                    {supplier.subcategoryIds?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2"><FolderTree className="w-4 h-4 text-gray-500" /><span className="text-xs text-gray-500 font-medium">Linked Subcategories</span></div>
                        <div className="space-y-2">
                          {groupSubCategoriesByCategory(supplier.subcategoryIds).map(({ category, subs }) => {
                            const color = hashColor(category.name);
                            return (
                              <div key={category._id} className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                                  <Layers className="w-3 h-3" />{category.name}
                                </div>
                                <div className="flex flex-wrap gap-1.5 ml-4">
                                  {subs.map((sub) => (
                                    <span key={sub._id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                                      <Tag className="w-3 h-3" />{sub.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-600 hover:text-gray-900"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Supplier Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 resize-none focus:ring-2 focus:ring-gray-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase"><FolderTree className="w-4 h-4 inline mr-1" />Link to Subcategories</label>
                  <button type="button" onClick={() => setIsChartPopupOpen(true)} className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-700 hover:border-indigo-400 flex items-center justify-center gap-3">
                    <GitBranch className="w-5 h-5" />
                    <span className="font-semibold">
                      {formData.subcategoryIds.length > 0 ? `${formData.subcategoryIds.length} selected — click to edit` : "Open chart to select subcategories"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 active:scale-95">
                  <Save className="w-4 h-4" /> Save Supplier
                </button>
              </div>
            </div>
          </div>
        )}

        {isChartPopupOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-800">
                <div className="flex items-center gap-3">
                  <FolderTree className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">{formData.name || "Supplier"} — Subcategories</h2>
                    <p className="text-gray-400 text-xs">Click to select/deselect</p>
                  </div>
                </div>
                <button onClick={() => setIsChartPopupOpen(false)} className="text-gray-400 hover:text-white p-2"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Search..." value={subCategorySearchTerm} onChange={(e) => setSubCategorySearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                <div className="space-y-1 font-mono text-sm">
                  {categoryTree.map((cat, catIndex) => {
                    const categoryMatches = cat.name.toLowerCase().includes(subCategorySearchTerm.toLowerCase());
                    const matchingSubs = cat.subCategories.filter((sub) => sub.name.toLowerCase().includes(subCategorySearchTerm.toLowerCase()));
                    if (subCategorySearchTerm && !categoryMatches && matchingSubs.length === 0) return null;
                    const subsToShow = subCategorySearchTerm && !categoryMatches ? matchingSubs : cat.subCategories;
                    const selectedCount = cat.subCategories.filter((s) => formData.subcategoryIds.includes(s._id)).length;
                    const isLast = catIndex === categoryTree.length - 1;
                    return (
                      <div key={cat._id}>
                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100">
                          <span className="text-gray-400 w-4">{isLast ? "└" : "├"}</span>
                          <button type="button" onClick={() => toggleCategorySelection(cat._id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedCount === cat.subCategories.length && selectedCount > 0 ? "border-indigo-600 bg-indigo-600" : selectedCount > 0 ? "border-indigo-400 bg-indigo-200" : "border-gray-400 bg-white"}`}>
                            {selectedCount === cat.subCategories.length && selectedCount > 0 && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </button>
                          <span className="text-yellow-500 text-lg">📁</span>
                          <span className="font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                          {selectedCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{selectedCount}/{cat.subCategories.length}</span>}
                        </div>
                        {subsToShow.length > 0 && (
                          <div className="ml-6">
                            {subsToShow.map((sub, subIndex) => {
                              const isSelected = formData.subcategoryIds.includes(sub._id);
                              return (
                                <button key={sub._id} type="button" onClick={() => toggleSubCategorySelection(sub._id)} className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-left ${isSelected ? "bg-indigo-100" : "hover:bg-gray-100"}`}>
                                  <span className="text-gray-300 w-4">{subIndex === subsToShow.length - 1 ? "└" : "├"}</span>
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-400 bg-white"}`}>
                                    {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                  </div>
                                  <span className={`font-medium ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>{sub.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-gray-600 text-sm">{formData.subcategoryIds.length} selected</span>
                <div className="flex gap-3">
                  <button onClick={() => setFormData((prev) => ({ ...prev, subcategoryIds: [], categoryIds: [] }))} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Clear All</button>
                  <button onClick={() => setIsChartPopupOpen(false)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg">Done</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
