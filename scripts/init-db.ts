import "./load-env";
import { ensureIndexes } from "../src/lib/mongodb";

async function main() {
  console.log("Creating MongoDB indexes…");
  await ensureIndexes();
  console.log("✓ Indexes ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("init-db failed:", err);
  process.exit(1);
});
