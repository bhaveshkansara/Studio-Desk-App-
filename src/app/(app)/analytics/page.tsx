import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { inr } from "@/lib/format";
import { startOfMonth, endOfDay } from "date-fns";

export default async function AnalyticsDashboardPage() {
  const { supabase, studio } = await requireStudio();

  // Fetch all bookings for this month
  const monthStart = startOfMonth(new Date()).toISOString();
  const { data: monthBookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("studio_id", studio.id)
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false });

  // Fetch all leads for this month
  const { data: monthLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("studio_id", studio.id)
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false });

  // Fetch team members for performance
  const { data: teamMembers } = await supabase
    .from("team_staff")
    .select("*, bookings(*)")
    .eq("studio_id", studio.id)
    .eq("status", "active");

  // Calculate metrics
  const bookings = monthBookings ?? [];
  const leads = monthLeads ?? [];

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "done");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total), 0);
  const totalPaid = confirmedBookings.reduce((sum, b) => sum + Number(b.paid), 0);
  const totalDue = totalRevenue - totalPaid;

  const newLeads = leads.filter((l) => l.status === "new").length;
  const contactedLeads = leads.filter((l) => l.status === "contacted").length;
  const quotationLeads = leads.filter((l) => l.status === "quotation_sent").length;
  const advancePendingLeads = leads.filter((l) => l.status === "advance_pending").length;
  const confirmedLeads = leads.filter((l) => l.status === "confirmed" || l.status === "completed").length;
  const lostLeads = leads.filter((l) => l.status === "lost" || l.status === "dismissed").length;

  const conversionRate = leads.length > 0 ? Math.round((confirmedLeads / leads.length) * 100) : 0;
  const contactRate = leads.length > 0 ? Math.round((contactedLeads / leads.length) * 100) : 0;

  // Lead source breakdown
  const sourceBreakdown: Record<string, number> = {};
  leads.forEach((l) => {
    sourceBreakdown[l.source || "unknown"] = (sourceBreakdown[l.source || "unknown"] ?? 0) + 1;
  });

  // Revenue by lead source
  const revenueBySource: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.status === "confirmed" || b.status === "done") {
      revenueBySource[b.source || "unknown"] = (revenueBySource[b.source || "unknown"] ?? 0) + Number(b.total);
    }
  });

  // Team performance
  const teamPerformance = (teamMembers ?? []).map((member) => {
    const assignedBookings = (member.bookings ?? []).filter((b: any) => b.assigned_to === member.id);
    const confirmedCount = assignedBookings.filter((b: any) => b.status === "confirmed" || b.status === "done").length;
    const totalAmount = assignedBookings
      .filter((b: any) => b.status === "confirmed" || b.status === "done")
      .reduce((sum: number, b: any) => sum + Number(b.total), 0);
    const paidAmount = assignedBookings.reduce((sum: number, b: any) => sum + Number(b.paid), 0);

    return {
      name: member.name,
      assignedCount: assignedBookings.length,
      confirmedCount,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  });

  // Booking status breakdown
  const statusBreakdown = {
    enquiry: bookings.filter((b) => b.status === "enquiry").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    done: bookings.filter((b) => b.status === "done").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <>
      <div>
        <Link className="back" href="/today">
          📊 Dashboard
        </Link>
        <h2>Analytics</h2>
        <p className="hint">Detailed insights into your business performance this month</p>
      </div>

      {/* Key Metrics */}
      <section>
        <div className="sec-head">
          <h2>This Month's Performance</h2>
        </div>

        <div
          className="panel"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            padding: "16px",
          }}
        >
          <div style={{ borderRight: "1px solid var(--line)", paddingRight: "16px" }}>
            <div style={{ fontSize: "0.9em", color: "var(--hint)", marginBottom: "8px" }}>Revenue</div>
            <div style={{ fontSize: "1.8em", fontWeight: "bold", color: "var(--primary)" }}>
              {inr(totalRevenue)}
            </div>
            <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
              {confirmedBookings.length} confirmed bookings
            </div>
          </div>

          <div style={{ borderRight: "1px solid var(--line)", paddingRight: "16px" }}>
            <div style={{ fontSize: "0.9em", color: "var(--hint)", marginBottom: "8px" }}>Collected</div>
            <div style={{ fontSize: "1.8em", fontWeight: "bold", color: "var(--success)" }}>
              {inr(totalPaid)}
            </div>
            <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
              {Math.round((totalPaid / totalRevenue) * 100)}% collection rate
            </div>
          </div>

          <div style={{ borderRight: "1px solid var(--line)", paddingRight: "16px" }}>
            <div style={{ fontSize: "0.9em", color: "var(--hint)", marginBottom: "8px" }}>Pending</div>
            <div style={{ fontSize: "1.8em", fontWeight: "bold", color: "var(--warn)" }}>
              {inr(totalDue)}
            </div>
            <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
              {Math.round((totalDue / totalRevenue) * 100)}% outstanding
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.9em", color: "var(--hint)", marginBottom: "8px" }}>Conversion</div>
            <div style={{ fontSize: "1.8em", fontWeight: "bold", color: "var(--primary)" }}>
              {conversionRate}%
            </div>
            <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
              {confirmedLeads} of {leads.length} leads
            </div>
          </div>
        </div>
      </section>

      {/* Lead Pipeline */}
      <section>
        <div className="sec-head">
          <h2>Lead Pipeline</h2>
          <span>{leads.length} total leads</span>
        </div>

        <div className="panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ textAlign: "center", padding: "12px", background: "var(--line)", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{newLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>New</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "var(--line)", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{contactedLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>Contacted</div>
              <div style={{ fontSize: "0.8em", color: "var(--hint)" }}>({contactRate}%)</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "var(--line)", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{quotationLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>Quotation</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "var(--line)", borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>{advancePendingLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>Advance Due</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "var(--success)", opacity: 0.2, borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "var(--success)" }}>{confirmedLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>Confirmed</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "var(--warn)", opacity: 0.2, borderRadius: "4px" }}>
              <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "var(--warn)" }}>{lostLeads}</div>
              <div style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "4px" }}>Lost</div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Sources */}
      <section>
        <div className="sec-head">
          <h2>Lead Sources</h2>
          <span>Where leads come from</span>
        </div>

        <div className="panel">
          <div style={{ fontSize: "0.95em" }}>
            {Object.entries(sourceBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const revenue = revenueBySource[source] || 0;
                const percentage = Math.round((count / leads.length) * 100);
                return (
                  <div
                    key={source}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div>
                      <strong style={{ textTransform: "capitalize" }}>{source}</strong>
                      <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
                        {count} leads ({percentage}%)
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1em", fontWeight: "bold" }}>{inr(revenue)}</div>
                      <div style={{ fontSize: "0.85em", color: "var(--hint)" }}>
                        {revenue > 0 ? `₹${Math.round(revenue / count)}/lead` : "No revenue"}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Booking Status Breakdown */}
      <section>
        <div className="sec-head">
          <h2>Booking Status</h2>
          <span>{bookings.length} bookings this month</span>
        </div>

        <div className="panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ padding: "12px", background: "var(--line)", borderRadius: "4px" }}>
              <div style={{ fontSize: "0.9em", color: "var(--hint)" }}>Enquiry</div>
              <div style={{ fontSize: "1.6em", fontWeight: "bold", marginTop: "4px" }}>
                {statusBreakdown.enquiry}
              </div>
            </div>
            <div style={{ padding: "12px", background: "var(--primary)", opacity: 0.15, borderRadius: "4px" }}>
              <div style={{ fontSize: "0.9em", color: "var(--hint)" }}>Confirmed</div>
              <div style={{ fontSize: "1.6em", fontWeight: "bold", color: "var(--primary)", marginTop: "4px" }}>
                {statusBreakdown.confirmed}
              </div>
            </div>
            <div style={{ padding: "12px", background: "var(--success)", opacity: 0.2, borderRadius: "4px" }}>
              <div style={{ fontSize: "0.9em", color: "var(--hint)" }}>Done</div>
              <div style={{ fontSize: "1.6em", fontWeight: "bold", color: "var(--success)", marginTop: "4px" }}>
                {statusBreakdown.done}
              </div>
            </div>
            <div style={{ padding: "12px", background: "var(--warn)", opacity: 0.2, borderRadius: "4px" }}>
              <div style={{ fontSize: "0.9em", color: "var(--hint)" }}>Cancelled</div>
              <div style={{ fontSize: "1.6em", fontWeight: "bold", color: "var(--warn)", marginTop: "4px" }}>
                {statusBreakdown.cancelled}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Performance */}
      {teamPerformance.length > 0 ? (
        <section>
          <div className="sec-head">
            <h2>Team Performance</h2>
            <span>{teamPerformance.length} team members</span>
          </div>

          <div className="panel">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.95em", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px" }}>Member</th>
                    <th style={{ textAlign: "center", padding: "12px 8px" }}>Assigned</th>
                    <th style={{ textAlign: "center", padding: "12px 8px" }}>Confirmed</th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>Revenue</th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>Collected</th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((member) => (
                    <tr key={member.name} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px 8px" }}>
                        <strong>{member.name}</strong>
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 8px" }}>
                        {member.assignedCount}
                      </td>
                      <td style={{ textAlign: "center", padding: "12px 8px" }}>
                        <strong style={{ color: "var(--success)" }}>{member.confirmedCount}</strong>
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {inr(member.totalAmount)}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px", color: "var(--success)" }}>
                        {inr(member.paidAmount)}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px", color: member.pendingAmount > 0 ? "var(--warn)" : "var(--hint)" }}>
                        {inr(member.pendingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
