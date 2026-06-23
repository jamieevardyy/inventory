"use client";

import * as React from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  STOCK_IN_TYPES,
  type MovementType,
  type StockMovementDTO,
  type InventoryItemDTO,
} from "@/lib/types";

const TYPE_LABELS: Record<MovementType, string> = {
  purchase: "Purchase",
  return: "Return",
  transfer_in: "Transfer In",
  consumption: "Consumption",
  sale: "Sale",
  transfer_out: "Transfer Out",
  damaged: "Damaged",
};

export function StockMovementPanel({ item }: { item: InventoryItemDTO }) {
  const router = useRouter();
  const [type, setType] = React.useState<MovementType>("purchase");
  const [qty, setQty] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [history, setHistory] = React.useState<StockMovementDTO[]>([]);
  const [qtyNow, setQtyNow] = React.useState(item.quantity);

  const loadHistory = React.useCallback(async () => {
    try {
      const data = await api<StockMovementDTO[]>(`/api/items/${item._id}/stock`);
      setHistory(data);
    } catch {
      /* ignore */
    }
  }, [item._id]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(qty);
    if (!n || n <= 0) {
      toast.error("Enter a quantity greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ item: InventoryItemDTO; movement: StockMovementDTO }>(
        `/api/items/${item._id}/stock`,
        { method: "POST", json: { movementType: type, quantity: n, remarks } },
      );
      setQtyNow(res.item.quantity);
      setQty("");
      setRemarks("");
      await loadHistory();
      toast.success(`Stock updated — now ${res.item.quantity} ${res.item.unit}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record movement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Stock Movement</span>
          <Badge variant="outline">
            On hand: {qtyNow} {item.unit}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Movement Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {STOCK_IN_TYPES.includes(value as MovementType) ? "↑ " : "↓ "}
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional note (PO number, reason…)"
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : STOCK_IN_TYPES.includes(type) ? (
              <ArrowUpCircle className="h-4 w-4" />
            ) : (
              <ArrowDownCircle className="h-4 w-4" />
            )}
            Record movement
          </Button>
        </form>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <History className="h-4 w-4" /> History
          </p>
          {history.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No movements recorded yet.
            </p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {history.map((m) => {
                const isIn = STOCK_IN_TYPES.includes(m.movementType);
                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{TYPE_LABELS[m.movementType]}</span>
                      {m.remarks ? (
                        <span className="ml-1 text-muted-foreground">· {m.remarks}</span>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={isIn ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                        {isIn ? "+" : "−"}
                        {m.quantity}
                      </span>
                      <p className="text-xs text-muted-foreground">→ {m.balanceAfter}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
