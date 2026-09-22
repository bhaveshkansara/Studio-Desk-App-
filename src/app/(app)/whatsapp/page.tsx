import Link from "next/link";
import { requireStudio } from "@/lib/auth";

export default async function WhatsAppPage() {
  const { studio } = await requireStudio();

  return (
    <>
      <div>
        <Link className="back" href="/settings">
          ⚙️ Settings
        </Link>
        <h2>WhatsApp Integration</h2>
        <p className="hint">Connect WhatsApp Business Platform for automated messages</p>
      </div>

      <section>
        <div className="sec-head">
          <h2>Setup Status</h2>
        </div>
        <div className="panel">
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px", marginRight: "12px" }}>🔗</span>
              <div>
                <strong>WhatsApp Business API</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.9em", color: "var(--hint)" }}>Not connected yet</p>
              </div>
            </div>
            <p style={{ margin: "12px 0", fontSize: "0.9em" }}>
              Connect your WhatsApp Business Account to send automated messages, quotations, and reminders.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Features</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div className="panel" style={{ padding: "16px" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>📨 Auto Messages</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.85em" }}>
              <li>Quotation delivery</li>
              <li>Event reminders</li>
              <li>Balance due notices</li>
              <li>Review requests</li>
            </ul>
          </div>

          <div className="panel" style={{ padding: "16px" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>📱 Read Messages</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.85em" }}>
              <li>Auto-import enquiries</li>
              <li>Lead extraction</li>
              <li>Track responses</li>
              <li>Customer history</li>
            </ul>
          </div>

          <div className="panel" style={{ padding: "16px" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>⏰ Scheduling</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.85em" }}>
              <li>Send at best time</li>
              <li>Recurring reminders</li>
              <li>Time zone aware</li>
              <li>Lead nurture flows</li>
            </ul>
          </div>

          <div className="panel" style={{ padding: "16px" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>📊 Analytics</strong>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.85em" }}>
              <li>Message read rates</li>
              <li>Response times</li>
              <li>Conversion tracking</li>
              <li>ROI per message</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>How to connect</h2>
        </div>
        <div className="panel" style={{ padding: "20px" }}>
          <ol style={{ lineHeight: "2", fontSize: "0.95em" }}>
            <li>
              <strong>Get WhatsApp Business Account</strong>
              <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
                Sign up at{" "}
                <a href="https://www.whatsapp.com/business/" target="_blank" rel="noopener noreferrer">
                  WhatsApp Business
                </a>{" "}
                or through Meta
              </p>
            </li>
            <li>
              <strong>Generate API credentials</strong>
              <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
                Create access token in Meta App Center → WhatsApp → Settings → API Credentials
              </p>
            </li>
            <li>
              <strong>Add credentials here</strong>
              <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
                Phone number ID, access token, and business account ID
              </p>
            </li>
            <li>
              <strong>Verify phone number</strong>
              <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
                Confirm your WhatsApp number with the code we send
              </p>
            </li>
            <li>
              <strong>Create message templates</strong>
              <p style={{ margin: "4px 0", color: "var(--hint)", fontSize: "0.9em" }}>
                Define approved templates in Meta for each message type
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>🔒 Security</h3>
        <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "0.9em", lineHeight: "1.6" }}>
          <li>API credentials encrypted and securely stored</li>
          <li>Only approved message templates are sent</li>
          <li>All messages logged for compliance</li>
          <li>Customer opt-in required before messaging</li>
          <li>Full audit trail of all messages</li>
        </ul>
      </section>

      <div className="data" style={{ marginTop: "20px" }}>
        <a href="https://www.whatsapp.com/business/" target="_blank" rel="noopener noreferrer" className="btn">
          → Set up WhatsApp Business
        </a>
      </div>
    </>
  );
}
