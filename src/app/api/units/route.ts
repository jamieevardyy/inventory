import { Collections } from "@/lib/mongodb";
import { serializeUnit } from "@/lib/serialize";
import { unitSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.units();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeUnit));
});

export const POST = handle(async (req: Request) => {
  const body = unitSchema.parse(await req.json());
  const col = await Collections.units();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    symbol: body.symbol,
    description: body.description,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeUnit(doc!), { status: 201 });
});
