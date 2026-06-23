import { Badge } from "@/components/ui/badge";
import type { InventoryItemDTO } from "@/lib/types";

export function stockStatus(item: Pick<InventoryItemDTO, "quantity" | "minimumQuantity">) {
  if (item.quantity <= 0) return "out" as const;
  if (item.quantity <= item.minimumQuantity) return "low" as const;
  return "ok" as const;
}

export function StockBadge({
  item,
}: {
  item: Pick<InventoryItemDTO, "quantity" | "minimumQuantity">;
}) {
  const status = stockStatus(item);
  if (status === "out") return <Badge variant="destructive">Out of stock</Badge>;
  if (status === "low") return <Badge variant="warning">Low stock</Badge>;
  return <Badge variant="success">In stock</Badge>;
}
