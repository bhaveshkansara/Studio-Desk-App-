export const SOURCES = {
  whatsapp: "WhatsApp enquiry",
  instagram: "Instagram enquiry",
  call: "Phone call",
  website: "Website",
  referral: "Referral",
} as const;

export const SRC_SHORT = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  call: "Phone call",
  website: "Website",
  referral: "Referral",
} as const;

export const KINDS = {
  bride: "Bridal",
  engagement: "Engagement",
  party: "Party",
  event: "Other event",
} as const;

export const LEAD_KINDS = { ...KINDS, student: "Student" } as const;

export const BSTATUS = {
  enquiry: "Enquiry",
  confirmed: "Confirmed",
  done: "Done",
  cancelled: "Cancelled",
} as const;

export const LSTATUS = {
  new: "New",
  contacted: "Contacted",
  quotation_sent: "Quotation sent",
  advance_pending: "Advance pending",
  confirmed: "Confirmed",
  completed: "Completed",
  lost: "Lost",
  dismissed: "Dismissed",
} as const;

export const SSTATUS = {
  active: "Active",
  completed: "Completed",
  left: "Left",
} as const;

export const COURSES = ["Basic", "Advanced", "Professional"] as const;

export type Source = keyof typeof SOURCES;
export type Kind = keyof typeof KINDS;
export type LeadKind = keyof typeof LEAD_KINDS;
export type BookingStatus = keyof typeof BSTATUS;
export type StudentStatus = keyof typeof SSTATUS;

export interface Studio {
  id: string;
  name: string;
  phone: string | null;
}

export interface StudioMember {
  studio_id: string;
  user_id: string;
  role: "owner" | "manager" | "staff";
  can_manage_team: boolean;
  can_manage_bookings: boolean;
  can_manage_payments: boolean;
  can_manage_settings: boolean;
  created_at: string;
}

export interface TeamStaff {
  id: string;
  studio_id: string;
  name: string;
  role: "owner" | "manager" | "staff";
  can_manage_team: boolean;
  can_manage_bookings: boolean;
  can_manage_payments: boolean;
  can_manage_settings: boolean;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface QuotationTemplate {
  id: string;
  studio_id: string;
  name: string;
  service_type: string;
  price: number;
  description: string | null;
  inclusions: string[];
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  studio_id: string;
  assigned_to: string | null;
  client: string;
  phone: string | null;
  insta: string | null;
  source: Source | null;
  kind: Kind;
  status: BookingStatus;
  service: string | null;
  event_date: string | null;
  event_time: string | null;
  trial_date: string | null;
  venue: string | null;
  total: number;
  paid: number;
  confirmation_sent: boolean;
  notes: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  studio_id: string;
  name: string;
  phone: string | null;
  insta: string | null;
  source: Source | null;
  course: string;
  status: StudentStatus;
  batch: string | null;
  start_date: string | null;
  fee: number;
  paid: number;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  studio_id: string;
  name: string | null;
  phone: string | null;
  insta: string | null;
  source: Source | null;
  kind: LeadKind;
  service: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  summary: string | null;
  message: string | null;
  status: "new" | "contacted" | "quotation_sent" | "advance_pending" | "confirmed" | "completed" | "lost" | "dismissed";
  booking_id: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  amount: number;
  note: string | null;
  paid_on: string;
  created_at: string;
}

export const balanceOfBooking = (b: Pick<Booking, "status" | "total" | "paid">) =>
  b.status === "cancelled" ? 0 : Math.max(0, Number(b.total) - Number(b.paid));

export const balanceOfStudent = (s: Pick<Student, "status" | "fee" | "paid">) =>
  s.status === "left" ? 0 : Math.max(0, Number(s.fee) - Number(s.paid));

export const isUpcoming = (b: Pick<Booking, "status">, diff: number | null) =>
  diff !== null && diff >= 0 && (b.status === "enquiry" || b.status === "confirmed");

export interface ScheduledReminder {
  id: string;
  studio_id: string;
  booking_id: string;
  reminder_type: "event_3days" | "balance_due" | "trial_confirmation" | "post_event_review";
  scheduled_for: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed";
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

export interface RazorpayConfig {
  studio_id: string;
  api_key_id: string | null;
  api_key_secret: string | null;
  is_configured: boolean;
  is_live_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  studio_id: string;
  booking_id: string | null;
  student_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "attempted" | "paid" | "failed" | "expired";
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  studio_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}
