"use client";

import * as React from "react";
import { Plus, Users, Loader2, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchiveButton } from "@/components/masters/archive-button";
import type { UserDTO, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["admin", "staff", "viewer"];

export function UserManager() {
  const [users, setUsers] = React.useState<UserDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api<UserDTO[]>("/api/users"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
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
        <UserDialog onSaved={load} />
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No users yet</p>
            <p className="text-sm text-muted-foreground">
              Add staff members for audit trails and access tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((u) => (
            <Card key={u._id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{u.role}</Badge>
                  {u.email ? <p className="mt-1 text-sm text-muted-foreground">{u.email}</p> : null}
                  {u.phone ? <p className="text-sm text-muted-foreground">{u.phone}</p> : null}
                </div>
                <div className="flex gap-1">
                  <UserDialog user={u} onSaved={load} />
                  <ArchiveButton
                    label={`Archive “${u.name}”?`}
                    onConfirm={async () => {
                      await api(`/api/users/${u._id}`, { method: "DELETE" });
                      toast.success("User archived");
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

function UserDialog({
  user,
  onSaved,
}: {
  user?: UserDTO;
  onSaved: () => void;
}) {
  const editing = Boolean(user);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [role, setRole] = React.useState<UserRole>(user?.role ?? "staff");
  const [notes, setNotes] = React.useState(user?.notes ?? "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = { name, email, phone, role, notes };
      if (editing) {
        await api(`/api/users/${user!._id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/users", { method: "POST", json: payload });
      }
      toast.success(editing ? "User updated" : "User created");
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
          <Button variant="ghost" size="icon" aria-label="Edit user">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
