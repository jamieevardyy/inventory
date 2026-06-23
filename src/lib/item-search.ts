import { ObjectId, type Filter } from "mongodb";
import { Collections } from "./mongodb";
import type { InventoryItem } from "./types";
import { fuzzyMatches, itemTokens, scoreItem } from "./search";

export interface SearchParams {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  /** "low" = at/below minimum (but > 0); "out" = 0; "all" */
  stock?: "low" | "out" | "all";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

function baseFilter(p: SearchParams): Filter<InventoryItem> {
  const filter: Filter<InventoryItem> = {};
  if (p.categoryId && ObjectId.isValid(p.categoryId)) {
    filter.categoryId = new ObjectId(p.categoryId);
  }
  if (p.subcategoryId && ObjectId.isValid(p.subcategoryId)) {
    filter.subcategoryId = new ObjectId(p.subcategoryId);
  }
  if (p.stock === "out") {
    filter.quantity = { $lte: 0 };
  } else if (p.stock === "low") {
    // quantity > 0 AND quantity <= minimumQuantity — expressed with $expr
    filter.$and = [
      { quantity: { $gt: 0 } },
      { $expr: { $lte: ["$quantity", "$minimumQuantity"] } },
    ];
  }
  return filter;
}

/**
 * Smart search combining MongoDB $text, regex, and in-memory fuzzy matching
 * (typo tolerance) across name + keywords + aliases + common names.
 */
export async function searchItems(p: SearchParams): Promise<SearchResult> {
  const col = await Collections.items();
  const page = Math.max(1, p.page || 1);
  const limit = Math.min(100, Math.max(1, p.limit || 20));
  const skip = (page - 1) * limit;
  const filter = baseFilter(p);
  const query = (p.q || "").trim();

  // No search query → simple paginated listing.
  if (!query) {
    const [items, total] = await Promise.all([
      col.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  // 1) Fast candidates: $text OR regex across the searchable fields.
  const rx = new RegExp(
    query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );
  const candidates = await col
    .find({
      ...filter,
      $or: [
        { $text: { $search: query } } as Filter<InventoryItem>,
        { itemName: rx },
        { referenceNames: rx },
        { searchKeywords: rx },
        { aliases: rx },
        { commonNames: rx },
      ],
    })
    .limit(500)
    .toArray();

  const byId = new Map(candidates.map((c) => [c._id.toString(), c]));

  // 2) Fuzzy fallback (typos): scan a capped projection and keep fuzzy hits.
  //    Keeps performance bounded while still catching "cabel" -> "cable".
  const projected = await col
    .find(filter, {
      projection: {
        itemName: 1,
        referenceNames: 1,
        searchKeywords: 1,
        aliases: 1,
        commonNames: 1,
      },
    })
    .limit(5000)
    .toArray();

  const fuzzyHitIds: string[] = [];
  for (const doc of projected) {
    const id = doc._id.toString();
    if (byId.has(id)) continue;
    if (fuzzyMatches(query, itemTokens(doc as InventoryItem))) {
      fuzzyHitIds.push(id);
    }
  }
  if (fuzzyHitIds.length) {
    const extra = await col
      .find({ _id: { $in: fuzzyHitIds.map((id) => new ObjectId(id)) } })
      .toArray();
    for (const e of extra) byId.set(e._id.toString(), e);
  }

  // 3) Rank everything by relevance score.
  const ranked = [...byId.values()]
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  const items = ranked.slice(skip, skip + limit).map((r) => r.item);
  return { items, total, page, limit };
}
