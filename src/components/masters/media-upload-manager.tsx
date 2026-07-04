"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "@/components/inventory/image-uploader";
import type { InventoryItemDTO, ProductImage } from "@/lib/types";

export function MediaUploadManager() {
  const [items, setItems] = React.useState<InventoryItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<ProductImage[]>([]);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<InventoryItemDTO[]>("/api/items?limit=200");
      setItems(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.itemName.toLowerCase().includes(q));
  }, [items, search]);

  const selected = items.find((i) => i._id === selectedId);

  React.useEffect(() => {
    setImages((selected?.images as ProductImage[]) ?? []);
  }, [selected]);

  const saveImages = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api(`/api/items/${selectedId}`, {
        method: "PATCH",
        json: { images },
      });
      toast.success("Images updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Input
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {filtered.map((item) => (
            <Card
              key={item._id}
              className={`cursor-pointer transition-colors ${selectedId === item._id ? "border-primary" : ""}`}
              onClick={() => setSelectedId(item._id)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                {item.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.images[0].url}
                    alt={item.itemName}
                    className="h-10 w-10 rounded border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.images?.length ?? 0)} image(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selected.itemName}</p>
                <p className="text-sm text-muted-foreground">Upload or manage product images</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/inventory/${selected._id}`}>View Item</Link>
              </Button>
            </div>
            <ImageUploader images={images} onChange={setImages} />
            <Button onClick={saveImages} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save Images
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-20 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Select an item</p>
              <p className="text-sm text-muted-foreground">
                Choose an inventory item to upload or update its images.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
