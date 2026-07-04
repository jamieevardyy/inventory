import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeLocation } from "@/lib/serialize";
import { locationUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = locationUpdateSchema.parse(await req.json());
  const update: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.parentLocationId !== undefined) {
    update.parentLocationId = body.parentLocationId
      ? new ObjectId(body.parentLocationId)
      : null;
  }
  const col = await Collections.locations();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!res) return fail("Location not found", 404);
  return ok(serializeLocation(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const _id = new ObjectId(params.id);
  const col = await Collections.locations();
  const res = await col.findOneAndUpdate(
    { _id },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Location not found", 404);
  return ok(serializeLocation(res));
});
