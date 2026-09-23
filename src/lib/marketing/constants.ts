// Shared by the browser and the server. Keep this file free of server-only imports.

export const IMAGE_KINDS = {
  bridal: "Bridal makeup",
  before_after: "Before / after",
  reel_thumbnail: "Reel thumbnail",
  makeup_look: "Makeup look",
  client_event: "Client / event",
} as const;
export type ImageKind = keyof typeof IMAGE_KINDS;

export const OCCASIONS = {
  bride: "Bride",
  party: "Party",
  engagement: "Engagement",
  reception: "Reception",
  editorial: "Editorial",
  fashion: "Fashion",
} as const;
export type Occasion = keyof typeof OCCASIONS;

export const TONES = {
  luxury: "Luxury & elegant",
  warm: "Warm & personal",
  playful: "Fun & playful",
  minimal: "Minimal & clean",
  bold: "Bold & confident",
  professional: "Professional & expert",
} as const;
export type Tone = keyof typeof TONES;

export const CONTENT_TYPES = {
  feed_post: "Feed post",
  carousel: "Carousel",
  reel: "Reel",
  story: "Story",
  before_after: "Before / after",
  educational: "Educational",
  portfolio: "Portfolio",
  booking: "Booking-focused",
} as const;
export type ContentType = keyof typeof CONTENT_TYPES;

export const GOALS = {
  reach: "Reach",
  engagement: "Engagement",
  profile_visits: "Profile visits",
  leads: "Leads",
  bookings: "Bookings",
  authority: "Authority",
  portfolio: "Portfolio",
} as const;
export type Goal = keyof typeof GOALS;

export const CAMPAIGN_STATUS = {
  draft: "Draft",
  ready: "Ready to post",
  scheduled: "Scheduled",
  posted: "Posted",
  archived: "Archived",
} as const;
export type CampaignStatus = keyof typeof CAMPAIGN_STATUS;

/** Sections that can be regenerated on their own after the first analysis. */
export const SECTIONS = {
  caption: "Generate Caption",
  hashtags: "Generate Hashtags",
  keywords: "Generate Keywords",
  calendar: "Generate 10-Day Calendar",
  improve: "Improve Content",
} as const;
export type Section = keyof typeof SECTIONS;

export const LOCATION_SUGGESTIONS = [
  "Jaipur",
  "Udaipur",
  "Jodhpur",
  "Jaisalmer",
  "Pushkar",
  "Delhi",
  "Mumbai",
  "Goa",
  "Phuket",
  "Bali",
  "Dubai",
  "Abu Dhabi",
];

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** Largest photo a user may pick. The browser shrinks it before upload. */
export const MAX_PICK_BYTES = 15 * 1024 * 1024;
/** Largest image the server accepts (Claude's per-image limit is 5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Longest edge sent to the AI. Larger images cost more and add nothing. */
export const MAX_EDGE_PX = 1568;

export interface CampaignDetails {
  imageKind: ImageKind;
  makeupType: string;
  occasion: Occasion | "";
  location: string;
  destination: string;
  brandName: string;
  audience: string;
  instagram: string;
  offer: string;
  tone: Tone | "";
}

export const EMPTY_DETAILS: CampaignDetails = {
  imageKind: "bridal",
  makeupType: "",
  occasion: "",
  location: "",
  destination: "",
  brandName: "",
  audience: "",
  instagram: "",
  offer: "",
  tone: "",
};
