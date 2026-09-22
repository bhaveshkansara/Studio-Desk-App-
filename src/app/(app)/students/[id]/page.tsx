import Link from "next/link";
import { notFound } from "next/navigation";
import { addPayment, deletePayment, deleteStudent } from "@/app/(app)/actions";
import { StudentForm } from "@/components/Forms";
import WaLink from "@/components/WaLink";
import { getTemplates, requireStudio } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";
import { igLink, renderTemplate, studentVars, waLink } from "@/lib/messages";
import { SSTATUS, balanceOfStudent } from "@/lib/types";
import type { Payment, Student } from "@/lib/types";

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const { supabase, studio } = await requireStudio();

  const { data } = await supabase.from("students").select("*").eq("id", id).eq("studio_id", studio.id).maybeSingle();
  if (!data) notFound();
  const s = data as Student;

  const [templates, pay] = await Promise.all([
    getTemplates(supabase, studio.id),
    supabase
      .from("payments")
      .select("id, amount, note, paid_on, created_at")
      .eq("student_id", id)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  const payments = (pay.data ?? []) as Payment[];
  const bal = balanceOfStudent(s);
  const wa = bal > 0 ? waLink(s.phone, renderTemplate(templates.student_fee ?? "", studentVars(s, studio.name))) : null;
  const ig = igLink(s.insta);

  return (
    <>
      <div>
        <Link className="back" href="/students">
          &larr; Students
        </Link>
        <h2>
          {s.name} <span className={"pill s-" + s.status}>{SSTATUS[s.status]}</span>
        </h2>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Saved.</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      {wa || ig ? (
        <section>
          <div className="sec-head">
            <h2>Message the student</h2>
          </div>
          <div className="data">
            {wa ? <WaLink href={wa} label="Fee reminder on WhatsApp" hot /> : null}
            {ig ? (
              <a className="act" href={ig} target="_blank" rel="noopener noreferrer">
                Instagram DM
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <section>
        <div className="sec-head">
          <h2>Fees</h2>
          <span>
            {inr(s.paid)} of {inr(s.fee)} paid{bal > 0 ? ` · ${inr(bal)} due` : ""}
          </span>
        </div>
        <div className="panel">
          {payments.length ? (
            payments.map((p) => (
              <div key={p.id} className="pay-row">
                <span>
                  {fmtDate(p.paid_on)}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
                <span>
                  {inr(p.amount)}{" "}
                  <form action={deletePayment} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="back" value={`/students/${id}`} />
                    <button className="act" type="submit" aria-label="Remove this payment">
                      Remove
                    </button>
                  </form>
                </span>
              </div>
            ))
          ) : (
            <p className="empty" style={{ margin: 0 }}>
              No payments recorded yet.
            </p>
          )}
          {s.status !== "left" ? (
            <form action={addPayment} className="form" style={{ borderTop: "1px solid var(--line)" }}>
              <input type="hidden" name="student_id" value={id} />
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
                  <input id="note" name="note" placeholder="Instalment 2, UPI" />
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
        <StudentForm student={s} />
      </section>

      <details className="danger">
        <summary>Delete this student</summary>
        <form action={deleteStudent}>
          <input type="hidden" name="id" value={id} />
          <p className="hint">This also removes their payment history and cannot be undone.</p>
          <button className="btn danger" type="submit">
            Yes, delete student
          </button>
        </form>
      </details>
    </>
  );
}
