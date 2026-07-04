"use client";

import * as React from "react";
import { Plus, Ruler, Loader2, Pencil } from "lucide-react";
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
import type { UnitDTO } from "@/lib/types";

export function UnitManager() {
  const [units, setUnits] = React.useState<UnitDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setUnits(await api<UnitDTO[]>("/api/units"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load units");
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
        <UnitDialog onSaved={load} />
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Ruler className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No units yet</p>
            <p className="text-sm text-muted-foreground">
              Define units of measure like pcs, kg, m, box.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => (
            <Card key={u._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <Badge variant="outline" className="mt-1">{u.symbol}</Badge>
                  {u.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{u.description}</p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <UnitDialog unit={u} onSaved={load} />
                  <ArchiveButton
                    label={`Archive “${u.name}”?`}
                    onConfirm={async () => {
                      await api(`/api/units/${u._id}`, { method: "DELETE" });
                      toast.success("Unit archived");
                      load();
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UnitDialog({
  unit,
  onSaved,
}: {
  unit?: UnitDTO;
  onSaved: () => void;
}) {
  const editing = Boolean(unit);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(unit?.name ?? "");
  const [symbol, setSymbol] = React.useState(unit?.symbol ?? "");
  const [description, setDescription] = React.useState(unit?.description ?? "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim() || !symbol.trim()) return toast.error("Name and symbol are required");
    setSaving(true);
    try {
      const payload = { name, symbol, description };
      if (editing) {
        await api(`/api/units/${unit!._id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/units", { method: "POST", json: payload });
      }
      toast.success(editing ? "Unit updated" : "Unit created");
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
          <Button variant="ghost" size="icon" aria-label="Edit unit">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Unit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Unit" : "New Unit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pieces" />
          </div>
          <div className="space-y-1.5">
            <Label>Symbol</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. pcs" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
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
