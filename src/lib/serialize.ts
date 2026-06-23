import type {
  Category,
  Subcategory,
  InventoryItem,
  StockMovement,
  CategoryDTO,
  SubcategoryDTO,
  InventoryItemDTO,
  StockMovementDTO,
  ProductImage,
} from "./types";

const iso = (d: Date | string | undefined | null): string =>
  d ? (typeof d === "string" ? d : d.toISOString()) : "";

function serializeImage(img: ProductImage) {
  return { ...img, uploadDate: iso(img.uploadDate) };
}

export function serializeCategory(c: Category): CategoryDTO {
  return {
    ...c,
    _id: c._id.toString(),
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
  } as CategoryDTO;
}

export function serializeSubcategory(s: Subcategory): SubcategoryDTO {
  return {
    ...s,
    _id: s._id.toString(),
    categoryId: s.categoryId.toString(),
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.updatedAt),
  } as SubcategoryDTO;
}

export function serializeItem(i: InventoryItem): InventoryItemDTO {
  return {
    ...i,
    _id: i._id.toString(),
    categoryId: i.categoryId ? i.categoryId.toString() : null,
    subcategoryId: i.subcategoryId ? i.subcategoryId.toString() : null,
    images: (i.images || []).map(serializeImage),
    ai: i.ai ? { ...i.ai, generatedAt: iso(i.ai.generatedAt) } : null,
    createdAt: iso(i.createdAt),
    updatedAt: iso(i.updatedAt),
  } as unknown as InventoryItemDTO;
}

export function serializeMovement(m: StockMovement): StockMovementDTO {
  return {
    ...m,
    _id: m._id.toString(),
    itemId: m.itemId.toString(),
    createdAt: iso(m.createdAt),
  } as StockMovementDTO;
}
