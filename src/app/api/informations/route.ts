import { Collections } from "@/lib/mongodb";
import { serializeInformation } from "@/lib/serialize";
import { informationSchema } from "@/lib/validators";
import { handle, ok, currentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.informations();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return ok(docs.map(serializeInformation));
});

export const POST = handle(async (req: Request) => {
  const body = informationSchema.parse(await req.json());
  const col = await Collections.informations();
  const now = new Date();
  const res = await col.insertOne({
    content: body.content,
    type: body.type,
    createdBy: currentUser(),
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeInformation(doc!), { status: 201 });
});
