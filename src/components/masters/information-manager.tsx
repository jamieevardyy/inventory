"use client";

import * as React from "react";
import { Plus, Info, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchiveButton } from "@/components/masters/archive-button";
import type { InformationDTO, InformationType } from "@/lib/types";

export function InformationManager() {
  const [items, setItems] = React.useState<InformationDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<InformationDTO[]>("/api/informations"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load informations");
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
        <InformationDialog onSaved={load} />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Info className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No information entries yet</p>
            <p className="text-sm text-muted-foreground">
              Store reference notes and general information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.createdBy} · {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <InformationDialog entry={item} onSaved={load} />
                    <ArchiveButton
                      label="Archive this entry?"
                      onConfirm={async () => {
                        await api(`/api/informations/${item._id}`, { method: "DELETE" });
                        toast.success("Entry archived");
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

function InformationDialog({
  entry,
  onSaved,
}: {
  entry?: InformationDTO;
  onSaved: () => void;
}) {
  const editing = Boolean(entry);
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState(entry?.content ?? "");
  const [type, setType] = React.useState<InformationType>(entry?.type ?? "general");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!content.trim()) return toast.error("Content is required");
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/informations/${entry!._id}`, {
          method: "PATCH",
          json: { content, type },
        });
      } else {
        await api("/api/informations", { method: "POST", json: { content, type } });
      }
      toast.success(editing ? "Entry updated" : "Entry created");
      setOpen(false);
      if (!editing) setContent("");
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
          <Button variant="ghost" size="icon" aria-label="Edit entry">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Entry" : "New Entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as InformationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Enter reference information…"
            />
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
