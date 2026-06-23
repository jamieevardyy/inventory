import { notFound } from "next/navigation";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { ArrowLeft, MapPin, Tag, Package, Sparkles } from "lucide-react";
import { Collections } from "@/lib/mongodb";
import { serializeItem } from "@/lib/serialize";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockBadge } from "@/components/inventory/stock-badge";
import { StockMovementPanel } from "@/components/inventory/stock-movement-panel";
import { ItemActions } from "@/components/inventory/item-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadItem(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const col = await Collections.items();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  let categoryName = "";
  let subcategoryName = "";
  if (doc.categoryId) {
    const c = await (await Collections.categories()).findOne({ _id: doc.categoryId });
    categoryName = c?.name ?? "";
  }
  if (doc.subcategoryId) {
    const s = await (await Collections.subcategories()).findOne({ _id: doc.subcategoryId });
    subcategoryName = s?.name ?? "";
  }
  return { item: serializeItem(doc), categoryName, subcategoryName };
}

function Chips({ label, values }: { label: string; values: string[] }) {
  if (!values?.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary">
            {v}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await loadItem(params.id);
  if (!data) notFound();
  const { item, categoryName, subcategoryName } = data;

  return (
    <div>
      <PageHeader title={item.itemName} description={[categoryName, subcategoryName].filter(Boolean).join(" → ") || "Uncategorized"}>
        <Button asChild variant="ghost">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <ItemActions id={item._id} name={item.itemName} />
      </PageHeader>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overview</span>
                <StockBadge item={item} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {item.images?.length ? (
                <div className="flex flex-wrap gap-3">
                  {item.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.storagePath || img.url}
                      src={img.url}
                      alt={img.fileName}
                      className="h-28 w-28 rounded-md border object-cover"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-md border bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {item.description ? (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Quantity" value={`${item.quantity} ${item.unit}`} />
                <Field label="Minimum" value={String(item.minimumQuantity)} />
                <Field label="Reorder" value={String(item.reorderQuantity)} />
                <Field label="Unit" value={item.unit} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" /> Names &amp; Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Chips label="Reference Names" values={item.referenceNames} />
              <Chips label="Search Keywords" values={item.searchKeywords} />
              <Chips label="Aliases" values={item.aliases} />
              <Chips label="Common Names" values={item.commonNames} />
              {!item.referenceNames?.length &&
              !item.searchKeywords.length &&
              !item.aliases.length &&
              !item.commonNames.length ? (
                <p className="text-sm text-muted-foreground">No additional names or search terms.</p>
              ) : null}
            </CardContent>
          </Card>

          {item.ai ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Analysis
                  {item.ai.mock ? (
                    <Badge variant="warning">mock</Badge>
                  ) : (
                    <Badge variant="secondary">{item.ai.model}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Chips label="AI Suggested Names" values={item.ai.names} />
                <Chips label="Layman Words" values={item.ai.laymanTerms} />
                <Chips label="AI Keywords" values={item.ai.searchKeywords} />
                <Chips label="Spelling Variations" values={item.ai.spellingVariations} />
                <p className="text-xs text-muted-foreground">
                  Generated {formatDate(item.ai.generatedAt)} · stored with the item.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Warehouse" value={item.warehouse || "—"} />
                <Field label="Rack" value={item.rack || "—"} />
                <Field label="Shelf" value={item.shelf || "—"} />
                <Field label="Bin" value={item.bin || "—"} />
              </div>
              <div className="mt-4 grid gap-4 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-2">
                <span>Created by {item.createdBy} · {formatDate(item.createdAt)}</span>
                <span>Modified by {item.modifiedBy} · {formatDate(item.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <StockMovementPanel item={item} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
