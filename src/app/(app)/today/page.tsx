import Link from "next/link";
import { Fragment } from "react";
import { BookingRow, StudentRow } from "@/components/Rows";
import { getTemplates, requireStudio } from "@/lib/auth";
import { dayDiff, dayLabel, inr, minutes } from "@/lib/format";
import { SOURCES, SRC_SHORT, balanceOfBooking, balanceOfStudent, isUpcoming } from "@/lib/types";
import type { Booking, Source, Student } from "@/lib/types";

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

export default async function TodayPage() {
  const { supabase, studio } = await requireStudio();
  const templates = await getTemplates(supabase, studio.id);
  const [bk, st, ld] = await Promise.all([
    supabase.from("bookings").select("*").eq("studio_id", studio.id).limit(2000),
    supabase.from("students").select("*").eq("studio_id", studio.id).limit(2000),
    supabase.from("leads").select("id").eq("studio_id", studio.id).eq("status", "new"),
  ]);
  const bookings = (bk.data ?? []) as Booking[];
  const students = (st.data ?? []) as Student[];
  const newLeads = (ld.data ?? []).length;

  const upcoming = bookings
    .filter((b) => isUpcoming(b, dayDiff(b.event_date)))
    .sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1));
  const clash = clashIds(upcoming);
  const next7 = upcoming.filter((b) => (dayDiff(b.event_date) ?? 99) <= 7).length;
  const collectB = bookings
    .filter((b) => b.status === "confirmed" || b.status === "done")
    .reduce((s, b) => s + balanceOfBooking(b), 0);
  const collectS = students.reduce((s, x) => s + balanceOfStudent(x), 0);
  const active = students.filter((s) => s.status === "active").length;
  const enquiries = bookings.filter((b) => {
    const n = dayDiff(b.event_date);
    return b.status === "enquiry" && (n === null || n >= 0);
  });

  const enqBySource: Partial<Record<Source, number>> = {};
  for (const b of enquiries) if (b.source) enqBySource[b.source] = (enqBySource[b.source] ?? 0) + 1;
  const enqNote = (Object.keys(enqBySource) as Source[])
    .map((k) => `${enqBySource[k]} ${SRC_SHORT[k]}`)
    .join(" · ");

  const soon = upcoming.filter((b) => (dayDiff(b.event_date) ?? 99) <= 14);

  // "Needs a nudge": confirmations to send, balances due within a week, open enquiries, student fees.
  const seen = new Set<string>();
  const nudgeBookings: Booking[] = [];
  const addB = (b: Booking) => {
    if (!seen.has(b.id)) {
      seen.add(b.id);
      nudgeBookings.push(b);
    }
  };
  upcoming.filter((b) => b.status === "confirmed" && !b.confirmation_sent).forEach(addB);
  upcoming
    .filter((b) => b.status === "confirmed" && (dayDiff(b.event_date) ?? 99) <= 7 && balanceOfBooking(b) > 0)
    .forEach(addB);
  enquiries
    .slice()
    .sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1))
    .slice(0, 4)
    .forEach(addB);
  const nudgeStudents = students
    .filter((s) => s.status === "active" && balanceOfStudent(s) > 0)
    .sort((a, b) => balanceOfStudent(b) - balanceOfStudent(a))
    .slice(0, 3);

  const bySrcB: Partial<Record<Source, number>> = {};
  const bySrcS: Partial<Record<Source, number>> = {};
  for (const b of bookings) if (b.source && b.status !== "cancelled") bySrcB[b.source] = (bySrcB[b.source] ?? 0) + 1;
  for (const s of students) if (s.source) bySrcS[s.source] = (bySrcS[s.source] ?? 0) + 1;
  const sourceKeys = (Object.keys(SOURCES) as Source[]).filter((k) => (bySrcB[k] ?? 0) + (bySrcS[k] ?? 0) > 0);
  const maxSrc = Math.max(1, ...sourceKeys.map((k) => (bySrcB[k] ?? 0) + (bySrcS[k] ?? 0)));

  const hasAnything = bookings.length + students.length > 0;
  let lastDay = "";

  // Revenue metrics
  const todayISO = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartISO = monthStart.toISOString().slice(0, 10);

  const todayRevenue = bookings
    .filter((b) => b.event_date === todayISO && b.status === "confirmed")
    .reduce((s, b) => s + Number(b.total), 0);

  const monthRevenue = bookings
    .filter((b) => b.event_date && b.event_date >= monthStartISO && (b.status === "confirmed" || b.status === "done"))
    .reduce((s, b) => s + Number(b.total), 0);

  const confirmedCount = bookings.filter((b) => b.status === "confirmed" || b.status === "done").length;
  const conversionRate = enquiries.length > 0 ? Math.round((confirmedCount / (confirmedCount + enquiries.length)) * 100) : 0;

  return (
    <>
      {newLeads > 0 ? (
        <div className="banner info" style={{ marginTop: 0 }}>
          <strong>
            {newLeads} new {newLeads === 1 ? "message" : "messages"}
          </strong>{" "}
          waiting in your Inbox.{" "}
          <Link className="btn" href="/inbox">
            Review
          </Link>
        </div>
      ) : null}

      {!hasAnything ? (
        <div className="panel empty">
          <p style={{ margin: "0 0 12px" }}>Nothing here yet. Add your first booking or student to get started.</p>
          <div className="data" style={{ justifyContent: "center" }}>
            <Link className="btn primary" href="/bookings/new">
              New booking
            </Link>
            <Link className="btn" href="/students/new">
              New student
            </Link>
            <Link className="btn" href="/inbox">
              Paste an enquiry
            </Link>
          </div>
        </div>
      ) : null}

      <div className="strip">
        <div>
          <b>{inr(monthRevenue)}</b>
          <span>Revenue this month</span>
          <em>{confirmedCount} confirmed bookings</em>
        </div>
        <div>
          <b>{inr(collectB + collectS)}</b>
          <span>Still to collect</span>
          <em>
            {inr(collectB)} bookings &middot; {inr(collectS)} fees
          </em>
        </div>
        <div>
          <b>{next7}</b>
          <span>Bookings in next 7 days</span>
          <em>{enquiries.length} enquiries to follow up</em>
        </div>
        <div>
          <b>{conversionRate}%</b>
          <span>Conversion rate</span>
          <em>{confirmedCount} of {confirmedCount + enquiries.length} leads</em>
        </div>
      </div>

      <section>
        <div className="sec-head">
          <h2>Coming up</h2>
          <span>Next 14 days</span>
        </div>
        <div className="panel">
          <ul className="list">
            {soon.length ? (
              soon.map((b) => {
                const label = dayLabel(b.event_date);
                const header = label !== lastDay;
                lastDay = label;
                return (
                  <Fragment key={b.id}>
                    {header ? <li className="day">{label}</li> : null}
                    <BookingRow b={b} studioName={studio.name} templates={templates} clash={clash.has(b.id)} />
                  </Fragment>
                );
              })
            ) : (
              <li className="empty">Nothing booked in the next 14 days.</li>
            )}
          </ul>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Needs a nudge</h2>
          <span>Confirmations to send, balances due, open enquiries, student fees</span>
        </div>
        <div className="panel">
          <ul className="list">
            {nudgeBookings.map((b) => (
              <BookingRow key={b.id} b={b} studioName={studio.name} templates={templates} clash={clash.has(b.id)} />
            ))}
            {nudgeStudents.map((s) => (
              <StudentRow key={s.id} s={s} studioName={studio.name} templates={templates} />
            ))}
            {nudgeBookings.length + nudgeStudents.length === 0 ? <li className="empty">All caught up.</li> : null}
          </ul>
        </div>
      </section>

      {sourceKeys.length ? (
        <section>
          <div className="sec-head">
            <h2>Where clients come from</h2>
            <span>All bookings and students</span>
          </div>
          <div className="panel" style={{ padding: "6px 14px" }}>
            <ul className="list">
              {sourceKeys.map((k) => {
                const a = bySrcB[k] ?? 0;
                const c = bySrcS[k] ?? 0;
                return (
                  <li key={k} className="srcrow">
                    <span>{SRC_SHORT[k]}</span>
                    <span className="bar" role="img" aria-label={`${a + c} clients`}>
                      <i style={{ width: `${Math.round(((a + c) / maxSrc) * 100)}%` }} />
                    </span>
                    <span className="bal">
                      {a} booking{a === 1 ? "" : "s"}
                      {c ? ` · ${c} student${c === 1 ? "" : "s"}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section>
        <div className="sec-head">
          <h2>Your data</h2>
        </div>
        <p className="hint">Download a copy any time, to keep a backup or open in Excel.</p>
        <div className="data">
          <a className="btn" href="/api/export/bookings">
            Export bookings (CSV)
          </a>
          <a className="btn" href="/api/export/students">
            Export students (CSV)
          </a>
        </div>
      </section>

      <Link className="fab" href="/bookings/new">
        + New booking
      </Link>
    </>
  );
}
