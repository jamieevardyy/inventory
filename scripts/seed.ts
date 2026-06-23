import "./load-env";
import { ObjectId } from "mongodb";
import { Collections, ensureIndexes } from "../src/lib/mongodb";

/** Seeds the example data from the spec (Electrical → Wires/Switches → items). */
async function main() {
  await ensureIndexes();
  const now = new Date();

  const categories = await Collections.categories();
  const subcategories = await Collections.subcategories();
  const items = await Collections.items();

  console.log("Clearing existing demo data…");
  await Promise.all([
    categories.deleteMany({}),
    subcategories.deleteMany({}),
    items.deleteMany({}),
  ]);

  const electrical = new ObjectId();
  await categories.insertOne({
    _id: electrical,
    name: "Electrical",
    description: "Electrical supplies and components",
    archived: false,
    createdAt: now,
    updatedAt: now,
  } as never);

  const wires = new ObjectId();
  const switches = new ObjectId();
  await subcategories.insertMany([
    {
      _id: wires,
      categoryId: electrical,
      name: "Wires & Cables",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: switches,
      categoryId: electrical,
      name: "Switches",
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ] as never);

  const base = {
    description: "",
    images: [],
    referenceNames: [] as string[],
    ai: null,
    quantity: 100,
    unit: "m",
    minimumQuantity: 20,
    reorderQuantity: 50,
    warehouse: "WH-1",
    rack: "R1",
    shelf: "S1",
    bin: "B1",
    createdBy: "seed",
    modifiedBy: "seed",
    createdAt: now,
    updatedAt: now,
  };

  await items.insertMany([
    {
      _id: new ObjectId(),
      ...base,
      itemName: "Copper Wire",
      categoryId: electrical,
      subcategoryId: wires,
      referenceNames: ["PVC Wire", "Single Core Wire", "Building Wire"],
      searchKeywords: ["wire", "cable", "electric wire", "copper cable", "building wire"],
      aliases: ["PVC Wire", "Single Core Wire", "Building Wire"],
      commonNames: ["electrical wire", "house wire"],
    },
    {
      _id: new ObjectId(),
      ...base,
      itemName: "Ethernet Cable",
      categoryId: electrical,
      subcategoryId: wires,
      quantity: 5,
      minimumQuantity: 10,
      referenceNames: ["LAN Cable", "CAT6 Cable", "Network Cable"],
      searchKeywords: ["cable", "ethernet", "network cable", "rj45"],
      aliases: ["LAN Cable", "CAT6 Cable", "Network Cable"],
      commonNames: ["internet wire", "internet cable", "computer cable"],
    },
    {
      _id: new ObjectId(),
      ...base,
      itemName: "6A Modular Switch",
      categoryId: electrical,
      subcategoryId: switches,
      quantity: 0,
      unit: "pcs",
      searchKeywords: ["switch", "modular switch", "6a switch"],
      aliases: ["Light Switch"],
      commonNames: ["on off switch", "button"],
    },
  ] as never);

  console.log("✓ Seeded 1 category, 2 subcategories, 3 items.");
  process.exit(0);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
