import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeUser } from "@/lib/serialize";
import { userUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = userUpdateSchema.parse(await req.json());
  const col = await Collections.users();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { ...body, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("User not found", 404);
  return ok(serializeUser(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.users();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("User not found", 404);
  return ok(serializeUser(res));
});
