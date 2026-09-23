import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";
import { MarketingError } from "./guard";
import { toMarketingError } from "./ai";

export const BUCKET = "marketing-images";
export const SETUP_MESSAGE =
  "Marketing history is not set up yet. Run supabase/migrations/marketing_ai.sql in the Supabase SQL editor.";

/** True when Supabase says the marketing table or storage bucket does not exist yet. */
export function isMissingSetup(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return (
    err.code === "PGRST205" ||
    err.code === "42P01" ||
    /bucket not found|could not find the table|does not exist/i.test(err.message ?? "")
  );
}

/** Signed-in user with a studio, or a MarketingError(401). */
export async function requireApiContext() {
  const ctx = await getContext();
  if (!ctx) throw new MarketingError("Your session has expired. Please sign in again.", 401);
  if (!ctx.studio) throw new MarketingError("No studio found for this account.", 403);
  return { ...ctx, studio: ctx.studio };
}

export async function readForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new MarketingError("The upload could not be read. Please try again.");
  }
}

export function errorResponse(err: unknown) {
  const e = err instanceof MarketingError ? err : toMarketingError(err);
  const headers: Record<string, string> = {};
  if (e.retryAfter) headers["Retry-After"] = String(e.retryAfter);
  return NextResponse.json({ error: e.message }, { status: e.status, headers });
}
