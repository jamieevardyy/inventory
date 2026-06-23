import { ObjectId } from "mongodb";
import { Collections, ensureIndexes } from "@/lib/mongodb";
import { serializeItem } from "@/lib/serialize";
import { itemSchema } from "@/lib/validators";
import { handle, ok, currentUser } from "@/lib/api";
import { searchItems } from "@/lib/item-search";
import type { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const result = await searchItems({
    q: sp.get("q") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    subcategoryId: sp.get("subcategoryId") || undefined,
    stock: (sp.get("stock") as "low" | "out" | "all") || undefined,
    page: Number(sp.get("page")) || 1,
    limit: Number(sp.get("limit")) || 20,
  });
  return ok({
    items: result.items.map(serializeItem),
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

export const POST = handle(async (req: Request) => {
  const body = itemSchema.parse(await req.json());
  await ensureIndexes();
  const col = await Collections.items();
  const now = new Date();
  const user = currentUser();

  const doc: Omit<InventoryItem, "_id"> = {
    itemName: body.itemName,
    referenceNames: body.referenceNames,
    categoryId: body.categoryId ? new ObjectId(body.categoryId) : null,
    subcategoryId: body.subcategoryId ? new ObjectId(body.subcategoryId) : null,
    description: body.description,
    images: body.images.map((img) => ({
      url: img.url,
      fileName: img.fileName,
      storagePath: img.storagePath,
      uploadDate: img.uploadDate ? new Date(img.uploadDate) : now,
    })),
    searchKeywords: body.searchKeywords,
    aliases: body.aliases,
    commonNames: body.commonNames,
    ai: body.ai
      ? {
          names: body.ai.names,
          laymanTerms: body.ai.laymanTerms,
          searchKeywords: body.ai.searchKeywords,
          commonNames: body.ai.commonNames,
          spellingVariations: body.ai.spellingVariations,
          model: body.ai.model,
          mock: body.ai.mock,
          generatedAt: body.ai.generatedAt ? new Date(body.ai.generatedAt) : now,
        }
      : null,
    quantity: body.quantity,
    unit: body.unit || "pcs",
    minimumQuantity: body.minimumQuantity,
    reorderQuantity: body.reorderQuantity,
    warehouse: body.warehouse,
    rack: body.rack,
    shelf: body.shelf,
    bin: body.bin,
    createdBy: user,
    modifiedBy: user,
    createdAt: now,
    updatedAt: now,
  };

  const res = await col.insertOne(doc as never);
  const created = await col.findOne({ _id: res.insertedId });
  return ok(serializeItem(created!), { status: 201 });
});
