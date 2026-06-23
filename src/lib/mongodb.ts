import { MongoClient, type Db, type Collection } from "mongodb";
import type {
  Category,
  Subcategory,
  InventoryItem,
  StockMovement,
} from "./types";

const dbName = process.env.MONGODB_DB || "ai_inventory";

/**
 * Cache the client across hot reloads in dev and across lambda invocations in
 * prod, so we don't exhaust the connection pool. (Next.js recommended pattern.)
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

/** Lazily connect on first use so `next build` doesn't open a socket at import. */
function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

export const Collections = {
  categories: async (): Promise<Collection<Category>> =>
    (await getDb()).collection<Category>("categories"),
  subcategories: async (): Promise<Collection<Subcategory>> =>
    (await getDb()).collection<Subcategory>("subcategories"),
  items: async (): Promise<Collection<InventoryItem>> =>
    (await getDb()).collection<InventoryItem>("inventoryItems"),
  stockMovements: async (): Promise<Collection<StockMovement>> =>
    (await getDb()).collection<StockMovement>("stockMovements"),
};

/** Create indexes (idempotent). Run via `npm run init-db` or on first call. */
export async function ensureIndexes(): Promise<void> {
  const items = await Collections.items();

  // Only one text index is allowed per collection; drop any stale one whose
  // fields differ from the current definition before (re)creating it.
  try {
    const existing = await items.indexes();
    for (const idx of existing) {
      const isText = Object.values(idx.key || {}).includes("text");
      if (isText && idx.name && idx.name !== "item_text_search_v2") {
        await items.dropIndex(idx.name);
      }
    }
  } catch {
    // collection may not exist yet — ignore
  }

  await items.createIndexes([
    {
      key: {
        itemName: "text",
        referenceNames: "text",
        searchKeywords: "text",
        aliases: "text",
        commonNames: "text",
        description: "text",
      },
      name: "item_text_search_v2",
      weights: {
        itemName: 10,
        referenceNames: 8,
        aliases: 6,
        commonNames: 6,
        searchKeywords: 4,
        description: 1,
      },
    },
    { key: { categoryId: 1 } },
    { key: { subcategoryId: 1 } },
    { key: { quantity: 1 } },
    { key: { createdAt: -1 } },
  ]);

  const subcategories = await Collections.subcategories();
  await subcategories.createIndex({ categoryId: 1 });

  const movements = await Collections.stockMovements();
  await movements.createIndexes([
    { key: { itemId: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
  ]);
}
