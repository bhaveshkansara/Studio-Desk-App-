import Link from "next/link";
import { saveRazorpayConfig } from "@/app/(app)/actions";
import { requireStudio } from "@/lib/auth";

export default async function RazorpaySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { saved, error } = await sp;
  const { supabase, studio } = await requireStudio();

  const { data: config } = await supabase
    .from("razorpay_config")
    .select("*")
    .eq("studio_id", studio.id)
    .maybeSingle();

  return (
    <>
      <div>
        <Link className="back" href="/settings">
          ⚙️ Settings
        </Link>
        <h2>Razorpay Payment Gateway</h2>
        <p className="hint">Accept online payments from clients directly in the app</p>
      </div>

      {saved ? <div className="banner info" style={{ marginTop: 0 }}>Razorpay configuration saved.</div> : null}
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
                {config?.is_configured
                  ? `${config.is_live_mode ? "Live" : "Test"} mode - Ready to accept payments`
                  : "Configure API credentials to enable online payments"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>API Credentials</h2>
          <span>From Razorpay Dashboard</span>
        </div>

        <form action={saveRazorpayConfig} className="form panel">
          <div className="grid">
            <div className="fld full">
              <label htmlFor="api_key_id">API Key ID</label>
              <input
                id="api_key_id"
                name="api_key_id"
                placeholder="Your Razorpay API Key ID"
                defaultValue={config?.api_key_id ?? ""}
              />
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Found in Razorpay Dashboard → Settings → API Keys
              </small>
            </div>

            <div className="fld full">
              <label htmlFor="api_key_secret">API Key Secret</label>
              <input
                id="api_key_secret"
                name="api_key_secret"
                type="password"
                placeholder="Your Razorpay API Key Secret"
                defaultValue={config?.api_key_secret ?? ""}
              />
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Keep this secret. Never share it with anyone.
              </small>
            </div>

            <div className="fld full">
              <label>
                <input
                  type="checkbox"
                  name="is_live_mode"
                  defaultChecked={config?.is_live_mode ?? false}
                />
                {" "}Live Mode
              </label>
              <small style={{ color: "var(--hint)", marginTop: "4px", display: "block" }}>
                Enable to accept real payments. Leave unchecked for testing.
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn primary" type="submit">
              Save Razorpay Configuration
            </button>
          </div>
        </form>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>📋 Setup Instructions</h3>
        <ol style={{ lineHeight: "2", fontSize: "0.95em", margin: 0, paddingLeft: "20px" }}>
          <li>
            <strong>Create Razorpay Account</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Visit{" "}
              <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer">
                Razorpay.com
              </a>
              {" "}and sign up
            </p>
          </li>
          <li>
            <strong>Complete Verification</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Verify your business details and bank account
            </p>
          </li>
          <li>
            <strong>Generate API Keys</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Go to Settings → API Keys → Generate Key Pair
            </p>
          </li>
          <li>
            <strong>Copy Credentials</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Copy Key ID and Key Secret from the dashboard
            </p>
          </li>
          <li>
            <strong>Paste Here</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Fill in the form above and save
            </p>
          </li>
          <li>
            <strong>Test Payment</strong>
            <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
              Create a test booking and process a payment from Payments page
            </p>
          </li>
        </ol>
      </section>

      <section style={{ background: "var(--line)", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
        <h3 style={{ marginTop: 0 }}>💳 Payment Features</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.9em" }}>
          <div>
            <strong>✅ Online Payments</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Accept UPI, cards, netbanking</p>
          </div>
          <div>
            <strong>✅ Instant Settlement</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Money in your account within 2 hours</p>
          </div>
          <div>
            <strong>✅ Payment Tracking</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>Auto-update booking balance when paid</p>
          </div>
          <div>
            <strong>✅ Secure</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--hint)" }}>PCI-DSS compliant, encrypted</p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--success)", opacity: 0.1, padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
        <h3 style={{ marginTop: 0, color: "var(--success)" }}>💰 Pricing</h3>
        <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "0.9em" }}>
          <li><strong>Transaction Fee:</strong> 2% + ₹3 per successful payment</li>
          <li><strong>No setup fee or monthly charges</strong></li>
          <li><strong>Pay only when you get paid</strong></li>
          <li><strong>Settlements within 2 hours</strong></li>
        </ul>
      </section>
    </>
  );
}
