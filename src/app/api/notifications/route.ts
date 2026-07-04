import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeNotificationRule } from "@/lib/serialize";
import { notificationRuleSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.notificationRules();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeNotificationRule));
});

export const POST = handle(async (req: Request) => {
  const body = notificationRuleSchema.parse(await req.json());
  const col = await Collections.notificationRules();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    type: body.type,
    categoryId: body.categoryId ? new ObjectId(body.categoryId) : null,
    subcategoryId: body.subcategoryId ? new ObjectId(body.subcategoryId) : null,
    threshold: body.threshold,
    notifyEmail: body.notifyEmail,
    active: body.active ?? true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeNotificationRule(doc!), { status: 201 });
});
