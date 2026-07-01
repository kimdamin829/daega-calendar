alter table reservations
  add column if not exists start_minutes smallint not null default 540,
  add column if not exists duration_minutes smallint not null default 60
    check (duration_minutes > 0);

update reservations
set start_minutes = (
  extract(hour from time)::int * 60 + extract(minute from time)::int
);

create index if not exists reservations_date_start_idx
  on reservations (date, start_minutes);
