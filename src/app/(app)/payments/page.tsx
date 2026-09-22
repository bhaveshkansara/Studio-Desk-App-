import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { dayDiff, fmtDate, inr } from "@/lib/format";
import { balanceOfBooking, balanceOfStudent } from "@/lib/types";
import type { Booking, Student, Payment } from "@/lib/types";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const f = sp.f === "pending" ? "pending" : sp.f === "history" ? "history" : "due";
  const q = (sp.q ?? "").trim().toLowerCase();

  const { supabase, studio } = await requireStudio();

  const [bookings, students, payments] = await Promise.all([
    supabase.from("bookings").select("*").eq("studio_id", studio.id).limit(1000),
    supabase.from("students").select("*").eq("studio_id", studio.id).limit(1000),
    supabase
      .from("payments")
      .select("*")
      .eq("studio_id", studio.id)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const bkgs = (bookings.data ?? []) as Booking[];
  const stds = (students.data ?? []) as Student[];
  const pays = (payments.data ?? []) as Payment[];

  type BalanceItem = { type: "booking" | "student"; id: string; name: string; balance: number; due_date: string | null; status: string };
  const items: BalanceItem[] = [];

  for (const b of bkgs) {
    const bal = balanceOfBooking(b);
    if (b.status !== "cancelled") {
      items.push({
        type: "booking",
        id: b.id,
        name: b.client,
        balance: bal,
        due_date: b.event_date,
        status: b.status,
      });
    }
  }

  for (const s of stds) {
    const bal = balanceOfStudent(s);
    if (s.status !== "left") {
      items.push({
        type: "student",
        id: s.id,
        name: s.name,
        balance: bal,
        due_date: null,
        status: s.status,
      });
    }
  }

  // Filter based on tab
  let list = items;
  if (f === "due") {
    list = items.filter((i) => i.balance > 0);
  } else if (f === "pending") {
    list = items.filter((i) => i.balance > 0 && i.due_date && (dayDiff(i.due_date) ?? 99) <= 7);
  }

  // Search filter
  if (q) {
    list = list.filter((i) => i.name.toLowerCase().includes(q));
  }

  // Sort: balance due first
  list.sort((a, b) => b.balance - a.balance);

  const totals = {
    due: items.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0),
    pending: items.filter((i) => i.balance > 0 && i.due_date && (dayDiff(i.due_date) ?? 99) <= 7).reduce((s, i) => s + i.balance, 0),
    collected: pays.reduce((s, p) => s + p.amount, 0),
  };

  const href = (nf: string) => `/payments?f=${nf}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <div>
        <h2>Payments & Collections</h2>
        <p className="hint">Track money due from bookings and student fees. Set SMS reminders for balance collection.</p>
      </div>

      <div className="strip">
        <div>
          <b>{inr(totals.collected)}</b>
          <span>Collected</span>
          <em>All payments</em>
        </div>
        <div>
          <b>{inr(totals.pending)}</b>
          <span>Due this week</span>
          <em>{items.filter((i) => i.balance > 0 && i.due_date && (dayDiff(i.due_date) ?? 99) <= 7).length} items</em>
        </div>
        <div>
          <b>{inr(totals.due)}</b>
          <span>Outstanding</span>
          <em>{items.filter((i) => i.balance > 0).length} items</em>
        </div>
      </div>

      <section>
        <div className="sec-head">
          <h2>Collection List</h2>
          <span className="chips">
            <Link className="chip" href="/payments" aria-current={f === "due" ? "true" : undefined}>
              Due
            </Link>
            <Link className="chip" href={href("pending")} aria-current={f === "pending" ? "true" : undefined}>
              This week
            </Link>
            <Link className="chip" href={href("history")} aria-current={f === "history" ? "true" : undefined}>
              Payment history
            </Link>
          </span>
        </div>
        <div className="panel">
          {f === "history" ? (
            <ul className="list">
              {pays.length ? (
                pays.map((p) => (
                  <li key={p.id} className="pay-row">
                    <span>
                      {fmtDate(p.paid_on)}
                      {p.note ? ` · ${p.note}` : ""}
                    </span>
                    <span>
                      <strong>{inr(p.amount)}</strong>
                    </span>
                  </li>
                ))
              ) : (
                <li className="empty">No payments recorded yet.</li>
              )}
            </ul>
          ) : (
            <>
              <form style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
                <input
                  type="search"
                  name="q"
                  placeholder="Search by name..."
                  defaultValue={q}
                  style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid var(--line)" }}
                />
                <input type="hidden" name="f" value={f} />
                <button type="submit" className="btn" style={{ padding: "8px 12px" }}>Search</button>
              </form>
              <ul className="list">
                {list.length ? (
                  list.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="row">
                      <Link
                        className="row-main"
                        href={item.type === "booking" ? `/bookings/${item.id}` : `/students/${item.id}`}
                      >
                        <span className="txt">
                          <strong>{item.name}</strong>
                          <small>
                            {item.type === "booking" ? "Booking" : "Student"} · {item.status}
                            {item.due_date ? ` · Due ${dayDiff(item.due_date) === 0 ? "today" : dayDiff(item.due_date) === 1 ? "tomorrow" : `in ${dayDiff(item.due_date)}d`}` : ""}
                          </small>
                        </span>
                        <span className="meta">
                          <span className="bal due">{inr(item.balance)}</span>
                        </span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="empty">
                    {f === "pending" ? "No payments due this week." : "No outstanding payments."}
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
        <h3 style={{ marginTop: 0 }}>SMS Reminders (Coming soon)</h3>
        <p className="hint">
          Connect your WhatsApp Business Platform or SMS provider to auto-send reminders when balance is due. Perfect for reducing follow-up calls.
        </p>
      </section>
    </>
  );
}
