import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { Booking, Lead } from "@/lib/types";

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.f === "leads" ? "leads" : "bookings";

  const { supabase, studio } = await requireStudio();

  const [{ data: bookings }, { data: leads }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, client, phone, event_date, status, created_at, updated_at")
      .eq("studio_id", studio.id)
      .eq("status", "confirmed")
      .lt("event_date", new Date().toISOString().slice(0, 10)),
    supabase
      .from("leads")
      .select("id, name, phone, status, contacted_at, created_at")
      .eq("studio_id", studio.id)
      .in("status", ["new", "contacted", "quotation_sent"]),
  ]);

  const bookingsList = (bookings ?? []).map(b => ({
    id: b.id,
    studio_id: studio.id,
    assigned_to: null,
    client: b.client,
    phone: b.phone,
    insta: null,
    source: null,
    kind: "bride" as const,
    status: b.status,
    service: null,
    event_date: b.event_date,
    event_time: null,
    trial_date: null,
    venue: null,
    total: 0,
    paid: 0,
    confirmation_sent: false,
    notes: null,
    created_at: b.created_at || "",
    updated_at: b.updated_at || "",
  })) as Booking[];
  const leadsList = (leads ?? []) as Lead[];

  // Bookings needing follow-ups (within 7 days, not confirmed)
  const upcomingBookings = bookingsList.filter((b) => {
    const daysUntil = b.event_date ? Math.ceil((new Date(b.event_date + "T00:00:00").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
    return daysUntil <= 7 && daysUntil >= 0;
  });

  // Leads needing follow-ups (not contacted in last 3 days)
  const staleLead = leadsList.filter((l) => {
    if (!l.contacted_at) return l.status === "new";
    const daysSinceContact = Math.floor((new Date().getTime() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceContact >= 3;
  });

  return (
    <>
      <div>
        <h2>Follow-ups</h2>
        <p className="hint">Track and manage follow-up reminders for leads and bookings</p>
      </div>

      <section>
        <div className="sec-head">
          <h2>Quick links</h2>
        </div>
        <div className="data" style={{ gap: "8px" }}>
          <Link href="/enquiries" className="btn">
            📨 Enquiries ({leadsList.length})
          </Link>
          <Link href="/bookings" className="btn">
            📅 Bookings ({bookingsList.length})
          </Link>
          <Link href="/payments" className="btn">
            💰 Collections
          </Link>
          <Link href="/quotations" className="btn">
            📝 Quotations
          </Link>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Follow-up schedule</h2>
          <span className="chips">
            <Link className="chip" href="/followups" aria-current={filter === "bookings" ? "true" : undefined}>
              Bookings ({upcomingBookings.length})
            </Link>
            <Link className="chip" href="/followups?f=leads" aria-current={filter === "leads" ? "true" : undefined}>
              Leads ({staleLead.length})
            </Link>
          </span>
        </div>

        {filter === "bookings" ? (
          <div className="panel">
            <ul className="list">
              {upcomingBookings.length ? (
                upcomingBookings.map((b) => (
                  <li key={b.id} className="row">
                    <Link className="row-main" href={`/bookings/${b.id}`}>
                      <span className="txt">
                        <strong>{b.client}</strong>
                        <small>{b.status === "confirmed" ? "Confirmation sent - check on day" : "Need confirmation"}</small>
                      </span>
                      <span className="meta">
                        <span className="tag">{new Date(b.event_date + "T00:00:00").toLocaleDateString()}</span>
                      </span>
                    </Link>
                    <div className="acts">
                      <Link href={`/bookings/${b.id}`} className="act hot">
                        Send reminder
                      </Link>
                    </div>
                  </li>
                ))
              ) : (
                <li className="empty">No bookings to follow up on</li>
              )}
            </ul>
          </div>
        ) : (
          <div className="panel">
            <ul className="list">
              {staleLead.length ? (
                staleLead.map((l) => (
                  <li key={l.id} className="row">
                    <Link className="row-main" href={`/enquiries`}>
                      <span className="txt">
                        <strong>{l.name || "Unnamed"}</strong>
                        <small>{l.status === "new" ? "Not contacted yet" : `Last contact: ${timeAgo(l.contacted_at || l.created_at)}`}</small>
                      </span>
                      <span className="meta">
                        <span className="pill">{l.status}</span>
                      </span>
                    </Link>
                    <div className="acts">
                      <Link href="/enquiries" className="act hot">
                        Follow up
                      </Link>
                    </div>
                  </li>
                ))
              ) : (
                <li className="empty">All leads are up to date</li>
              )}
            </ul>
          </div>
        )}
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>⏰ Auto Follow-ups (Coming Soon)</h3>
        <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "0.9em", lineHeight: "1.6" }}>
          <li>Auto-send quotation 1 day after lead contact</li>
          <li>Auto-send reminder 3 days before event</li>
          <li>Auto-send balance due 1 day before event</li>
          <li>Auto-request review 1 day after event</li>
        </ul>
      </section>
    </>
  );
}
