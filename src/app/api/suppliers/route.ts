import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeSupplier } from "@/lib/serialize";
import { supplierSchema } from "@/lib/validators";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const includeArchived =
    new URL(req.url).searchParams.get("includeArchived") === "true";
  const col = await Collections.suppliers();
  const filter = includeArchived ? {} : { archived: { $ne: true } };
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeSupplier));
});

export const POST = handle(async (req: Request) => {
  const body = supplierSchema.parse(await req.json());
  const col = await Collections.suppliers();
  const now = new Date();
  const res = await col.insertOne({
    name: body.name,
    phone: body.phone,
    email: body.email,
    notes: body.notes,
    categoryIds: body.categoryIds.map((id) => new ObjectId(id)),
    subcategoryIds: body.subcategoryIds.map((id) => new ObjectId(id)),
    isActive: body.isActive ?? true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeSupplier(doc!), { status: 201 });
});
