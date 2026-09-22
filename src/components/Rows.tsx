import Link from "next/link";
import WaLink from "@/components/WaLink";
import { dayDiff, fmtDate, fmtTime, initials, inr, timeAgo } from "@/lib/format";
import { bookingVars, igLink, renderTemplate, studentVars, waLink } from "@/lib/messages";
import {
  BSTATUS,
  KINDS,
  LSTATUS,
  SRC_SHORT,
  SSTATUS,
  balanceOfBooking,
  balanceOfStudent,
} from "@/lib/types";
import type { Booking, Lead, Student } from "@/lib/types";

type Templates = Record<string, string>;

function SourceTag({ source }: { source: keyof typeof SRC_SHORT | null }) {
  return source && SRC_SHORT[source] ? <span className="tag src">{SRC_SHORT[source]}</span> : null;
}

export function BookingRow({
  b,
  studioName,
  templates,
  clash,
}: {
  b: Booking;
  studioName: string;
  templates: Templates;
  clash?: boolean;
}) {
  const n = dayDiff(b.event_date);
  const d = b.event_date ? new Date(b.event_date + "T00:00:00Z") : null;
  const cls = n === 0 ? "today" : n !== null && n > 0 && n <= 7 ? "soon" : "";
  const bal = balanceOfBooking(b);
  const sub = [b.service || KINDS[b.kind], fmtTime(b.event_time), b.venue].filter(Boolean).join(" · ");
  const live = b.status === "enquiry" || b.status === "confirmed";
  const vars = bookingVars(b, studioName);

  let primary: { href: string; label: string; hot?: boolean; confirmId?: string } | null = null;
  let pending = false;
  if (live) {
    let body = templates.reminder ?? "";
    let label = "WhatsApp reminder";
    let hot = false;
    let confirmId: string | undefined;
    if (b.status === "enquiry") {
      body = templates.enquiry_reply ?? "";
      label = "Reply on WhatsApp";
    } else if (!b.confirmation_sent) {
      body = templates.confirmation ?? "";
      label = "Send confirmation";
      hot = true;
      confirmId = b.id;
      pending = n !== null && n >= 0;
    }
    const href = waLink(b.phone, renderTemplate(body, vars));
    if (href) primary = { href, label, hot, confirmId };
  }
  const ig = live ? igLink(b.insta) : null;
  const hasActions = Boolean(primary || ig);

  return (
    <li className={"row" + (hasActions ? "" : " noact")}>
      <Link className="row-main" href={`/bookings/${b.id}`}>
        <span className={"badge " + cls}>
          <span>
            <b>{d ? d.getUTCDate() : "–"}</b>
            <i>{d ? d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }) : ""}</i>
          </span>
        </span>
        <span className="txt">
          <strong>
            {b.client}
            <SourceTag source={b.source} />
            {pending ? <span className="tag clash">Confirmation pending</span> : null}
            {clash ? (
              <span className="tag clash" title="Another booking is close to this time">
                Clash
              </span>
            ) : null}
          </strong>
          {sub ? <small>{sub}</small> : null}
        </span>
        <span className="meta">
          <span className={"pill s-" + b.status}>{BSTATUS[b.status]}</span>
          {b.status === "cancelled" || b.status === "done" ? null : bal > 0 ? (
            <span className="bal due">{inr(bal)} due</span>
          ) : Number(b.total) > 0 ? (
            <span className="bal ok">Paid</span>
          ) : null}
        </span>
      </Link>
      {hasActions ? (
        <div className="acts">
          {primary ? <WaLink {...primary} /> : null}
          {ig ? (
            <a className="act" href={ig} target="_blank" rel="noopener noreferrer">
              Instagram DM
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function StudentRow({
  s,
  studioName,
  templates,
}: {
  s: Student;
  studioName: string;
  templates: Templates;
}) {
  const bal = balanceOfStudent(s);
  const fee = Number(s.fee) || 0;
  const pct = fee > 0 ? Math.min(100, Math.round((Number(s.paid) / fee) * 100)) : 0;
  const sub = [s.course ? `${s.course} course` : "", s.batch, s.start_date ? `from ${fmtDate(s.start_date)}` : ""]
    .filter(Boolean)
    .join(" · ");
  const wa = bal > 0 ? waLink(s.phone, renderTemplate(templates.student_fee ?? "", studentVars(s, studioName))) : null;
  const ig = s.status !== "left" ? igLink(s.insta) : null;
  const hasActions = Boolean(wa || ig);

  return (
    <li className={"row" + (hasActions ? "" : " noact")}>
      <Link className="row-main" href={`/students/${s.id}`}>
        <span className="badge init">{initials(s.name)}</span>
        <span className="txt">
          <strong>
            {s.name}
            <SourceTag source={s.source} />
          </strong>
          {sub ? <small>{sub}</small> : null}
          {fee > 0 ? (
            <span className="bar" role="img" aria-label={`${pct}% of fees paid`}>
              <i style={{ width: `${pct}%` }} />
            </span>
          ) : null}
        </span>
        <span className="meta">
          <span className={"pill s-" + s.status}>{SSTATUS[s.status]}</span>
          {s.status === "left" ? null : bal > 0 ? (
            <span className="bal due">{inr(bal)} due</span>
          ) : fee > 0 ? (
            <span className="bal ok">Fees paid</span>
          ) : null}
        </span>
      </Link>
      {hasActions ? (
        <div className="acts">
          {wa ? <WaLink href={wa} label="WhatsApp reminder" /> : null}
          {ig ? (
            <a className="act" href={ig} target="_blank" rel="noopener noreferrer">
              Instagram DM
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function LeadRow({
  l,
  dismiss,
}: {
  l: Lead;
  dismiss: (fd: FormData) => Promise<void>;
}) {
  const isNew = l.status === "new";
  const student = l.kind === "student";
  const chips = [l.event_date ? fmtDate(l.event_date) : "", fmtTime(l.event_time), l.service, l.venue].filter(Boolean);
  const ig = isNew ? igLink(l.insta) : null;
  const wa = isNew ? waLink(l.phone, `Hi ${(l.name ?? "").split(" ")[0] || "there"}, thank you for your enquiry!`) : null;

  return (
    <li className="row">
      <div className="lead">
        <div className="lead-top">
          <strong>{l.name || "Unnamed"}</strong>
          <SourceTag source={l.source} />
          {student ? <span className="tag">Student</span> : null}
          {!isNew ? (
            <span className="pill">{LSTATUS[l.status as keyof typeof LSTATUS] || l.status}</span>
          ) : null}
          <span className="ago">{timeAgo(l.created_at)}</span>
        </div>
        {chips.length ? (
          <div className="chipsx">
            {chips.map((c) => (
              <span key={c} className="tag chipx">
                {c}
              </span>
            ))}
          </div>
        ) : null}
        <details className="quote">
          <summary>{l.summary || "Message"}</summary>
          <p>{l.message}</p>
        </details>
        {isNew ? (
          <div className="acts">
            <Link className="act hot" href={`${student ? "/students" : "/bookings"}/new?lead=${l.id}`}>
              {student ? "Convert to student" : "Convert to booking"}
            </Link>
            {ig ? (
              <a className="act" href={ig} target="_blank" rel="noopener noreferrer">
                Instagram DM
              </a>
            ) : null}
            {wa ? (
              <a className="act" href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
            <form action={dismiss} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={l.id} />
              <button className="act" type="submit">
                Dismiss
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </li>
  );
}
