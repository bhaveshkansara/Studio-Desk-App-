// Plain-text helpers shared by the browser (copy / download) and the server (saving).
import { toCsv } from "@/lib/format";
import { CONTENT_TYPES, GOALS } from "./constants";
import type { MarketingResult } from "./schema";

export const HASHTAG_GROUPS = {
  highIntentBridal: "High-intent bridal",
  localSeo: "Local SEO",
  destinationWedding: "Destination wedding",
  makeupNiche: "Makeup niche",
  longTail: "Long-tail",
} as const;

export const KEYWORD_GROUPS = {
  secondary: "Secondary",
  local: "Local",
  longTail: "Long-tail",
  instagram: "Instagram SEO",
  google: "Google SEO",
  reel: "Reel",
} as const;

const uniq = (list: string[]) => [...new Set(list.map((s) => s.trim()).filter(Boolean))];

export const allHashtags = (r: Pick<MarketingResult, "hashtags">) =>
  uniq((Object.keys(HASHTAG_GROUPS) as (keyof typeof HASHTAG_GROUPS)[]).flatMap((k) => r.hashtags[k])).slice(0, 30);

export const allKeywords = (r: Pick<MarketingResult, "keywords">) =>
  uniq([r.keywords.primary, ...(Object.keys(KEYWORD_GROUPS) as (keyof typeof KEYWORD_GROUPS)[]).flatMap((k) => r.keywords[k])]);

export const hashtagsText = (tags: string[]) => tags.join(" ");
export const keywordsText = (keywords: string[]) => keywords.join("\n");

/** "24 Sep, Thu" for a YYYY-MM-DD date. */
export function calDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: "UTC",
  });
}

export function calendarCsv(r: Pick<MarketingResult, "calendar">): string {
  return toCsv(
    ["Day", "Date", "Content type", "Topic", "Hook", "Caption idea", "CTA", "Keywords", "Hashtags", "Posting time", "Goal"],
    r.calendar.map((d) => [
      d.day,
      d.date,
      CONTENT_TYPES[d.contentType],
      d.topic,
      d.hook,
      d.captionIdea,
      d.cta,
      d.keywords.join("; "),
      d.hashtags.join(" "),
      d.postingTime,
      GOALS[d.goal],
    ]),
  );
}
