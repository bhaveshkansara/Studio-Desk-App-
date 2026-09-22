import Link from "next/link";
import { sendInvoice } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";
import { balanceOfBooking } from "@/lib/types";
import type { Booking } from "@/lib/types";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const sp = await searchParams;
  const { booking: bookingId } = await sp;
  const { supabase, studio } = await requireStudio();

  let prefill: Booking | null = null;

  if (bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("studio_id", studio.id)
      .maybeSingle();
    if (data) {
      prefill = data as Booking;
    }
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("studio_id", studio.id)
    .eq("status", "confirmed")
    .order("event_date", { ascending: true })
    .limit(50);

  const confirmedBookings = (bookings ?? []) as Booking[];

  return (
    <>
      <div>
        <h2>Invoices</h2>
        <p className="hint">Generate and send invoices to confirmed bookings</p>
      </div>

      <section>
        <div className="sec-head">
          <h2>Generate invoice</h2>
        </div>
        <form action={sendInvoice} className="form panel">
          <input type="hidden" name="booking_id" value={prefill?.id ?? ""} />
          <div className="grid">
            <div className="fld">
              <label htmlFor="client">Client name</label>
              <input id="client" name="client" required defaultValue={prefill?.client ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="phone">WhatsApp number</label>
              <input id="phone" name="phone" type="tel" required defaultValue={prefill?.phone ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="service">Service</label>
              <input id="service" name="service" required defaultValue={prefill?.service ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="event_date">Event date</label>
              <input id="event_date" name="event_date" type="date" required defaultValue={prefill?.event_date ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="total">Total amount (₹)</label>
              <input id="total" name="total" type="number" required defaultValue={prefill?.total ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="paid">Advance received (₹)</label>
              <input id="paid" name="paid" type="number" defaultValue={prefill?.paid ?? ""} />
            </div>
            <div className="fld full">
              <label htmlFor="terms">Payment terms & conditions</label>
              <textarea
                id="terms"
                name="terms"
                placeholder="Balance due on day of event. Cancellation 30 days before gets full refund."
                defaultValue="Balance due on day of event"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn primary" type="submit">
              Generate & Send Invoice
            </button>
          </div>
        </form>
      </section>

      <section>
        <div className="sec-head">
          <h2>Confirmed bookings</h2>
          <span>Ready to invoice</span>
        </div>
        <div className="panel">
          <ul className="list">
            {confirmedBookings.length ? (
              confirmedBookings.map((b) => {
                const bal = balanceOfBooking(b);
                return (
                  <li key={b.id} className="row">
                    <Link className="row-main" href={`/invoices?booking=${b.id}`}>
                      <span className="txt">
                        <strong>{b.client}</strong>
                        <small>
                          {b.service} · {fmtDate(b.event_date ?? "")} · {inr(b.total)}
                        </small>
                      </span>
                      <span className="meta">
                        {bal > 0 ? <span className="bal due">{inr(bal)} due</span> : <span className="bal ok">Paid</span>}
                      </span>
                    </Link>
                    <div className="acts">
                      <Link href={`/invoices?booking=${b.id}`} className="act hot">
                        Invoice
                      </Link>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="empty">No confirmed bookings</li>
            )}
          </ul>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>📄 Invoice Template</h3>
        <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
          <strong style={{ display: "block", marginBottom: "8px" }}>INVOICE</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <div style={{ color: "var(--hint)" }}>From:</div>
              <strong>{studio.name}</strong>
            </div>
            <div>
              <div style={{ color: "var(--hint)" }}>Bill To:</div>
              <strong>{prefill?.client || "Client Name"}</strong>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 0" }}>Service</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>{prefill?.service || "Makeup Service"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 0" }}>Event Date</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>{prefill?.event_date ? fmtDate(prefill.event_date) : "{{date}}"}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 0" }}>Venue</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>{prefill?.venue || "{{venue}}"}</td>
              </tr>
              <tr style={{ fontWeight: "bold", borderBottom: "2px solid var(--line)" }}>
                <td style={{ padding: "8px 0" }}>Total Amount</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>{prefill ? inr(prefill.total) : "₹{{amount}}"}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0" }}>Advance Received</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>{prefill ? inr(prefill.paid) : "₹{{advance}}"}</td>
              </tr>
              <tr style={{ fontWeight: "bold", color: "var(--warn)" }}>
                <td style={{ padding: "8px 0" }}>Balance Due</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>
                  {prefill ? inr(balanceOfBooking(prefill)) : "₹{{balance}}"}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ color: "var(--hint)" }}>
            <strong>Payment Terms:</strong> Balance due on day of event
          </div>
        </div>
      </section>
    </>
  );
}
