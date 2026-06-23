import type { AiSuggestion } from "./types";

const BASE = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(
  /\/$/,
  "",
);
const MODEL = process.env.OLLAMA_VISION_MODEL || "qwen2.5vl:7b";
const FORCE_MOCK = process.env.AI_MOCK === "true";

const PROMPT = `Analyze the uploaded inventory image. Identify the product shown in the image.

Return ONLY a JSON response. Generate:
1. Between 3 and 10 possible product names you are confident describe this item (at least 3).
2. Common search terms.
3. Layman names — simple, everyday words a non-expert would call this item.
4. Frequently used alternative names.
5. Common spelling variations.

The purpose is to improve inventory search.

Do NOT generate: Category, Sub Category, Quantity, Unit, Stock Information, or Product Specifications.

Respond with JSON only, matching exactly this shape:
{
  "suggestedNames": ["string", "string", "string"],
  "searchKeywords": ["string"],
  "commonNames": ["string"],
  "laymanTerms": ["string"],
  "spellingVariations": ["string"]
}`;

function uniqClean(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const s = String(v ?? "").trim();
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

function parseJsonLoose(text: string): Record<string, unknown> | null {
  // Strip code fences and locate the first JSON object.
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Deterministic-ish mock so the AI flow works without a local model. */
export function mockSuggestion(): AiSuggestion {
  return {
    suggestedNames: [
      "Unidentified Product",
      "Generic Item",
      "Stock Item",
      "Warehouse Product",
      "Inventory Article",
    ],
    searchKeywords: ["item", "product", "stock", "inventory", "goods"],
    commonNames: ["thing", "product", "stuff"],
    laymanTerms: ["thingy", "doohickey", "gadget", "whatchamacallit"],
    spellingVariations: ["prodcut", "iteem", "stok"],
    model: "mock",
    mock: true,
  };
}

/** True when a real model should be attempted. */
export function aiLive(): boolean {
  return !FORCE_MOCK;
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  // Local fallback paths (/uploads/..) must be resolved against the app origin;
  // the caller passes absolute URLs. data: URLs are accepted as-is.
  if (imageUrl.startsWith("data:")) {
    return imageUrl.split(",")[1] ?? "";
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

/**
 * Send an image to the local Ollama vision model and return search-oriented
 * suggestions. Falls back to a mock on any error or when AI_MOCK=true.
 */
export async function suggestFromImage(imageUrl: string): Promise<AiSuggestion> {
  if (FORCE_MOCK) return mockSuggestion();

  try {
    const base64 = await fetchImageAsBase64(imageUrl);

    const res = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: PROMPT,
        images: [base64],
        stream: false,
        format: "json",
        options: { temperature: 0.2 },
      }),
      // Vision inference can be slow on CPU.
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
    const data = (await res.json()) as { response?: string };
    const parsed = parseJsonLoose(data.response || "");
    if (!parsed) throw new Error("Could not parse model JSON");

    return {
      // Keep 3–10 names; the prompt asks for at least 3.
      suggestedNames: uniqClean(parsed.suggestedNames).slice(0, 10),
      searchKeywords: uniqClean(parsed.searchKeywords),
      commonNames: uniqClean(parsed.commonNames),
      laymanTerms: uniqClean(parsed.laymanTerms),
      spellingVariations: uniqClean(parsed.spellingVariations),
      model: MODEL,
      mock: false,
    };
  } catch (err) {
    console.warn(
      `[ollama] vision call failed, using mock fallback: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return mockSuggestion();
  }
}
