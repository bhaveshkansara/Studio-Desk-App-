import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { inr } from "@/lib/format";
import type { QuotationTemplate } from "@/lib/types";

export default async function QuotationTemplatesPage() {
  const { supabase, studio } = await requireStudio();

  const { data: templates } = await supabase
    .from("quotation_templates")
    .select("*")
    .eq("studio_id", studio.id)
    .order("service_type", { ascending: true });

  const templateList = (templates ?? []) as QuotationTemplate[];

  // Default bridal makeup templates
  const defaultTemplates = [
    {
      name: "Wedding Makeup",
      service_type: "wedding",
      price: 25000,
      inclusions: ["Professional Hairstyling", "Hair Extensions", "Eyelashes", "Makeup Artistry", "Bridal Touch-ups"],
    },
    {
      name: "Reception Makeup",
      service_type: "reception",
      price: 25000,
      inclusions: ["Professional Hairstyling", "Makeup Artistry", "Bridal Touch-ups"],
    },
    {
      name: "Sangeet Makeup",
      service_type: "sangeet",
      price: 22000,
      inclusions: ["Professional Hairstyling", "Hair Extensions (optional)", "Makeup Artistry", "Hair Styling"],
    },
    {
      name: "Haldi Makeup",
      service_type: "haldi",
      price: 18000,
      inclusions: ["Professional Hairstyling", "Bridal Makeup", "Flower Jewelry Setup"],
    },
  ];

  const products = [
    "Dior",
    "Armani",
    "Gucci",
    "Natasha Denona",
    "Pat McGrath USA",
    "Estée Lauder",
    "Smashbox",
    "YSL",
    "NARS",
    "Too Faced",
    "Charlotte Tilbury",
    "Embryolisse French",
    "MAC",
    "Huda Beauty",
  ];

  return (
    <>
      <div>
        <Link className="back" href="/quotations">
          ← Quotations
        </Link>
        <h2>Quotation Templates</h2>
        <p className="hint">Pre-built service packages for faster quotations</p>
      </div>

      <section>
        <div className="sec-head">
          <h2>Your service packages</h2>
          <span>{templateList.length} package{templateList.length === 1 ? "" : "s"}</span>
        </div>

        {templateList.length > 0 ? (
          <div className="panel">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {templateList.map((t) => (
                <div key={t.id} style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "8px" }}>{t.name}</strong>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "var(--primary)", marginBottom: "12px" }}>
                    {inr(t.price)}
                  </div>
                  {t.inclusions && t.inclusions.length > 0 ? (
                    <ul style={{ margin: "0 0 12px 0", paddingLeft: "16px", fontSize: "0.9em" }}>
                      {t.inclusions.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div style={{ fontSize: "0.9em", color: "var(--hint)" }}>
                    {t.description || "No additional notes"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel">
            <p style={{ color: "var(--hint)", textAlign: "center", padding: "20px", margin: 0 }}>
              No templates yet. Use the defaults below or create custom ones.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="sec-head">
          <h2>🎯 Recommended templates</h2>
          <span>Pre-built bridal packages</span>
        </div>

        <div className="panel">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {defaultTemplates.map((t) => (
              <div key={t.service_type} style={{ border: "1px solid var(--line)", borderRadius: "6px", padding: "16px" }}>
                <strong style={{ display: "block", marginBottom: "8px" }}>{t.name}</strong>
                <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "var(--primary)", marginBottom: "12px" }}>
                  {inr(t.price)}
                </div>
                <ul style={{ margin: "0 0 12px 0", paddingLeft: "16px", fontSize: "0.9em" }}>
                  {t.inclusions.map((inc, i) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
                <Link
                  href={`/quotations?template=${t.service_type}&amount=${t.price}`}
                  className="btn"
                  style={{ display: "block", textAlign: "center", padding: "8px", textDecoration: "none" }}
                >
                  Use this template
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="sec-head">
          <h2>Professional products</h2>
        </div>

        <div className="panel">
          <p style={{ fontSize: "0.9em", marginBottom: "12px", color: "var(--hint)" }}>
            Brands used in your quotations:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {products.map((p) => (
              <span
                key={p}
                style={{
                  background: "var(--line)",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "0.9em",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--panel-bg)", padding: "16px", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0 }}>📋 Sample Quotation</h3>
        <div style={{ fontSize: "0.9em", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
{`BRIDAL MAKEUP QUOTATION
March Wedding Bookings

Wedding Makeup — ₹25,000
Reception Makeup — ₹25,000
Sangeet Makeup — ₹22,000
Haldi Makeup — ₹18,000

INCLUSIONS

• Professional Hairstyling
• Hair Extensions
• Eyelashes
• Contact Lenses
• Dress Draping

PROFESSIONAL PRODUCTS USED

Dior • Armani • Gucci • Natasha Denona
Pat McGrath USA • Estée Lauder • Smashbox
YSL • NARS • Too Faced • Charlotte Tilbury
Embryolisse French • MAC • Huda Beauty

Best Regards,
[Your Name]
Professional Makeup Artist
📞 [Your Phone]`}
        </div>
      </section>
    </>
  );
}
