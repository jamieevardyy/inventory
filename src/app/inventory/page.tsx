"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, PlusCircle, Package, Loader2 } from "lucide-react";
import { api } from "@/lib/client";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StockBadge } from "@/components/inventory/stock-badge";
import type { InventoryItemDTO } from "@/lib/types";

interface ItemsResponse {
  items: InventoryItemDTO[];
  total: number;
  page: number;
  limit: number;
}

const STOCK_FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
] as const;

function InventoryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const stock = (params.get("stock") as "low" | "out" | "all") ?? "all";

  const [q, setQ] = React.useState(initialQ);
  const [data, setData] = React.useState<ItemsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Debounced fetch whenever query or stock filter changes.
  React.useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (stock && stock !== "all") sp.set("stock", stock);
        sp.set("limit", "50");
        const res = await api<ItemsResponse>(`/api/items?${sp.toString()}`);
        setData(res);
      } catch {
        setData({ items: [], total: 0, page: 1, limit: 50 });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q, stock]);

  const setStock = (key: string) => {
    const sp = new URLSearchParams(params.toString());
    if (key === "all") sp.delete("stock");
    else sp.set("stock", key);
    router.replace(`/inventory?${sp.toString()}`);
  };

  return (
    <div>
      <PageHeader title="Inventory" description={data ? `${data.total} item(s)` : ""}>
        <Button asChild>
          <Link href="/inventory/new">
            <PlusCircle className="h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, keyword, alias… (typo-tolerant, e.g. “cabel”)"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {STOCK_FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={stock === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setStock(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : !data || data.items.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No items found</p>
            <p className="text-sm text-muted-foreground">
              {q ? "Try a different search term." : "Add your first item to get started."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((item) => (
              <Link key={item._id} href={`/inventory/${item._id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0].url}
                        alt={item.itemName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{item.itemName}</p>
                      <StockBadge item={item} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </p>
                    {item.searchKeywords?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {item.searchKeywords.slice(0, 3).map((kw) => (
                          <Badge key={kw} variant="outline" className="text-[10px]">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <InventoryInner />
    </React.Suspense>
  );
}
