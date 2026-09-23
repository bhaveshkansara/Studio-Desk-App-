"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CopyButton from "@/components/marketing/CopyButton";
import ResultCards, { downloadCalendar } from "@/components/marketing/ResultCards";
import {
  CAMPAIGN_STATUS,
  EMPTY_DETAILS,
  IMAGE_KINDS,
  LOCATION_SUGGESTIONS,
  OCCASIONS,
  SECTIONS,
  TONES,
} from "@/lib/marketing/constants";
import type { CampaignDetails, ImageKind, Section } from "@/lib/marketing/constants";
import { prepareImage } from "@/lib/marketing/image";
import type { PreparedImage } from "@/lib/marketing/image";
import type { MarketingResult } from "@/lib/marketing/schema";
import { allHashtags, allKeywords, hashtagsText, keywordsText } from "@/lib/marketing/text";

const PROGRESS = [
  "Uploading your photo…",
  "Reading the makeup, hair and styling…",
  "Writing your captions…",
  "Picking hashtags and keywords…",
  "Planning your 10-day calendar…",
  "Checking how to improve the post…",
];

type Busy = Section | "analyze" | "save" | null;

/** POSTs a form to one of the marketing APIs and turns every failure into a friendly Error. */
async function post<T>(url: string, body: FormData, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body, signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("The request took too long. Please try again.");
    throw new Error("Network problem. Please check your internet connection and try again.");
  }
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson) {
    throw new Error(
      res.redirected || res.status === 401
        ? "Your session has expired. Please refresh the page and sign in again."
        : `Something went wrong (error ${res.status}). Please try again.`,
    );
  }
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Something went wrong (error ${res.status}). Please try again.`);
  return data;
}

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

export default function MarketingStudio({ brandName, aiReady }: { brandName: string; aiReady: boolean }) {
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [details, setDetails] = useState<CampaignDetails>({ ...EMPTY_DETAILS, brandName });
  const [result, setResult] = useState<MarketingResult | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [saved, setSaved] = useState<{ id: string; for: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Free the preview URL when the photo changes or the page closes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // Rotate progress messages during the long first analysis.
  useEffect(() => {
    if (busy !== "analyze") return;
    setProgress(0);
    const t = setInterval(() => setProgress((p) => Math.min(p + 1, PROGRESS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  const unsaved = Boolean(result && saved?.for !== result.generatedAt);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const set = <K extends keyof CampaignDetails>(k: K, v: CampaignDetails[K]) => setDetails((d) => ({ ...d, [k]: v }));

  async function pick(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    setNotice(null);
    setImageNote("Preparing photo…");
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);
      setPreview(URL.createObjectURL(prepared.blob));
      setResult(null);
      setSaved(null);
      setTitle("");
      setImageNote(
        prepared.originalMinEdge < 600
          ? "This photo is quite small. A higher-resolution photo will look better on Instagram."
          : null,
      );
    } catch (err) {
      setImageNote(null);
      setError((err as Error).message);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    setImageNote(null);
    setResult(null);
    setSaved(null);
    setError(null);
  }

  async function analyze() {
    setError(null);
    setNotice(null);
    if (!image) {
      setError("Please upload a photo first.");
      return;
    }
    const form = new FormData();
    form.append("image", image.blob, "photo.jpg");
    form.append("details", JSON.stringify(details));
    const t = withTimeout(150_000);
    setBusy("analyze");
    try {
      const data = await post<{ result: MarketingResult; cached?: boolean }>("/api/marketing/analyze", form, t.signal);
      setResult(data.result);
      setTitle(data.result.instagramSeo.postTitle || "");
      if (data.cached) setNotice("Same photo and details as before, so we reused the last analysis.");
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      t.done();
      setBusy(null);
    }
  }

  async function generate(section: Section) {
    if (!result) return;
    setError(null);
    setNotice(null);
    const form = new FormData();
    form.append("section", section);
    form.append("details", JSON.stringify(details));
    form.append("current", JSON.stringify(result));
    if (section === "improve" && image) form.append("image", image.blob, "photo.jpg");
    const t = withTimeout(150_000);
    setBusy(section);
    try {
      const data = await post<{ result: MarketingResult }>("/api/marketing/generate", form, t.signal);
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      t.done();
      setBusy(null);
    }
  }

  async function save() {
    if (!result) return;
    setError(null);
    setNotice(null);
    const form = new FormData();
    form.append("result", JSON.stringify(result));
    form.append("details", JSON.stringify(details));
    form.append("title", title);
    form.append("status", status);
    if (image) form.append("image", image.blob, "photo.jpg");
    const t = withTimeout(60_000);
    setBusy("save");
    try {
      const data = await post<{ id: string }>("/api/marketing/campaigns", form, t.signal);
      setSaved({ id: data.id, for: result.generatedAt });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      t.done();
      setBusy(null);
    }
  }

  const analyzing = busy === "analyze";

  return (
    <div className="mk">
      <section className="mk-hero">
        <p className="eyebrow">MUA Marketing AI</p>
        <h2>Turn one photo into a week of bookings</h2>
        <p>
          Upload a bridal look, before/after or reel cover. Get captions, hashtags, SEO keywords, the best time to post
          and a 10-day content plan.
        </p>
        <Link className="mk-hist-link" href="/marketing/history">
          Saved campaigns →
        </Link>
      </section>

      {!aiReady ? (
        <div className="banner bad">
          AI is not set up yet. Ask your admin to add <span className="code">ANTHROPIC_API_KEY</span> on the server.
        </div>
      ) : null}

      <section className="panel mk-upload-panel">
        <div className="mk-step">
          <span>1</span>
          <h3>Upload a photo</h3>
        </div>

        <div className="mk-kinds" role="radiogroup" aria-label="Photo type">
          {(Object.keys(IMAGE_KINDS) as ImageKind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={details.imageKind === k}
              className="chip"
              aria-current={details.imageKind === k ? "true" : undefined}
              onClick={() => set("imageKind", k)}
            >
              {IMAGE_KINDS[k]}
            </button>
          ))}
        </div>

        {preview ? (
          <div className="mk-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt="Selected photo preview" />
            <div className="mk-preview-acts">
              <button type="button" className="act" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
                Change photo
              </button>
              <button type="button" className="act" onClick={clearImage} disabled={Boolean(busy)}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            className={dragging ? "mk-drop on" : "mk-drop"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
          >
            <span className="mk-drop-icon" aria-hidden="true">
              ✦
            </span>
            <strong>Upload Photo</strong>
            <small>Tap to choose, or drop a JPG, PNG or WebP (up to 15 MB)</small>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mk-file"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
        )}
        {preview ? (
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mk-file"
            onChange={(e) => pick(e.target.files?.[0])}
            aria-label="Choose another photo"
          />
        ) : null}
        {imageNote ? <p className="hint mk-note">{imageNote}</p> : null}

        <details className="mk-details">
          <summary>
            <span className="mk-step">
              <span>2</span>
              <h3>Add details (optional)</h3>
            </span>
            <small>Better details = better local SEO</small>
          </summary>
          <div className="grid">
            <div className="fld">
              <label htmlFor="mk-makeup">Makeup type</label>
              <input
                id="mk-makeup"
                value={details.makeupType}
                onChange={(e) => set("makeupType", e.target.value)}
                placeholder="HD, airbrush, soft glam…"
                maxLength={120}
              />
            </div>
            <div className="fld">
              <label htmlFor="mk-occasion">Occasion</label>
              <select id="mk-occasion" value={details.occasion} onChange={(e) => set("occasion", e.target.value as CampaignDetails["occasion"])}>
                <option value="">Not set</option>
                {Object.entries(OCCASIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label htmlFor="mk-location">Location / city</label>
              <input
                id="mk-location"
                list="mk-cities"
                value={details.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Jaipur"
                maxLength={80}
              />
            </div>
            <div className="fld">
              <label htmlFor="mk-destination">Wedding destination</label>
              <input
                id="mk-destination"
                list="mk-cities"
                value={details.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder="Udaipur, Goa, Dubai…"
                maxLength={80}
              />
            </div>
            <datalist id="mk-cities">
              {LOCATION_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="fld">
              <label htmlFor="mk-brand">Brand name</label>
              <input id="mk-brand" value={details.brandName} onChange={(e) => set("brandName", e.target.value)} maxLength={80} />
            </div>
            <div className="fld">
              <label htmlFor="mk-insta">Instagram handle</label>
              <input
                id="mk-insta"
                value={details.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="@yourstudio"
                autoCapitalize="none"
                autoComplete="off"
                maxLength={40}
              />
            </div>
            <div className="fld">
              <label htmlFor="mk-audience">Target audience</label>
              <input
                id="mk-audience"
                value={details.audience}
                onChange={(e) => set("audience", e.target.value)}
                placeholder="Brides getting married this season"
                maxLength={160}
              />
            </div>
            <div className="fld">
              <label htmlFor="mk-tone">Tone</label>
              <select id="mk-tone" value={details.tone} onChange={(e) => set("tone", e.target.value as CampaignDetails["tone"])}>
                <option value="">Let AI choose</option>
                {Object.entries(TONES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld full">
              <label htmlFor="mk-offer">Offer / service</label>
              <input
                id="mk-offer"
                value={details.offer}
                onChange={(e) => set("offer", e.target.value)}
                placeholder="Bridal package with free trial for 2026 weddings"
                maxLength={200}
              />
            </div>
          </div>
        </details>

        <div className="mk-analyze">
          <button type="button" className="btn primary mk-go" onClick={analyze} disabled={!aiReady || Boolean(busy)}>
            {analyzing ? "Analyzing…" : result ? "Analyze again" : "Analyze Content"}
          </button>
          {!image && !analyzing ? <small>Upload a photo to start.</small> : null}
        </div>

        {analyzing ? (
          <div className="mk-progress" role="status">
            <span className="mk-spinner" aria-hidden="true" />
            <span>{PROGRESS[progress]}</span>
            <small>This usually takes under a minute.</small>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="banner bad" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? <div className="banner info">{notice}</div> : null}

      {result ? (
        <div ref={resultsRef} className="mk-results-wrap">
          {result.sample ? (
            <div className="banner">Sample output (developer mode). This is not a real AI analysis.</div>
          ) : null}

          <div className="mk-toolbar panel">
            <strong>One-click actions</strong>
            <div className="mk-toolbar-acts">
              {aiReady
                ? (Object.keys(SECTIONS) as Section[]).map((s) => (
                    <button key={s} type="button" className="act hot" disabled={Boolean(busy)} onClick={() => generate(s)}>
                      {busy === s ? "Generating…" : SECTIONS[s]}
                    </button>
                  ))
                : null}
              <CopyButton text={result.captions.main} label="Copy Caption" />
              <CopyButton text={hashtagsText(allHashtags(result))} label="Copy Hashtags" />
              <CopyButton text={keywordsText(allKeywords(result))} label="Copy Keywords" />
              <button type="button" className="act" onClick={() => downloadCalendar(result)}>
                Download Calendar
              </button>
            </div>
          </div>

          <ResultCards result={result} onGenerate={aiReady ? generate : undefined} busy={busy === "save" ? null : busy} />

          <section className="panel mk-save">
            <div className="mk-step">
              <span>3</span>
              <h3>Save this campaign</h3>
            </div>
            <div className="grid">
              <div className="fld">
                <label htmlFor="mk-title">Campaign name</label>
                <input id="mk-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Soft glam bride, Jaipur" />
              </div>
              <div className="fld">
                <label htmlFor="mk-status">Status</label>
                <select id="mk-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.entries(CAMPAIGN_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              {saved && !unsaved ? (
                <Link className="btn" href={`/marketing/${saved.id}`}>
                  Saved ✓ View campaign
                </Link>
              ) : null}
              <button type="button" className="btn primary" onClick={save} disabled={Boolean(busy) || !unsaved}>
                {busy === "save" ? "Saving…" : saved && !unsaved ? "Saved" : "Save campaign"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
