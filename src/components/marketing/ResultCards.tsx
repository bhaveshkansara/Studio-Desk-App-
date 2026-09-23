"use client";

import CopyButton from "@/components/marketing/CopyButton";
import { CONTENT_TYPES, GOALS, SECTIONS } from "@/lib/marketing/constants";
import type { Section } from "@/lib/marketing/constants";
import type { MarketingResult, Tip } from "@/lib/marketing/schema";
import {
  HASHTAG_GROUPS,
  KEYWORD_GROUPS,
  allHashtags,
  allKeywords,
  calDate,
  calendarCsv,
  hashtagsText,
  keywordsText,
} from "@/lib/marketing/text";

export function downloadCalendar(result: Pick<MarketingResult, "calendar">) {
  const blob = new Blob([calendarCsv(result)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `content-calendar-${result.calendar[0]?.date || "10-days"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function GenButton({
  section,
  onGenerate,
  busy,
}: {
  section: Section;
  onGenerate?: (s: Section) => void;
  busy?: Section | "analyze" | null;
}) {
  if (!onGenerate) return null;
  const mine = busy === section;
  return (
    <button type="button" className="act hot" disabled={Boolean(busy)} onClick={() => onGenerate(section)}>
      {mine ? "Generating…" : SECTIONS[section]}
    </button>
  );
}

function Card({
  id,
  title,
  eyebrow,
  actions,
  children,
  loading,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <section className="mk-card panel" id={id} aria-busy={loading || undefined}>
      <header className="mk-card-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {actions ? <div className="mk-card-acts">{actions}</div> : null}
      </header>
      <div className={loading ? "mk-card-body mk-dim" : "mk-card-body"}>{children}</div>
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <p className="hint">None</p>;
  return (
    <div className="mk-chips">
      {items.map((t) => (
        <span key={t} className="mk-chip">
          {t}
        </span>
      ))}
    </div>
  );
}

function TipList({ title, tips }: { title: string; tips: Tip[] }) {
  if (!tips.length) return null;
  return (
    <div className="mk-tips">
      <h3>{title}</h3>
      <ul>
        {tips.map((t, i) => (
          <li key={i}>
            <b>{t.area}</b>
            <span>{t.tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SCORE_LABELS: [keyof MarketingResult["scores"], string][] = [
  ["photo", "Photo presentation"],
  ["caption", "Caption readiness"],
  ["seo", "SEO readiness"],
  ["bookingCta", "Booking CTA"],
  ["overall", "Overall content readiness"],
];

const tone = (n: number) => (n >= 8 ? "good" : n >= 5 ? "mid" : "low");

export default function ResultCards({
  result,
  onGenerate,
  busy = null,
}: {
  result: MarketingResult;
  onGenerate?: (s: Section) => void;
  busy?: Section | "analyze" | null;
}) {
  const a = result.analysis;
  const tags = allHashtags(result);
  const keywords = allKeywords(result);

  return (
    <div className="mk-results">
      {!a.isBeautyContent ? (
        <div className="banner">
          This photo does not look like makeup, hair or wedding content, so the suggestions are generic. For best
          results, upload a makeup or bridal photo.
        </div>
      ) : null}

      <Card id="mk-analysis" eyebrow="AI image analysis" title={a.contentAngle || "Content analysis"}>
        <p className="mk-lede">{a.summary}</p>
        <dl className="mk-facts">
          {(
            [
              ["Makeup style", a.makeupStyle],
              ["Skin finish", a.skinFinish],
              ["Eye makeup", a.eyeMakeup],
              ["Lip style", a.lipStyle],
              ["Hair", a.hairStyle],
              ["Outfit / styling", a.outfitStyling],
              ["Aesthetic", a.aesthetic],
              ["Occasion", a.occasion],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        id="mk-score"
        eyebrow="Diagnostic only"
        title="Content score"
        loading={busy === "improve"}
      >
        <p className="hint">These scores measure how ready this post is to publish. They never rate the person in the photo.</p>
        <ul className="mk-scores">
          {SCORE_LABELS.map(([k, label]) => {
            const s = result.scores[k];
            return (
              <li key={k} className={k === "overall" ? "mk-score overall" : "mk-score"}>
                <div className="mk-score-top">
                  <span>{label}</span>
                  <b className={`mk-num ${tone(s.score)}`}>
                    {s.score}
                    <small>/10</small>
                  </b>
                </div>
                <span className="mk-meter" aria-hidden="true">
                  <i className={tone(s.score)} style={{ width: `${s.score * 10}%` }} />
                </span>
                <small className="mk-score-tip">{s.howToImprove}</small>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card
        id="mk-caption"
        eyebrow="Instagram caption"
        title="Caption"
        loading={busy === "caption"}
        actions={
          <>
            <GenButton section="caption" onGenerate={onGenerate} busy={busy} />
            <CopyButton text={result.captions.main} label="Copy Caption" className="act" />
          </>
        }
      >
        <p className="mk-hook">“{result.captions.hook}”</p>
        <div className="mk-caption">{result.captions.main}</div>
        <div className="mk-cta-row">
          <div>
            <small>CTA</small>
            <p>{result.captions.cta}</p>
          </div>
          <div>
            <small>Booking CTA</small>
            <p>{result.captions.bookingCta}</p>
          </div>
        </div>
        {result.captions.alternatives.length ? (
          <div className="mk-alts">
            <h3>Alternative captions</h3>
            {result.captions.alternatives.map((alt, i) => (
              <div key={i} className="mk-alt">
                <p>{alt}</p>
                <CopyButton text={alt} label="Copy" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="mk-copy-all">
          <CopyButton
            text={`${result.captions.main}\n\n${hashtagsText(tags)}`}
            label="Copy caption + hashtags"
            className="btn"
          />
        </div>
      </Card>

      <Card
        id="mk-hashtags"
        eyebrow={`${tags.length} hashtags`}
        title="Hashtags"
        loading={busy === "hashtags"}
        actions={
          <>
            <GenButton section="hashtags" onGenerate={onGenerate} busy={busy} />
            <CopyButton text={hashtagsText(tags)} label="Copy Hashtags" />
          </>
        }
      >
        {(Object.keys(HASHTAG_GROUPS) as (keyof typeof HASHTAG_GROUPS)[]).map((k) =>
          result.hashtags[k].length ? (
            <div key={k} className="mk-group">
              <h3>{HASHTAG_GROUPS[k]}</h3>
              <Chips items={result.hashtags[k]} />
            </div>
          ) : null,
        )}
      </Card>

      <Card
        id="mk-keywords"
        eyebrow="SEO"
        title="SEO keywords"
        loading={busy === "keywords"}
        actions={
          <>
            <GenButton section="keywords" onGenerate={onGenerate} busy={busy} />
            <CopyButton text={keywordsText(keywords)} label="Copy Keywords" />
          </>
        }
      >
        <div className="mk-primary">
          <small>Primary keyword</small>
          <b>{result.keywords.primary}</b>
        </div>
        {(Object.keys(KEYWORD_GROUPS) as (keyof typeof KEYWORD_GROUPS)[]).map((k) =>
          result.keywords[k].length ? (
            <div key={k} className="mk-group">
              <h3>{KEYWORD_GROUPS[k]}</h3>
              <Chips items={result.keywords[k]} />
            </div>
          ) : null,
        )}

        <div className="mk-seo">
          <h3>Instagram SEO</h3>
          <dl className="mk-facts one">
            <div>
              <dt>Suggested post title</dt>
              <dd>{result.instagramSeo.postTitle}</dd>
            </div>
            <div>
              <dt>SEO-friendly caption</dt>
              <dd className="mk-pre">{result.instagramSeo.seoCaption}</dd>
            </div>
            <div>
              <dt>Alt text</dt>
              <dd>{result.instagramSeo.altText}</dd>
            </div>
            <div>
              <dt>Location tag</dt>
              <dd>{result.instagramSeo.locationTag}</dd>
            </div>
            <div>
              <dt>Keywords to place in the caption</dt>
              <dd>
                <Chips items={result.instagramSeo.captionKeywords} />
              </dd>
            </div>
            <div>
              <dt>Profile / search keywords</dt>
              <dd>
                <Chips items={result.instagramSeo.profileKeywords} />
              </dd>
            </div>
          </dl>
          <div className="mk-inline-acts">
            <CopyButton text={result.instagramSeo.seoCaption} label="Copy SEO caption" />
            <CopyButton text={result.instagramSeo.altText} label="Copy alt text" />
          </div>
        </div>
      </Card>

      <div className="mk-duo">
        <Card id="mk-posting" eyebrow="Best time to post" title={`${result.posting.bestDay}, ${result.posting.bestTime}`}>
          <p className="mk-label">{result.posting.label}</p>
          <dl className="mk-facts one">
            <div>
              <dt>Best day</dt>
              <dd>{result.posting.bestDay}</dd>
            </div>
            <div>
              <dt>Best time</dt>
              <dd>
                {result.posting.bestTime} {result.posting.timezone}
              </dd>
            </div>
            <div>
              <dt>Backup time</dt>
              <dd>
                {result.posting.backupTime} {result.posting.timezone}
              </dd>
            </div>
            <div>
              <dt>Why</dt>
              <dd>{result.posting.reason}</dd>
            </div>
          </dl>
        </Card>

        <Card id="mk-type" eyebrow="Content recommendation" title={CONTENT_TYPES[result.recommendation.primary]}>
          <p>{result.recommendation.why}</p>
          {result.recommendation.alsoGood.length ? (
            <div className="mk-group">
              <h3>Also works as</h3>
              <Chips items={result.recommendation.alsoGood.map((t) => CONTENT_TYPES[t])} />
            </div>
          ) : null}
        </Card>
      </div>

      <Card
        id="mk-calendar"
        eyebrow="Starts tomorrow"
        title="10-day content calendar"
        loading={busy === "calendar"}
        actions={
          <>
            <GenButton section="calendar" onGenerate={onGenerate} busy={busy} />
            <button type="button" className="act" onClick={() => downloadCalendar(result)} disabled={!result.calendar.length}>
              Download Calendar
            </button>
          </>
        }
      >
        <ol className="mk-cal">
          {result.calendar.map((d) => (
            <li key={d.day}>
              <details>
                <summary>
                  <span className="mk-cal-day">
                    <b>{d.day}</b>
                    <i>{calDate(d.date)}</i>
                  </span>
                  <span className="mk-cal-main">
                    <strong>{d.topic}</strong>
                    <small>
                      {CONTENT_TYPES[d.contentType]} · {d.postingTime}
                    </small>
                  </span>
                  <span className={`mk-goal g-${d.goal}`}>{GOALS[d.goal]}</span>
                </summary>
                <dl className="mk-facts one">
                  <div>
                    <dt>Hook</dt>
                    <dd>{d.hook}</dd>
                  </div>
                  <div>
                    <dt>Caption idea</dt>
                    <dd>{d.captionIdea}</dd>
                  </div>
                  <div>
                    <dt>CTA</dt>
                    <dd>{d.cta}</dd>
                  </div>
                  <div>
                    <dt>Keywords</dt>
                    <dd>{d.keywords.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Hashtags</dt>
                    <dd>{d.hashtags.join(" ")}</dd>
                  </div>
                </dl>
              </details>
            </li>
          ))}
        </ol>
      </Card>

      <Card
        id="mk-improve"
        eyebrow="How to improve this content"
        title="Improvement advice"
        loading={busy === "improve"}
        actions={<GenButton section="improve" onGenerate={onGenerate} busy={busy} />}
      >
        <div className="mk-tipgrid">
          <TipList title="Content improvements" tips={result.improvements.content} />
          <TipList title="Marketing improvements" tips={result.improvements.marketing} />
          <TipList title="Profile improvements" tips={result.improvements.profile} />
          <TipList title="Booking improvements" tips={result.improvements.booking} />
        </div>
      </Card>
    </div>
  );
}
