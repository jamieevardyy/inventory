"use client";

/** Thin fetch wrapper that unwraps the { ok, data, error } envelope. */
export async function api<T>(
  url: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init || {};
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }

  const env = payload as { ok?: boolean; data?: T; error?: string } | null;
  if (!res.ok || !env?.ok) {
    throw new Error(env?.error || `Request failed (${res.status})`);
  }
  return env.data as T;
}
