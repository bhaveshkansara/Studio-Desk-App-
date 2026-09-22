import Link from "next/link";
import { Fragment } from "react";
import { updateLeadStatus } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";
import { dayDiff, timeAgo } from "@/lib/format";
import { LSTATUS } from "@/lib/types";
import type { Lead } from "@/lib/types";

const WORKFLOW: (keyof typeof LSTATUS)[] = ["new", "contacted", "quotation_sent", "advance_pending", "confirmed", "completed", "lost"];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.f === "won" ? "won" : sp.f === "lost" ? "lost" : "active";

  const { supabase, studio } = await requireStudio();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("studio_id", studio.id)
    .order("updated_at", { ascending: false })
    .limit(500);

  const leads = (data ?? []) as Lead[];

  let list = leads.filter((l) => {
    if (filter === "won") return l.status === "confirmed" || l.status === "completed";
    if (filter === "lost") return l.status === "lost" || l.status === "dismissed";
    return l.status !== "confirmed" && l.status !== "completed" && l.status !== "lost" && l.status !== "dismissed";
  });

  const stats = {
    new: leads.filter((l) => l.status === "new").length,
    active: leads.filter((l) => !["confirmed", "completed", "lost", "dismissed"].includes(l.status)).length,
    won: leads.filter((l) => l.status === "confirmed" || l.status === "completed").length,
    lost: leads.filter((l) => l.status === "lost" || l.status === "dismissed").length,
  };

  const href = (f: string) => `/enquiries?f=${f}`;

  return (
    <>
      <div>
        <h2>Enquiries & Leads</h2>
        <p className="hint">Track leads through the workflow: New → Contacted → Quotation Sent → Advance Pending → Confirmed → Completed or Lost</p>
      </div>

      <div className="strip">
        <div>
          <b>{stats.new}</b>
          <span>New leads</span>
        </div>
        <div>
          <b>{stats.active}</b>
          <span>In progress</span>
        </div>
        <div>
          <b>{stats.won}</b>
          <span>Won</span>
          <em>{Math.round(((stats.won / (stats.won + stats.lost)) || 0) * 100)}% conversion</em>
        </div>
        <div>
          <b>{stats.lost}</b>
          <span>Lost</span>
        </div>
      </div>

      <section>
        <div className="sec-head">
          <h2>Leads</h2>
          <span className="chips">
            <Link className="chip" href="/enquiries" aria-current={filter === "active" ? "true" : undefined}>
              Active
            </Link>
            <Link className="chip" href={href("won")} aria-current={filter === "won" ? "true" : undefined}>
              Won
            </Link>
            <Link className="chip" href={href("lost")} aria-current={filter === "lost" ? "true" : undefined}>
              Lost
            </Link>
          </span>
        </div>
        <div className="panel">
          <ul className="list">
            {list.length ? (
              list.map((l) => (
                <li key={l.id} className="row">
                  <Link className="row-main" href={`/bookings/new?lead=${l.id}`}>
                    <span className="txt">
                      <strong>
                        {l.name || "(No name)"}
                        {l.kind ? <span className="tag">{l.kind}</span> : null}
                      </strong>
                      <small>{l.summary || l.message?.slice(0, 60)}</small>
                    </span>
                    <span className="meta">
                      <span className="pill">{LSTATUS[l.status]}</span>
                      <span style={{ fontSize: "0.85em", color: "var(--hint)" }}>
                        {l.event_date ? `${dayDiff(l.event_date) === 0 ? "Today" : dayDiff(l.event_date) === 1 ? "Tomorrow" : `${dayDiff(l.event_date)}d`} · ` : ""}
                        {timeAgo(l.updated_at || l.created_at)}
                      </span>
                    </span>
                  </Link>
                  <div className="acts" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {WORKFLOW.indexOf(l.status as any) < WORKFLOW.length - 1 && l.status !== "dismissed" && l.status !== "completed" ? (
                      <form action={updateLeadStatus} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value={WORKFLOW[WORKFLOW.indexOf(l.status as any) + 1]} />
                        {l.status === "new" && <input type="hidden" name="contacted_at" value={new Date().toISOString()} />}
                        <button className="act" type="submit" title={`Move to ${LSTATUS[WORKFLOW[WORKFLOW.indexOf(l.status as any) + 1]]}`}>
                          →
                        </button>
                      </form>
                    ) : null}
                    {l.status !== "confirmed" && l.status !== "completed" && l.status !== "dismissed" ? (
                      <form action={updateLeadStatus} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="lost" />
                        <button className="act danger" type="submit" title="Mark as lost">
                          ✕
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))
            ) : (
              <li className="empty">No {filter === "active" ? "active" : filter} leads yet.</li>
            )}
          </ul>
        </div>
      </section>

      <Link className="fab" href="/inbox">
        + New message
      </Link>
    </>
  );
}
