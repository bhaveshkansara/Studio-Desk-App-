"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudio } from "@/lib/auth";
import { aiEnabled, extractLead } from "@/lib/ai";
import { todayISO } from "@/lib/format";
import { DEFAULT_TEMPLATES, cleanHandle } from "@/lib/messages";
import { BSTATUS, KINDS, LEAD_KINDS, SOURCES, SSTATUS } from "@/lib/types";
import type { BookingStatus, Kind, LeadKind, Source, StudentStatus } from "@/lib/types";

const enc = encodeURIComponent;

/** Adds query parameters to a path that may already have some. */
function to(path: string, params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return path.includes("?") ? `${path}&${q}` : `${path}?${q}`;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function money(fd: FormData, key: string): number {
  const n = Number(String(fd.get(key) ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

const dateOrNull = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const timeOrNull = (v: string | null) => (v && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : null);

function pick<T extends string>(v: string | null, allowed: Record<T, string>): T | null {
  return v && Object.prototype.hasOwnProperty.call(allowed, v) ? (v as T) : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ bookings
export async function saveBooking(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  const leadId = str(fd, "lead_id");
  const back = id ? `/bookings/${id}` : leadId ? `/bookings/new?lead=${leadId}` : "/bookings/new";

  const client = str(fd, "client");
  if (!client) redirect(to(back, { error: "Enter the client's name." }));

  const rec = {
    client,
    phone: str(fd, "phone"),
    insta: cleanHandle(str(fd, "insta")),
    source: pick<Source>(str(fd, "source"), SOURCES),
    kind: pick<Kind>(str(fd, "kind"), KINDS) ?? "bride",
    status: pick<BookingStatus>(str(fd, "status"), BSTATUS) ?? "enquiry",
    service: str(fd, "service"),
    event_date: dateOrNull(str(fd, "event_date")),
    event_time: timeOrNull(str(fd, "event_time")),
    trial_date: dateOrNull(str(fd, "trial_date")),
    venue: str(fd, "venue"),
    total: money(fd, "total"),
    confirmation_sent: fd.get("confirmation_sent") === "on",
    notes: str(fd, "notes"),
    assigned_to: str(fd, "assigned_to") || null,
  };

  if (id) {
    const { error } = await supabase.from("bookings").update(rec).eq("id", id).eq("studio_id", studio.id);
    if (error) redirect(to(back, { error: error.message }));
    refresh();
    redirect(`/bookings/${id}?saved=1`);
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...rec, studio_id: studio.id })
    .select("id")
    .single();
  if (error || !data) redirect(to(back, { error: error?.message ?? "Could not save the booking." }));

  const advance = money(fd, "advance");
  if (advance > 0) {
    await supabase
      .from("payments")
      .insert({ studio_id: studio.id, booking_id: data.id, amount: advance, note: "Advance" });
  }
  if (leadId) {
    await supabase.from("leads").update({ status: "confirmed", booking_id: data.id }).eq("id", leadId).eq("studio_id", studio.id);
  }
  refresh();
  redirect(`/bookings/${data.id}`);
}

export async function deleteBooking(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  if (id) await supabase.from("bookings").delete().eq("id", id).eq("studio_id", studio.id);
  refresh();
  redirect("/bookings");
}

export async function markConfirmationSent(id: string) {
  const { supabase, studio } = await requireStudio();
  await supabase.from("bookings").update({ confirmation_sent: true }).eq("id", id).eq("studio_id", studio.id);
  refresh();
}

// ------------------------------------------------------------------ students
export async function saveStudent(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  const leadId = str(fd, "lead_id");
  const back = id ? `/students/${id}` : leadId ? `/students/new?lead=${leadId}` : "/students/new";

  const name = str(fd, "name");
  if (!name) redirect(to(back, { error: "Enter the student's name." }));

  const rec = {
    name,
    phone: str(fd, "phone"),
    insta: cleanHandle(str(fd, "insta")),
    source: pick<Source>(str(fd, "source"), SOURCES),
    course: str(fd, "course") ?? "Basic",
    status: pick<StudentStatus>(str(fd, "status"), SSTATUS) ?? "active",
    batch: str(fd, "batch"),
    start_date: dateOrNull(str(fd, "start_date")),
    fee: money(fd, "fee"),
    notes: str(fd, "notes"),
  };

  if (id) {
    const { error } = await supabase.from("students").update(rec).eq("id", id).eq("studio_id", studio.id);
    if (error) redirect(to(back, { error: error.message }));
    refresh();
    redirect(`/students/${id}?saved=1`);
  }

  const { data, error } = await supabase
    .from("students")
    .insert({ ...rec, studio_id: studio.id })
    .select("id")
    .single();
  if (error || !data) redirect(to(back, { error: error?.message ?? "Could not save the student." }));

  const advance = money(fd, "advance");
  if (advance > 0) {
    await supabase
      .from("payments")
      .insert({ studio_id: studio.id, student_id: data.id, amount: advance, note: "Admission payment" });
  }
  if (leadId) {
    await supabase.from("leads").update({ status: "completed" }).eq("id", leadId).eq("studio_id", studio.id);
  }
  refresh();
  redirect(`/students/${data.id}`);
}

export async function deleteStudent(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  if (id) await supabase.from("students").delete().eq("id", id).eq("studio_id", studio.id);
  refresh();
  redirect("/students");
}

// ------------------------------------------------------------------ payments
export async function addPayment(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const bookingId = str(fd, "booking_id");
  const studentId = str(fd, "student_id");
  const back = bookingId ? `/bookings/${bookingId}` : `/students/${studentId}`;
  const amount = money(fd, "amount");
  if ((!bookingId && !studentId) || amount <= 0) {
    redirect(`${back}?error=${enc("Enter the amount received.")}`);
  }
  const { error } = await supabase.from("payments").insert({
    studio_id: studio.id,
    booking_id: bookingId,
    student_id: bookingId ? null : studentId,
    amount,
    note: str(fd, "note"),
  });
  if (error) redirect(`${back}?error=${enc(error.message)}`);
  refresh();
  redirect(`${back}?saved=1`);
}

export async function deletePayment(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  const back = str(fd, "back") ?? "/today";
  if (id) await supabase.from("payments").delete().eq("id", id).eq("studio_id", studio.id);
  refresh();
  redirect(back);
}

// --------------------------------------------------------------------- inbox
export async function addLead(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const message = str(fd, "message");
  if (!message) redirect(`/inbox?error=${enc("Paste a message first.")}`);

  const lead: Record<string, unknown> = {
    studio_id: studio.id,
    name: null,
    phone: null,
    insta: cleanHandle(str(fd, "handle")),
    source: pick<Source>(str(fd, "source"), SOURCES) ?? "instagram",
    kind: "bride",
    service: null,
    event_date: null,
    event_time: null,
    venue: null,
    summary: message.replace(/\s+/g, " ").slice(0, 120),
    message: message.slice(0, 4000),
    status: "new",
  };

  let notice = "Added to your Inbox.";
  if (str(fd, "mode") === "ai") {
    if (!aiEnabled()) {
      notice = "AI reading is not set up yet, so the message was saved as it is.";
    } else {
      try {
        const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long" }).format(
          new Date(),
        );
        const ex = await extractLead(message, todayISO(), weekday);
        if (ex) {
          const phone = ex.phone.replace(/\D/g, "");
          lead.name = ex.name.trim().slice(0, 80) || null;
          lead.phone = phone.length >= 10 ? phone.slice(-12) : null;
          lead.insta = lead.insta ?? cleanHandle(ex.instagram);
          lead.kind = pick<LeadKind>(ex.kind, LEAD_KINDS) ?? "bride";
          lead.service = ex.service.trim().slice(0, 80) || null;
          lead.event_date = dateOrNull(ex.date);
          lead.event_time = timeOrNull(ex.time);
          lead.venue = ex.venue.trim().slice(0, 100) || null;
          lead.summary = ex.summary.trim().slice(0, 140) || lead.summary;
        } else {
          notice = "Could not read that message, so it was saved as it is.";
        }
      } catch {
        notice = "Reading failed, so the message was saved as it is.";
      }
    }
  }

  const { error } = await supabase.from("leads").insert(lead);
  if (error) redirect(`/inbox?error=${enc(error.message)}`);
  refresh();
  redirect(`/inbox?notice=${enc(notice)}`);
}

export async function dismissLead(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  if (id) await supabase.from("leads").update({ status: "dismissed" }).eq("id", id).eq("studio_id", studio.id);
  refresh();
  redirect("/inbox");
}

export async function updateLeadStatus(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || !status) return;

  const updates: Record<string, unknown> = { status };
  if (status === "contacted" && !str(fd, "contacted_at")) {
    updates.contacted_at = new Date().toISOString();
  }

  await supabase.from("leads").update(updates).eq("id", id).eq("studio_id", studio.id);
  refresh();
}

// ------------------------------------------------------------------ team
export async function removeTeamMember(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const userId = str(fd, "user_id");
  if (userId) {
    await supabase
      .from("studio_members")
      .delete()
      .eq("studio_id", studio.id)
      .eq("user_id", userId);
  }
  refresh();
  redirect("/team");
}

export async function updateMemberPermissions(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const userId = str(fd, "user_id");
  const role = str(fd, "role") || "staff";

  if (!userId) return;

  const updates: Record<string, unknown> = { role };
  if (role === "owner") {
    updates.can_manage_team = true;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = true;
    updates.can_manage_settings = true;
  } else if (role === "manager") {
    updates.can_manage_team = false;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = true;
    updates.can_manage_settings = false;
  } else {
    updates.can_manage_team = false;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = false;
    updates.can_manage_settings = false;
  }

  await supabase
    .from("studio_members")
    .update(updates)
    .eq("studio_id", studio.id)
    .eq("user_id", userId);

  refresh();
  redirect("/team/permissions?saved=1");
}

// Add team staff member directly
export async function addTeamStaff(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const name = str(fd, "name");
  const role = str(fd, "role") || "staff";

  if (!name) redirect("/team?error=" + enc("Enter team member name"));

  const permissions: Record<string, unknown> = {};
  if (role === "owner") {
    permissions.can_manage_team = true;
    permissions.can_manage_bookings = true;
    permissions.can_manage_payments = true;
    permissions.can_manage_settings = true;
  } else if (role === "manager") {
    permissions.can_manage_bookings = true;
    permissions.can_manage_payments = true;
  } else {
    permissions.can_manage_bookings = true;
  }

  const { error } = await supabase.from("team_staff").insert({
    studio_id: studio.id,
    name,
    role,
    ...permissions,
  });

  if (error) redirect("/team?error=" + enc(error.message));
  refresh();
  redirect("/team?saved=1");
}

// Update team staff
export async function updateTeamStaff(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const role = str(fd, "role") || "staff";
  const status = str(fd, "status") || "active";

  if (!id || !name) return;

  const updates: Record<string, unknown> = { name, role, status };
  if (role === "owner") {
    updates.can_manage_team = true;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = true;
    updates.can_manage_settings = true;
  } else if (role === "manager") {
    updates.can_manage_team = false;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = true;
    updates.can_manage_settings = false;
  } else {
    updates.can_manage_team = false;
    updates.can_manage_bookings = true;
    updates.can_manage_payments = false;
    updates.can_manage_settings = false;
  }

  await supabase.from("team_staff").update(updates).eq("id", id).eq("studio_id", studio.id);
  refresh();
  redirect("/team?saved=1");
}

// Delete team staff
export async function deleteTeamStaff(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const id = str(fd, "id");
  if (id) {
    await supabase.from("team_staff").delete().eq("id", id).eq("studio_id", studio.id);
  }
  refresh();
  redirect("/team");
}

// ------------------------------------------------------------------ quotations
export async function generateQuotationDraft(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const leadId = str(fd, "lead_id");
  const bookingId = str(fd, "booking_id");
  const amount = money(fd, "amount");
  const autoGenerate = fd.get("auto_generate") === "on";
  const sendViaWhatsapp = fd.get("send_whatsapp") === "on";

  if (!amount) {
    redirect("/quotations?error=" + enc("Enter quotation amount"));
  }

  // Save to quotation_drafts table for tracking
  const { error: insertError } = await supabase
    .from("quotation_drafts")
    .insert({
      studio_id: studio.id,
      lead_id: leadId,
      booking_id: bookingId,
      amount,
      auto_generated: autoGenerate,
      sent_via_whatsapp: false,
      status: "draft",
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    redirect("/quotations?error=" + enc("Failed to save quotation draft"));
  }

  if (sendViaWhatsapp) {
    // Send via WhatsApp
    await sendQuotation(fd);
  } else {
    // Just save as draft, don't send
    refresh();
    redirect("/quotations?saved=Quotation saved as draft. Send anytime from pending quotations.");
  }
}

export async function sendQuotation(fd: FormData) {
  const { supabase, studio } = await requireStudio();

  // Get form values
  const client = str(fd, "client");
  const phone = str(fd, "phone");
  const service = str(fd, "service");
  const amount = money(fd, "amount");
  const event_date = str(fd, "event_date");
  const venue = str(fd, "venue");

  // Validate required fields
  if (!client || !phone || !service || !amount) {
    redirect("/quotations?error=Please%20fill%20all%20required%20fields");
  }

  try {
    // Try to get WhatsApp config
    let config: any = null;
    try {
      const { data } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("studio_id", studio.id)
        .maybeSingle();
      config = data;
    } catch (e) {
      // Table might not exist yet, continue anyway
    }

    // Build quotation message
    const advance = Math.round(amount * 0.3);
    const balance = amount - advance;

    const messageText = `Hi ${client},

Thank you for enquiring! 🎉

*SERVICE QUOTATION*

Service: ${service}
${event_date ? `Date: ${event_date}` : ""}
${venue ? `Venue: ${venue}` : ""}

*QUOTATION: ₹${amount}*

💳 Advance (30%): ₹${advance}
💳 Balance Due: ₹${balance}

Ready to confirm? Please reply. 💬`;

    // Try to send via WhatsApp if configured
    let sentViaWhatsapp = false;

    if (config?.is_configured && config?.api_token && config?.phone_number_id) {
      try {
        // Clean and format phone number
        let formattedPhone = phone.replace(/\D/g, "").trim();
        if (!formattedPhone) throw new Error("Invalid phone number");

        if (formattedPhone.startsWith("0")) {
          formattedPhone = formattedPhone.substring(1);
        }
        if (formattedPhone.length === 10) {
          formattedPhone = "91" + formattedPhone;
        } else if (!formattedPhone.startsWith("91")) {
          formattedPhone = "91" + formattedPhone;
        }

        // Send via WhatsApp
        const response = await fetch(
          `https://graph.instagram.com/v18.0/${config.phone_number_id}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.api_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: formattedPhone,
              type: "text",
              text: { body: messageText },
            }),
          }
        );

        if (response.ok) {
          sentViaWhatsapp = true;
        }
      } catch (error) {
        // WhatsApp send failed, but don't fail the whole operation
      }
    }

    // Redirect with appropriate message
    if (sentViaWhatsapp) {
      redirect("/quotations?success=Quotation%20sent%20via%20WhatsApp%20successfully!");
    } else if (config?.is_configured) {
      redirect("/quotations?success=Quotation%20created%20but%20WhatsApp%20send%20failed.%20Please%20try%20again.");
    } else {
      redirect("/quotations?success=Quotation%20created!%20Set%20up%20WhatsApp%20in%20Settings%20to%20send%20automatically.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    redirect(`/quotations?error=Error:%20${encodeURIComponent(message)}`);
  }
}

// ------------------------------------------------------------------ invoices
export async function sendInvoice(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const bookingId = str(fd, "booking_id");
  const client = str(fd, "client");
  const phone = str(fd, "phone");
  const service = str(fd, "service");
  const event_date = str(fd, "event_date");
  const total = money(fd, "total");
  const paid = money(fd, "paid");

  if (!client || !phone || !total) {
    redirect(to("/invoices", { error: "Fill all required fields" }));
  }

  // Get WhatsApp config
  const { data: config } = await supabase
    .from("whatsapp_config")
    .select("*")
    .eq("studio_id", studio.id)
    .maybeSingle();

  const balance = total - paid;

  // If WhatsApp is configured, send via WhatsApp
  if (config?.is_configured && config?.api_token && config?.phone_number_id) {
    try {
      const messageText = `Hi ${client},

*YOUR INVOICE* 📄

${service ? `Service: ${service}` : ""}
${event_date ? `Event Date: ${event_date}` : ""}

*TOTAL AMOUNT: ₹${total}*

✓ Advance Received: ₹${paid}
⏳ Balance Due: ₹${balance}

Payment Terms: Balance due on event day

*PROFESSIONAL SERVICES INCLUDE:*
✓ Professional Makeup
✓ Hairstyling
✓ Bridal Touch-ups

Thank you! 🙏`;

      // Format phone number
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.startsWith("0")) formattedPhone = formattedPhone.slice(1);
      if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;
      if (!formattedPhone.startsWith("91")) formattedPhone = "91" + formattedPhone;

      const waResponse = await fetch(
        `https://graph.instagram.com/v18.0/${config.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.api_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: { body: messageText },
          }),
        }
      );

      const waData = (await waResponse.json()) as any;

      if (!waResponse.ok) {
        redirect(
          to(bookingId ? `/bookings/${bookingId}` : "/invoices", {
            error: `WhatsApp error: ${waData?.error?.message || "Failed to send"}`,
          })
        );
      }
    } catch (error) {
      redirect(
        to(bookingId ? `/bookings/${bookingId}` : "/invoices", {
          error: `Failed to send: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      );
    }
  }

  // Redirect with success
  if (bookingId) {
    redirect(`/bookings/${bookingId}?saved=1&sent=invoice`);
  } else {
    redirect("/invoices?saved=1&sent=invoice");
  }
}

// ------------------------------------------------------------------ whatsapp
export async function saveWhatsAppConfig(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const apiToken = str(fd, "api_token");
  const phoneNumberId = str(fd, "phone_number_id");
  const businessAccountId = str(fd, "business_account_id");

  if (!apiToken || !phoneNumberId) {
    redirect("/settings/whatsapp?error=" + enc("Enter API token and phone number ID"));
  }

  const isConfigured = Boolean(apiToken && phoneNumberId);

  const { error } = await supabase.from("whatsapp_config").upsert({
    studio_id: studio.id,
    api_token: apiToken,
    phone_number_id: phoneNumberId,
    business_account_id: businessAccountId,
    is_configured: isConfigured,
    updated_at: new Date().toISOString(),
  });

  if (error) redirect("/settings/whatsapp?error=" + enc(error.message));
  refresh();
  redirect("/settings/whatsapp?saved=1");
}

// ------------------------------------------------------------------ settings
export async function saveSettings(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const name = str(fd, "studio_name");
  if (!name) redirect(`/settings?error=${enc("Enter your studio name.")}`);

  const { error } = await supabase
    .from("studios")
    .update({ name, phone: str(fd, "studio_phone") })
    .eq("id", studio.id);
  if (error) redirect(`/settings?error=${enc(error.message)}`);

  const rows = Object.keys(DEFAULT_TEMPLATES).map((key) => ({
    studio_id: studio.id,
    key,
    body: str(fd, `tpl_${key}`) ?? DEFAULT_TEMPLATES[key]!,
  }));
  const { error: tErr } = await supabase.from("message_templates").upsert(rows, { onConflict: "studio_id,key" });
  if (tErr) redirect(`/settings?error=${enc(tErr.message)}`);

  refresh();
  redirect("/settings?saved=1");
}

// ------------------------------------------------------------------ razorpay
export async function saveRazorpayConfig(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const apiKeyId = str(fd, "api_key_id");
  const apiKeySecret = str(fd, "api_key_secret");
  const isLiveMode = fd.get("is_live_mode") === "on";

  if (!apiKeyId || !apiKeySecret) {
    redirect("/settings/razorpay?error=" + enc("Enter both API Key ID and Secret"));
  }

  const isConfigured = Boolean(apiKeyId && apiKeySecret);

  const { error } = await supabase.from("razorpay_config").upsert({
    studio_id: studio.id,
    api_key_id: apiKeyId,
    api_key_secret: apiKeySecret,
    is_configured: isConfigured,
    is_live_mode: isLiveMode,
    updated_at: new Date().toISOString(),
  });

  if (error) redirect("/settings/razorpay?error=" + enc(error.message));
  refresh();
  redirect("/settings/razorpay?saved=1");
}

export async function createPaymentOrder(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const bookingId = str(fd, "booking_id");
  const amount = money(fd, "amount");
  const customerPhone = str(fd, "customer_phone");
  const customerEmail = str(fd, "customer_email");

  if (!bookingId || amount <= 0 || !customerPhone) {
    redirect("/payments?error=" + enc("Invalid payment details"));
  }

  const { data: config } = await supabase
    .from("razorpay_config")
    .select("*")
    .eq("studio_id", studio.id)
    .maybeSingle();

  if (!config?.is_configured) {
    redirect("/payments?error=" + enc("Razorpay not configured. Set it up in Settings."));
  }

  try {
    const { createRazorpayOrder } = await import("@/lib/razorpay");
    const result = await createRazorpayOrder(
      { api_key_id: config.api_key_id!, api_key_secret: config.api_key_secret! },
      {
        amount,
        customer_phone: customerPhone,
        customer_email: customerEmail || "noreply@studiodesk.app",
        description: `Payment for booking`,
        booking_id: bookingId,
      }
    );

    if (!result.success) {
      redirect("/payments?error=" + enc(result.error || "Failed to create payment order"));
    }

    const { error: insertError } = await supabase.from("payment_orders").insert({
      studio_id: studio.id,
      booking_id: bookingId,
      razorpay_order_id: result.order_id,
      amount,
      currency: "INR",
      status: "created",
      customer_phone: customerPhone,
      customer_email: customerEmail,
    });

    if (insertError) {
      redirect("/payments?error=" + enc(insertError.message));
    }

    refresh();
    redirect(`/payments/${result.order_id}/checkout`);
  } catch (error) {
    redirect("/payments?error=" + enc("Error creating payment order"));
  }
}

export async function verifyPayment(fd: FormData) {
  const { supabase, studio } = await requireStudio();
  const orderId = str(fd, "razorpay_order_id");
  const paymentId = str(fd, "razorpay_payment_id");
  const signature = str(fd, "razorpay_signature");

  if (!orderId || !paymentId || !signature) {
    redirect("/payments?error=" + enc("Invalid payment verification data"));
  }

  const { data: config } = await supabase
    .from("razorpay_config")
    .select("*")
    .eq("studio_id", studio.id)
    .maybeSingle();

  if (!config?.is_configured) {
    redirect("/payments?error=" + enc("Razorpay not configured"));
  }

  try {
    const { verifyRazorpaySignature } = await import("@/lib/razorpay");
    const isValid = verifyRazorpaySignature(
      { api_key_id: config.api_key_id!, api_key_secret: config.api_key_secret! },
      { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }
    );

    if (!isValid) {
      redirect("/payments?error=" + enc("Payment signature verification failed"));
    }

    const { data: order, error: fetchError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      redirect("/payments?error=" + enc("Order not found"));
    }

    const { error: updateError } = await supabase
      .from("payment_orders")
      .update({
        razorpay_payment_id: paymentId,
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      redirect("/payments?error=" + enc(updateError.message));
    }

    if (order.booking_id) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", order.booking_id)
        .maybeSingle();

      if (booking) {
        const newPaid = Number(booking.paid) + order.amount;
        const { error: paymentError } = await supabase.from("payments").insert({
          studio_id: studio.id,
          booking_id: order.booking_id,
          amount: order.amount,
          note: `Razorpay Payment - ${paymentId}`,
          paid_on: new Date().toISOString().split("T")[0],
        });

        if (!paymentError) {
          await supabase.from("analytics_events").insert({
            studio_id: studio.id,
            event_type: "payment_received",
            event_data: {
              booking_id: order.booking_id,
              amount: order.amount,
              payment_method: "razorpay",
            },
          });
        }
      }
    }

    refresh();
    redirect("/payments?success=Payment verified successfully");
  } catch (error) {
    redirect("/payments?error=" + enc("Error verifying payment"));
  }
}
