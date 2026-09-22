import Link from "next/link";
import { notFound } from "next/navigation";
import { addPayment, deleteBooking, deletePayment } from "@/app/(app)/actions";
import { BookingForm } from "@/components/Forms";
import WaLink from "@/components/WaLink";
import { getTemplates, requireStudio } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";
import { bookingVars, igLink, renderTemplate, waLink } from "@/lib/messages";
import { BSTATUS, balanceOfBooking } from "@/lib/types";
import type { Booking, Payment } from "@/lib/types";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const { supabase, studio } = await requireStudio();

  const { data } = await supabase.from("bookings").select("*").eq("id", id).eq("studio_id", studio.id).maybeSingle();
  if (!data) notFound();
  const b = data as Booking;

  const [templates, pay, members] = await Promise.all([
    getTemplates(supabase, studio.id),
    supabase
      .from("payments")
      .select("id, amount, note, paid_on, created_at")
      .eq("booking_id", id)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("studio_members")
      .select("user_id")
      .eq("studio_id", studio.id),
  ]);
  const payments = (pay.data ?? []) as Payment[];
  const teamMembers = (members.data ?? []).map((m) => ({ user_id: m.user_id }));
  const bal = balanceOfBooking(b);
  const vars = bookingVars(b, studio.name);

  const messages: { key: string; label: string; hot?: boolean; confirmId?: string }[] = [];
  if (b.status === "enquiry") messages.push({ key: "enquiry_reply", label: "Reply to enquiry" });
  if (b.status === "confirmed") {
    messages.push(
      b.confirmation_sent
        ? { key: "confirmation", label: "Resend confirmation" }
        : { key: "confirmation", label: "Send confirmation", hot: true, confirmId: b.id },
    );
    messages.push({ key: "reminder", label: "Send reminder" });
  }
  if (bal > 0 && b.status !== "cancelled") messages.push({ key: "balance_due", label: "Ask for balance" });
  if (b.status === "done") messages.push({ key: "review_request", label: "Ask for a review" });

  const ig = igLink(b.insta);

  return (
    <>
      <div>
        <Link className="back" href="/bookings">
          &larr; Bookings
        </Link>
        <h2>
          {b.client} <span className={"pill s-" + b.status}>{BSTATUS[b.status]}</span>
          {b.assigned_to ? <span className="pill" style={{ marginLeft: "8px" }}>Assigned</span> : null}
        </h2>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Saved.</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      <section>
        <div className="sec-head">
          <h2>Message the client</h2>
          <span>{b.phone ? "Opens WhatsApp with the message ready" : "Add a phone number to use WhatsApp"}</span>
        </div>
        <div className="data">
          {messages.map((m) => {
            const href = waLink(b.phone, renderTemplate(templates[m.key] ?? "", vars));
            return href ? (
              <WaLink key={m.key + m.label} href={href} label={m.label} hot={m.hot} confirmId={m.confirmId} />
            ) : null;
          })}
          {ig ? (
            <a className="act" href={ig} target="_blank" rel="noopener noreferrer">
              Instagram DM
            </a>
          ) : null}
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Payments</h2>
          <span>
            {inr(b.paid)} of {inr(b.total)} received{bal > 0 ? ` · ${inr(bal)} due` : ""}
          </span>
        </div>
        <div className="panel">
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9em" }}>
              <span>Total</span>
              <span><strong>{inr(b.total)}</strong></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9em" }}>
              <span>Received</span>
              <span><strong>{inr(b.paid)}</strong> {b.total > 0 && `(${Math.round((b.paid / b.total) * 100)}%)`}</span>
            </div>
            {bal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9em", color: "var(--warn)" }}>
                <span>Balance due</span>
                <span><strong>{inr(bal)}</strong></span>
              </div>
            )}
          </div>
          {payments.length ? (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              {payments.map((p) => (
                <div key={p.id} className="pay-row">
                  <span>
                    {fmtDate(p.paid_on)}
                    {p.note ? ` · ${p.note}` : ""}
                  </span>
                  <span>
                    {inr(p.amount)}{" "}
                    <form action={deletePayment} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="back" value={`/bookings/${id}`} />
                      <button className="act" type="submit" aria-label="Remove this payment">
                        Remove
                      </button>
                    </form>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty" style={{ margin: 0, borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
              No payments recorded yet.
            </p>
          )}
          {b.status !== "cancelled" ? (
            <form action={addPayment} className="form" style={{ borderTop: "1px solid var(--line)", marginTop: "12px" }}>
              <input type="hidden" name="booking_id" value={id} />
              <div className="grid">
                <div className="fld">
                  <label htmlFor="amount">Amount received (&#8377;)</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="any"
                    inputMode="numeric"
                    required
                    defaultValue={bal > 0 ? String(bal) : ""}
                  />
                </div>
                <div className="fld">
                  <label htmlFor="note">Note (optional)</label>
                  <input id="note" name="note" placeholder="UPI, cash, cheque" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn primary" type="submit">
                  Record payment
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Details</h2>
        </div>
        <BookingForm booking={b} teamMembers={teamMembers} />
      </section>

      <details className="danger">
        <summary>Delete this booking</summary>
        <form action={deleteBooking}>
          <input type="hidden" name="id" value={id} />
          <p className="hint">This also removes its payment history and cannot be undone.</p>
          <button className="btn danger" type="submit">
            Yes, delete booking
          </button>
        </form>
      </details>
    </>
  );
}
