import { z } from "zod";
import { CONTENT_TYPES, GOALS } from "./constants";
import type { ContentType, Goal } from "./constants";

const contentType = z.enum(Object.keys(CONTENT_TYPES) as [ContentType, ...ContentType[]]);
const goal = z.enum(Object.keys(GOALS) as [Goal, ...Goal[]]);

// Structured outputs do not enforce array lengths or number ranges, so the prompt asks for
// them and `normalizeResult` clamps them after parsing.

export const AnalysisSchema = z.object({
  isBeautyContent: z.boolean(),
  summary: z.string(),
  makeupStyle: z.string(),
  skinFinish: z.string(),
  eyeMakeup: z.string(),
  lipStyle: z.string(),
  hairStyle: z.string(),
  outfitStyling: z.string(),
  aesthetic: z.string(),
  occasion: z.string(),
  contentAngle: z.string(),
});

export const CaptionsSchema = z.object({
  hook: z.string(),
  main: z.string(),
  alternatives: z.array(z.string()),
  cta: z.string(),
  bookingCta: z.string(),
});

export const HashtagsSchema = z.object({
  highIntentBridal: z.array(z.string()),
  localSeo: z.array(z.string()),
  destinationWedding: z.array(z.string()),
  makeupNiche: z.array(z.string()),
  longTail: z.array(z.string()),
});

export const KeywordsSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()),
  local: z.array(z.string()),
  longTail: z.array(z.string()),
  instagram: z.array(z.string()),
  google: z.array(z.string()),
  reel: z.array(z.string()),
});

export const InstagramSeoSchema = z.object({
  seoCaption: z.string(),
  altText: z.string(),
  postTitle: z.string(),
  captionKeywords: z.array(z.string()),
  profileKeywords: z.array(z.string()),
  locationTag: z.string(),
});

export const PostingSchema = z.object({
  bestDay: z.string(),
  bestTime: z.string(),
  backupTime: z.string(),
  timezone: z.string(),
  reason: z.string(),
});

export const RecommendationSchema = z.object({
  primary: contentType,
  alsoGood: z.array(contentType),
  why: z.string(),
});

export const CalendarDaySchema = z.object({
  day: z.number().describe("1 to 10"),
  contentType: contentType,
  topic: z.string(),
  hook: z.string(),
  captionIdea: z.string(),
  cta: z.string(),
  keywords: z.array(z.string()),
  hashtags: z.array(z.string()),
  postingTime: z.string(),
  goal: goal,
});

const Tip = z.object({ area: z.string(), tip: z.string() });

export const ImprovementsSchema = z.object({
  content: z.array(Tip),
  marketing: z.array(Tip),
  profile: z.array(Tip),
  booking: z.array(Tip),
});

const Score = z.object({ score: z.number().describe("Whole number from 0 to 10"), howToImprove: z.string() });

export const ScoresSchema = z.object({
  photo: Score,
  caption: Score,
  seo: Score,
  bookingCta: Score,
  overall: Score,
});

/** What the model returns for a full analysis. */
export const ModelResultSchema = z.object({
  analysis: AnalysisSchema,
  captions: CaptionsSchema,
  hashtags: HashtagsSchema,
  keywords: KeywordsSchema,
  instagramSeo: InstagramSeoSchema,
  posting: PostingSchema,
  recommendation: RecommendationSchema,
  calendar: z.array(CalendarDaySchema),
  improvements: ImprovementsSchema,
  scores: ScoresSchema,
});

/** Per-section schemas used by the one-click "Generate ..." buttons. */
export const SectionSchemas = {
  caption: z.object({ captions: CaptionsSchema, instagramSeo: InstagramSeoSchema }),
  hashtags: z.object({ hashtags: HashtagsSchema }),
  keywords: z.object({ keywords: KeywordsSchema, instagramSeo: InstagramSeoSchema }),
  calendar: z.object({ calendar: z.array(CalendarDaySchema) }),
  improve: z.object({ improvements: ImprovementsSchema, scores: ScoresSchema }),
} as const;

/** What the app stores and renders: the model output plus fields the server fills in itself. */
export const MarketingResultSchema = ModelResultSchema.extend({
  posting: PostingSchema.extend({
    source: z.enum(["general", "account"]),
    label: z.string(),
  }),
  calendar: z.array(CalendarDaySchema.extend({ date: z.string() })),
  generatedAt: z.string(),
  sample: z.boolean().optional(),
});

export type ModelResult = z.infer<typeof ModelResultSchema>;
export type MarketingResult = z.infer<typeof MarketingResultSchema>;
export type CalendarDay = MarketingResult["calendar"][number];
export type Scores = z.infer<typeof ScoresSchema>;
export type Tip = z.infer<typeof Tip>;
