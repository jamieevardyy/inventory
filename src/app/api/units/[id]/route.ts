import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeUnit } from "@/lib/serialize";
import { unitUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = unitUpdateSchema.parse(await req.json());
  const col = await Collections.units();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { ...body, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Unit not found", 404);
  return ok(serializeUnit(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.units();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Unit not found", 404);
  return ok(serializeUnit(res));
});
