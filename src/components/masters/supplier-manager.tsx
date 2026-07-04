"use client";

import * as React from "react";
import { Plus, Building2, Loader2, Pencil, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArchiveButton } from "@/components/masters/archive-button";
import type { CategoryDTO, SubcategoryDTO, SupplierDTO } from "@/lib/types";

export function SupplierManager() {
  const [suppliers, setSuppliers] = React.useState<SupplierDTO[]>([]);
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategoryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, sub] = await Promise.all([
        api<SupplierDTO[]>("/api/suppliers"),
        api<CategoryDTO[]>("/api/categories"),
        api<SubcategoryDTO[]>("/api/subcategories"),
      ]);
      setSuppliers(s);
      setCategories(c);
      setSubcategories(sub);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SupplierDialog
          categories={categories}
          subcategories={subcategories}
          onSaved={load}
        />
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No suppliers yet</p>
            <p className="text-sm text-muted-foreground">
              Add vendors and link them to categories they supply.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {suppliers.map((s) => (
            <Card key={s._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                      {s.phone ? (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {s.phone}
                        </p>
                      ) : null}
                      {s.email ? (
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> {s.email}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.subcategoryIds.length > 0 ? (
                        s.subcategoryIds.map((id) => {
                          const sub = subcategories.find((x) => x._id === id);
                          return sub ? (
                            <Badge key={id} variant="outline" className="text-xs">
                              {sub.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <Badge variant="secondary">No categories linked</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <SupplierDialog
                      supplier={s}
                      categories={categories}
                      subcategories={subcategories}
                      onSaved={load}
                    />
                    <ArchiveButton
                      label={`Archive “${s.name}”?`}
                      onConfirm={async () => {
                        await api(`/api/suppliers/${s._id}`, { method: "DELETE" });
                        toast.success("Supplier archived");
                        load();
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierDialog({
  supplier,
  categories,
  subcategories,
  onSaved,
}: {
  supplier?: SupplierDTO;
  categories: CategoryDTO[];
  subcategories: SubcategoryDTO[];
  onSaved: () => void;
}) {
  const editing = Boolean(supplier);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(supplier?.name ?? "");
  const [phone, setPhone] = React.useState(supplier?.phone ?? "");
  const [email, setEmail] = React.useState(supplier?.email ?? "");
  const [notes, setNotes] = React.useState(supplier?.notes ?? "");
  const [subcategoryIds, setSubcategoryIds] = React.useState<string[]>(
    supplier?.subcategoryIds ?? [],
  );
  const [saving, setSaving] = React.useState(false);

  const toggleSub = (id: string) => {
    setSubcategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const categoryIds = [
        ...new Set(
          subcategoryIds
            .map((id) => subcategories.find((s) => s._id === id)?.categoryId)
            .filter(Boolean) as string[],
        ),
      ];
      const payload = { name, phone, email, notes, categoryIds, subcategoryIds };
      if (editing) {
        await api(`/api/suppliers/${supplier!._id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/suppliers", { method: "POST", json: payload });
      }
      toast.success(editing ? "Supplier updated" : "Supplier created");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon" aria-label="Edit supplier">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Supplier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Supplier" : "New Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Linked Subcategories</Label>
            {categories.map((cat) => {
              const subs = subcategories.filter((s) => s.categoryId === cat._id);
              if (subs.length === 0) return null;
              return (
                <div key={cat._id} className="rounded-md border p-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{cat.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subs.map((sub) => (
                      <label
                        key={sub._id}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={subcategoryIds.includes(sub._id)}
                          onChange={() => toggleSub(sub._id)}
                        />
                        {sub.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
