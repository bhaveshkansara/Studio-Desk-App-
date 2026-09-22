import Link from "next/link";
import { addLead, dismissLead } from "@/app/(app)/actions";
import { LeadRow } from "@/components/Rows";
import { requireStudio } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import type { Lead } from "@/lib/types";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ lf?: string; error?: string; notice?: string }>;
}) {
  const { lf, error, notice } = await searchParams;
  const filter = lf === "done" ? "done" : "new";
  const { supabase, studio } = await requireStudio();

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false })
    .limit(300);
  const leads = ((data ?? []) as Lead[]).filter((l) => (filter === "new" ? l.status === "new" : l.status !== "new"));
  const ai = aiEnabled();

  return (
    <>
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}
      {notice ? <div className="banner info" style={{ marginTop: 0 }}>{notice}</div> : null}

      <section>
        <div className="sec-head">
          <h2>Add a message</h2>
          <span>Instagram or WhatsApp</span>
        </div>
        <form action={addLead} className="form panel">
          <p className="hint">
            Copy an enquiry from the chat and paste it here.{" "}
            {ai
              ? "Claude picks out the name, date, service and venue, then you turn it into a booking in one tap."
              : "Save it here, then turn it into a booking in one tap."}
          </p>
          <div className="grid">
            <div className="fld full">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                required
                placeholder="Hi! I need bridal makeup on 20 Nov at Jaipur Marriott. What are your rates?"
              />
            </div>
            <div className="fld">
              <label htmlFor="source">Came from</label>
              <select id="source" name="source" defaultValue="instagram">
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="fld">
              <label htmlFor="handle">Instagram handle (optional)</label>
              <input id="handle" name="handle" placeholder="@username" autoCapitalize="none" autoComplete="off" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" name="mode" value="raw">
              Save without reading
            </button>
            {ai ? (
              <button className="btn primary" type="submit" name="mode" value="ai">
                Read with AI
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section>
        <div className="sec-head">
          <h2>Messages</h2>
          <span className="chips">
            <Link className="chip" href="/inbox" aria-current={filter === "new" ? "true" : undefined}>
              New
            </Link>
            <Link className="chip" href="/inbox?lf=done" aria-current={filter === "done" ? "true" : undefined}>
              Done
            </Link>
          </span>
        </div>
        <div className="panel">
          <ul className="list">
            {leads.length ? (
              leads.map((l) => <LeadRow key={l.id} l={l} dismiss={dismissLead} />)
            ) : (
              <li className="empty">{filter === "new" ? "No new messages. Paste an enquiry above." : "Nothing here yet."}</li>
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
