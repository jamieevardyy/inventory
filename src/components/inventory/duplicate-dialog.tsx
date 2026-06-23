"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InventoryItemDTO } from "@/lib/types";

export interface DuplicateHit {
  score: number;
  item: InventoryItemDTO;
}

interface Props {
  open: boolean;
  duplicates: DuplicateHit[];
  onContinue: () => void;
  onCancel: () => void;
}

export function DuplicateDialog({ open, duplicates, onContinue, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Potential duplicate items found
          </DialogTitle>
          <DialogDescription>
            Similar items already exist. You can edit an existing one, continue
            saving as a new item, or cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {duplicates.map(({ item, score }) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.itemName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Qty {item.quantity} {item.unit}
                  {item.aliases?.length ? ` · ${item.aliases.slice(0, 3).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">match {score}</Badge>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/inventory/${item._id}`}>Edit existing</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onContinue}>Continue anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
