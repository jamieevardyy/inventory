import { ObjectId } from "mongodb";
import { Collections } from "@/lib/mongodb";
import { serializeItem, serializeMovement } from "@/lib/serialize";
import { stockMovementSchema } from "@/lib/validators";
import { handle, ok, fail, currentUser } from "@/lib/api";
import { STOCK_IN_TYPES } from "@/lib/types";

type Ctx = { params: { id: string } };

export const dynamic = "force-dynamic";

/** List stock movement history for an item (most recent first). */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const movements = await Collections.stockMovements();
  const docs = await movements
    .find({ itemId: new ObjectId(params.id) })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return ok(docs.map(serializeMovement));
});

/** Record a stock movement and adjust the item's quantity atomically-ish. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  if (!ObjectId.isValid(params.id)) return fail("Invalid id", 400);
  const itemId = new ObjectId(params.id);
  const body = stockMovementSchema.parse(await req.json());

  const items = await Collections.items();
  const item = await items.findOne({ _id: itemId });
  if (!item) return fail("Item not found", 404);

  const isIn = STOCK_IN_TYPES.includes(body.movementType);
  const delta = isIn ? body.quantity : -body.quantity;
  const balanceAfter = item.quantity + delta;
  if (balanceAfter < 0) {
    return fail(
      `Insufficient stock: have ${item.quantity}, tried to remove ${body.quantity}`,
      409,
    );
  }

  const now = new Date();
  const user = currentUser();

  const movements = await Collections.stockMovements();
  const ins = await movements.insertOne({
    itemId,
    movementType: body.movementType,
    quantity: body.quantity,
    balanceAfter,
    remarks: body.remarks,
    createdBy: user,
    createdAt: now,
  } as never);

  const updated = await items.findOneAndUpdate(
    { _id: itemId },
    { $set: { quantity: balanceAfter, updatedAt: now, modifiedBy: user } },
    { returnDocument: "after" },
  );

  const movement = await movements.findOne({ _id: ins.insertedId });
  return ok({
    item: serializeItem(updated!),
    movement: serializeMovement(movement!),
  });
});
