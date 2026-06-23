import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeItem } from "@/lib/serialize";
import { PageHeader } from "@/components/layout/page-header";
import { ItemForm } from "@/components/inventory/item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: { id: string };
}) {
  if (!ObjectId.isValid(params.id)) notFound();
  const col = await Collections.items();
  const doc = await col.findOne({ _id: new ObjectId(params.id) });
  if (!doc) notFound();
  const item = serializeItem(doc);

  return (
    <div>
      <PageHeader title="Edit Item" description={item.itemName} />
      <ItemForm mode="edit" item={item} />
    </div>
  );
}
