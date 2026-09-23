import Link from "next/link";
import { sendQuotation } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";
import type { Booking } from "@/lib/types";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; booking?: string; success?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { lead: leadId, booking: bookingId, success, error } = sp;
  const { supabase, studio } = await requireStudio();

  let prefill: Partial<Booking> | null = null;

  if (leadId) {
    const { data } = await supabase
      .from("leads")
      .select("name, phone, insta, service, event_date, venue")
      .eq("id", leadId)
      .eq("studio_id", studio.id)
      .maybeSingle();
    if (data) {
      prefill = data as any;
    }
  } else if (bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("client, phone, service, event_date, venue, total")
      .eq("id", bookingId)
      .eq("studio_id", studio.id)
      .maybeSingle();
    if (data) {
      prefill = data as any;
    }
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client, phone, service, event_date, total, status")
    .eq("studio_id", studio.id)
    .eq("status", "enquiry")
    .order("created_at", { ascending: false })
    .limit(50);

  const enquiries = (bookings ?? []) as Booking[];

  return (
    <>
      <div>
        <h2>Quotations</h2>
        <p className="hint">Create and send quotations to enquiries via WhatsApp</p>
      </div>

      {success ? <div className="banner info" style={{ marginTop: 0 }}>{success}</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      <section>
        <div className="sec-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Generate quotation</h2>
          <Link href="/quotations/templates" className="btn" style={{ padding: "6px 12px", fontSize: "0.9em" }}>
            📋 Templates
          </Link>
        </div>
        <form action={sendQuotation} className="form panel">
          <div className="grid">
            <div className="fld">
              <label htmlFor="client">Client name</label>
              <input id="client" name="client" required defaultValue={prefill?.client ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="phone">WhatsApp number</label>
              <input id="phone" name="phone" type="tel" required defaultValue={prefill?.phone ?? ""} />
            </div>
            <div className="fld full">
              <label htmlFor="service">Service description</label>
              <input id="service" name="service" required placeholder="HD bridal makeup + hairstyle" defaultValue={prefill?.service ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="event_date">Event date</label>
              <input id="event_date" name="event_date" type="date" defaultValue={prefill?.event_date ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="venue">Venue</label>
              <input id="venue" name="venue" placeholder="Hotel/venue name" defaultValue={prefill?.venue ?? ""} />
            </div>
            <div className="fld">
              <label htmlFor="amount">Quotation amount (₹)</label>
              <input id="amount" name="amount" type="number" min="0" step="any" required placeholder="5000" />
            </div>
            <div className="fld full">
              <label htmlFor="notes">Additional notes (optional)</label>
              <textarea id="notes" name="notes" placeholder="Trial booking available, 30% advance required..." />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn primary" type="submit">
              Generate & Send via WhatsApp
            </button>
          </div>
          <p style={{ fontSize: "0.9em", color: "var(--hint)", marginTop: "12px", textAlign: "center" }}>
            Note: Set up WhatsApp in Settings for automatic sending
          </p>
        </form>
      </section>


      <section>
        <div className="sec-head">
          <h2>Pending quotations</h2>
          <span>Enquiries awaiting quotations</span>
        </div>
        <div className="panel">
          <ul className="list">
            {enquiries.length ? (
              enquiries.map((e) => (
                <li key={e.id} className="row">
                  <Link className="row-main" href={`/quotations?booking=${e.id}`}>
                    <span className="txt">
                      <strong>{e.client}</strong>
                      <small>
                        {e.service} · {e.event_date ? fmtDate(e.event_date) : "No date"}
                      </small>
                    </span>
                  </Link>
                  <div className="acts">
                    <Link href={`/quotations?booking=${e.id}`} className="act hot">
                      Create quotation
                    </Link>
                  </div>
                </li>
              ))
            ) : (
              <li className="empty">No pending enquiries</li>
            )}
          </ul>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Professional details</h2>
        </div>

        <div className="panel" style={{ marginBottom: "16px" }}>
          <strong style={{ display: "block", marginBottom: "12px" }}>Inclusions:</strong>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.9em", lineHeight: "1.8" }}>
            <li>Professional Hairstyling</li>
            <li>Hair Extensions</li>
            <li>Eyelashes</li>
            <li>Contact Lenses</li>
            <li>Dress Draping</li>
          </ul>
        </div>

        <div className="panel">
          <strong style={{ display: "block", marginBottom: "12px" }}>Professional Products Used:</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "0.9em" }}>
            {["Dior", "Armani", "Gucci", "Natasha Denona", "Pat McGrath USA", "Estée Lauder", "Smashbox", "YSL", "NARS", "Too Faced", "Charlotte Tilbury", "Embryolisse", "MAC", "Huda Beauty"].map((
              (brand) => (
                <span key={brand} style={{ background: "var(--line)", padding: "4px 10px", borderRadius: "4px" }}>
                  {brand}
                </span>
              )
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>📝 Quotation Format</h3>
        <p style={{ fontSize: "0.9em", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
{`Hi ${prefill?.client || "[Client Name]"}, thank you for enquiring!

Service: ${prefill?.service || "[Service Description]"}
Date: ${prefill?.event_date ? fmtDate(prefill.event_date) : "[Event Date]"}
Venue: ${prefill?.venue || "[Venue]"}

QUOTATION: ₹[Amount]

Advance (30%): ₹[Advance]
Balance on day: ₹[Balance]

INCLUSIONS:
• Professional Hairstyling
• Hair Extensions
• Eyelashes
• Makeup Artistry

PROFESSIONAL PRODUCTS:
Dior • Armani • Gucci • Natasha Denona • Pat McGrath
Estée Lauder • Smashbox • YSL • NARS • Too Faced

Trial booking available on [Trial Date]

Ready to confirm? Please reply with advance payment details.`}
        </p>
      </section>
    </>
  );
}
