"use client";

import * as React from "react";
import {
  Plus,
  MapPin,
  Loader2,
  Pencil,
  ChevronRight,
  CornerDownRight,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchiveButton } from "@/components/masters/archive-button";
import type { LocationDTO } from "@/lib/types";

const LOCATION_TYPES = ["warehouse", "rack", "shelf", "bin", "other"];
const NONE = "__none__";

function sortHierarchy(list: LocationDTO[]): LocationDTO[] {
  const map = new Map<string, LocationDTO[]>();
  list.forEach((loc) => {
    const parent = loc.parentLocationId || "root";
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent)!.push(loc);
  });
  const result: LocationDTO[] = [];
  function walk(parentId: string | null) {
    const children = map.get(parentId || "root") || [];
    children.sort((a, b) => a.name.localeCompare(b.name));
    for (const child of children) {
      result.push(child);
      walk(child._id);
    }
  }
  walk(null);
  return result;
}

function depth(loc: LocationDTO, all: LocationDTO[]): number {
  let d = 0;
  let current: LocationDTO | undefined = loc;
  while (current?.parentLocationId) {
    d++;
    current = all.find((x) => x._id === current?.parentLocationId);
  }
  return d;
}

export function LocationManager() {
  const [locations, setLocations] = React.useState<LocationDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<LocationDTO[]>("/api/locations");
      setLocations(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? locations.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            (l.type || "").toLowerCase().includes(q) ||
            (l.code || "").toLowerCase().includes(q),
        )
      : locations;
    return sortHierarchy(base);
  }, [locations, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <LocationDialog locations={locations} onSaved={load} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No locations yet</p>
            <p className="text-sm text-muted-foreground">
              Create warehouses, racks, shelves, and bins in a hierarchy.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((loc) => (
            <Card key={loc._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: depth(loc, locations) * 20 }}
                >
                  {depth(loc, locations) > 0 ? (
                    <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{loc.name}</span>
                  {loc.type ? <Badge variant="outline">{loc.type}</Badge> : null}
                  {loc.code ? (
                    <span className="text-xs text-muted-foreground">{loc.code}</span>
                  ) : null}
                  {!loc.isActive ? <Badge variant="secondary">Inactive</Badge> : null}
                </div>
                <div className="flex gap-1.5">
                  <LocationDialog location={loc} locations={locations} onSaved={load} />
                  <ArchiveButton
                    label={`Archive “${loc.name}”?`}
                    onConfirm={async () => {
                      await api(`/api/locations/${loc._id}`, { method: "DELETE" });
                      toast.success("Location archived");
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

function LocationDialog({
  location,
  locations,
  onSaved,
}: {
  location?: LocationDTO;
  locations: LocationDTO[];
  onSaved: () => void;
}) {
  const editing = Boolean(location);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(location?.name ?? "");
  const [type, setType] = React.useState(location?.type ?? "warehouse");
  const [code, setCode] = React.useState(location?.code ?? "");
  const [description, setDescription] = React.useState(location?.description ?? "");
  const [parentLocationId, setParentLocationId] = React.useState(
    location?.parentLocationId ?? NONE,
  );
  const [isActive, setIsActive] = React.useState(location?.isActive ?? true);
  const [saving, setSaving] = React.useState(false);

  const parents = locations.filter((l) => l._id !== location?._id);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        code,
        description,
        parentLocationId: parentLocationId === NONE ? null : parentLocationId,
        isActive,
      };
      if (editing) {
        await api(`/api/locations/${location!._id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/locations", { method: "POST", json: payload });
      }
      toast.success(editing ? "Location updated" : "Location created");
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
          <Button variant="ghost" size="icon" aria-label="Edit location">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Location" : "New Location"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Warehouse" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Parent Location</Label>
            <Select value={parentLocationId} onValueChange={setParentLocationId}>
              <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None (top level)</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
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
