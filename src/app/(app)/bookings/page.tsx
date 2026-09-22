import Link from "next/link";
import { Fragment } from "react";
import { BookingRow } from "@/components/Rows";
import { getTemplates, requireStudio } from "@/lib/auth";
import { dayDiff, dayLabel, minutes } from "@/lib/format";
import { SOURCES, SRC_SHORT, isUpcoming } from "@/lib/types";
import type { Booking } from "@/lib/types";

const FILTERS: [string, string][] = [
  ["upcoming", "Upcoming"],
  ["enquiry", "Enquiries"],
  ["past", "Past"],
  ["all", "All"],
];

const sortKey = (b: Booking) => `${b.event_date ?? "9999"} ${b.event_time ?? "99:99"}`;

function clashIds(list: Booking[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      if (a.event_date !== b.event_date) continue;
      const ma = minutes(a.event_time);
      const mb = minutes(b.event_time);
      if (ma === null || mb === null || Math.abs(ma - mb) < 180) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string; src?: string }>;
}) {
  const sp = await searchParams;
  const f = FILTERS.some(([k]) => k === sp.f) ? (sp.f as string) : "upcoming";
  const q = (sp.q ?? "").trim().toLowerCase();
  const src = sp.src && sp.src in SOURCES ? sp.src : "";

  const { supabase, studio } = await requireStudio();
  const templates = await getTemplates(supabase, studio.id);
  const { data } = await supabase.from("bookings").select("*").eq("studio_id", studio.id).limit(2000);
  const all = (data ?? []) as Booking[];
  const clash = clashIds(all.filter((b) => isUpcoming(b, dayDiff(b.event_date))));

  let list = all.filter((b) => {
    const n = dayDiff(b.event_date);
    if (f === "upcoming") return isUpcoming(b, n);
    if (f === "enquiry") return b.status === "enquiry";
    if (f === "past") return b.status === "done" || b.status === "cancelled" || (n !== null && n < 0);
    return true;
  });
  if (src) list = list.filter((b) => b.source === src);
  if (q) {
    list = list.filter((b) =>
      [b.client, b.phone, b.insta, b.service, b.venue, b.notes].join(" ").toLowerCase().includes(q),
    );
  }
  const asc = f === "upcoming" || f === "enquiry";
  list.sort((a, b) => (sortKey(a) < sortKey(b) ? (asc ? -1 : 1) : asc ? 1 : -1));

  const href = (nf: string) => `/bookings?f=${nf}${q ? `&q=${encodeURIComponent(q)}` : ""}${src ? `&src=${src}` : ""}`;
  let lastDay = "";

  return (
    <>
      <div className="tools">
        <div className="chips">
          {FILTERS.map(([k, label]) => (
            <Link key={k} className="chip" href={href(k)} aria-current={f === k ? "true" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <form className="filters" method="get">
          <input type="hidden" name="f" value={f} />
          <input
            className="search"
            type="search"
            name="q"
            placeholder="Search name, phone, venue"
            defaultValue={sp.q ?? ""}
            aria-label="Search bookings"
          />
          <select className="search src-filter" name="src" defaultValue={src} aria-label="Filter by source">
            <option value="">All sources</option>
            {Object.entries(SRC_SHORT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Filter
          </button>
        </form>
      </div>

      <div className="panel">
        <ul className="list">
          {list.length ? (
            list.map((b) => {
              let header: React.ReactNode = null;
              if (f === "upcoming") {
                const label = dayLabel(b.event_date);
                if (label !== lastDay) header = <li className="day">{label}</li>;
                lastDay = label;
              }
              return (
                <Fragment key={b.id}>
                  {header}
                  <BookingRow b={b} studioName={studio.name} templates={templates} clash={clash.has(b.id)} />
                </Fragment>
              );
            })
          ) : (
            <li className="empty">No bookings here yet. Tap + New booking.</li>
          )}
        </ul>
      </div>

      <Link className="fab" href="/bookings/new">
        + New booking
      </Link>
    </>
  );
}
