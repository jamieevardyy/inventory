"use client";

import * as React from "react";
import {
  Plus,
  FolderTree,
  Loader2,
  Pencil,
  ChevronRight,
  CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArchiveButton } from "@/components/masters/archive-button";
import type { CategoryDTO, SubcategoryDTO } from "@/lib/types";

export function CategoryManager() {
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [subs, setSubs] = React.useState<SubcategoryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api<CategoryDTO[]>("/api/categories"),
        api<SubcategoryDTO[]>("/api/subcategories"),
      ]);
      setCategories(c);
      setSubs(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories");
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
        <CategoryDialog onSaved={load} />
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create a category, then add subcategories under it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const children = subs.filter((s) => s.categoryId === cat._id);
            return (
              <Card key={cat._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="outline">{children.length} sub</Badge>
                    </div>
                    <div className="flex gap-1.5">
                      <SubcategoryDialog categoryId={cat._id} onSaved={load} />
                      <CategoryDialog category={cat} onSaved={load} />
                      <ArchiveButton
                        label={`Archive “${cat.name}”?`}
                        onConfirm={async () => {
                          await api(`/api/categories/${cat._id}`, { method: "DELETE" });
                          toast.success("Category archived");
                          load();
                        }}
                      />
                    </div>
                  </div>

                  {children.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-l pl-6">
                      {children.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/40"
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                            {sub.name}
                          </span>
                          <div className="flex gap-1.5">
                            <SubcategoryDialog
                              categoryId={cat._id}
                              subcategory={sub}
                              onSaved={load}
                            />
                            <ArchiveButton
                              label={`Archive “${sub.name}”?`}
                              onConfirm={async () => {
                                await api(`/api/subcategories/${sub._id}`, { method: "DELETE" });
                                toast.success("Subcategory archived");
                                load();
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  onSaved,
}: {
  category?: CategoryDTO;
  onSaved: () => void;
}) {
  const editing = Boolean(category);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(category?.name ?? "");
  const [description, setDescription] = React.useState(category?.description ?? "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/categories/${category!._id}`, {
          method: "PATCH",
          json: { name, description },
        });
      } else {
        await api("/api/categories", { method: "POST", json: { name, description } });
      }
      toast.success(editing ? "Category updated" : "Category created");
      setOpen(false);
      if (!editing) {
        setName("");
        setDescription("");
      }
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
          <Button variant="ghost" size="icon" aria-label="Edit category">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electrical" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubcategoryDialog({
  categoryId,
  subcategory,
  onSaved,
}: {
  categoryId: string;
  subcategory?: SubcategoryDTO;
  onSaved: () => void;
}) {
  const editing = Boolean(subcategory);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(subcategory?.name ?? "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/subcategories/${subcategory!._id}`, {
          method: "PATCH",
          json: { name },
        });
      } else {
        await api("/api/subcategories", {
          method: "POST",
          json: { categoryId, name },
        });
      }
      toast.success(editing ? "Subcategory updated" : "Subcategory created");
      setOpen(false);
      if (!editing) setName("");
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
          <Button variant="ghost" size="icon" aria-label="Edit subcategory">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Subcategory
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Subcategory" : "New Subcategory"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wires & Cables" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
