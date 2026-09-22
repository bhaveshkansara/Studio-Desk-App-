import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Studio } from "@/lib/types";
import { DEFAULT_TEMPLATES } from "@/lib/messages";

/** Signed-in user plus the studio they belong to. Null when signed out. */
export const getContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("studio_members")
    .select("studio_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let studio: Studio | null = null;
  if (member) {
    const { data } = await supabase
      .from("studios")
      .select("id, name, phone")
      .eq("id", member.studio_id)
      .maybeSingle();
    studio = (data as Studio | null) ?? null;
  }
  return { supabase, user, studio, role: (member?.role as string | undefined) ?? null };
});

/** For pages and actions: redirects to /login when signed out. */
export async function requireContext() {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** For actions that write data: also guarantees a studio exists. */
export async function requireStudio() {
  const ctx = await requireContext();
  if (!ctx.studio) throw new Error("No studio found for this account. Run supabase/schema.sql first.");
  return { ...ctx, studio: ctx.studio };
}

/** The studio's message templates, falling back to the built-in defaults. */
export async function getTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studioId: string,
): Promise<Record<string, string>> {
  const { data } = await supabase.from("message_templates").select("key, body").eq("studio_id", studioId);
  const out = { ...DEFAULT_TEMPLATES };
  for (const r of (data ?? []) as { key: string; body: string }[]) out[r.key] = r.body;
  return out;
}
