import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeSubcategory } from "@/lib/serialize";
import { subcategorySchema } from "@/lib/validators";
import { handle, ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const categoryId = params.get("categoryId");
  const includeArchived = params.get("includeArchived") === "true";

  const filter: Record<string, unknown> = includeArchived
    ? {}
    : { archived: { $ne: true } };
  if (categoryId) {
    if (!ObjectId.isValid(categoryId)) return fail("Invalid categoryId", 400);
    filter.categoryId = new ObjectId(categoryId);
  }

  const col = await Collections.subcategories();
  const docs = await col.find(filter).sort({ name: 1 }).toArray();
  return ok(docs.map(serializeSubcategory));
});

export const POST = handle(async (req: Request) => {
  const body = subcategorySchema.parse(await req.json());
  const categories = await Collections.categories();
  const parent = await categories.findOne({ _id: new ObjectId(body.categoryId) });
  if (!parent) return fail("Parent category not found", 404);

  const col = await Collections.subcategories();
  const now = new Date();
  const res = await col.insertOne({
    categoryId: new ObjectId(body.categoryId),
    name: body.name,
    description: body.description,
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);
  const doc = await col.findOne({ _id: res.insertedId });
  return ok(serializeSubcategory(doc!), { status: 201 });
});
