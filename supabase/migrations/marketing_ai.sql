-- MUA Marketing AI: saved campaigns + private photo storage.
-- Safe to run more than once. Run in Supabase: Dashboard > SQL Editor > New query.
-- Requires public.studios, public.studio_members and public.is_member() from schema.sql.

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  title text not null default 'Marketing campaign' check (char_length(title) <= 140),
  status text not null default 'draft' check (status in ('draft', 'ready', 'scheduled', 'posted', 'archived')),
  content_type text,
  image_path text,
  details jsonb not null default '{}'::jsonb,
  result jsonb not null,
  caption text,
  hashtags text[] not null default '{}',
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketing_campaigns_studio_created_idx
  on public.marketing_campaigns(studio_id, created_at desc);

drop trigger if exists marketing_campaigns_touch on public.marketing_campaigns;
create trigger marketing_campaigns_touch before update on public.marketing_campaigns
  for each row execute function public.touch_updated_at();

alter table public.marketing_campaigns enable row level security;
drop policy if exists marketing_campaigns_all on public.marketing_campaigns;
create policy marketing_campaigns_all on public.marketing_campaigns for all
  using (public.is_member(studio_id)) with check (public.is_member(studio_id));

-- Private bucket. Files live at <studio_id>/<uuid>.<ext> and are shown with short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketing-images', 'marketing-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A member may only touch files inside their own studio's folder.
drop policy if exists marketing_images_select on storage.objects;
create policy marketing_images_select on storage.objects for select to authenticated
  using (bucket_id = 'marketing-images' and (storage.foldername(name))[1] in (
    select m.studio_id::text from public.studio_members m where m.user_id = auth.uid()));

drop policy if exists marketing_images_insert on storage.objects;
create policy marketing_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'marketing-images' and (storage.foldername(name))[1] in (
    select m.studio_id::text from public.studio_members m where m.user_id = auth.uid()));

drop policy if exists marketing_images_update on storage.objects;
create policy marketing_images_update on storage.objects for update to authenticated
  using (bucket_id = 'marketing-images' and (storage.foldername(name))[1] in (
    select m.studio_id::text from public.studio_members m where m.user_id = auth.uid()));

drop policy if exists marketing_images_delete on storage.objects;
create policy marketing_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'marketing-images' and (storage.foldername(name))[1] in (
    select m.studio_id::text from public.studio_members m where m.user_id = auth.uid()));
