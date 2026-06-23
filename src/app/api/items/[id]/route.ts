import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeItem } from "@/lib/serialize";
import { itemUpdateSchema } from "@/lib/validators";
import { handle, ok, fail, currentUser } from "@/lib/api";
import { deleteImage } from "@/lib/bunny";

type Ctx = { params: { id: string } };

export const dynamic = "force-dynamic";

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.items();
  const doc = await col.findOne({ _id: new ObjectId(params.id) });
  if (!doc) return fail("Item not found", 404);
  return ok(serializeItem(doc));
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const body = itemUpdateSchema.parse(await req.json());

  const set: Record<string, unknown> = { ...body, updatedAt: new Date(), modifiedBy: currentUser() };
  if ("categoryId" in body) {
    set.categoryId = body.categoryId ? new ObjectId(body.categoryId) : null;
  }
  if ("subcategoryId" in body) {
    set.subcategoryId = body.subcategoryId ? new ObjectId(body.subcategoryId) : null;
  }
  if (body.images) {
    set.images = body.images.map((img) => ({
      url: img.url,
      fileName: img.fileName,
      storagePath: img.storagePath,
      uploadDate: img.uploadDate ? new Date(img.uploadDate) : new Date(),
    }));
  }
  if ("ai" in body) {
    set.ai = body.ai
      ? {
          ...body.ai,
          generatedAt: body.ai.generatedAt ? new Date(body.ai.generatedAt) : new Date(),
        }
      : null;
  }

  const col = await Collections.items();
  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!res) return fail("Item not found", 404);
  return ok(serializeItem(res));
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const col = await Collections.items();
  const doc = await col.findOne({ _id: new ObjectId(params.id) });
  if (!doc) return fail("Item not found", 404);

  // Best-effort cleanup of stored images.
  await Promise.all((doc.images || []).map((img) => deleteImage(img).catch(() => undefined)));

  await col.deleteOne({ _id: doc._id });
  const movements = await Collections.stockMovements();
  await movements.deleteMany({ itemId: doc._id });

  return ok({ deleted: true });
});
