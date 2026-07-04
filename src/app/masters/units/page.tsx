"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Search, Edit2, Trash2, X, Save, Ruler } from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface Unit {
  _id: string;
  name: string;
  symbol: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UnitsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({ name: "", symbol: "", description: "" });

  const { data, error, mutate, isLoading } = useSWR("/api/units", mastersFetcher);

  const units: Unit[] = data?.success ? data.data : [];

  const filtered = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({ name: unit.name, symbol: unit.symbol, description: unit.description || "" });
    } else {
      setEditingUnit(null);
      setFormData({ name: "", symbol: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.symbol.trim()) {
      toast.error("Name and symbol are required");
      return;
    }
    try {
      const url = editingUnit ? `/api/units/${editingUnit._id}` : "/api/units";
      const method = editingUnit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(editingUnit ? "Unit updated" : "Unit created");
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
    if (!confirm("Archive this unit?")) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Unit archived");
        mutate();
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  if (error) return <div className="p-10 text-center text-rose-500">Failed to load units.</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Units of Measure</h1>
            <p className="text-gray-600 mt-2 text-sm font-medium">
              Define measurement units for inventory items
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-900/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Unit
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, symbol, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 py-3 text-sm text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading units...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl text-center py-16">
            <Ruler className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No units found</p>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold shadow-lg"
            >
              Add First Unit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((unit) => (
              <div
                key={unit._id}
                className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:border-gray-300 transition-all group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200">
                        <Ruler className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{unit.name}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-mono font-semibold border border-gray-200">
                          {unit.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(unit)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(unit._id)}
                        className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {unit.description && (
                    <p className="text-sm text-gray-700 mt-2 pt-3 border-t border-gray-200">{unit.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingUnit ? "Edit Unit" : "Add Unit"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-600 hover:text-gray-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pieces"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. pcs"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Optional description..."
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Save Unit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
