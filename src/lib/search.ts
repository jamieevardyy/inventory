import type { InventoryItem } from "./types";

/** Lowercase + collapse whitespace + strip punctuation for matching. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein edit distance (iterative, two-row). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Edit distance allowance grows with word length. */
function fuzzyThreshold(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/**
 * Token-level fuzzy match: every query token must match some haystack token
 * either as a substring (prefix/partial) or within the Levenshtein threshold
 * (handles typos like "cabel" -> "cable", "etharnet" -> "ethernet").
 */
export function fuzzyMatches(query: string, haystackTokens: string[]): boolean {
  const qTokens = normalize(query).split(" ").filter(Boolean);
  if (!qTokens.length) return true;

  return qTokens.every((qt) =>
    haystackTokens.some((ht) => {
      if (ht.includes(qt) || qt.includes(ht)) return true;
      return levenshtein(qt, ht) <= fuzzyThreshold(Math.max(qt.length, ht.length));
    }),
  );
}

type SearchableFields = Pick<
  InventoryItem,
  "itemName" | "searchKeywords" | "aliases" | "commonNames"
> &
  Partial<Pick<InventoryItem, "referenceNames">>;

/** All searchable tokens for an item. */
export function itemTokens(item: SearchableFields): string[] {
  const fields = [
    item.itemName,
    ...(item.referenceNames || []),
    ...(item.searchKeywords || []),
    ...(item.aliases || []),
    ...(item.commonNames || []),
  ];
  const tokens = new Set<string>();
  for (const f of fields) {
    for (const t of normalize(f).split(" ")) {
      if (t) tokens.add(t);
    }
  }
  return [...tokens];
}

/**
 * Score a candidate item against a query (higher = better).
 * Combines exact-name, prefix, keyword, and fuzzy signals.
 */
export function scoreItem(query: string, item: SearchableFields): number {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(item.itemName);
  const tokens = itemTokens(item);

  let score = 0;
  if (name === q) score += 100;
  if (name.startsWith(q)) score += 40;
  if (name.includes(q)) score += 20;

  const qTokens = q.split(" ").filter(Boolean);
  for (const qt of qTokens) {
    if (tokens.includes(qt)) {
      score += 15;
    } else if (tokens.some((t) => t.startsWith(qt))) {
      score += 8;
    } else {
      // best fuzzy distance bonus
      const best = Math.min(
        ...tokens.map((t) => levenshtein(qt, t)),
        99,
      );
      if (best <= fuzzyThreshold(qt.length)) score += Math.max(1, 6 - best);
    }
  }
  return score;
}
