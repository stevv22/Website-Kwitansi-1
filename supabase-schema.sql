-- Jalankan di Supabase Dashboard > SQL Editor > New query.
create table if not exists public.hdi_app_state (
  id text primary key check (id = 'main'),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Untuk aplikasi yang langsung berjalan di browser, kebijakan ini memberi
-- akses baca/tulis ke siapa pun yang memiliki anon key. Gunakan hanya untuk
-- uji coba/internal terbatas. Untuk data pembayaran siswa yang sebenarnya,
-- aktifkan Supabase Auth dan batasi RLS berdasarkan pengguna/role sekolah.
alter table public.hdi_app_state enable row level security;
drop policy if exists "hdi demo read" on public.hdi_app_state;
drop policy if exists "hdi demo write" on public.hdi_app_state;
create policy "hdi demo read" on public.hdi_app_state for select to anon, authenticated using (true);
create policy "hdi demo write" on public.hdi_app_state for all to anon, authenticated using (true) with check (true);
grant select, insert, update on public.hdi_app_state to anon, authenticated;
