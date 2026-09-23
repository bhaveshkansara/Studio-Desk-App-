import type { CampaignDetails } from "./constants";
import type { ModelResult } from "./schema";

/**
 * Canned output for local development when MARKETING_AI_SAMPLE=1 and no API key is set.
 * Never used in production (see `sampleMode` in ./ai).
 */
export function sampleResult(d: CampaignDetails, variant = false): ModelResult {
  const city = d.location || "Jaipur";
  const c = city.toLowerCase().replace(/[^a-z]/g, "");
  const dest = d.destination || "Udaipur";
  const brand = d.brandName || "our studio";
  const v = variant ? " (new version)" : "";

  const topics: [ModelResult["calendar"][number]["contentType"], string, ModelResult["calendar"][number]["goal"]][] = [
    ["reel", "Bridal transformation in 30 seconds", "reach"],
    ["carousel", "5 things to do a week before your wedding makeup", "engagement"],
    ["story", "Poll: soft glam or bold bridal?", "engagement"],
    ["before_after", "Before / after of a real bride", "profile_visits"],
    ["educational", "How to choose your bridal lip shade", "authority"],
    ["portfolio", "This month's brides", "portfolio"],
    ["reel", "Behind the scenes on a destination wedding", "reach"],
    ["carousel", "Bridal FAQs: trial, timing, touch-ups", "leads"],
    ["story", "Client review + booking link", "leads"],
    ["booking", "Limited dates open for the season", "bookings"],
  ];

  return {
    analysis: {
      isBeautyContent: true,
      summary: `A bridal look with a soft, glowing base and defined eyes${v}.`,
      makeupStyle: "Soft glam bridal",
      skinFinish: "Satin, natural glow",
      eyeMakeup: "Warm brown smoky eyes with lashes",
      lipStyle: "Rosy nude, lined",
      hairStyle: "Low bun with fresh flowers",
      outfitStyling: "Red bridal lehenga with gold jewellery",
      aesthetic: "Classic, warm and luxurious",
      occasion: "Wedding",
      contentAngle: "Real bride, soft glam that still photographs well",
    },
    captions: {
      hook: `Soft glam, but make it bridal${v}.`,
      main: `Soft glam, but make it bridal${v}.\n\nShe wanted to look like herself on her wedding day, only a little more glowing. So we kept the base light, built warmth around the eyes and finished with a rosy nude lip that lasted through every ritual.\n\nBridal makeup in ${city} for brides who love a timeless look.\n\nDM "BRIDE" to check availability for your date.`,
      alternatives: [
        `Her first words after the mirror: "This is me, just better." That is the whole goal. Bridal makeup by ${brand} in ${city}. DM "BRIDE" for dates.`,
        `Tip for brides: pick a lip shade one tone deeper than your everyday nude so it shows in photos. This rosy nude did exactly that. Booking ${city} weddings now.`,
        `Glow that lasts from pheras to the last dance. DM "BRIDE".`,
      ],
      cta: "Save this for your bridal mood board.",
      bookingCta: 'DM "BRIDE" to check availability for your date.',
    },
    hashtags: {
      highIntentBridal: ["#bridalmakeupartist", "#bridalmakeup", "#indianbride", "#brideoftheday", "#weddingmakeup"],
      localSeo: [`#${c}bride`, `#${c}makeupartist`, `#${c}weddings`, `#bridalmakeup${c}`],
      destinationWedding: ["#destinationwedding", `#${dest.toLowerCase().replace(/[^a-z]/g, "")}wedding`, "#rajasthanwedding", "#destinationweddingindia"],
      makeupNiche: ["#softglam", "#hdmakeup", "#airbrushmakeup", "#glowingskin", "#mua"],
      longTail: ["#softglambridalmakeup", "#bridalmakeuplook2026", "#naturalbridalmakeup", "#bridalmakeupinspo"],
    },
    keywords: {
      primary: `Bridal Makeup Artist ${city}`,
      secondary: ["Soft Glam Bridal Makeup", "HD Bridal Makeup", "Airbrush Bridal Makeup"],
      local: [`Best Makeup Artist in ${city}`, `Luxury Bridal Makeup ${city}`, `Makeup Artist near me ${city}`],
      longTail: [`Soft glam bridal makeup artist in ${city}`, "Natural bridal makeup for Indian weddings"],
      instagram: ["bridal makeup", `${city} makeup artist`, "soft glam bride"],
      google: [`bridal makeup artist ${city} price`, `best bridal makeup ${city}`],
      reel: ["bridal transformation", "soft glam bride", "bridal makeup tutorial"],
    },
    instagramSeo: {
      seoCaption: `Soft glam bridal makeup in ${city}. A light satin base, warm brown eyes and a rosy nude lip that lasts all day. Bridal makeup artist for ${city} and ${dest} weddings. DM "BRIDE" to book.`,
      altText: "Bride with soft glam makeup, warm brown eyes, rosy nude lips and a low bun with flowers.",
      postTitle: `Soft Glam Bride | ${city}`,
      captionKeywords: [`bridal makeup artist ${city}`, "soft glam", "bridal makeup", "rosy nude lip"],
      profileKeywords: ["Bridal Makeup Artist", city, "Destination Weddings", "Soft Glam"],
      locationTag: `${city}, India`,
    },
    posting: {
      bestDay: "Sunday",
      bestTime: "7:30 PM",
      backupTime: "1:00 PM",
      timezone: "IST",
      reason: "Brides and families browse wedding content in the evening and on weekends.",
    },
    recommendation: {
      primary: "carousel",
      alsoGood: ["reel", "before_after", "story"],
      why: "A carousel lets you show close-ups of the eyes, lips and full look. Brides save carousels for later, which helps reach.",
    },
    calendar: topics.map(([contentType, topic, goal], i) => ({
      day: i + 1,
      contentType,
      topic,
      hook: `${topic}${v}`,
      captionIdea: `Share ${topic.toLowerCase()} with a short personal note.`,
      cta: goal === "bookings" || goal === "leads" ? 'DM "BRIDE" to check dates' : "Save and share with a bride-to-be",
      keywords: [`bridal makeup ${city}`, "soft glam"],
      hashtags: ["#bridalmakeup", `#${c}bride`, "#softglam"],
      postingTime: i % 2 ? "1:00 PM" : "7:30 PM",
      goal,
    })),
    improvements: {
      content: [
        { area: "Lighting", tip: "Shoot facing a window with soft daylight so the skin finish shows true." },
        { area: "Makeup visibility", tip: "Add one close-up of the eyes and lips as a second slide." },
      ],
      marketing: [
        { area: "Location SEO", tip: `Mention ${city} once in the first two lines of the caption.` },
        { area: "Hook", tip: "Open with the bride's reaction or one bold line, not a greeting." },
      ],
      profile: [{ area: "Highlights", tip: "Create a 'Brides' highlight so new visitors see your work fast." }],
      booking: [{ area: "CTA", tip: 'Use one clear keyword CTA like DM "BRIDE" on every bridal post.' }],
    },
    scores: {
      photo: { score: 8, howToImprove: "Add a close-up slide to show detail." },
      caption: { score: 6, howToImprove: "Share the bride's story or the look's details." },
      seo: { score: d.location ? 7 : 4, howToImprove: "Add your city and service in the details." },
      bookingCta: { score: d.offer ? 7 : 5, howToImprove: "Add your offer and Instagram handle." },
      overall: { score: 7, howToImprove: "Post as a carousel with the SEO caption above." },
    },
  };
}
