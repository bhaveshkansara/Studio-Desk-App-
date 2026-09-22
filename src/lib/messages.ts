import { first, fmtDate, fmtTime, inr } from "./format";
import { KINDS, balanceOfBooking, balanceOfStudent } from "./types";
import type { Booking, Student } from "./types";

export type Vars = Record<string, string>;

export const TEMPLATE_LABELS: Record<string, { label: string; hint: string }> = {
  enquiry_reply: { label: "Enquiry reply", hint: "First reply to a new enquiry." },
  confirmation: { label: "Booking confirmation", hint: "Sent when a booking is confirmed." },
  reminder: { label: "Reminder", hint: "Sent a day or two before the event." },
  balance_due: { label: "Balance due", hint: "Asks for the remaining payment." },
  student_fee: { label: "Student fee reminder", hint: "Asks a student for pending fees." },
  review_request: { label: "Review request", hint: "Sent after the event." },
};

// Keep in step with seed_templates() in supabase/schema.sql.
export const DEFAULT_TEMPLATES: Record<string, string> = {
  enquiry_reply:
    "Hi {{name}}, thank you for your enquiry! I am checking my availability for {{date}}. Could you please share the venue, the timing and how many people need makeup? I will send the details and pricing right away. - {{studio}}",
  confirmation:
    "Hi {{name}}, your booking is confirmed!\n\nService: {{service}}\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\nTotal: {{total}}\nAdvance received: {{paid}}\nBalance due: {{balance}}\n\nPlease come with a clean, moisturised face and share a photo of your outfit. Thank you! - {{studio}}",
  reminder:
    "Hi {{name}}, a quick reminder about your {{service}} booking on {{date}} at {{time}} ({{venue}}). The balance due is {{balance}}. Please reply to confirm. Thank you! - {{studio}}",
  balance_due:
    "Hi {{name}}, a gentle reminder that {{balance}} is pending for your booking on {{date}}. Please let me know when you can pay. Thank you! - {{studio}}",
  student_fee:
    "Hi {{name}}, a gentle reminder that {{balance}} is pending for the {{course}} course. Please let me know when you can pay. Thank you! - {{studio}}",
  review_request:
    "Hi {{name}}, thank you for choosing {{studio}}! If you loved your look, a quick Google review would mean a lot to us.",
};

export const PLACEHOLDERS = [
  "{{name}}",
  "{{studio}}",
  "{{service}}",
  "{{date}}",
  "{{time}}",
  "{{venue}}",
  "{{total}}",
  "{{paid}}",
  "{{balance}}",
  "{{course}}",
];

const FALLBACK: Vars = {
  date: "your event date",
  time: "the agreed time",
  venue: "your venue",
  service: "your makeup",
  course: "makeup",
};

export function renderTemplate(body: string, vars: Vars): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k: string) => vars[k] || FALLBACK[k] || "");
}

export function bookingVars(b: Booking, studioName: string): Vars {
  return {
    name: first(b.client),
    studio: studioName,
    service: b.service || KINDS[b.kind] || "",
    date: fmtDate(b.event_date),
    time: fmtTime(b.event_time),
    venue: b.venue || "",
    total: Number(b.total) > 0 ? inr(b.total) : "",
    paid: Number(b.paid) > 0 ? inr(b.paid) : inr(0),
    balance: inr(balanceOfBooking(b)),
  };
}

export function studentVars(s: Student, studioName: string): Vars {
  return {
    name: first(s.name),
    studio: studioName,
    course: s.course,
    total: inr(s.fee),
    paid: inr(s.paid),
    balance: inr(balanceOfStudent(s)),
  };
}

/** WhatsApp click-to-chat link. Returns null when the phone number is unusable. */
export function waLink(phone: string | null | undefined, text: string): string | null {
  const d = String(phone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const n = d.length === 10 ? "91" + d : d.replace(/^0+/, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

/** Instagram DM link from a handle or profile URL. */
export function igLink(handle: string | null | undefined): string | null {
  const h = String(handle ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `https://ig.me/m/${h}` : null;
}

export function cleanHandle(v: string | null | undefined): string | null {
  const h = String(v ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : null;
}
