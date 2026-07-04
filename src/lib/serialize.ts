import type {
  Category,
  Subcategory,
  Location,
  Supplier,
  Unit,
  User,
  Information,
  NotificationRule,
  InventoryItem,
  StockMovement,
  CategoryDTO,
  SubcategoryDTO,
  LocationDTO,
  SupplierDTO,
  UnitDTO,
  UserDTO,
  InformationDTO,
  NotificationRuleDTO,
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

export function serializeLocation(l: Location): LocationDTO {
  return {
    ...l,
    _id: l._id.toString(),
    parentLocationId: l.parentLocationId ? l.parentLocationId.toString() : null,
    createdAt: iso(l.createdAt),
    updatedAt: iso(l.updatedAt),
  } as LocationDTO;
}

export function serializeSupplier(s: Supplier): SupplierDTO {
  return {
    ...s,
    _id: s._id.toString(),
    categoryIds: s.categoryIds.map((id) => id.toString()),
    subcategoryIds: s.subcategoryIds.map((id) => id.toString()),
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.updatedAt),
  } as SupplierDTO;
}

export function serializeUnit(u: Unit): UnitDTO {
  return {
    ...u,
    _id: u._id.toString(),
    createdAt: iso(u.createdAt),
    updatedAt: iso(u.updatedAt),
  } as UnitDTO;
}

export function serializeUser(u: User): UserDTO {
  return {
    ...u,
    _id: u._id.toString(),
    createdAt: iso(u.createdAt),
    updatedAt: iso(u.updatedAt),
  } as UserDTO;
}

export function serializeInformation(i: Information): InformationDTO {
  return {
    ...i,
    _id: i._id.toString(),
    createdAt: iso(i.createdAt),
    updatedAt: iso(i.updatedAt),
  } as InformationDTO;
}

export function serializeNotificationRule(n: NotificationRule): NotificationRuleDTO {
  return {
    ...n,
    _id: n._id.toString(),
    categoryId: n.categoryId ? n.categoryId.toString() : null,
    subcategoryId: n.subcategoryId ? n.subcategoryId.toString() : null,
    createdAt: iso(n.createdAt),
    updatedAt: iso(n.updatedAt),
  } as NotificationRuleDTO;
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
