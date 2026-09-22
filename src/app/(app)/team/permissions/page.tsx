import Link from "next/link";
import { updateMemberPermissions } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";
import type { StudioMember } from "@/lib/types";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { saved } = await sp;
  const { supabase, studio, user } = await requireStudio();

  const { data: members } = await supabase
    .from("studio_members")
    .select("*")
    .eq("studio_id", studio.id)
    .order("role", { ascending: false });

  const teamMembers = (members ?? []) as StudioMember[];

  return (
    <>
      <div>
        <Link className="back" href="/team">
          &larr; Team
        </Link>
        <h2>Role & Permissions</h2>
        <p className="hint">Manage what each team member can do</p>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Permissions updated.</div> : null}

      <section>
        <div className="sec-head">
          <h2>Team member access</h2>
          <span>{teamMembers.length} member{teamMembers.length === 1 ? "" : "s"}</span>
        </div>

        <div className="panel">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <th style={{ textAlign: "left", padding: "12px" }}>Member</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Role</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Bookings</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Payments</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Team Mgmt</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>Settings</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.user_id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px" }}>
                      <strong>{m.user_id === user?.id ? "You" : "Team member"}</strong>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <select
                        defaultValue={m.role}
                        onChange={(e) => {
                          const form = document.createElement("form");
                          form.method = "POST";
                          form.action = "";
                          form.innerHTML = `
                            <input type="hidden" name="user_id" value="${m.user_id}" />
                            <input type="hidden" name="role" value="${e.target.value}" />
                          `;
                          document.body.appendChild(form);
                          form.submit();
                        }}
                        style={{ padding: "4px 8px" }}
                      >
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <input
                        type="checkbox"
                        defaultChecked={m.can_manage_bookings}
                        onChange={(e) => {
                          // This would trigger updateMemberPermissions
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <input type="checkbox" defaultChecked={m.can_manage_payments} disabled={m.role === "staff"} />
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <input type="checkbox" defaultChecked={m.can_manage_team} disabled={m.role !== "owner"} />
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      <input type="checkbox" defaultChecked={m.can_manage_settings} disabled={m.role !== "owner"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>Role Definitions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
          <div>
            <strong style={{ display: "block", marginBottom: "6px" }}>👑 Owner</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.9em", lineHeight: "1.6" }}>
              <li>Full access to all features</li>
              <li>Manage team members</li>
              <li>Configure settings</li>
              <li>View all permissions</li>
            </ul>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: "6px" }}>📊 Manager</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.9em", lineHeight: "1.6" }}>
              <li>Manage bookings & enquiries</li>
              <li>Track payments & collections</li>
              <li>View team performance</li>
              <li>Cannot manage team/settings</li>
            </ul>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: "6px" }}>👤 Staff</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.9em", lineHeight: "1.6" }}>
              <li>Manage assigned bookings</li>
              <li>View own workload</li>
              <li>Cannot view financials</li>
              <li>Cannot manage team/settings</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
