import Link from "next/link";
import { StudentForm } from "@/components/Forms";
import { requireStudio } from "@/lib/auth";
import type { Lead, Student } from "@/lib/types";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; error?: string }>;
}) {
  const { lead, error } = await searchParams;
  const { supabase, studio } = await requireStudio();

  let prefill: Partial<Student> | undefined;
  if (lead) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead)
      .eq("studio_id", studio.id)
      .maybeSingle();
    const l = data as Lead | null;
    if (l) {
      prefill = {
        name: l.name ?? "",
        phone: l.phone,
        insta: l.insta,
        source: l.source,
        course: "Basic",
        status: "active",
        notes: l.summary,
      };
    }
  }

  return (
    <>
      <div>
        <Link className="back" href={lead ? "/inbox" : "/students"}>
          &larr; Back
        </Link>
        <h2>{prefill ? "Student from message" : "New student"}</h2>
        {prefill ? (
          <p className="hint">Details were read from the message. Check them, fix anything that is wrong, then save.</p>
        ) : null}
      </div>
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}
      <StudentForm student={prefill} leadId={prefill ? lead : undefined} />
    </>
  );
}
