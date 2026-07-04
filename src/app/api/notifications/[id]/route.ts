import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeNotificationRule } from "@/lib/serialize";
import { notificationRuleUpdateSchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: { id: string } };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = notificationRuleUpdateSchema.parse(await req.json());
  const update: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.categoryId !== undefined) {
    update.categoryId = body.categoryId ? new ObjectId(body.categoryId) : null;
  }
  if (body.subcategoryId !== undefined) {
    update.subcategoryId = body.subcategoryId ? new ObjectId(body.subcategoryId) : null;
  }
  const col = await Collections.notificationRules();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!res) return fail("Notification rule not found", 404);
  return ok(serializeNotificationRule(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.notificationRules();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: { archived: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!res) return fail("Notification rule not found", 404);
  return ok(serializeNotificationRule(res));
});
