-- Studio Desk database schema.
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- Every table is protected by Row Level Security: a signed-in user can only see
-- and change rows that belong to a studio they are a member of.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tenants
create table public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Studio',
  phone text,
  created_at timestamptz not null default now()
);

create table public.studio_members (
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  can_manage_team boolean not null default false,
  can_manage_bookings boolean not null default true,
  can_manage_payments boolean not null default false,
  can_manage_settings boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (studio_id, user_id)
);
create index studio_members_user_idx on public.studio_members(user_id);

-- Team roster: direct team member management (name-based, no auth required)
create table public.team_staff (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  can_manage_team boolean not null default false,
  can_manage_bookings boolean not null default true,
  can_manage_payments boolean not null default false,
  can_manage_settings boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index team_staff_studio_idx on public.team_staff(studio_id);

-- Trigger for team_staff updated_at
create trigger team_staff_touch before update on public.team_staff
  for each row execute function public.touch_updated_at();

-- RLS for team_staff
alter table public.team_staff enable row level security;
create policy team_staff_all on public.team_staff for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

create or replace function public.is_member(sid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.studio_members m
    where m.studio_id = sid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(sid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.studio_members m
    where m.studio_id = sid and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------- data
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  client text not null,
  phone text,
  insta text,
  source text check (source in ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  kind text not null default 'bride' check (kind in ('bride', 'engagement', 'party', 'event')),
  status text not null default 'enquiry' check (status in ('enquiry', 'confirmed', 'done', 'cancelled')),
  service text,
  event_date date,
  event_time time,
  trial_date date,
  venue text,
  total numeric(12, 2) not null default 0 check (total >= 0),
  paid numeric(12, 2) not null default 0,
  confirmation_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_studio_date_idx on public.bookings(studio_id, event_date);
create index bookings_assigned_to_idx on public.bookings(assigned_to);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  phone text,
  insta text,
  source text check (source in ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  course text not null default 'Basic',
  status text not null default 'active' check (status in ('active', 'completed', 'left')),
  batch text,
  start_date date,
  fee numeric(12, 2) not null default 0 check (fee >= 0),
  paid numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_studio_idx on public.students(studio_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text,
  phone text,
  insta text,
  source text check (source in ('whatsapp', 'instagram', 'call', 'website', 'referral')),
  kind text not null default 'bride' check (kind in ('bride', 'engagement', 'party', 'event', 'student')),
  service text,
  event_date date,
  event_time time,
  venue text,
  summary text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'quotation_sent', 'advance_pending', 'confirmed', 'completed', 'lost', 'dismissed')),
  booking_id uuid references public.bookings(id) on delete set null,
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_studio_status_idx on public.leads(studio_id, status);
create index leads_booking_idx on public.leads(booking_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  paid_on date not null default current_date,
  created_at timestamptz not null default now(),
  check ((booking_id is not null)::int + (student_id is not null)::int = 1)
);
create index payments_booking_idx on public.payments(booking_id);
create index payments_student_idx on public.payments(student_id);

create table public.message_templates (
  studio_id uuid not null references public.studios(id) on delete cascade,
  key text not null,
  body text not null,
  primary key (studio_id, key)
);

-- ---------------------------------------------------------------- triggers
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- "paid" on bookings and students is always the sum of its payments.
create or replace function public.refresh_paid() returns trigger
language plpgsql security definer set search_path = public as $$
declare b uuid; s uuid;
begin
  if tg_op = 'DELETE' then
    b := old.booking_id; s := old.student_id;
  else
    b := new.booking_id; s := new.student_id;
  end if;
  if b is not null then
    update public.bookings
      set paid = (select coalesce(sum(amount), 0) from public.payments where booking_id = b)
      where id = b;
  end if;
  if s is not null then
    update public.students
      set paid = (select coalesce(sum(amount), 0) from public.payments where student_id = s)
      where id = s;
  end if;
  return null;
end $$;

create trigger payments_refresh after insert or update or delete on public.payments
  for each row execute function public.refresh_paid();

-- Default WhatsApp message templates for a new studio.
create or replace function public.seed_templates(sid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.message_templates (studio_id, key, body) values
  (sid, 'enquiry_reply',
   E'Hi {{name}}, thank you for your enquiry! I am checking my availability for {{date}}. Could you please share the venue, the timing and how many people need makeup? I will send the details and pricing right away. - {{studio}}'),
  (sid, 'confirmation',
   E'Hi {{name}}, your booking is confirmed!\n\nService: {{service}}\nDate: {{date}}\nTime: {{time}}\nVenue: {{venue}}\nTotal: {{total}}\nAdvance received: {{paid}}\nBalance due: {{balance}}\n\nPlease come with a clean, moisturised face and share a photo of your outfit. Thank you! - {{studio}}'),
  (sid, 'reminder',
   E'Hi {{name}}, a quick reminder about your {{service}} booking on {{date}} at {{time}} ({{venue}}). The balance due is {{balance}}. Please reply to confirm. Thank you! - {{studio}}'),
  (sid, 'balance_due',
   E'Hi {{name}}, a gentle reminder that {{balance}} is pending for your booking on {{date}}. Please let me know when you can pay. Thank you! - {{studio}}'),
  (sid, 'student_fee',
   E'Hi {{name}}, a gentle reminder that {{balance}} is pending for the {{course}} course. Please let me know when you can pay. Thank you! - {{studio}}'),
  (sid, 'review_request',
   E'Hi {{name}}, thank you for choosing {{studio}}! If you loved your look, a quick Google review would mean a lot to us.')
  on conflict do nothing;
end $$;

-- Every new sign-up gets its own studio, an owner membership and default templates.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  insert into public.studios (name)
  values (coalesce(nullif(trim(new.raw_user_meta_data->>'studio_name'), ''), 'My Studio'))
  returning id into sid;
  insert into public.studio_members (studio_id, user_id, role) values (sid, new.id, 'owner');
  perform public.seed_templates(sid);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- security
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;
alter table public.bookings enable row level security;
alter table public.students enable row level security;
alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.message_templates enable row level security;

create policy studios_select on public.studios for select using (public.is_member(id));
create policy studios_update on public.studios for update
  using (public.is_owner(id)) with check (public.is_owner(id));

create policy members_select on public.studio_members for select using (user_id = auth.uid());

create policy bookings_all on public.bookings for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));
create policy students_all on public.students for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));
create policy leads_all on public.leads for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));
create policy payments_all on public.payments for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));
create policy templates_all on public.message_templates for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- Quotation templates for different services
create table public.quotation_templates (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  service_type text not null,
  price numeric(12, 2) not null,
  description text,
  inclusions text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotation_templates_studio_idx on public.quotation_templates(studio_id);

-- Trigger for quotation_templates
create trigger quotation_templates_touch before update on public.quotation_templates
  for each row execute function public.touch_updated_at();

-- RLS for quotation_templates
alter table public.quotation_templates enable row level security;
create policy quotation_templates_all on public.quotation_templates for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- WhatsApp Business API configuration
create table public.whatsapp_config (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  api_token text,
  phone_number_id text,
  business_account_id text,
  is_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for whatsapp_config
alter table public.whatsapp_config enable row level security;
create policy whatsapp_config_access on public.whatsapp_config for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- ---------------------------------------------------------------- Quotation drafts
create table public.quotation_drafts (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  auto_generated boolean not null default false,
  sent_via_whatsapp boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'sent', 'expired')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index quotation_drafts_studio_status_idx on public.quotation_drafts(studio_id, status);
create index quotation_drafts_lead_idx on public.quotation_drafts(lead_id);
create index quotation_drafts_booking_idx on public.quotation_drafts(booking_id);

-- RLS for quotation_drafts
alter table public.quotation_drafts enable row level security;
create policy quotation_drafts_all on public.quotation_drafts for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- ---------------------------------------------------------------- Scheduled reminders
create table public.scheduled_reminders (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('event_3days', 'balance_due', 'trial_confirmation', 'post_event_review')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  retry_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);
create index scheduled_reminders_studio_status_idx on public.scheduled_reminders(studio_id, status, scheduled_for);
create index scheduled_reminders_booking_idx on public.scheduled_reminders(booking_id);

-- RLS for scheduled_reminders
alter table public.scheduled_reminders enable row level security;
create policy scheduled_reminders_all on public.scheduled_reminders for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- ---------------------------------------------------------------- Razorpay integration
create table public.razorpay_config (
  studio_id uuid primary key references public.studios(id) on delete cascade,
  api_key_id text,
  api_key_secret text,
  is_configured boolean not null default false,
  is_live_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for razorpay_config
alter table public.razorpay_config enable row level security;
create policy razorpay_config_access on public.razorpay_config for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- Payment orders tracking
create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'attempted', 'paid', 'failed', 'expired')),
  customer_phone text,
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_orders_studio_idx on public.payment_orders(studio_id);
create index payment_orders_booking_idx on public.payment_orders(booking_id);
create index payment_orders_razorpay_idx on public.payment_orders(razorpay_order_id);

-- RLS for payment_orders
alter table public.payment_orders enable row level security;
create policy payment_orders_all on public.payment_orders for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- ---------------------------------------------------------------- Analytics events
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_studio_date_idx on public.analytics_events(studio_id, created_at);

-- RLS for analytics_events
alter table public.analytics_events enable row level security;
create policy analytics_events_all on public.analytics_events for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- ---------------------------------------------------------------- MUA Marketing AI
-- Saved marketing campaigns and the private "marketing-images" storage bucket.
-- The full, re-runnable definition lives in supabase/migrations/marketing_ai.sql:
-- run that file after this one (or on its own for an existing project).
