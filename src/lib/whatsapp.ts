// WhatsApp Business API integration
// Requires: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID in environment

export interface WhatsAppConfig {
  api_token: string;
  phone_number_id: string;
  business_account_id: string;
}

export interface WhatsAppMessage {
  recipient_phone: string;
  message_type: "quotation" | "invoice" | "reminder" | "confirmation";
  data: Record<string, string | number>;
}

export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  message: WhatsAppMessage
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  try {
    if (!config.api_token || !config.phone_number_id) {
      return {
        success: false,
        error: "WhatsApp API credentials not configured. Set them in Settings > WhatsApp Integration",
      };
    }

    // Format phone number (remove leading 0 or +, ensure 10 digits for India)
    let phone = message.recipient_phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = phone.slice(1);
    if (phone.length === 10) phone = "91" + phone; // India country code
    if (!phone.startsWith("91")) phone = "91" + phone;

    // Build message based on type
    let messageText = "";
    switch (message.message_type) {
      case "quotation":
        messageText = formatQuotationMessage(message.data);
        break;
      case "invoice":
        messageText = formatInvoiceMessage(message.data);
        break;
      case "reminder":
        messageText = formatReminderMessage(message.data);
        break;
      case "confirmation":
        messageText = formatConfirmationMessage(message.data);
        break;
    }

    // Send via WhatsApp Cloud API
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
          to: phone,
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error: `WhatsApp API error: ${(data as any)?.error?.message || "Unknown error"}`,
      };
    }

    return {
      success: true,
      message_id: (data as any)?.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send WhatsApp message: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

function formatQuotationMessage(data: Record<string, string | number>): string {
  const advance = Math.round((Number(data.amount) * 30) / 100);
  const balance = Number(data.amount) - advance;

  return `Hi ${data.client},

Thank you for enquiring! 🎉

*SERVICE QUOTATION*

Service: ${data.service}
Date: ${data.event_date}
Venue: ${data.venue}

*QUOTATION: ₹${data.amount}*

💳 Advance (30%): ₹${advance}
💳 Balance Due: ₹${balance}

*INCLUSIONS:*
✓ Professional Hairstyling
✓ Hair Extensions
✓ Makeup Artistry
✓ Bridal Touch-ups

*PROFESSIONAL PRODUCTS USED:*
Dior • Armani • Gucci • Natasha Denona
Pat McGrath • Estée Lauder • Smashbox

Trial booking available! 📅

Ready to confirm? Please reply with your confirmation. 💬`;
}

function formatInvoiceMessage(data: Record<string, string | number>): string {
  const balance = Number(data.total) - Number(data.paid);

  return `Hi ${data.client},

*YOUR INVOICE* 📄

Service: ${data.service}
Event Date: ${data.event_date}

*TOTAL AMOUNT: ₹${data.total}*

✓ Advance Received: ₹${data.paid}
⏳ Balance Due: ₹${balance}

Payment Terms: Balance due on event day

*PROFESSIONAL SERVICES INCLUDE:*
✓ Professional Makeup
✓ Hairstyling
✓ Bridal Touch-ups

Thank you! 🙏`;
}

function formatReminderMessage(data: Record<string, string | number>): string {
  return `Hi ${data.client},

Quick reminder! 🔔

Your booking is coming up on ${data.event_date} at ${data.event_time}

📍 Venue: ${data.venue}
💅 Service: ${data.service}

Balance Due: ₹${data.balance}

Please confirm your arrival time. See you soon! 💄`;
}

function formatConfirmationMessage(data: Record<string, string | number>): string {
  return `Hi ${data.client},

Your booking is confirmed! ✅

*BOOKING DETAILS*

Date: ${data.event_date}
Time: ${data.event_time}
Venue: ${data.venue}
Service: ${data.service}

Total: ₹${data.total}
Advance Received: ₹${data.paid}
Balance Due: ₹${data.balance}

Please come with a clean, moisturized face.
Share your outfit photo if possible! 📸

Looking forward to making you beautiful! 💄✨`;
}
