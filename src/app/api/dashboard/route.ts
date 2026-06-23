import { getDashboardStats } from "@/lib/dashboard";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  return ok(await getDashboardStats());
});
