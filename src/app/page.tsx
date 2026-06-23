import Link from "next/link";
import {
  Package,
  FolderTree,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/inventory/stock-badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const stat = (
  label: string,
  value: number,
  Icon: typeof Package,
  href: string,
  tone: string,
) => (
  <Link key={label} href={href}>
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default async function DashboardPage() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch {
    stats = null;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory at a glance"
      >
        <Button asChild>
          <Link href="/inventory/new">
            <PlusCircle className="h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        {!stats ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Could not connect to the database. Check <code>MONGODB_URI</code> in
              your <code>.env.local</code>, then refresh.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stat("Total Items", stats.totalItems, Package, "/inventory", "bg-blue-100 text-blue-700")}
              {stat("Categories", stats.totalCategories, FolderTree, "/categories", "bg-violet-100 text-violet-700")}
              {stat("Low Stock", stats.lowStock, AlertTriangle, "/inventory?stock=low", "bg-amber-100 text-amber-700")}
              {stat("Out of Stock", stats.outOfStock, XCircle, "/inventory?stock=out", "bg-red-100 text-red-700")}
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Recently Added Items</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/inventory">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {stats.recentItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No items yet. Run <code>npm run seed</code> for demo data, or
                    add your first item.
                  </p>
                ) : (
                  <div className="divide-y">
                    {stats.recentItems.map((item) => (
                      <Link
                        key={item._id}
                        href={`/inventory/${item._id}`}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-3">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0].url}
                              alt={item.itemName}
                              className="h-10 w-10 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {item.quantity} {item.unit}
                          </Badge>
                          <StockBadge item={item} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
