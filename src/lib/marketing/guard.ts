import { createHash } from "node:crypto";
import { EMPTY_DETAILS, IMAGE_KINDS, MAX_UPLOAD_BYTES, OCCASIONS, TONES } from "./constants";
import type { CampaignDetails, ImageKind, Occasion, Tone } from "./constants";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";

/** A user-facing failure with the HTTP status the API should answer with. */
export class MarketingError extends Error {
  constructor(
    message: string,
    public status = 400,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

/** Detects the real image type from its first bytes, ignoring what the browser claimed. */
export function sniffImage(bytes: Uint8Array): ImageMediaType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export interface UploadedImage {
  bytes: Uint8Array;
  mediaType: ImageMediaType;
  base64: string;
}

/** Reads and validates the uploaded image from a multipart form. */
export async function readImage(form: FormData): Promise<UploadedImage>;
export async function readImage(form: FormData, required: false): Promise<UploadedImage | null>;
export async function readImage(form: FormData, required = true): Promise<UploadedImage | null> {
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    if (!required) return null;
    throw new MarketingError("Please upload a photo first.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new MarketingError("This photo is too large. Please use an image under 5 MB.", 413);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = sniffImage(bytes);
  if (!mediaType) {
    throw new MarketingError("This file is not a valid JPG, PNG or WebP image.", 415);
  }
  return { bytes, mediaType, base64: Buffer.from(bytes).toString("base64") };
}

const clip = (v: unknown, max = 120) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const oneOf = <T extends string>(v: unknown, allowed: Record<T, string>): T | "" =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(allowed, v) ? (v as T) : "";

/** Parses the optional details the user typed. Unknown keys are dropped, long text is cut. */
export function parseDetails(raw: unknown): CampaignDetails {
  let obj: Record<string, unknown> = {};
  if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") obj = parsed as Record<string, unknown>;
    } catch {
      throw new MarketingError("The details could not be read. Please refresh the page and try again.");
    }
  }
  return {
    imageKind: (oneOf<ImageKind>(obj.imageKind, IMAGE_KINDS) || EMPTY_DETAILS.imageKind) as ImageKind,
    makeupType: clip(obj.makeupType),
    occasion: oneOf<Occasion>(obj.occasion, OCCASIONS),
    location: clip(obj.location, 80),
    destination: clip(obj.destination, 80),
    brandName: clip(obj.brandName, 80),
    audience: clip(obj.audience, 160),
    instagram: clip(obj.instagram, 40).replace(/^@+/, "").replace(/[^\w.]/g, ""),
    offer: clip(obj.offer, 200),
    tone: oneOf<Tone>(obj.tone, TONES),
  };
}

export const sha256 = (...parts: (string | Uint8Array)[]) => {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  return h.digest("hex");
};

// ------------------------------------------------------------------ rate limiting
// Kept in memory: enough to stop accidental double-clicks and runaway loops on one server.
// On multi-instance hosting each instance counts separately.
const hits = new Map<string, number[]>();

/** Throws a 429 MarketingError when `key` made `limit` calls within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    hits.set(key, recent);
    throw new MarketingError(
      `You have reached the limit for now. Please wait ${retryAfter < 90 ? `${retryAfter} seconds` : `${Math.ceil(retryAfter / 60)} minutes`} and try again.`,
      429,
      retryAfter,
    );
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
}

// ------------------------------------------------------------------ result cache
// Re-analysing the same photo with the same details returns the earlier result instead of
// paying for another AI call.
const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_MAX = 200;

export function cacheGet<T>(key: string, now = Date.now()): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (now - hit.at > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, now = Date.now()) {
  cache.delete(key);
  cache.set(key, { at: now, value });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
}
