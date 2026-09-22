import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { dayDiff, inr } from "@/lib/format";
import type { Booking } from "@/lib/types";

export default async function TeamPerformancePage() {
  const { supabase, studio } = await requireStudio();

  const [{ data: members }, { data: bookings }] = await Promise.all([
    supabase
      .from("studio_members")
      .select("user_id, role, created_at")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("assigned_to, status, total, paid, event_date, created_at")
      .eq("studio_id", studio.id),
  ]);

  const teamMembers = members ?? [];
  const bookingsList = (bookings ?? []) as Booking[];

  interface MemberStats {
    assigned: number;
    confirmed: number;
    completed: number;
    revenue: number;
    collected: number;
    balance: number;
    cancellations: number;
    conversion: number;
  }

  const stats = new Map<string | null, MemberStats>();

  for (const m of teamMembers) {
    stats.set(m.user_id, { assigned: 0, confirmed: 0, completed: 0, revenue: 0, collected: 0, balance: 0, cancellations: 0, conversion: 0 });
  }

  for (const b of bookingsList) {
    const key = b.assigned_to;
    let s = stats.get(key);
    if (!s) {
      s = { assigned: 0, confirmed: 0, completed: 0, revenue: 0, collected: 0, balance: 0, cancellations: 0, conversion: 0 };
      stats.set(key, s);
    }

    s.assigned++;
    if (b.status === "confirmed") s.confirmed++;
    if (b.status === "done") s.completed++;
    if (b.status === "cancelled") s.cancellations++;

    if (b.status === "confirmed" || b.status === "done") {
      s.revenue += Number(b.total);
      s.collected += Number(b.paid);
      s.balance += Number(b.total) - Number(b.paid);
    }
  }

  // Calculate conversion rates
  for (const s of stats.values()) {
    s.conversion = s.assigned > 0 ? Math.round(((s.confirmed + s.completed) / s.assigned) * 100) : 0;
  }

  const memberList = teamMembers.map((m) => ({
    ...m,
    stats: stats.get(m.user_id) || { assigned: 0, confirmed: 0, completed: 0, revenue: 0, collected: 0, balance: 0, cancellations: 0, conversion: 0 },
  }));

  memberList.sort((a, b) => b.stats.revenue - a.stats.revenue);

  const totals = {
    assigned: bookingsList.length,
    revenue: memberList.reduce((s, m) => s + m.stats.revenue, 0),
    collected: memberList.reduce((s, m) => s + m.stats.collected, 0),
    balance: memberList.reduce((s, m) => s + m.stats.balance, 0),
  };

  return (
    <>
      <div>
        <Link className="back" href="/team">
          &larr; Team
        </Link>
        <h2>Team Performance</h2>
        <p className="hint">Revenue, conversion rates, and workload by team member</p>
      </div>

      <div className="strip">
        <div>
          <b>{totals.assigned}</b>
          <span>Total bookings</span>
        </div>
        <div>
          <b>{inr(totals.revenue)}</b>
          <span>Total revenue</span>
          <em>{inr(totals.collected)} collected</em>
        </div>
        <div>
          <b>{inr(totals.balance)}</b>
          <span>Outstanding</span>
          <em>{memberList.length} team members</em>
        </div>
      </div>

      <section>
        <div className="sec-head">
          <h2>Performance by team member</h2>
        </div>
        <div className="panel" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Member</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Bookings</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Confirmed</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Conversion</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Revenue</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Collected</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {memberList.length ? (
                memberList.map((m) => (
                  <tr key={m.user_id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px" }}>
                      <strong>{m.role === "owner" ? "You" : "Team member"}</strong>
                      {m.role === "owner" ? <span className="tag" style={{ marginLeft: "8px" }}>Owner</span> : null}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px" }}>{m.stats.assigned}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>{m.stats.confirmed + m.stats.completed}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      <span style={{ fontWeight: "bold" }}>{m.stats.conversion}%</span>
                    </td>
                    <td style={{ textAlign: "right", padding: "8px" }}>{inr(m.stats.revenue)}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>{inr(m.stats.collected)}</td>
                    <td style={{ textAlign: "right", padding: "8px", color: m.stats.balance > 0 ? "var(--warn)" : "inherit" }}>
                      {inr(m.stats.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: "var(--hint)" }}>
                    No team members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
