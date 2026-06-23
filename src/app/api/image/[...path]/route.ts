import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ZONE = process.env.BUNNY_STORAGE_ZONE;
const KEY = process.env.BUNNY_STORAGE_API_KEY;
const HOST = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";

/**
 * Serves objects from a BunnyCDN Storage zone without a public Pull Zone.
 * Storage zones require the AccessKey to read, so we authenticate here and
 * stream the bytes back to the browser. Used when BUNNY_PULL_ZONE_URL is unset.
 */
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  if (!ZONE || !KEY) {
    return NextResponse.json(
      { ok: false, error: "Bunny storage not configured" },
      { status: 404 },
    );
  }

  const storagePath = params.path.map(encodeURIComponent).join("/");
  const upstream = await fetch(`https://${HOST}/${ZONE}/${storagePath}`, {
    headers: { AccessKey: KEY },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { ok: false, error: "Image not found" },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") || "application/octet-stream",
      // Files are content-addressed (unique names), so cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
