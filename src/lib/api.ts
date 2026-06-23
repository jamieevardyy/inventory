import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ ok: false, error: message, details: extra }, { status });
}

/** Wraps a route handler with consistent error -> JSON conversion. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, err.flatten());
      }
      console.error("[api] unhandled error:", err);
      const message = err instanceof Error ? err.message : "Internal error";
      return fail(message, 500);
    }
  };
}

/** Absolute origin of the current request (for fetching local images). */
export function originOf(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export const currentUser = () => process.env.DEFAULT_USER || "system";
