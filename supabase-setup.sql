-- Помощник 47: таблица для синхронизации. Вставьте целиком в Supabase, SQL Editor, и нажмите Run.
create table if not exists public.records (
  collection text not null,
  id         text not null,
  data       jsonb,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (collection, id)
);
create index if not exists records_updated_idx on public.records (updated_at);

-- время изменения ставит сервер, а не телефон (чтобы не зависеть от часов устройств)
create or replace function public.records_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.records_touch();

-- доступ только у двух аккаунтов: u7@pomoshnik47.app и u4@pomoshnik47.app
alter table public.records enable row level security;
drop policy if exists "pair read"   on public.records;
drop policy if exists "pair insert" on public.records;
drop policy if exists "pair update" on public.records;
create policy "pair read"   on public.records for select to authenticated
  using ((auth.jwt() ->> 'email') in ('u7@pomoshnik47.app','u4@pomoshnik47.app'));
create policy "pair insert" on public.records for insert to authenticated
  with check ((auth.jwt() ->> 'email') in ('u7@pomoshnik47.app','u4@pomoshnik47.app'));
create policy "pair update" on public.records for update to authenticated
  using ((auth.jwt() ->> 'email') in ('u7@pomoshnik47.app','u4@pomoshnik47.app'))
  with check ((auth.jwt() ->> 'email') in ('u7@pomoshnik47.app','u4@pomoshnik47.app'));

-- права: без входа (anon) доступа нет совсем; удаления нет, записи только помечаются удалёнными
revoke all on public.records from anon;
grant usage on schema public to authenticated;
grant select, insert, update on public.records to authenticated;
