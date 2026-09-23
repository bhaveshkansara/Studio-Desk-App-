"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudio } from "@/lib/auth";
import { CAMPAIGN_STATUS, CONTENT_TYPES } from "@/lib/marketing/constants";
import { BUCKET, SETUP_MESSAGE, isMissingSetup } from "@/lib/marketing/http";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = encodeURIComponent;

function idFrom(fd: FormData): string {
  const id = String(fd.get("id") ?? "");
  if (!UUID.test(id)) redirect("/marketing/history?error=" + enc("Campaign not found."));
  return id;
}

const has = (map: object, v: string) => Object.prototype.hasOwnProperty.call(map, v);

function parseHashtags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const body = part.toLowerCase().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    if (body) seen.add("#" + body.slice(0, 60));
    if (seen.size >= 30) break;
  }
  return [...seen];
}

function parseKeywords(raw: string): string[] {
  const seen = new Map<string, string>();
  for (const part of raw.split(/[\n,]+/)) {
    const v = part.trim().replace(/\s+/g, " ").slice(0, 120);
    if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
    if (seen.size >= 60) break;
  }
  return [...seen.values()];
}

function refresh() {
  revalidatePath("/marketing", "layout");
}

export async function updateCampaign(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = idFrom(fd);
  const back = `/marketing/${id}`;

  const title = String(fd.get("title") ?? "").trim().slice(0, 140);
  if (!title) redirect(`${back}?error=${enc("Give the campaign a name.")}`);
  const status = String(fd.get("status") ?? "");
  const contentType = String(fd.get("content_type") ?? "");

  const { error } = await supabase
    .from("marketing_campaigns")
    .update({
      title,
      status: has(CAMPAIGN_STATUS, status) ? status : "draft",
      content_type: has(CONTENT_TYPES, contentType) ? contentType : null,
      caption: String(fd.get("caption") ?? "").trim().slice(0, 4000) || null,
      hashtags: parseHashtags(String(fd.get("hashtags") ?? "")),
      keywords: parseKeywords(String(fd.get("keywords") ?? "")),
    })
    .eq("id", id)
    .eq("studio_id", studio.id);
  if (error) {
    console.error("[marketing-update]", error.code, error.message);
    redirect(`${back}?error=${enc(isMissingSetup(error) ? SETUP_MESSAGE : "Could not save your changes. Please try again.")}`);
  }
  refresh();
  redirect(`${back}?saved=1`);
}

export async function duplicateCampaign(fd: FormData) {
  const { supabase, user, studio } = await requireStudio();
  const id = idFrom(fd);

  const { data: row, error } = await supabase
    .from("marketing_campaigns")
    .select("title, content_type, image_path, details, result, caption, hashtags, keywords")
    .eq("id", id)
    .eq("studio_id", studio.id)
    .maybeSingle();
  if (error || !row) redirect("/marketing/history?error=" + enc("Campaign not found."));

  // Each copy owns its own photo, so deleting one never breaks the other.
  let imagePath: string | null = null;
  if (row.image_path) {
    const ext = String(row.image_path).split(".").pop() || "jpg";
    const next = `${studio.id}/${randomUUID()}.${ext}`;
    const { error: copyErr } = await supabase.storage.from(BUCKET).copy(row.image_path, next);
    if (!copyErr) imagePath = next;
    else console.error("[marketing-duplicate] copy", copyErr.message);
  }

  const { data, error: insErr } = await supabase
    .from("marketing_campaigns")
    .insert({
      ...row,
      studio_id: studio.id,
      created_by: user.id,
      title: `Copy of ${row.title}`.slice(0, 140),
      status: "draft",
      image_path: imagePath,
    })
    .select("id")
    .single();
  if (insErr || !data) {
    if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
    redirect(`/marketing/${id}?error=${enc("Could not duplicate this campaign. Please try again.")}`);
  }
  refresh();
  redirect(`/marketing/${data.id}?notice=${enc("Duplicated. You are now editing the copy.")}`);
}

export async function deleteCampaign(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = idFrom(fd);

  const { data: row } = await supabase
    .from("marketing_campaigns")
    .select("image_path")
    .eq("id", id)
    .eq("studio_id", studio.id)
    .maybeSingle();
  const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id).eq("studio_id", studio.id);
  if (error) redirect(`/marketing/${id}?error=${enc("Could not delete this campaign. Please try again.")}`);
  if (row?.image_path) {
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([row.image_path]);
    if (rmErr) console.error("[marketing-delete] storage", rmErr.message);
  }
  refresh();
  redirect("/marketing/history?notice=" + enc("Campaign deleted."));
}
