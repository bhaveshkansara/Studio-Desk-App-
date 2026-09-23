import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CAMPAIGN_STATUS } from "@/lib/marketing/constants";
import { MarketingError, parseDetails, rateLimit, readImage } from "@/lib/marketing/guard";
import { BUCKET, SETUP_MESSAGE, errorResponse, isMissingSetup, readForm, requireApiContext } from "@/lib/marketing/http";
import { MarketingResultSchema } from "@/lib/marketing/schema";
import { allHashtags, allKeywords } from "@/lib/marketing/text";

export const runtime = "nodejs";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

/** Saves a generated campaign (and its photo) to the studio's marketing history. */
export async function POST(req: Request) {
  try {
    const { supabase, user, studio } = await requireApiContext();
    rateLimit(`save:${user.id}`, 30, 10 * 60 * 1000);

    const form = await readForm(req);
    const parsed = (() => {
      try {
        return MarketingResultSchema.safeParse(JSON.parse(String(form.get("result") ?? "")));
      } catch {
        return null;
      }
    })();
    if (!parsed?.success) throw new MarketingError("There is nothing valid to save. Please analyse a photo first.");
    const result = parsed.data;
    const details = parseDetails(form.get("details"));
    const title = String(form.get("title") ?? "").trim().slice(0, 140) || result.instagramSeo.postTitle || "Marketing campaign";
    const statusRaw = String(form.get("status") ?? "draft");
    const status = Object.prototype.hasOwnProperty.call(CAMPAIGN_STATUS, statusRaw) ? statusRaw : "draft";
    const image = await readImage(form, false);

    let imagePath: string | null = null;
    if (image) {
      imagePath = `${studio.id}/${randomUUID()}.${EXT[image.mediaType]}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, image.bytes, { contentType: image.mediaType, upsert: false });
      if (error) {
        console.error("[marketing-save] upload", error.message);
        throw new MarketingError(isMissingSetup(error) ? SETUP_MESSAGE : "The photo could not be saved. Please try again.", 503);
      }
    }

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        studio_id: studio.id,
        created_by: user.id,
        title,
        status,
        content_type: result.recommendation.primary,
        image_path: imagePath,
        details,
        result,
        caption: result.captions.main,
        hashtags: allHashtags(result),
        keywords: allKeywords(result),
      })
      .select("id")
      .single();

    if (error || !data) {
      if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
      console.error("[marketing-save] insert", error?.code, error?.message);
      throw new MarketingError(isMissingSetup(error) ? SETUP_MESSAGE : "The campaign could not be saved. Please try again.", 503);
    }

    revalidatePath("/marketing", "layout");
    return NextResponse.json({ id: data.id });
  } catch (err) {
    return errorResponse(err);
  }
}
