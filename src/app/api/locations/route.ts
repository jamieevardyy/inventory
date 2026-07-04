import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeLocation } from "@/lib/serialize";
import { locationSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const includeArchived = params.get("includeArchived") === "true";
  const search = params.get("search")?.trim();
  const type = params.get("type")?.trim();

  const filter: Record<string, unknown> = includeArchived ? {} : { archived: { $ne: true } };
  if (search) filter.name = { $regex: search, $options: "i" };
  if (type) filter.type = type;

  const col = await Collections.locations();
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeLocation));
});

export const POST = handle(async (req: Request) => {
  const body = locationSchema.parse(await req.json());
  const col = await Collections.locations();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    type: body.type || undefined,
    code: body.code || undefined,
    description: body.description || undefined,
    parentLocationId: body.parentLocationId ? new ObjectId(body.parentLocationId) : null,
    isActive: body.isActive ?? true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeLocation(doc!), { status: 201 });
});
