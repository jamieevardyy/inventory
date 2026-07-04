/** SWR fetcher — normalizes StockAI `{ ok, data }` to telegram-style `{ success, data }`. */
export async function mastersFetcher(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.ok !== undefined) {
    return { success: json.ok, data: json.data, error: json.error };
  }
  return json;
}

export function parentId(loc: { parentLocationId?: string | { _id: string } | null }): string | null {
  if (!loc.parentLocationId) return null;
  return typeof loc.parentLocationId === "object"
    ? loc.parentLocationId._id
    : loc.parentLocationId;
}
