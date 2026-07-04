"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, Trash2, Edit2, Search, CornerDownRight, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher, parentId } from "@/lib/masters-fetcher";

interface Location {
  _id: string;
  name: string;
  type?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  parentLocationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function LocationMasterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; loc: Location } | null>(null);
  const [mobileSelectedId, setMobileSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    code: "",
    description: "",
    isActive: true,
    parentLocationId: null as string | null,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const queryParams = new URLSearchParams({
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(typeFilter && { type: typeFilter }),
  });

  const { data, error, mutate } = useSWR(`/api/locations?${queryParams}`, mastersFetcher);

  function getDepth(loc: Location, allLocs: Location[]) {
    let depth = 0;
    let current: Location | null = loc;
    while (current) {
      const pid = parentId(current);
      if (!pid) break;
      depth++;
      current = allLocs.find((x) => x._id === pid) || null;
    }
    return depth;
  }

  function sortByHierarchy(locList: Location[]) {
    const map = new Map<string, Location[]>();
    locList.forEach((loc) => {
      const parent = parentId(loc) || "root";
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(loc);
    });
    const result: Location[] = [];
    function traverse(pid: string | null) {
      const children = map.get(pid || "root") || [];
      children.sort((a, b) => a.name.localeCompare(b.name));
      for (const child of children) {
        result.push(child);
        traverse(child._id);
      }
    }
    traverse(null);
    return result;
  }

  const locationsRaw: Location[] = data?.success ? data.data : [];
  let locations = sortByHierarchy(locationsRaw);
  if (activeFilter) {
    const wantActive = activeFilter === "true";
    locations = locations.filter((l) => l.isActive === wantActive);
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    const res = await fetch(`/api/locations/${deleteTargetId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      mutate();
      toast.success("Location archived");
    } else {
      toast.error(json.error || "Failed to archive");
    }
    setDeleteTargetId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: formData.name,
      type: formData.type || undefined,
      code: formData.code || undefined,
      description: formData.description || undefined,
      isActive: formData.isActive,
      parentLocationId: formData.parentLocationId || null,
    };
    const url = editingId ? `/api/locations/${editingId}` : "/api/locations";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.ok) {
      mutate();
      toast.success(editingId ? "Location updated" : "Location created");
      setIsCreateModalOpen(false);
      resetForm();
    } else {
      toast.error(json.error || "Failed to save");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", type: "", code: "", description: "", isActive: true, parentLocationId: null });
    setEditingId(null);
  };

  const openCreateModal = (parentLocId: string | null = null) => {
    resetForm();
    if (parentLocId) setFormData((prev) => ({ ...prev, parentLocationId: parentLocId }));
    setIsCreateModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    resetForm();
    setEditingId(loc._id);
    setFormData({
      name: loc.name,
      type: loc.type || "",
      code: loc.code || "",
      description: loc.description || "",
      isActive: loc.isActive,
      parentLocationId: parentId(loc),
    });
    setIsCreateModalOpen(true);
  };

  if (error) return <div className="p-10 text-center text-rose-500">Failed to load data.</div>;
  if (!data) return <div className="p-10 text-center text-gray-600 animate-pulse">Loading locations...</div>;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Locations</h1>
            <p className="text-gray-600 mt-2 text-sm font-medium">Manage your warehouse hierarchy and storage spaces</p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-900/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Location</span>
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full group">
            <Search className="absolute inset-y-0 left-0 pl-3 w-5 h-5 my-auto text-gray-500" />
            <input
              className="pl-10 w-full bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 py-3 text-sm text-gray-900 placeholder-gray-500"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 min-w-[140px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="warehouse">Warehouse</option>
              <option value="zone">Zone</option>
              <option value="rack">Rack</option>
              <option value="shelf">Shelf</option>
              <option value="bin">Bin</option>
            </select>
            <select
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 min-w-[120px]"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(searchTerm || typeFilter || activeFilter) && (
              <button
                onClick={() => { setSearchTerm(""); setTypeFilter(""); setActiveFilter(""); }}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 font-medium whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-900 font-bold">
                  <th className="px-6 py-5">Location Name</th>
                  <th className="px-6 py-5 hidden md:table-cell">Code</th>
                  <th className="px-6 py-5 hidden sm:table-cell">Type</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right hidden md:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-600 italic">
                      No locations found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => {
                    const depth = getDepth(loc, locationsRaw);
                    const isMobileSelected = mobileSelectedId === loc._id;
                    return (
                      <tr
                        key={loc._id}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.pageX, y: e.pageY, loc }); }}
                        className={`group transition-all ${isMobileSelected ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      >
                        <td
                          className="px-6 py-4 cursor-pointer md:cursor-default"
                          onClick={() => setMobileSelectedId(mobileSelectedId === loc._id ? null : loc._id)}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                              {depth > 0 && <CornerDownRight className="w-4 h-4 text-gray-500 mr-2" />}
                              <div className="flex flex-col">
                                <span className={`font-medium text-base ${depth === 0 ? "text-gray-900" : "text-gray-800"}`}>
                                  {loc.name}
                                </span>
                                {loc.description && (
                                  <span className="text-[11px] text-gray-600 truncate max-w-[200px]">{loc.description}</span>
                                )}
                              </div>
                            </div>
                            {isMobileSelected && (
                              <div className="md:hidden flex items-center gap-3 mt-3 pl-2">
                                <button onClick={(e) => { e.stopPropagation(); openEditModal(loc); }} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-900 rounded-lg text-xs font-medium">
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openCreateModal(loc._id); }} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium">
                                  <Plus className="w-3 h-3" /> Child
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(loc._id); }} className="flex items-center gap-1 px-3 py-1.5 bg-rose-700 text-rose-50 rounded-lg text-xs font-medium">
                                  <Trash2 className="w-3 h-3" /> Archive
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono hidden md:table-cell">{loc.code || "—"}</td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          {loc.type ? (
                            <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-900 text-xs font-medium border border-gray-200">{loc.type}</span>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${loc.isActive ? "bg-green-600 text-white border-green-700" : "bg-gray-400 border-gray-500 text-white"}`}>
                            {loc.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => openEditModal(loc)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => openCreateModal(loc._id)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><Plus className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteTargetId(loc._id)} className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {contextMenu && (
        <div className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => { openEditModal(contextMenu.loc); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</button>
          <button onClick={() => { openCreateModal(contextMenu.loc._id); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Child</button>
          <div className="h-px bg-gray-200 my-1" />
          <button onClick={() => { setDeleteTargetId(contextMenu.loc._id); setContextMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Archive</button>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Location" : formData.parentLocationId ? "Add Sub-Location" : "Create New Location"}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" placeholder="e.g. Main Warehouse" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Type</label>
                  <input list="location-types" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" />
                  <datalist id="location-types">
                    <option value="warehouse" /><option value="zone" /><option value="rack" /><option value="shelf" /><option value="bin" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Code</label>
                  <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none" placeholder="e.g. WH-01" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Description</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-gray-400 outline-none resize-none" />
                </div>
                <div className="col-span-2 flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-5 w-5 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Active Status</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Parent Location (Optional)</label>
                <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm" value={formData.parentLocationId || ""} onChange={(e) => setFormData({ ...formData, parentLocationId: e.target.value || null })}>
                  <option value="">No Parent (Top Level)</option>
                  {locations.filter((l) => l._id !== editingId).map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {Array(getDepth(loc, locationsRaw)).fill("— ").join("")}{loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-lg active:scale-95">{editingId ? "Update Location" : "Create Location"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Location?</h3>
              <p className="text-sm text-gray-600 mb-6">This location will be hidden from dropdowns. Existing references are preserved.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-rose-50 bg-rose-600 hover:bg-rose-700 rounded-xl">Archive</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
