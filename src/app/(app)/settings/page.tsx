import Link from "next/link";
import { saveSettings } from "@/app/(app)/actions";
import { getTemplates, requireStudio } from "@/lib/auth";
import { DEFAULT_TEMPLATES, PLACEHOLDERS, TEMPLATE_LABELS } from "@/lib/messages";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, studio } = await requireStudio();
  const templates = await getTemplates(supabase, studio.id);

  return (
    <>
      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Settings saved.</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      <form action={saveSettings}>
        <section>
          <div className="sec-head">
            <h2>Your studio</h2>
          </div>
          <div className="form panel">
            <div className="grid">
              <div className="fld">
                <label htmlFor="studio_name">Studio name</label>
                <input id="studio_name" name="studio_name" required defaultValue={studio.name} />
              </div>
              <div className="fld">
                <label htmlFor="studio_phone">Studio phone (optional)</label>
                <input id="studio_phone" name="studio_phone" type="tel" defaultValue={studio.phone ?? ""} />
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div className="sec-head">
            <h2>WhatsApp messages</h2>
            <span>Your wording, filled in for each client</span>
          </div>
          <p className="hint">
            Available fields:{" "}
            {PLACEHOLDERS.map((p) => (
              <span key={p} className="code" style={{ marginRight: 6 }}>
                {p}
              </span>
            ))}
          </p>
          <div className="form panel">
            <div className="grid">
              {Object.keys(DEFAULT_TEMPLATES).map((key) => (
                <div key={key} className="fld full">
                  <label htmlFor={`tpl_${key}`}>
                    {TEMPLATE_LABELS[key]?.label ?? key} &middot; {TEMPLATE_LABELS[key]?.hint}
                  </label>
                  <textarea id={`tpl_${key}`} name={`tpl_${key}`} rows={5} defaultValue={templates[key] ?? ""} />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn primary" type="submit">
                Save settings
              </button>
            </div>
          </div>
        </section>
      </form>

      <section style={{ marginTop: 26 }}>
        <div className="sec-head">
          <h2>Integrations</h2>
          <span>Connect third-party services</span>
        </div>

        <div className="panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              padding: "16px",
            }}
          >
            <Link
              href="/settings/whatsapp"
              style={{
                padding: "16px",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                display: "block",
              }}
              className="integration-card"
            >
              <div style={{ fontSize: "1.3em", marginBottom: "8px" }}>💬</div>
              <strong>WhatsApp Integration</strong>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.9em", color: "var(--hint)" }}>
                Send automated messages to clients
              </p>
            </Link>

            <Link
              href="/settings/razorpay"
              style={{
                padding: "16px",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                display: "block",
              }}
              className="integration-card"
            >
              <div style={{ fontSize: "1.3em", marginBottom: "8px" }}>💳</div>
              <strong>Razorpay Payments</strong>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.9em", color: "var(--hint)" }}>
                Accept online payments instantly
              </p>
            </Link>
          </div>
        </div>

        <style>{`
          .integration-card:hover {
            background: var(--panel-bg);
            border-color: var(--primary);
          }
        `}</style>
      </section>
    </>
  );
}
