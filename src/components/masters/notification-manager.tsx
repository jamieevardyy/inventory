"use client";

import * as React from "react";
import { Plus, Bell, Loader2, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchiveButton } from "@/components/masters/archive-button";
import type {
  CategoryDTO,
  SubcategoryDTO,
  NotificationRuleDTO,
  NotificationRuleType,
} from "@/lib/types";

const NONE = "__none__";

export function NotificationManager() {
  const [rules, setRules] = React.useState<NotificationRuleDTO[]>([]);
  const [categories, setCategories] = React.useState<CategoryDTO[]>([]);
  const [subcategories, setSubcategories] = React.useState<SubcategoryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [r, c, s] = await Promise.all([
        api<NotificationRuleDTO[]>("/api/notifications"),
        api<CategoryDTO[]>("/api/categories"),
        api<SubcategoryDTO[]>("/api/subcategories"),
      ]);
      setRules(r);
      setCategories(c);
      setSubcategories(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load rules");
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
        <NotificationDialog
          categories={categories}
          subcategories={subcategories}
          onSaved={load}
        />
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No notification rules yet</p>
            <p className="text-sm text-muted-foreground">
              Set up low-stock and reorder alerts by category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const cat = categories.find((c) => c._id === rule.categoryId);
            const sub = subcategories.find((s) => s._id === rule.subcategoryId);
            return (
              <Card key={rule._id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{rule.name}</p>
                      <Badge variant="outline" className="capitalize">
                        {rule.type.replace("_", " ")}
                      </Badge>
                      {rule.active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Threshold: {rule.threshold}
                      {cat ? ` · ${cat.name}` : ""}
                      {sub ? ` → ${sub.name}` : ""}
                      {rule.notifyEmail ? ` · ${rule.notifyEmail}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <NotificationDialog
                      rule={rule}
                      categories={categories}
                      subcategories={subcategories}
                      onSaved={load}
                    />
                    <ArchiveButton
                      label={`Archive “${rule.name}”?`}
                      onConfirm={async () => {
                        await api(`/api/notifications/${rule._id}`, { method: "DELETE" });
                        toast.success("Rule archived");
                        load();
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationDialog({
  rule,
  categories,
  subcategories,
  onSaved,
}: {
  rule?: NotificationRuleDTO;
  categories: CategoryDTO[];
  subcategories: SubcategoryDTO[];
  onSaved: () => void;
}) {
  const editing = Boolean(rule);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(rule?.name ?? "");
  const [type, setType] = React.useState<NotificationRuleType>(rule?.type ?? "low_stock");
  const [categoryId, setCategoryId] = React.useState(rule?.categoryId ?? NONE);
  const [subcategoryId, setSubcategoryId] = React.useState(rule?.subcategoryId ?? NONE);
  const [threshold, setThreshold] = React.useState(String(rule?.threshold ?? 0));
  const [notifyEmail, setNotifyEmail] = React.useState(rule?.notifyEmail ?? "");
  const [active, setActive] = React.useState(rule?.active ?? true);
  const [saving, setSaving] = React.useState(false);

  const filteredSubs = subcategories.filter(
    (s) => categoryId === NONE || s.categoryId === categoryId,
  );

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        categoryId: categoryId === NONE ? null : categoryId,
        subcategoryId: subcategoryId === NONE ? null : subcategoryId,
        threshold: Number(threshold),
        notifyEmail,
        active,
      };
      if (editing) {
        await api(`/api/notifications/${rule!._id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/notifications", { method: "POST", json: payload });
      }
      toast.success(editing ? "Rule updated" : "Rule created");
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
          <Button variant="ghost" size="icon" aria-label="Edit rule">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Rule" : "New Rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationRuleType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="reorder">Reorder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(NONE); }}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>All</SelectItem>
                  {filteredSubs.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Threshold</Label>
              <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notify Email</Label>
              <Input value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
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
