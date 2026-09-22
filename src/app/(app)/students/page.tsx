import Link from "next/link";
import { StudentRow } from "@/components/Rows";
import { getTemplates, requireStudio } from "@/lib/auth";
import { SOURCES, SRC_SHORT, balanceOfStudent } from "@/lib/types";
import type { Student } from "@/lib/types";

const FILTERS: [string, string][] = [
  ["active", "Active"],
  ["due", "Fees due"],
  ["completed", "Completed"],
  ["all", "All"],
];

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string; src?: string }>;
}) {
  const sp = await searchParams;
  const f = FILTERS.some(([k]) => k === sp.f) ? (sp.f as string) : "active";
  const q = (sp.q ?? "").trim().toLowerCase();
  const src = sp.src && sp.src in SOURCES ? sp.src : "";

  const { supabase, studio } = await requireStudio();
  const templates = await getTemplates(supabase, studio.id);
  const { data } = await supabase.from("students").select("*").eq("studio_id", studio.id).limit(2000);

  let list = ((data ?? []) as Student[]).filter((s) => {
    if (f === "active") return s.status === "active";
    if (f === "due") return balanceOfStudent(s) > 0;
    if (f === "completed") return s.status === "completed";
    return true;
  });
  if (src) list = list.filter((s) => s.source === src);
  if (q) {
    list = list.filter((s) =>
      [s.name, s.phone, s.insta, s.course, s.batch, s.notes].join(" ").toLowerCase().includes(q),
    );
  }
  list.sort((a, b) => a.name.localeCompare(b.name));

  const href = (nf: string) => `/students?f=${nf}${q ? `&q=${encodeURIComponent(q)}` : ""}${src ? `&src=${src}` : ""}`;

  return (
    <>
      <div className="tools">
        <div className="chips">
          {FILTERS.map(([k, label]) => (
            <Link key={k} className="chip" href={href(k)} aria-current={f === k ? "true" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <form className="filters" method="get">
          <input type="hidden" name="f" value={f} />
          <input
            className="search"
            type="search"
            name="q"
            placeholder="Search name, phone, course"
            defaultValue={sp.q ?? ""}
            aria-label="Search students"
          />
          <select className="search src-filter" name="src" defaultValue={src} aria-label="Filter by source">
            <option value="">All sources</option>
            {Object.entries(SRC_SHORT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Filter
          </button>
        </form>
      </div>

      <div className="panel">
        <ul className="list">
          {list.length ? (
            list.map((s) => <StudentRow key={s.id} s={s} studioName={studio.name} templates={templates} />)
          ) : (
            <li className="empty">No students here yet. Tap + New student.</li>
          )}
        </ul>
      </div>

      <Link className="fab" href="/students/new">
        + New student
      </Link>
    </>
  );
}
