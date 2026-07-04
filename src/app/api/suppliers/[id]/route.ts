import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeSupplier } from "@/lib/serialize";
import { supplierUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = supplierUpdateSchema.parse(await req.json());
  const update: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.categoryIds) update.categoryIds = body.categoryIds.map((id) => new ObjectId(id));
  if (body.subcategoryIds) {
    update.subcategoryIds = body.subcategoryIds.map((id) => new ObjectId(id));
  }
  const col = await Collections.suppliers();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!res) return fail("Supplier not found", 404);
  return ok(serializeSupplier(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.suppliers();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Supplier not found", 404);
  return ok(serializeSupplier(res));
});
