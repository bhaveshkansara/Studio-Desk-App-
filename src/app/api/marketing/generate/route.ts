import { NextResponse } from "next/server";
import { marketingAiAvailable, regenerateSection } from "@/lib/marketing/ai";
import { SECTIONS } from "@/lib/marketing/constants";
import type { Section } from "@/lib/marketing/constants";
import { MarketingError, parseDetails, rateLimit, readImage } from "@/lib/marketing/guard";
import { errorResponse, readForm, requireApiContext } from "@/lib/marketing/http";
import { MarketingResultSchema } from "@/lib/marketing/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Regenerates one section (caption, hashtags, keywords, calendar or improvement advice). */
export async function POST(req: Request) {
  try {
    const { user } = await requireApiContext();
    if (!marketingAiAvailable()) {
      throw new MarketingError("AI is not set up yet. Ask your admin to add ANTHROPIC_API_KEY on the server.", 503);
    }
    const form = await readForm(req);

    const section = form.get("section");
    if (typeof section !== "string" || !Object.prototype.hasOwnProperty.call(SECTIONS, section)) {
      throw new MarketingError("Unknown section.");
    }
    let current;
    try {
      current = MarketingResultSchema.parse(JSON.parse(String(form.get("current") ?? "")));
    } catch {
      throw new MarketingError("Please analyse a photo first.");
    }
    const details = parseDetails(form.get("details"));
    const image = section === "improve" ? await readImage(form, false) : null;

    rateLimit(`generate:${user.id}`, 30, 10 * 60 * 1000);
    const result = await regenerateSection(section as Section, current, details, image);
    return NextResponse.json({ result });
  } catch (err) {
    return errorResponse(err);
  }
}
