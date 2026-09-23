import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCampaign, duplicateCampaign, updateCampaign } from "@/app/(app)/marketing/actions";
import CopyButton from "@/components/marketing/CopyButton";
import ResultCards from "@/components/marketing/ResultCards";
import { requireStudio } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { CAMPAIGN_STATUS, CONTENT_TYPES, IMAGE_KINDS } from "@/lib/marketing/constants";
import type { CampaignDetails } from "@/lib/marketing/constants";
import { BUCKET, SETUP_MESSAGE, isMissingSetup } from "@/lib/marketing/http";
import { MarketingResultSchema } from "@/lib/marketing/schema";

export const metadata: Metadata = { title: "Campaign · MUA Marketing AI" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; notice?: string }>;
}) {
  const [{ id }, { saved, error, notice }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();
  const { supabase, studio } = await requireStudio();

  const { data: row, error: dbError } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", id)
    .eq("studio_id", studio.id)
    .maybeSingle();
  if (dbError) {
    return (
      <div className="banner bad">{isMissingSetup(dbError) ? SETUP_MESSAGE : "Could not load this campaign. Please refresh the page."}</div>
    );
  }
  if (!row) notFound();

  const parsed = MarketingResultSchema.safeParse(row.result);
  const details = (row.details ?? {}) as Partial<CampaignDetails>;
  let imageUrl: string | null = null;
  if (row.image_path) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(row.image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }
  const hashtags = (row.hashtags ?? []) as string[];
  const keywords = (row.keywords ?? []) as string[];
  const detailBits = [
    details.imageKind ? IMAGE_KINDS[details.imageKind] : null,
    details.location,
    details.destination,
    details.instagram ? "@" + details.instagram : null,
  ].filter(Boolean);

  return (
    <>
      <div>
        <Link className="back" href="/marketing/history">
          ← Saved campaigns
        </Link>
        <h2>{row.title}</h2>
        <p className="hint">
          {fmtDate(String(row.created_at).slice(0, 10))} · {CAMPAIGN_STATUS[row.status as keyof typeof CAMPAIGN_STATUS] ?? row.status}
          {detailBits.length ? ` · ${detailBits.join(" · ")}` : ""}
        </p>
      </div>

      {saved ? <div className="banner info">Changes saved.</div> : null}
      {notice ? <div className="banner info">{notice}</div> : null}
      {error ? <div className="banner bad">{error}</div> : null}

      <section className="mk-detail-top">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
          <img className="mk-detail-img" src={imageUrl} alt={parsed.success ? parsed.data.instagramSeo.altText : "Campaign photo"} />
        ) : null}

        <form action={updateCampaign} className="form panel mk-edit" id="edit">
          <input type="hidden" name="id" value={row.id} />
          <div className="grid">
            <div className="fld full">
              <label htmlFor="title">Campaign name</label>
              <input id="title" name="title" required maxLength={140} defaultValue={row.title} />
            </div>
            <div className="fld">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={row.status}>
                {Object.entries(CAMPAIGN_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label htmlFor="content_type">Content type</label>
              <select id="content_type" name="content_type" defaultValue={row.content_type ?? ""}>
                <option value="">Not set</option>
                {Object.entries(CONTENT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld full">
              <label htmlFor="caption">Final caption</label>
              <textarea id="caption" name="caption" rows={9} maxLength={4000} defaultValue={row.caption ?? ""} />
            </div>
            <div className="fld full">
              <label htmlFor="hashtags">Hashtags (separate with spaces)</label>
              <textarea id="hashtags" name="hashtags" rows={3} defaultValue={hashtags.join(" ")} />
            </div>
            <div className="fld full">
              <label htmlFor="keywords">Keywords (one per line)</label>
              <textarea id="keywords" name="keywords" rows={5} defaultValue={keywords.join("\n")} />
            </div>
          </div>
          <div className="form-actions">
            <span className="mk-inline-acts spacer">
              <CopyButton text={row.caption ?? ""} label="Copy Caption" />
              <CopyButton text={hashtags.join(" ")} label="Copy Hashtags" />
              <CopyButton text={keywords.join("\n")} label="Copy Keywords" />
            </span>
            <button className="btn primary" type="submit">
              Save changes
            </button>
          </div>
        </form>
      </section>

      <div className="data">
        <form action={duplicateCampaign}>
          <input type="hidden" name="id" value={row.id} />
          <button className="btn" type="submit">
            Duplicate
          </button>
        </form>
        <Link className="btn" href="/marketing">
          New campaign
        </Link>
      </div>

      {parsed.success ? (
        <section>
          <div className="sec-head">
            <h2>Full AI marketing kit</h2>
            <span>Generated {fmtDate(parsed.data.generatedAt.slice(0, 10))}</span>
          </div>
          <ResultCards result={parsed.data} />
        </section>
      ) : (
        <div className="banner">The original AI result for this campaign could not be displayed.</div>
      )}

      <details className="danger">
        <summary>Delete this campaign</summary>
        <form action={deleteCampaign}>
          <input type="hidden" name="id" value={row.id} />
          <button className="btn danger" type="submit">
            Yes, delete it permanently
          </button>
        </form>
      </details>
    </>
  );
}
