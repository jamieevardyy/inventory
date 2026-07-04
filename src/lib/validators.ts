import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid id")
  .optional()
  .nullable();

const stringArray = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((arr) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean))));

export const imageSchema = z.object({
  url: z.string().min(1),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  uploadDate: z.union([z.string(), z.date()]).optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().default(""),
});

export const categoryUpdateSchema = categorySchema.partial().extend({
  archived: z.boolean().optional(),
});

export const subcategorySchema = z.object({
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Valid categoryId required"),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().default(""),
});

export const subcategoryUpdateSchema = z.object({
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  archived: z.boolean().optional(),
});

export const aiDataSchema = z.object({
  names: stringArray,
  laymanTerms: stringArray,
  searchKeywords: stringArray,
  commonNames: stringArray,
  spellingVariations: stringArray,
  model: z.string().default(""),
  mock: z.boolean().default(false),
  generatedAt: z.union([z.string(), z.date()]).optional(),
});

export const itemSchema = z.object({
  itemName: z.string().trim().min(1, "Item name is required").max(200),
  referenceNames: stringArray,
  categoryId: objectId,
  subcategoryId: objectId,
  description: z.string().trim().max(5000).optional().default(""),
  images: z.array(imageSchema).default([]),

  searchKeywords: stringArray,
  aliases: stringArray,
  commonNames: stringArray,
  ai: aiDataSchema.nullable().optional(),

  quantity: z.coerce.number().min(0).default(0),
  unit: z.string().trim().max(40).optional().default("pcs"),
  minimumQuantity: z.coerce.number().min(0).default(0),
  reorderQuantity: z.coerce.number().min(0).default(0),

  warehouse: z.string().trim().max(120).optional().default(""),
  rack: z.string().trim().max(120).optional().default(""),
  shelf: z.string().trim().max(120).optional().default(""),
  bin: z.string().trim().max(120).optional().default(""),
});

export const itemUpdateSchema = itemSchema.partial();

export const MOVEMENT_TYPES = [
  "purchase",
  "return",
  "transfer_in",
  "consumption",
  "sale",
  "transfer_out",
  "damaged",
] as const;

export const stockMovementSchema = z.object({
  movementType: z.enum(MOVEMENT_TYPES),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  remarks: z.string().trim().max(1000).optional().default(""),
});

export const duplicateCheckSchema = z.object({
  itemName: z.string().trim().min(1),
  referenceNames: z.array(z.string()).optional().default([]),
  aliases: z.array(z.string()).optional().default([]),
  searchKeywords: z.array(z.string()).optional().default([]),
  commonNames: z.array(z.string()).optional().default([]),
  excludeId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});


const objectIdArray = z
  .array(z.string().regex(/^[a-f\d]{24}$/i))
  .default([])
  .transform((arr) => Array.from(new Set(arr)));

export const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.string().trim().max(60).optional().default(""),
  code: z.string().trim().max(60).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  parentLocationId: objectId.nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
});

export const locationUpdateSchema = locationSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(5000).optional().default(""),
  categoryIds: objectIdArray,
  subcategoryIds: objectIdArray,
  isActive: z.boolean().optional().default(true),
});

export const supplierUpdateSchema = supplierSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const unitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  symbol: z.string().trim().min(1, "Symbol is required").max(20),
  description: z.string().trim().max(2000).optional().default(""),
});

export const unitUpdateSchema = unitSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const userRoleSchema = z.enum(["admin", "staff", "viewer"]);

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  role: userRoleSchema.optional().default("staff"),
  notes: z.string().trim().max(5000).optional().default(""),
});

export const userUpdateSchema = userSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const informationTypeSchema = z.enum(["general", "note"]);

export const informationSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(10000),
  type: informationTypeSchema.optional().default("general"),
});

export const informationUpdateSchema = informationSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const notificationRuleTypeSchema = z.enum(["low_stock", "reorder"]);

export const notificationRuleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: notificationRuleTypeSchema,
  categoryId: objectId.nullable().optional().default(null),
  subcategoryId: objectId.nullable().optional().default(null),
  threshold: z.coerce.number().min(0).default(0),
  notifyEmail: z.string().trim().max(120).optional().default(""),
  active: z.boolean().optional().default(true),
});

export const notificationRuleUpdateSchema = notificationRuleSchema.partial().extend({
  archived: z.boolean().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SubcategoryInput = z.infer<typeof subcategorySchema>;
