// The app is built for studios in India, so "today" is always Indian Standard Time.
const TZ = "Asia/Kolkata";

export const inr = (n: number | string | null | undefined) =>
  "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

/** Today's date in IST as YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today (IST) to the given date. Negative when in the past. */
export function dayDiff(iso?: string | null): number | null {
  if (!iso) return null;
  const a = Date.parse(iso + "T00:00:00Z");
  const b = Date.parse(todayISO() + "T00:00:00Z");
  if (Number.isNaN(a)) return null;
  return Math.round((a - b) / 86400000);
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function dayLabel(iso?: string | null): string {
  const n = dayDiff(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return fmtDate(iso);
}

/** Accepts "HH:MM" or "HH:MM:SS". */
export function fmtTime(t?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}

export const minutes = (t?: string | null): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export const first = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || "there";

export function initials(n?: string | null): string {
  const p = (n ?? "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "?") + (p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** CSV with a BOM so Excel opens UTF-8 (rupee signs, Hindi names) correctly. */
export function toCsv(head: string[], rows: unknown[][]): string {
  return "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
