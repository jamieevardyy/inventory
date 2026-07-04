"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search, Package, X, Save, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { mastersFetcher } from "@/lib/masters-fetcher";
import { ImageUploader } from "@/components/inventory/image-uploader";
import type { ProductImage } from "@/lib/types";

interface InventoryItem {
  _id: string;
  itemName: string;
  description?: string;
  images: ProductImage[];
  categoryId?: string | null;
  subcategoryId?: string | null;
}

export default function MediaUploadPage() {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useSWR("/api/items?limit=200", mastersFetcher);

  const items: InventoryItem[] = data?.success ? data.data.items : [];

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return item.itemName.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
  });

  const selectItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setImages(item.images || []);
    setShowDropdown(false);
    setSearch("");
  };

  const handleSave = async () => {
    if (!selectedItem) {
      toast.error("Please select an item first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${selectedItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Images saved to item");
        mutate();
        setSelectedItem(null);
        setImages([]);
      } else {
        toast.error(json.error || "Failed to save images");
      }
    } catch {
      toast.error("Failed to save images");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Media Upload</h1>
              <p className="text-gray-500 text-sm mt-1">Upload and attach images to inventory items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                  Select Item
                </h2>
              </div>
              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by item name or description..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                  {showDropdown && search && (
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-2xl max-h-80 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="p-6 text-gray-500 text-sm text-center">No items found matching &quot;{search}&quot;</div>
                      ) : (
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 border-b">
                            {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
                          </div>
                          {filtered.slice(0, 10).map((item) => (
                            <button
                              key={item._id}
                              onClick={() => selectItem(item)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-start gap-3">
                                <Package className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-gray-900">{item.itemName}</span>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{item.description}</p>
                                  )}
                                  <span className="text-xs text-gray-400 mt-1 inline-block">
                                    {item.images?.length || 0} image{(item.images?.length || 0) !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedItem ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-blue-700 text-lg">{selectedItem.itemName}</span>
                        </div>
                        {selectedItem.description && (
                          <p className="text-gray-700 text-sm">{selectedItem.description}</p>
                        )}
                      </div>
                      <button onClick={() => { setSelectedItem(null); setImages([]); }} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Search and select an item to upload images</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">2</span>
                  Upload Images
                </h2>
              </div>
              <div className="p-6">
                {selectedItem ? (
                  <div className="space-y-4">
                    <ImageUploader images={images} onChange={setImages} />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${saving ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg active:scale-[0.98]"}`}
                    >
                      <Save className="w-5 h-5" />
                      {saving ? "Saving..." : "Save Images to Item"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Upload className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Select an item first to upload images</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Search for an inventory item by name or description</span></div>
            <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Upload images using drag-and-drop or file picker</span></div>
            <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Images are stored via the upload API and linked to the item</span></div>
            <div className="flex items-start gap-2"><span className="text-green-500">✓</span><span>Save updates the item record with the new image list</span></div>
          </div>
        </div>
      </div>

      {showDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
