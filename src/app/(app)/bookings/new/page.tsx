import Link from "next/link";
import { BookingForm } from "@/components/Forms";
import { requireStudio } from "@/lib/auth";
import type { Booking, Lead } from "@/lib/types";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; error?: string }>;
}) {
  const { lead, error } = await searchParams;
  const { supabase, studio } = await requireStudio();

  let prefill: Partial<Booking> | undefined;
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
        client: l.name ?? "",
        phone: l.phone,
        insta: l.insta,
        source: l.source,
        kind: l.kind === "student" ? "bride" : l.kind,
        status: "enquiry",
        service: l.service,
        event_date: l.event_date,
        event_time: l.event_time,
        venue: l.venue,
        notes: l.summary,
      };
    }
  }

  const { data: members } = await supabase
    .from("studio_members")
    .select("user_id")
    .eq("studio_id", studio.id);
  const teamMembers = (members ?? []).map((m) => ({ user_id: m.user_id }));

  return (
    <>
      <div>
        <Link className="back" href={lead ? "/inbox" : "/bookings"}>
          &larr; Back
        </Link>
        <h2>{prefill ? "Booking from message" : "New booking"}</h2>
        {prefill ? (
          <p className="hint">Details were read from the message. Check them, fix anything that is wrong, then save.</p>
        ) : null}
      </div>
      {error ? <div className="banner bad" style={{ marginTop: 0 }}>{error}</div> : null}
      <BookingForm booking={prefill} leadId={prefill ? lead : undefined} teamMembers={teamMembers} />
    </>
  );
}
