import { saveBooking, saveStudent } from "@/app/(app)/actions";
import { BSTATUS, COURSES, KINDS, SOURCES, SSTATUS } from "@/lib/types";
import type { Booking, Student } from "@/lib/types";

function Opts({ map, blank }: { map: Record<string, string>; blank?: string }) {
  return (
    <>
      {blank !== undefined ? <option value="">{blank}</option> : null}
      {Object.entries(map).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}

const timeValue = (t?: string | null) => (t ? t.slice(0, 5) : "");

interface TeamMember {
  user_id: string;
  name?: string;
}

export function BookingForm({
  booking,
  leadId,
  teamMembers,
}: {
  booking?: Partial<Booking>;
  leadId?: string;
  teamMembers?: TeamMember[];
}) {
  const isNew = !booking?.id;
  return (
    <form action={saveBooking} className="form panel">
      {booking?.id ? <input type="hidden" name="id" value={booking.id} /> : null}
      {leadId ? <input type="hidden" name="lead_id" value={leadId} /> : null}
      <div className="grid">
        <div className="fld">
          <label htmlFor="client">Client name</label>
          <input id="client" name="client" required autoComplete="off" defaultValue={booking?.client ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="phone">Phone / WhatsApp</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={booking?.phone ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="source">How did they reach you?</label>
          <select id="source" name="source" defaultValue={booking?.source ?? ""}>
            <Opts map={SOURCES} blank="Not set" />
          </select>
        </div>
        {teamMembers && teamMembers.length > 0 ? (
          <div className="fld">
            <label htmlFor="assigned_to">Assigned to</label>
            <select id="assigned_to" name="assigned_to" defaultValue={booking?.assigned_to ?? ""}>
              <option value="">Not assigned</option>
              {teamMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name || "Team member"}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="fld">
          <label htmlFor="insta">Instagram handle</label>
          <input
            id="insta"
            name="insta"
            placeholder="@username"
            autoCapitalize="none"
            autoComplete="off"
            defaultValue={booking?.insta ?? ""}
          />
        </div>
        <div className="fld">
          <label htmlFor="kind">Type</label>
          <select id="kind" name="kind" defaultValue={booking?.kind ?? "bride"}>
            <Opts map={KINDS} />
          </select>
        </div>
        <div className="fld">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={booking?.status ?? "enquiry"}>
            <Opts map={BSTATUS} />
          </select>
        </div>
        <div className="fld full">
          <label htmlFor="service">Service</label>
          <input id="service" name="service" placeholder="HD bridal + hairstyle" defaultValue={booking?.service ?? ""} />
        </div>
        <div className="fld full check">
          <label htmlFor="confirmation_sent">
            <input
              id="confirmation_sent"
              name="confirmation_sent"
              type="checkbox"
              defaultChecked={Boolean(booking?.confirmation_sent)}
            />
            Confirmation sent on WhatsApp
          </label>
        </div>
        <div className="fld">
          <label htmlFor="event_date">Date</label>
          <input id="event_date" name="event_date" type="date" defaultValue={booking?.event_date ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="event_time">Time</label>
          <input id="event_time" name="event_time" type="time" defaultValue={timeValue(booking?.event_time)} />
        </div>
        <div className="fld">
          <label htmlFor="trial_date">Trial date (optional)</label>
          <input id="trial_date" name="trial_date" type="date" defaultValue={booking?.trial_date ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="venue">Venue / address</label>
          <input id="venue" name="venue" defaultValue={booking?.venue ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="total">Total (&#8377;)</label>
          <input
            id="total"
            name="total"
            type="number"
            min="0"
            step="any"
            inputMode="numeric"
            defaultValue={booking?.total ? String(booking.total) : ""}
          />
        </div>
        {isNew ? (
          <div className="fld">
            <label htmlFor="advance">Advance received (&#8377;)</label>
            <input id="advance" name="advance" type="number" min="0" step="any" inputMode="numeric" />
          </div>
        ) : null}
        <div className="fld full">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Skin type, number of guests to do, hairstyle references"
            defaultValue={booking?.notes ?? ""}
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn primary" type="submit">
          {isNew ? "Save booking" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function StudentForm({
  student,
  leadId,
}: {
  student?: Partial<Student>;
  leadId?: string;
}) {
  const isNew = !student?.id;
  const courses: Record<string, string> = Object.fromEntries(COURSES.map((c) => [c, c]));
  if (student?.course && !courses[student.course]) courses[student.course] = student.course;
  return (
    <form action={saveStudent} className="form panel">
      {student?.id ? <input type="hidden" name="id" value={student.id} /> : null}
      {leadId ? <input type="hidden" name="lead_id" value={leadId} /> : null}
      <div className="grid">
        <div className="fld">
          <label htmlFor="name">Student name</label>
          <input id="name" name="name" required autoComplete="off" defaultValue={student?.name ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="phone">Phone / WhatsApp</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={student?.phone ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="source">How did they reach you?</label>
          <select id="source" name="source" defaultValue={student?.source ?? ""}>
            <Opts map={SOURCES} blank="Not set" />
          </select>
        </div>
        <div className="fld">
          <label htmlFor="insta">Instagram handle</label>
          <input
            id="insta"
            name="insta"
            placeholder="@username"
            autoCapitalize="none"
            autoComplete="off"
            defaultValue={student?.insta ?? ""}
          />
        </div>
        <div className="fld">
          <label htmlFor="course">Course</label>
          <select id="course" name="course" defaultValue={student?.course ?? "Basic"}>
            <Opts map={courses} />
          </select>
        </div>
        <div className="fld">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={student?.status ?? "active"}>
            <Opts map={SSTATUS} />
          </select>
        </div>
        <div className="fld">
          <label htmlFor="batch">Batch / timing</label>
          <input id="batch" name="batch" placeholder="Morning, Mon-Sat" defaultValue={student?.batch ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="start_date">Start date</label>
          <input id="start_date" name="start_date" type="date" defaultValue={student?.start_date ?? ""} />
        </div>
        <div className="fld">
          <label htmlFor="fee">Total fee (&#8377;)</label>
          <input
            id="fee"
            name="fee"
            type="number"
            min="0"
            step="any"
            inputMode="numeric"
            defaultValue={student?.fee ? String(student.fee) : ""}
          />
        </div>
        {isNew ? (
          <div className="fld">
            <label htmlFor="advance">Paid at admission (&#8377;)</label>
            <input id="advance" name="advance" type="number" min="0" step="any" inputMode="numeric" />
          </div>
        ) : null}
        <div className="fld full">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Attendance, kit given, certificate status"
            defaultValue={student?.notes ?? ""}
          />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn primary" type="submit">
          {isNew ? "Save student" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
