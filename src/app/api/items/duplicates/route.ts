import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeItem } from "@/lib/serialize";
import { duplicateCheckSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";
import { itemTokens, normalize, scoreItem } from "@/lib/search";
import type { InventoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Find potential duplicates of a candidate item by comparing its name,
 * aliases, keywords and common names against existing inventory.
 */
export const POST = handle(async (req: Request) => {
  const body = duplicateCheckSchema.parse(await req.json());
  const col = await Collections.items();

  // Build a token set from the candidate's identifying fields.
  const candidateTokens = itemTokens({
    itemName: body.itemName,
    referenceNames: body.referenceNames,
    searchKeywords: body.searchKeywords,
    aliases: body.aliases,
    commonNames: body.commonNames,
  });

  const filter: Record<string, unknown> = {};
  if (body.excludeId && ObjectId.isValid(body.excludeId)) {
    filter._id = { $ne: new ObjectId(body.excludeId) };
  }

  const existing = await col
    .find(filter, {
      projection: {
        itemName: 1,
        referenceNames: 1,
        searchKeywords: 1,
        aliases: 1,
        commonNames: 1,
        quantity: 1,
        unit: 1,
        images: 1,
        categoryId: 1,
        subcategoryId: 1,
        description: 1,
        minimumQuantity: 1,
        reorderQuantity: 1,
        warehouse: 1,
        rack: 1,
        shelf: 1,
        bin: 1,
        createdBy: 1,
        modifiedBy: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    })
    .limit(5000)
    .toArray();

  const candidateName = normalize(body.itemName);

  const scored = existing
    .map((item) => {
      // Score by candidate name vs existing item + token overlap both ways.
      const nameScore = scoreItem(body.itemName, item as InventoryItem);
      const reverseScore = scoreItem(item.itemName, {
        itemName: body.itemName,
        referenceNames: body.referenceNames,
        searchKeywords: body.searchKeywords,
        aliases: body.aliases,
        commonNames: body.commonNames,
      });
      const existingTokens = itemTokens(item as InventoryItem);
      const overlap = candidateTokens.filter((t) =>
        existingTokens.includes(t),
      ).length;
      const exact = normalize(item.itemName) === candidateName ? 100 : 0;
      return { item, score: exact + nameScore + reverseScore + overlap * 5 };
    })
    .filter((r) => r.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return ok({
    duplicates: scored.map((r) => ({
      score: r.score,
      item: serializeItem(r.item as InventoryItem),
    })),
  });
});
