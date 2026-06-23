import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeSubcategory } from "@/lib/serialize";
import { subcategoryUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = subcategoryUpdateSchema.parse(await req.json());
  const set: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.categoryId) set.categoryId = new ObjectId(body.categoryId);

  const col = await Collections.subcategories();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!res) return fail("Subcategory not found", 404);
  return ok(serializeSubcategory(res));
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.subcategories();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Subcategory not found", 404);
  return ok(serializeSubcategory(res));
});
