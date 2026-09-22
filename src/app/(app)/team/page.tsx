import Link from "next/link";
import { addTeamStaff, deleteTeamStaff, updateTeamStaff } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";
import type { TeamStaff } from "@/lib/types";

const ROLE_LABELS = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { saved, error } = await sp;
  const { supabase, studio } = await requireStudio();

  const [{ data: staff }, { data: bookings }] = await Promise.all([
    supabase
      .from("team_staff")
      .select("*")
      .eq("studio_id", studio.id)
      .eq("status", "active")
      .order("role", { ascending: false }),
    supabase
      .from("bookings")
      .select("assigned_to, status, total")
      .eq("studio_id", studio.id),
  ]);

  const teamStaff = (staff ?? []) as TeamStaff[];
  const bookingsList = bookings ?? [];

  // Calculate stats per team member
  const stats = new Map<string, { assigned: number; confirmed: number; revenue: number }>();
  for (const b of bookingsList) {
    const key = b.assigned_to;
    if (!stats.has(key)) {
      stats.set(key, { assigned: 0, confirmed: 0, revenue: 0 });
    }
    const s = stats.get(key)!;
    s.assigned++;
    if (b.status === "confirmed" || b.status === "done") {
      s.confirmed++;
      s.revenue += Number(b.total);
    }
  }

  return (
    <>
      <div>
        <h2>Team Members</h2>
        <p className="hint">Add team members and assign roles directly. No invitations needed.</p>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Team member updated.</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      <section>
        <div className="sec-head">
          <h2>Add team member</h2>
          <span>Direct assignment - no invitations</span>
        </div>
        <form action={addTeamStaff} className="form panel">
          <div className="grid">
            <div className="fld">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required placeholder="Team member name" autoComplete="off" />
            </div>
            <div className="fld">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="staff">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              Add member
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="sec-head">
          <h2>Team roster</h2>
          <span>{teamStaff.length} member{teamStaff.length === 1 ? "" : "s"}</span>
        </div>
        <div className="panel">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Role</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>Bookings</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>Confirmed</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamStaff.length ? (
                  teamStaff.map((member) => {
                    const memberStats = stats.get(member.id);
                    return (
                      <tr key={member.id} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "12px" }}>
                          <strong>{member.name}</strong>
                        </td>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <form action={updateTeamStaff} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={member.id} />
                            <input type="hidden" name="name" value={member.name} />
                            <input type="hidden" name="status" value={member.status} />
                            <select
                              name="role"
                              defaultValue={member.role}
                              onChange={(e) => e.currentTarget.form?.requestSubmit()}
                              style={{ padding: "4px 8px", cursor: "pointer" }}
                            >
                              <option value="staff">Staff</option>
                              <option value="manager">Manager</option>
                              <option value="owner">Owner</option>
                            </select>
                          </form>
                        </td>
                        <td style={{ textAlign: "right", padding: "12px" }}>
                          {memberStats?.assigned ?? 0}
                        </td>
                        <td style={{ textAlign: "right", padding: "12px" }}>
                          {memberStats?.confirmed ?? 0}
                        </td>
                        <td style={{ textAlign: "center", padding: "12px" }}>
                          <form action={deleteTeamStaff} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={member.id} />
                            <button className="act danger" type="submit" aria-label="Remove this member">
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--hint)" }}>
                      No team members yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Team Management Tools</h2>
        </div>
        <div className="data">
          <Link href="/team/performance" className="btn">
            📊 Performance Dashboard
          </Link>
          <Link href="/team/calendar" className="btn">
            📅 Availability Calendar
          </Link>
          <Link href="/team/permissions" className="btn">
            🔐 Permissions Info
          </Link>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>Role Levels</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9em", lineHeight: "1.6" }}>
          <div>
            <strong>👑 Owner</strong>
            <p>Full access to all features and settings</p>
          </div>
          <div>
            <strong>📊 Manager</strong>
            <p>Manage bookings, payments, and view reports</p>
          </div>
          <div>
            <strong>👤 Staff</strong>
            <p>Manage assigned bookings only</p>
          </div>
        </div>
      </section>
    </>
  );
}
