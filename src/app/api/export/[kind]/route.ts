import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";
import { todayISO, toCsv } from "@/lib/format";
import { BSTATUS, KINDS, SOURCES, SSTATUS, balanceOfBooking, balanceOfStudent } from "@/lib/types";
import type { Booking, Student } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const ctx = await getContext();
  if (!ctx?.studio) return new NextResponse("Sign in first.", { status: 401 });
  if (kind !== "bookings" && kind !== "students") return new NextResponse("Not found.", { status: 404 });

  let csv: string;
  if (kind === "bookings") {
    const { data } = await ctx.supabase
      .from("bookings")
      .select("*")
      .eq("studio_id", ctx.studio.id)
      .order("event_date", { ascending: true })
      .limit(20000);
    const rows = ((data ?? []) as Booking[]).map((b) => [
      b.client,
      b.phone,
      b.source ? SOURCES[b.source] : "",
      b.insta,
      b.confirmation_sent ? "Yes" : "No",
      KINDS[b.kind],
      b.service,
      b.event_date,
      b.event_time?.slice(0, 5),
      b.trial_date,
      b.venue,
      b.total,
      b.paid,
      balanceOfBooking(b),
      BSTATUS[b.status],
      b.notes,
    ]);
    csv = toCsv(
      [
        "Client",
        "Phone",
        "Source",
        "Instagram",
        "Confirmation sent",
        "Type",
        "Service",
        "Date",
        "Time",
        "Trial date",
        "Venue",
        "Total",
        "Received",
        "Balance",
        "Status",
        "Notes",
      ],
      rows,
    );
  } else {
    const { data } = await ctx.supabase
      .from("students")
      .select("*")
      .eq("studio_id", ctx.studio.id)
      .order("name", { ascending: true })
      .limit(20000);
    const rows = ((data ?? []) as Student[]).map((s) => [
      s.name,
      s.phone,
      s.source ? SOURCES[s.source] : "",
      s.insta,
      s.course,
      s.batch,
      s.start_date,
      s.fee,
      s.paid,
      balanceOfStudent(s),
      SSTATUS[s.status],
      s.notes,
    ]);
    csv = toCsv(
      ["Name", "Phone", "Source", "Instagram", "Course", "Batch", "Start date", "Total fee", "Paid", "Balance", "Status", "Notes"],
      rows,
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-${todayISO()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
