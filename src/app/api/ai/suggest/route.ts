import { z } from "zod";
import { suggestFromImage } from "@/lib/ollama";
import { handle, ok, fail, originOf } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const schema = z.object({
  imageUrl: z.string().min(1, "imageUrl is required"),
});

export const POST = handle(async (req: Request) => {
  const { imageUrl } = schema.parse(await req.json());

  // Resolve relative (local-fallback) URLs against the request origin so the
  // server can fetch the bytes to send to Ollama.
  let absolute = imageUrl;
  if (imageUrl.startsWith("/")) {
    absolute = `${originOf(req)}${imageUrl}`;
  } else if (!/^https?:|^data:/.test(imageUrl)) {
    return fail("imageUrl must be an absolute URL, root-relative path, or data URI", 400);
  }

  const suggestion = await suggestFromImage(absolute);
  return ok(suggestion);
});
