import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeCategory } from "@/lib/serialize";
import { categoryUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = categoryUpdateSchema.parse(await req.json());
  const col = await Collections.categories();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { ...body, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Category not found", 404);
  return ok(serializeCategory(res));
});

/** Archive (soft delete). Hard delete is blocked if subcategories exist. */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const _id = new ObjectId(params.id);
  const col = await Collections.categories();
  const res = await col.findOneAndUpdate(
    { _id },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Category not found", 404);
  return ok(serializeCategory(res));
});
