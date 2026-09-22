import Link from "next/link";
import { saveWhatsAppConfig } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";

export default async function WhatsAppSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { saved, error } = await sp;
  const { supabase, studio } = await requireStudio();

  const { data: config } = await supabase
    .from("whatsapp_config")
    .select("*")
    .eq("studio_id", studio.id)
    .maybeSingle();

  return (
    <>
      <div>
        <Link className="back" href="/settings">
          ⚙️ Settings
        </Link>
        <h2>WhatsApp Integration</h2>
        <p className="hint">Enable automated quotations, invoices, and reminders via WhatsApp</p>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>WhatsApp configuration saved.</div> : null}
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}

      <section>
        <div className="sec-head">
          <h2>Connection Status</h2>
        </div>
        <div className="panel">
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>{config?.is_configured ? "🟢" : "🔴"}</span>
            <div>
              <strong>{config?.is_configured ? "Connected" : "Not Connected"}</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.9em", color: "var(--hint)" }}>
                {config?.is_configured ? "WhatsApp is ready to send messages" : "Configure API credentials to enable WhatsApp"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>API Credentials</h2>
          <span>From WhatsApp Business Platform</span>
        </div>

        <form action={saveWhatsAppConfig} className="form panel">
          <div className="grid">
            <div className="fld full">
              <label htmlFor="phone_number_id">Phone Number ID</label>
              <input
                id="phone_number_id"
                name="phone_number_id"
                placeholder="Your WhatsApp Business phone number ID"
                defaultValue={config?.phone_number_id ?? ""}
              />
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Found in WhatsApp → Settings → Business Account → Phone Number IDs
              </small>
            </div>

            <div className="fld full">
              <label htmlFor="api_token">API Access Token</label>
              <input
                id="api_token"
                name="api_token"
                type="password"
                placeholder="Your WhatsApp Business API token"
                defaultValue={config?.api_token ?? ""}
              />
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Found in Meta App Center → WhatsApp → Settings
              </small>
            </div>

            <div className="fld full">
              <label htmlFor="business_account_id">Business Account ID</label>
              <input
                id="business_account_id"
                name="business_account_id"
                placeholder="Your WhatsApp Business account ID"
                defaultValue={config?.business_account_id ?? ""}
              />
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Your WhatsApp Business account identifier
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn primary" type="submit">
              Save WhatsApp Configuration
            </button>
          </div>
        </form>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>📋 Setup Instructions</h3>
        <ol style={{ lineHeight: "2", fontSize: "0.95em", margin: 0, paddingLeft: "20px" }}>
          <li>
            <strong>Create WhatsApp Business Account</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Visit{" "}
              <a href="https://www.whatsapp.com/business/" target="_blank" rel="noopener noreferrer">
                WhatsApp Business
              </a>
            </p>
          </li>
          <li>
            <strong>Set up Meta Business Account</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Register your business in Meta App Center
            </p>
          </li>
          <li>
            <strong>Create App & Get API Token</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Create WhatsApp app in Meta → Get Access Token
            </p>
          </li>
          <li>
            <strong>Add Phone Number</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Verify your WhatsApp phone number
            </p>
          </li>
          <li>
            <strong>Paste Credentials Here</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Fill in the form above and save
            </p>
          </li>
          <li>
            <strong>Test Sending</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Send a test quotation from Quotations page
            </p>
          </li>
        </ol>
      </section>

      <section style={{ background: "var(--line)", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
        <h3 style={{ marginTop: 0 }}>💬 Automated Messages</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9em" }}>
          <div>
            <strong>✅ Quotations</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Send with service, date, venue, pricing</p>
          </div>
          <div>
            <strong>✅ Invoices</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Send with total, advance, balance</p>
          </div>
          <div>
            <strong>✅ Reminders</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Send 3 days before event</p>
          </div>
          <div>
            <strong>✅ Confirmations</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Send when booking confirmed</p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--warn)", opacity: 0.1, padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
        <h3 style={{ marginTop: 0, color: "var(--warn)" }}>🔒 Security</h3>
        <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "0.9em" }}>
          <li>API token is encrypted and never exposed</li>
          <li>Only sent to official WhatsApp Business API</li>
          <li>All messages are logged for compliance</li>
          <li>Your data stays in your account</li>
        </ul>
      </section>
    </>
  );
}
