"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles, Star, Plus, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./image-uploader";
import { DuplicateDialog, type DuplicateHit } from "./duplicate-dialog";
import type {
  CategoryDTO,
  SubcategoryDTO,
  UnitDTO,
  InventoryItemDTO,
  ProductImage,
  AiSuggestion,
} from "@/lib/types";

interface FormState {
  itemName: string;
  referenceNames: string[];
  categoryId: string;
  subcategoryId: string;
  description: string;
  images: ProductImage[];
  searchKeywords: string[];
  // Passed through unchanged (kept for search richness / edit preservation).
  aliases: string[];
  commonNames: string[];
  quantity: string;
  unit: string;
  minimumQuantity: string;
  reorderQuantity: string;
  warehouse: string;
  rack: string;
  shelf: string;
  bin: string;
}

const NONE = "__none__";

function fromDTO(item?: InventoryItemDTO): FormState {
  return {
    itemName: item?.itemName ?? "",
    referenceNames: item?.referenceNames ?? [],
    categoryId: item?.categoryId ?? "",
    subcategoryId: item?.subcategoryId ?? "",
    description: item?.description ?? "",
    images: (item?.images as ProductImage[]) ?? [],
    searchKeywords: item?.searchKeywords ?? [],
    aliases: item?.aliases ?? [],
    commonNames: item?.commonNames ?? [],
    quantity: String(item?.quantity ?? 0),
    unit: item?.unit ?? "pcs",
    minimumQuantity: String(item?.minimumQuantity ?? 0),
    reorderQuantity: String(item?.reorderQuantity ?? 0),
    warehouse: item?.warehouse ?? "",
    rack: item?.rack ?? "",
    shelf: item?.shelf ?? "",
    bin: item?.bin ?? "",
  };
}

export function ItemForm({
  mode,
  item,
}: {
  mode: "create" | "edit";
  item?: InventoryItemDTO;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() => fromDTO(item));
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategoryDTO[]>([]);
  const [units, setUnits] = React.useState<UnitDTO[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [duplicates, setDuplicates] = React.useState<DuplicateHit[]>([]);
  const [showDup, setShowDup] = React.useState(false);

  // AI state
  const [ai, setAi] = React.useState<AiSuggestion | null>(
    item?.ai
      ? {
          suggestedNames: item.ai.names,
          searchKeywords: item.ai.searchKeywords,
          commonNames: item.ai.commonNames,
          laymanTerms: item.ai.laymanTerms,
          spellingVariations: item.ai.spellingVariations,
          model: item.ai.model,
          mock: item.ai.mock,
        }
      : null,
  );
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    api<CategoryDTO[]>("/api/categories").then(setCategories).catch(() => {});
    api<SubcategoryDTO[]>("/api/subcategories").then(setSubcategories).catch(() => {});
    api<UnitDTO[]>("/api/units").then(setUnits).catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const subForCategory = subcategories.filter(
    (s) => !form.categoryId || s.categoryId === form.categoryId,
  );

  const primaryImage = form.images[0]?.url ?? null;

  /** Run vision analysis for the primary image and merge keywords. */
  const analyze = React.useCallback(async (imageUrl: string) => {
    setAnalyzing(true);
    try {
      const data = await api<AiSuggestion>("/api/ai/suggest", {
        method: "POST",
        json: { imageUrl },
      });
      setAi(data);
      // Auto-fill search keywords with AI terms (layman + spelling included).
      const terms = [
        ...data.searchKeywords,
        ...data.commonNames,
        ...data.laymanTerms,
        ...data.spellingVariations,
      ];
      setForm((f) => ({
        ...f,
        searchKeywords: Array.from(new Set([...f.searchKeywords, ...terms])),
        // If no name yet, pre-fill primary with the AI's top pick.
        itemName: f.itemName || data.suggestedNames[0] || "",
      }));
      toast[data.mock ? "message" : "success"](
        data.mock ? "AI mock used" : "AI analysis complete",
        data.mock
          ? { description: "Ollama unreachable — showing placeholder names." }
          : undefined,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const addReference = (name: string) => {
    setForm((f) =>
      f.referenceNames.some((n) => n.toLowerCase() === name.toLowerCase()) ||
      f.itemName.toLowerCase() === name.toLowerCase()
        ? f
        : { ...f, referenceNames: [...f.referenceNames, name] },
    );
  };

  const setPrimary = (name: string) => {
    setForm((f) => {
      // Demote the existing primary into reference names (if any).
      const refs = f.itemName && f.itemName !== name
        ? Array.from(new Set([...f.referenceNames, f.itemName]))
        : f.referenceNames;
      return {
        ...f,
        itemName: name,
        referenceNames: refs.filter((n) => n.toLowerCase() !== name.toLowerCase()),
      };
    });
  };

  const buildPayload = () => ({
    itemName: form.itemName.trim(),
    referenceNames: form.referenceNames,
    categoryId: form.categoryId || null,
    subcategoryId: form.subcategoryId || null,
    description: form.description,
    images: form.images,
    searchKeywords: form.searchKeywords,
    aliases: form.aliases,
    commonNames: form.commonNames,
    ai: ai
      ? {
          names: ai.suggestedNames,
          laymanTerms: ai.laymanTerms,
          searchKeywords: ai.searchKeywords,
          commonNames: ai.commonNames,
          spellingVariations: ai.spellingVariations,
          model: ai.model,
          mock: ai.mock,
          generatedAt:
            (item?.ai?.generatedAt as string | undefined) ??
            new Date().toISOString(),
        }
      : null,
    quantity: Number(form.quantity) || 0,
    unit: form.unit,
    minimumQuantity: Number(form.minimumQuantity) || 0,
    reorderQuantity: Number(form.reorderQuantity) || 0,
    warehouse: form.warehouse,
    rack: form.rack,
    shelf: form.shelf,
    bin: form.bin,
  });

  const persist = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (mode === "create") {
        const created = await api<InventoryItemDTO>("/api/items", {
          method: "POST",
          json: payload,
        });
        toast.success("Item created");
        router.push(`/inventory/${created._id}`);
      } else {
        await api<InventoryItemDTO>(`/api/items/${item!._id}`, {
          method: "PATCH",
          json: payload,
        });
        toast.success("Item updated");
        router.push(`/inventory/${item!._id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
      setShowDup(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) {
      toast.error("Choose or enter a primary name");
      return;
    }

    const nameChanged = mode === "edit" && item && item.itemName !== form.itemName.trim();
    if (mode === "create" || nameChanged) {
      try {
        const { duplicates: hits } = await api<{ duplicates: DuplicateHit[] }>(
          "/api/items/duplicates",
          {
            method: "POST",
            json: {
              itemName: form.itemName.trim(),
              referenceNames: form.referenceNames,
              searchKeywords: form.searchKeywords,
              excludeId: mode === "edit" ? item!._id : undefined,
            },
          },
        );
        if (hits.length) {
          setDuplicates(hits);
          setShowDup(true);
          return;
        }
      } catch {
        /* don't block saving on a failed duplicate check */
      }
    }
    await persist();
  };

  const hasImage = form.images.length > 0;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 p-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* STEP 1 — Image first */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              Product Image
            </CardTitle>
            <CardDescription>
              Start by uploading a photo. We&apos;ll analyze it for name and
              search-term suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
              onPrimaryUploaded={(img) => analyze(img.url)}
            />
          </CardContent>
        </Card>

        {/* STEP 2 — Naming */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Naming
            </CardTitle>
            <CardDescription>
              Pick one primary name; keep the rest as reference names. You can
              also type your own.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI candidate names */}
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI suggested names
                  {ai?.mock ? (
                    <Badge variant="warning" className="ml-1">mock</Badge>
                  ) : ai ? (
                    <Badge variant="secondary" className="ml-1">{ai.model}</Badge>
                  ) : null}
                </p>
                {hasImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => primaryImage && analyze(primaryImage)}
                    disabled={analyzing}
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {ai ? "Re-analyze" : "Analyze"}
                  </Button>
                )}
              </div>

              {!hasImage ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Upload an image above to get suggestions.
                </p>
              ) : analyzing ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing image…
                </p>
              ) : ai && ai.suggestedNames.length ? (
                <div className="space-y-2">
                  {ai.suggestedNames.map((name) => {
                    const isPrimary = form.itemName.toLowerCase() === name.toLowerCase();
                    const isRef = form.referenceNames.some(
                      (n) => n.toLowerCase() === name.toLowerCase(),
                    );
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5"
                      >
                        <span className="truncate text-sm">{name}</span>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={isPrimary ? "default" : "outline"}
                            onClick={() => setPrimary(name)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            {isPrimary ? "Primary" : "Set primary"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isPrimary || isRef}
                            onClick={() => addReference(name)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {isRef ? "Added" : "Reference"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {ai.laymanTerms.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-1 text-xs text-muted-foreground">Layman words</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ai.laymanTerms.map((t) => (
                          <button key={t} type="button" onClick={() => addReference(t)} title="Add to reference names">
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              {t}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="itemName">Primary Name *</Label>
              <Input
                id="itemName"
                value={form.itemName}
                onChange={(e) => set("itemName", e.target.value)}
                placeholder="e.g. Copper Wire"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reference Names</Label>
              <TagInput
                value={form.referenceNames}
                onChange={(t) => set("referenceNames", t)}
                placeholder="Alternate names for lookup…"
              />
            </div>
          </CardContent>
        </Card>

        {/* STEP 3 — Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </span>
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.categoryId || NONE}
                  onValueChange={(v) => {
                    set("categoryId", v === NONE ? "" : v);
                    set("subcategoryId", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sub Category</Label>
                <Select
                  value={form.subcategoryId || NONE}
                  onValueChange={(v) => set("subcategoryId", v === NONE ? "" : v)}
                  disabled={!form.categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {subForCategory.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional details about this item"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Search Keywords</Label>
              <TagInput
                value={form.searchKeywords}
                onChange={(t) => set("searchKeywords", t)}
                placeholder="wire, cable, electric wire…"
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled from AI terms; edit freely. Used for typo-tolerant search.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* STEP 4 — Stock & location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              Stock &amp; Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Quantity" value={form.quantity} onChange={(v) => set("quantity", v)} />
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit</Label>
                {units.length > 0 ? (
                  <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u._id} value={u.symbol}>
                          {u.name} ({u.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="unit" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pcs, m, kg" />
                )}
              </div>
              <NumberField label="Minimum Qty" value={form.minimumQuantity} onChange={(v) => set("minimumQuantity", v)} />
              <NumberField label="Reorder Qty" value={form.reorderQuantity} onChange={(v) => set("reorderQuantity", v)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField label="Warehouse" value={form.warehouse} onChange={(v) => set("warehouse", v)} />
              <TextField label="Rack" value={form.rack} onChange={(v) => set("rack", v)} />
              <TextField label="Shelf" value={form.shelf} onChange={(v) => set("shelf", v)} />
              <TextField label="Bin" value={form.bin} onChange={(v) => set("bin", v)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky action sidebar */}
      <div className="space-y-4">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Primary name" value={form.itemName || "—"} />
            <SummaryRow label="Reference names" value={form.referenceNames.length ? String(form.referenceNames.length) : "0"} />
            <SummaryRow label="Keywords" value={String(form.searchKeywords.length)} />
            <SummaryRow label="Images" value={String(form.images.length)} />
            <SummaryRow
              label="AI"
              value={ai ? (ai.mock ? "mock" : ai.model) : "not run"}
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mode === "create" ? "Create Item" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DuplicateDialog
        open={showDup}
        duplicates={duplicates}
        onContinue={persist}
        onCancel={() => setShowDup(false)}
      />
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
