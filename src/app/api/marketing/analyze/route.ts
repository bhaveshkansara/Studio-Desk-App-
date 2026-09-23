import { NextResponse } from "next/server";
import { analyzeContent, marketingAiAvailable } from "@/lib/marketing/ai";
import { MarketingError, cacheGet, cacheSet, parseDetails, rateLimit, readImage, sha256 } from "@/lib/marketing/guard";
import { errorResponse, readForm, requireApiContext } from "@/lib/marketing/http";
import type { MarketingResult } from "@/lib/marketing/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Analyses an uploaded photo and returns the full marketing kit in one AI call. */
export async function POST(req: Request) {
  try {
    const { user, studio } = await requireApiContext();
    if (!marketingAiAvailable()) {
      throw new MarketingError("AI is not set up yet. Ask your admin to add ANTHROPIC_API_KEY on the server.", 503);
    }
    const form = await readForm(req);
    const image = await readImage(form);
    if (!image) throw new MarketingError("No image provided", 400);
    const details = parseDetails(form.get("details"));

    const key = "analyze:" + sha256(studio.id, image.bytes, JSON.stringify(details));
    const cached = cacheGet<MarketingResult>(key);
    if (cached) return NextResponse.json({ result: cached, cached: true });

    rateLimit(`analyze:${user.id}`, 10, 10 * 60 * 1000);
    const result = await analyzeContent(image, details);
    cacheSet(key, result);
    return NextResponse.json({ result });
  } catch (err) {
    return errorResponse(err);
  }
}
