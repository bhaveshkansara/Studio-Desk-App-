// Scheduled reminder system for makeup artist bookings

import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "./whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ReminderSchedule {
  booking_id: string;
  client_name: string;
  phone: string;
  event_date: string;
  event_time: string;
  venue: string;
  service: string;
  balance_due: number;
}

export async function scheduleReminders(
  studioId: string,
  booking: ReminderSchedule
): Promise<void> {
  // Calculate dates for different reminder types
  const eventDate = new Date(booking.event_date);
  const threeDaysBefore = new Date(eventDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

  // Get current time
  const now = new Date();

  // Only schedule if event is in future
  if (eventDate <= now) return;

  try {
    // Schedule 3-day before reminder
    if (threeDaysBefore > now) {
      await supabase.from("scheduled_reminders").insert({
        studio_id: studioId,
        booking_id: booking.booking_id,
        reminder_type: "event_3days",
        scheduled_for: threeDaysBefore.toISOString(),
        status: "pending",
      });
    }

    // Schedule balance due reminder (1 day before)
    if (booking.balance_due > 0) {
      const balanceReminder = new Date(eventDate);
      balanceReminder.setDate(balanceReminder.getDate() - 1);

      if (balanceReminder > now) {
        await supabase.from("scheduled_reminders").insert({
          studio_id: studioId,
          booking_id: booking.booking_id,
          reminder_type: "balance_due",
          scheduled_for: balanceReminder.toISOString(),
          status: "pending",
        });
      }
    }

    // Schedule post-event review request (1 day after event)
    const reviewDate = new Date(eventDate);
    reviewDate.setDate(reviewDate.getDate() + 1);

    await supabase.from("scheduled_reminders").insert({
      studio_id: studioId,
      booking_id: booking.booking_id,
      reminder_type: "post_event_review",
      scheduled_for: reviewDate.toISOString(),
      status: "pending",
    });
  } catch (error) {
    console.error("Error scheduling reminders:", error);
  }
}

export async function sendPendingReminders(): Promise<void> {
  try {
    // Fetch all pending reminders that are due
    const now = new Date();
    const { data: reminders, error } = await supabase
      .from("scheduled_reminders")
      .select("*, bookings(*), studios(*, whatsapp_config(*))")
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    if (error) throw error;
    if (!reminders) return;

    for (const reminder of reminders) {
      try {
        const booking = reminder.bookings;
        const studio = reminder.studios;
        const whatsappConfig = studio.whatsapp_config;

        if (!booking || !studio) continue;

        let messageText = "";

        if (reminder.reminder_type === "event_3days") {
          const eventDate = new Date(booking.event_date);
          messageText = `Hi ${booking.client},

Quick reminder! 🔔

Your ${booking.service} booking is coming up on ${booking.event_date} at ${booking.event_time}

📍 Venue: ${booking.venue}

Please confirm your arrival time and come with a clean, moisturized face.

Thank you! 💄`;
        } else if (reminder.reminder_type === "balance_due") {
          const balance = Number(booking.total) - Number(booking.paid);
          if (balance > 0) {
            messageText = `Hi ${booking.client},

Your booking is tomorrow! 📅

Service: ${booking.service}
Balance Due: ₹${balance}

Please arrange payment before the event. Thank you! 🙏`;
          }
        } else if (reminder.reminder_type === "post_event_review") {
          messageText = `Hi ${booking.client},

Thank you for choosing us! 💄✨

We hope you loved your look! A quick Google review would mean a lot to us.

It helps other brides find us. Thank you! 🌟

${studio.phone ? `📞 ${studio.phone}` : ""}`;
        }

        if (!messageText) continue;

        // Send via WhatsApp if configured
        if (whatsappConfig?.is_configured && booking.phone) {
          const result = await sendWhatsAppMessage(whatsappConfig, {
            recipient_phone: booking.phone,
            message_type: "reminder",
            data: {
              client: booking.client,
              event_date: booking.event_date,
              event_time: booking.event_time,
              service: booking.service,
              venue: booking.venue,
              balance: Number(booking.total) - Number(booking.paid),
            },
          });

          if (result.success) {
            await supabase
              .from("scheduled_reminders")
              .update({
                status: "sent",
                sent_at: now.toISOString(),
              })
              .eq("id", reminder.id);

            // Log analytics event
            await supabase.from("analytics_events").insert({
              studio_id: studio.id,
              event_type: `reminder_${reminder.reminder_type}`,
              event_data: {
                booking_id: booking.id,
                reminder_type: reminder.reminder_type,
              },
            });
          } else {
            // Retry logic
            const retryCount = (reminder.retry_count || 0) + 1;
            if (retryCount < 3) {
              await supabase
                .from("scheduled_reminders")
                .update({
                  retry_count: retryCount,
                  error_message: result.error,
                })
                .eq("id", reminder.id);
            } else {
              await supabase
                .from("scheduled_reminders")
                .update({
                  status: "failed",
                  error_message: result.error,
                })
                .eq("id", reminder.id);
            }
          }
        }
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendPendingReminders:", error);
  }
}

export async function scheduleEmailReminder(
  studioId: string,
  bookingId: string,
  recipientEmail: string,
  reminderType: string
): Promise<void> {
  // Future: integrate with email service (SendGrid, Resend, etc)
  // For now, log the event
  await supabase.from("analytics_events").insert({
    studio_id: studioId,
    event_type: `email_reminder_${reminderType}`,
    event_data: {
      booking_id: bookingId,
      recipient_email: recipientEmail,
    },
  });
}
