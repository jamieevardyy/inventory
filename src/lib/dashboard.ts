import { Collections } from "./mongodb";
import { serializeItem } from "./serialize";
import type { InventoryItemDTO } from "./types";

export interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  outOfStock: number;
  lowStock: number;
  recentItems: InventoryItemDTO[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const items = await Collections.items();
  const categories = await Collections.categories();

  const [totalItems, totalCategories, outOfStock, lowStock, recent] =
    await Promise.all([
      items.countDocuments({}),
      categories.countDocuments({ archived: { $ne: true } }),
      items.countDocuments({ quantity: { $lte: 0 } }),
      items.countDocuments({
        $and: [
          { quantity: { $gt: 0 } },
          { $expr: { $lte: ["$quantity", "$minimumQuantity"] } },
        ],
      }),
      items.find({}).sort({ createdAt: -1 }).limit(8).toArray(),
    ]);

  return {
    totalItems,
    totalCategories,
    outOfStock,
    lowStock,
    recentItems: recent.map(serializeItem),
  };
}
