import { Collections } from "@/lib/mongodb";
import { serializeCategory } from "@/lib/serialize";
import { categorySchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.categories();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeCategory));
});

export const POST = handle(async (req: Request) => {
  const body = categorySchema.parse(await req.json());
  const col = await Collections.categories();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    description: body.description,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeCategory(doc!), { status: 201 });
});
