create table reservations (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  time        time not null,
  party_size  smallint not null check (party_size > 0),
  guest_name  text not null,
  seat        text,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reservations_date_idx on reservations (date);
create index reservations_date_time_idx on reservations (date, time);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reservations_updated_at
  before update on reservations
  for each row execute function update_updated_at();

alter table reservations enable row level security;

create policy "public read"
  on reservations for select
  using (true);

create policy "public insert"
  on reservations for insert
  with check (true);

create policy "public update"
  on reservations for update
  using (true)
  with check (true);

create policy "public delete"
  on reservations for delete
  using (true);

alter publication supabase_realtime add table reservations;
