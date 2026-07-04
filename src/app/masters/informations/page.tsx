"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  Search,
  Trash2,
  FileText,
  User,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";

interface InformationItem {
  _id: string;
  content: string;
  type: "general" | "note";
  createdBy: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function InformationsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ content: "", type: "general" as "general" | "note" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, error, mutate, isLoading } = useSWR("/api/informations", mastersFetcher);

  const allItems: InformationItem[] = data?.success ? data.data : [];

  const filtered = useMemo(() => {
    if (!debouncedSearch) return allItems;
    const q = debouncedSearch.toLowerCase();
    return allItems.filter(
      (i) =>
        i.content.toLowerCase().includes(q) ||
        i.createdBy.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)
    );
  }, [allItems, debouncedSearch]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const informations = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    const res = await fetch(`/api/informations/${deleteTargetId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      mutate();
      toast.success("Information archived");
    } else {
      toast.error(json.error || "Failed to archive");
    }
    setDeleteTargetId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.content.trim()) {
      toast.error("Content is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/informations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Information created");
        setIsCreateOpen(false);
        setCreateForm({ content: "", type: "general" });
        mutate();
      } else {
        toast.error(json.error || "Failed to create");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    });
  }

  function getRelativeTime(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  }

  if (error) return <div className="p-10 text-center text-red-500">Failed to load</div>;
  if (!data) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Informations</h1>
              <p className="text-gray-500 text-sm">Reference notes and general information log</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-4 w-5 h-5 my-auto text-gray-400" />
            <input
              className="pl-12 w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 py-3 text-sm text-gray-900 placeholder-gray-400"
              placeholder="Search informations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 animate-pulse">Loading informations...</div>
        ) : informations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Informations Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {searchTerm ? "No results match your search." : "Add reference notes and information entries here."}
            </p>
            {!searchTerm && (
              <button onClick={() => setIsCreateOpen(true)} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">
                Add First Entry
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {informations.map((info) => {
              const isExpanded = expandedId === info._id;
              const shouldTruncate = info.content.length > 300;
              return (
                <div key={info._id} className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold uppercase">
                        {info.createdBy.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {info.createdBy}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${info.type === "note" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                            {info.type}
                          </span>
                        </p>
                        <p className="text-gray-400 text-xs flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span className="text-gray-600 font-medium">{getRelativeTime(info.createdAt)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(info.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTargetId(info._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                          {shouldTruncate && !isExpanded ? `${info.content.substring(0, 300)}...` : info.content}
                        </p>
                        {shouldTruncate && (
                          <button onClick={() => setExpandedId(isExpanded ? null : info._id)} className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl disabled:opacity-50 font-medium">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl disabled:opacity-50 font-medium">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Add Information</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Type</label>
                <select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as "general" | "note" })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900">
                  <option value="general">General</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Content *</label>
                <textarea required rows={6} value={createForm.content} onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 resize-none focus:ring-2 focus:ring-gray-400 outline-none" placeholder="Enter information content..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Information?</h3>
              <p className="text-sm text-gray-500 mb-6">This entry will be hidden from the list.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl">Archive</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
