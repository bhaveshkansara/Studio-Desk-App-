import type { Metadata } from "next";
import Link from "next/link";
import { deleteCampaign, duplicateCampaign } from "@/app/(app)/marketing/actions";
import { requireStudio } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { CAMPAIGN_STATUS, CONTENT_TYPES } from "@/lib/marketing/constants";
import type { CampaignStatus, ContentType } from "@/lib/marketing/constants";
import { BUCKET, SETUP_MESSAGE, isMissingSetup } from "@/lib/marketing/http";

export const metadata: Metadata = { title: "Saved campaigns · MUA Marketing AI" };

interface Row {
  id: string;
  title: string;
  status: CampaignStatus;
  content_type: ContentType | null;
  image_path: string | null;
  caption: string | null;
  hashtags: string[];
  created_at: string;
}

export default async function MarketingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; notice?: string }>;
}) {
  const { status: statusParam, error, notice } = await searchParams;
  const filter = statusParam && statusParam in CAMPAIGN_STATUS ? (statusParam as CampaignStatus) : null;
  const { supabase, studio } = await requireStudio();

  let query = supabase
    .from("marketing_campaigns")
    .select("id, title, status, content_type, image_path, caption, hashtags, created_at")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter) query = query.eq("status", filter);
  const { data, error: dbError } = await query;
  const rows = (data ?? []) as Row[];

  // One signed-URL request for all thumbnails instead of one per row.
  const thumbs = new Map<string, string>();
  const paths = rows.map((r) => r.image_path).filter((p): p is string => Boolean(p));
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) thumbs.set(s.path, s.signedUrl);
  }

  return (
    <>
      <div>
        <Link className="back" href="/marketing">
          ← MUA Marketing AI
        </Link>
        <h2>Saved campaigns</h2>
      </div>

      {error ? <div className="banner bad">{error}</div> : null}
      {notice ? <div className="banner info">{notice}</div> : null}
      {dbError ? (
        <div className="banner bad">{isMissingSetup(dbError) ? SETUP_MESSAGE : "Could not load your campaigns. Please refresh the page."}</div>
      ) : null}

      <section>
        <div className="sec-head">
          <span className="chips">
            <Link className="chip" href="/marketing/history" aria-current={!filter ? "true" : undefined}>
              All
            </Link>
            {(Object.keys(CAMPAIGN_STATUS) as CampaignStatus[]).map((s) => (
              <Link key={s} className="chip" href={`/marketing/history?status=${s}`} aria-current={filter === s ? "true" : undefined}>
                {CAMPAIGN_STATUS[s]}
              </Link>
            ))}
          </span>
        </div>

        <div className="panel">
          <ul className="list">
            {rows.length ? (
              rows.map((r) => {
                const thumb = r.image_path ? thumbs.get(r.image_path) : undefined;
                return (
                  <li key={r.id} className="row mk-hrow">
                    <Link href={`/marketing/${r.id}`} className="row-main">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                        <img className="mk-thumb" src={thumb} alt="" loading="lazy" />
                      ) : (
                        <span className="mk-thumb mk-thumb-empty" aria-hidden="true">
                          ✦
                        </span>
                      )}
                      <span className="txt">
                        <strong>{r.title}</strong>
                        <small>{(r.caption ?? "").slice(0, 90) || "No caption"}</small>
                      </span>
                      <span className="meta">
                        <span className={`pill mk-st-${r.status}`}>{CAMPAIGN_STATUS[r.status] ?? r.status}</span>
                        <span className="bal">
                          {fmtDate(r.created_at.slice(0, 10))}
                          {r.content_type && CONTENT_TYPES[r.content_type] ? ` · ${CONTENT_TYPES[r.content_type]}` : ""}
                        </span>
                      </span>
                    </Link>
                    <div className="acts mk-hacts">
                      <Link className="act" href={`/marketing/${r.id}`}>
                        View
                      </Link>
                      <Link className="act" href={`/marketing/${r.id}#edit`}>
                        Edit
                      </Link>
                      <form action={duplicateCampaign}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="act" type="submit">
                          Duplicate
                        </button>
                      </form>
                      <details className="danger mk-del">
                        <summary>Delete</summary>
                        <form action={deleteCampaign}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="act" type="submit">
                            Yes, delete
                          </button>
                        </form>
                      </details>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="empty">
                {filter ? "No campaigns with this status." : "No saved campaigns yet."}{" "}
                <Link href="/marketing">Create one →</Link>
              </li>
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
