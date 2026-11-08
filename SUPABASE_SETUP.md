# Supabase setup

## 1. Create the alert table and secure admin access

Run this once in the Supabase SQL Editor. The alert uses a fixed UUID so the same row is read and updated every time. Writes require a signed-in user ID in the `flood_alert_admins` allowlist.

```sql
create table if not exists public.flood_alerts (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'
    check (id = '00000000-0000-0000-0000-000000000001'),
  signal_level text not null default 'NO ACTIVE SIGNAL'
    check (signal_level in ('NO ACTIVE SIGNAL', 'SIGNAL NO. 1', 'SIGNAL NO. 2', 'SIGNAL NO. 3', 'SIGNAL NO. 4', 'SIGNAL NO. 5')),
  flood_status text not null default 'No Flooding'
    check (flood_status in ('No Flooding', 'Flooding Reported', 'Critical Flooding')),
  affected_locations text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.flood_alert_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.flood_alerts enable row level security;
alter table public.flood_alert_admins enable row level security;

grant select on public.flood_alerts to anon, authenticated;
grant insert, update on public.flood_alerts to authenticated;
grant select on public.flood_alert_admins to authenticated;

drop policy if exists "Anyone can read the current flood alert" on public.flood_alerts;
create policy "Anyone can read the current flood alert"
  on public.flood_alerts for select to anon, authenticated using (true);

drop policy if exists "Admins can view their own admin record" on public.flood_alert_admins;
create policy "Admins can view their own admin record"
  on public.flood_alert_admins for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Signed-in admins can insert the current flood alert" on public.flood_alerts;
create policy "Signed-in admins can insert the current flood alert"
  on public.flood_alerts for insert to authenticated
  with check (id = '00000000-0000-0000-0000-000000000001'::uuid and exists (
    select 1 from public.flood_alert_admins where user_id = auth.uid()
  ));

drop policy if exists "Signed-in admins can update the current flood alert" on public.flood_alerts;
create policy "Signed-in admins can update the current flood alert"
  on public.flood_alerts for update to authenticated
  using (id = '00000000-0000-0000-0000-000000000001'::uuid and exists (
    select 1 from public.flood_alert_admins where user_id = auth.uid()
  ))
  with check (id = '00000000-0000-0000-0000-000000000001'::uuid and exists (
    select 1 from public.flood_alert_admins where user_id = auth.uid()
  ));

insert into public.flood_alerts (id, signal_level, flood_status, affected_locations)
values ('00000000-0000-0000-0000-000000000001', 'SIGNAL NO. 2', 'Flooding Reported', array[]::text[])
on conflict (id) do nothing;
```

Create your admin in **Authentication > Users**. Copy its UUID and authorize it with:

```sql
insert into public.flood_alert_admins (user_id)
values ('PASTE-ADMIN-USER-UUID-HERE');
```

If you previously ran older setup SQL, rerun the SQL above to replace the earlier broad write policies, then add the admin UUID. Only allowlisted users can write, even if public sign-ups are enabled.

## 2. Enable Realtime

In Supabase, open **Database > Publications** and enable `flood_alerts` for the `supabase_realtime` publication. The public page also polls once a minute as a fallback.

## 3. Configure the app

In `public/supabase-config.js`, replace `YOUR_PROJECT_ID` with your Supabase project ID from **Project Settings > API**. The existing publishable/anon key is intended for browser use with RLS enabled. Never place a `service_role` or secret key in browser code. The app stays in setup mode until the project URL placeholder is replaced.

Run `npm start`, visit `/login`, and sign in. `/admin` checks the browser session, while Supabase RLS and the allowlist enforce write access.

## 4. Deploying

Host this Express app (or serve `public` as static files) and configure the host to use its assigned `PORT`. Add the deployed origin to Supabase **Authentication > URL Configuration > Site URL / Redirect URLs**. Browser auto-open is only for local development.
