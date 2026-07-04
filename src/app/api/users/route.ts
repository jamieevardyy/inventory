import { Collections } from "@/lib/mongodb";
import { serializeUser } from "@/lib/serialize";
import { userSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.users();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeUser));
});

export const POST = handle(async (req: Request) => {
  const body = userSchema.parse(await req.json());
  const col = await Collections.users();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    email: body.email,
    phone: body.phone,
    role: body.role,
    notes: body.notes,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeUser(doc!), { status: 201 });
});
