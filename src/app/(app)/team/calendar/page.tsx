import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

export default async function TeamCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const monthParam = sp.month ? parseInt(sp.month) : new Date().getMonth();
  const month = Math.max(0, Math.min(11, monthParam));

  const { supabase, studio } = await requireStudio();

  const [{ data: members }, { data: bookings }] = await Promise.all([
    supabase
      .from("studio_members")
      .select("user_id, role")
      .eq("studio_id", studio.id)
      .order("role", { ascending: false }),
    supabase
      .from("bookings")
      .select("assigned_to, event_date, client, status")
      .eq("studio_id", studio.id)
      .in("status", ["confirmed", "done"]),
  ]);

  const teamMembers = members ?? [];
  const bookingsList = (bookings ?? []) as Booking[];

  // Group bookings by date and member
  const bookingsByDateAndMember = new Map<string, Map<string | null, Booking[]>>();
  for (const b of bookingsList) {
    if (!b.event_date) continue;
    if (!bookingsByDateAndMember.has(b.event_date)) {
      bookingsByDateAndMember.set(b.event_date, new Map());
    }
    const dateBookings = bookingsByDateAndMember.get(b.event_date)!;
    if (!dateBookings.has(b.assigned_to)) {
      dateBookings.set(b.assigned_to, []);
    }
    dateBookings.get(b.assigned_to)!.push(b);
  }

  // Get all dates in the month
  const year = new Date().getFullYear();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(firstDay);

  const prevMonth = month === 0 ? 11 : month - 1;
  const nextMonth = month === 11 ? 0 : month + 1;

  return (
    <>
      <div>
        <Link className="back" href="/team">
          &larr; Team
        </Link>
        <h2>Team Availability</h2>
        <p className="hint">See who has bookings on which dates</p>
      </div>

      <section>
        <div className="sec-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>{monthName}</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/team/calendar?month=${prevMonth}`} className="btn" style={{ padding: "6px 12px" }}>
              ← Prev
            </Link>
            <Link href={`/team/calendar?month=${nextMonth}`} className="btn" style={{ padding: "6px 12px" }}>
              Next →
            </Link>
          </div>
        </div>

        <div className="panel">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(year, month, i + 1);
              const dateStr = date.toISOString().slice(0, 10);
              const dayBookings = bookingsByDateAndMember.get(dateStr);
              const dayName = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

              return (
                <div
                  key={dateStr}
                  style={{
                    padding: "12px",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    background: dayBookings && dayBookings.size > 0 ? "var(--panel-bg)" : "transparent",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "8px", color: "var(--hint)" }}>{dayName}</div>
                  {dayBookings && dayBookings.size > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.9em" }}>
                      {Array.from(dayBookings.entries()).map(([memberId, bookings]) => {
                        const member = teamMembers.find((m) => m.user_id === memberId);
                        return (
                          <li key={memberId || "unassigned"}>
                            <strong>{member ? (member.role === "owner" ? "You" : "Team member") : "Unassigned"}</strong>
                            <div style={{ fontSize: "0.85em", color: "var(--hint)", marginTop: "4px" }}>
                              {bookings.map((b) => (
                                <div key={b.id}>{b.client}</div>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div style={{ color: "var(--hint)", fontSize: "0.9em" }}>No bookings</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
