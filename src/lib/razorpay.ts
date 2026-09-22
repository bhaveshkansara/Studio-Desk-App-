// Razorpay payment gateway integration for India-based makeup artists

import crypto from "crypto";

export interface RazorpayPaymentConfig {
  api_key_id: string;
  api_key_secret: string;
}

export interface CreateOrderParams {
  amount: number; // in paise (100 paise = 1 rupee)
  customer_phone: string;
  customer_email: string;
  description: string;
  booking_id: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function createRazorpayOrder(
  config: RazorpayPaymentConfig,
  params: CreateOrderParams
): Promise<{
  success: boolean;
  order_id?: string;
  error?: string;
}> {
  try {
    if (!config.api_key_id || !config.api_key_secret) {
      return {
        success: false,
        error: "Razorpay credentials not configured",
      };
    }

    // Convert rupees to paise if needed
    const amountInPaise = params.amount > 1000 ? params.amount : params.amount * 100;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.api_key_id}:${config.api_key_secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: params.booking_id,
        description: params.description,
        customer_notify: 1,
        notes: {
          booking_id: params.booking_id,
          type: "booking_payment",
        },
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.description || "Failed to create order",
      };
    }

    return {
      success: true,
      order_id: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error creating Razorpay order: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function verifyRazorpaySignature(
  config: RazorpayPaymentConfig,
  verification: PaymentVerification
): boolean {
  try {
    const body = `${verification.razorpay_order_id}|${verification.razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", config.api_key_secret)
      .update(body)
      .digest("hex");

    return expectedSignature === verification.razorpay_signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export async function captureRazorpayPayment(
  config: RazorpayPaymentConfig,
  paymentId: string,
  amount: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const amountInPaise = amount > 1000 ? amount : amount * 100;

    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.api_key_id}:${config.api_key_secret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
        }),
      }
    );

    const data = (await response.json()) as any;

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.description || "Failed to capture payment",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Capture error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

export function generateRazorpayCheckoutScript(
  config: RazorpayPaymentConfig,
  orderId: string,
  amount: number,
  customerEmail: string,
  customerPhone: string,
  studioName: string
): string {
  return `
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function openRazorpayCheckout() {
        const options = {
          key: "${config.api_key_id}",
          amount: ${amount > 1000 ? amount : amount * 100},
          currency: "INR",
          name: "${studioName}",
          description: "Makeup Artist Booking Payment",
          order_id: "${orderId}",
          handler: function(response) {
            document.getElementById("razorpay_order_id").value = response.razorpay_order_id;
            document.getElementById("razorpay_payment_id").value = response.razorpay_payment_id;
            document.getElementById("razorpay_signature").value = response.razorpay_signature;
            document.getElementById("payment-form").submit();
          },
          prefill: {
            email: "${customerEmail}",
            contact: "${customerPhone}",
          },
          theme: {
            color: "#c084fc",
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      }

      openRazorpayCheckout();
    </script>
  `;
}
