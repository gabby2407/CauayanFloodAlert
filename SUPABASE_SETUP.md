# Supabase setup

## 1. Create the alert table

In the Supabase SQL Editor, run:

```sql
create table if not exists public.flood_alerts (
  id integer primary key check (id = 1),
  signal_level text not null default 'NO ACTIVE SIGNAL'
    check (signal_level in ('NO ACTIVE SIGNAL', 'SIGNAL NO. 1', 'SIGNAL NO. 2', 'SIGNAL NO. 3', 'SIGNAL NO. 4', 'SIGNAL NO. 5')),
  flood_status text not null default 'No Flooding'
    check (flood_status in ('No Flooding', 'Flooding Reported', 'Critical Flooding')),
  affected_locations text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.flood_alerts enable row level security;

create policy "Anyone can read the current flood alert"
  on public.flood_alerts for select
  to anon, authenticated
  using (true);

create policy "Signed-in admins can insert the current flood alert"
  on public.flood_alerts for insert
  to authenticated
  with check (id = 1);

create policy "Signed-in admins can update the current flood alert"
  on public.flood_alerts for update
  to authenticated
  using (id = 1)
  with check (id = 1);

insert into public.flood_alerts (id, signal_level, flood_status, affected_locations)
values (1, 'SIGNAL NO. 2', 'Flooding Reported', array[]::text[])
on conflict (id) do nothing;
```

The `id = 1` constraint makes this table a single current alert. The browser calls Supabase directly: anonymous visitors can read it and signed-in users can write it. Only create trusted admin accounts in Supabase Auth; do not enable public sign-ups. If the project has other users, use a separate admin role/allowlist and tighten the write policies before giving them accounts.

## 2. Enable Realtime

In Supabase, open **Database → Publications** and enable `flood_alerts` for the `supabase_realtime` publication. The public page also polls once a minute as a fallback.

## 3. Configure this app

Open `public/supabase-config.js` and replace the placeholders with your Supabase **Project URL** and **anon/public key** from **Project Settings → API**. The anon key is designed for browser use with RLS enabled. Never put the `service_role` key in this file.

Create the admin email/password in **Authentication → Users** in the Supabase Dashboard. Then run `npm start`, visit `/login`, and sign in. `/admin` checks the Supabase session in the browser; Supabase RLS is the actual database access control.

## 4. Deploying

For a public deployment, host this Express app (or serve `public` as static files) and configure the host to use its assigned `PORT`. Add your deployed origin to Supabase **Authentication → URL Configuration → Site URL / Redirect URLs**. The included browser auto-open is intended for local development; disable that behavior on a hosted server if needed.
