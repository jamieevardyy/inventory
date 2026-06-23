import { promises as fs } from "fs";
import path from "path";
import type { ProductImage } from "./types";

const ZONE = process.env.BUNNY_STORAGE_ZONE;
const KEY = process.env.BUNNY_STORAGE_API_KEY;
const HOST = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
const PULL = (process.env.BUNNY_PULL_ZONE_URL || "").replace(/\/$/, "");

/** Can we upload to Bunny Storage? Only needs zone + key. */
export function bunnyConfigured(): boolean {
  return Boolean(ZONE && KEY);
}

/**
 * Public URL for a stored object. Prefers a real Pull Zone (CDN) when set;
 * otherwise falls back to the in-app /api/image proxy so no pull zone is
 * required. (Storage zones aren't publicly readable on their own.)
 */
function publicUrl(storagePath: string): string {
  return PULL ? `${PULL}/${storagePath}` : `/api/image/${storagePath}`;
}

function safeName(name: string): string {
  const ext = path.extname(name);
  const base = path
    .basename(name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rand}-${base || "image"}${ext.toLowerCase()}`;
}

/**
 * Upload bytes to BunnyCDN Storage. Falls back to writing into
 * /public/uploads when Bunny isn't configured, so the app runs locally.
 */
export async function uploadImage(
  buffer: Buffer,
  originalName: string,
  contentType: string,
): Promise<ProductImage> {
  const fileName = safeName(originalName);
  const storagePath = `inventory/${fileName}`;

  if (bunnyConfigured()) {
    const url = `https://${HOST}/${ZONE}/${storagePath}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        AccessKey: KEY as string,
        "Content-Type": contentType || "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`BunnyCDN upload failed (${res.status}): ${text}`);
    }
    return {
      url: publicUrl(storagePath),
      fileName,
      storagePath,
      uploadDate: new Date(),
    };
  }

  // Local fallback
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);
  return {
    url: `/uploads/${fileName}`,
    fileName,
    storagePath: `uploads/${fileName}`,
    uploadDate: new Date(),
  };
}

/** Delete an uploaded image (best effort). */
export async function deleteImage(image: ProductImage): Promise<void> {
  if (bunnyConfigured() && !image.storagePath.startsWith("uploads/")) {
    const url = `https://${HOST}/${ZONE}/${image.storagePath}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { AccessKey: KEY as string },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`BunnyCDN delete failed (${res.status})`);
    }
    return;
  }
  // Local fallback
  const file = path.join(process.cwd(), "public", image.storagePath);
  await fs.unlink(file).catch(() => undefined);
}
