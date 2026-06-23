import { uploadImage } from "@/lib/bunny";
import { handle, ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";
// Allow larger image payloads.
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const POST = handle(async (req: Request) => {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return fail("No file uploaded (expected form field 'file')", 400);
  }
  if (file.size > MAX_BYTES) {
    return fail("File too large (max 10MB)", 413);
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return fail(`Unsupported file type: ${file.type}`, 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = await uploadImage(buffer, file.name || "image", file.type);
  return ok({ ...image, uploadDate: image.uploadDate.toISOString() }, { status: 201 });
});
