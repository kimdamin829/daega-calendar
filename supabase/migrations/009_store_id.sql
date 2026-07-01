-- 매장 구분: 1호점(main, 기존 데이터) / 2호점(branch)
alter table reservations
  add column if not exists store_id text not null default 'main';

create index if not exists reservations_store_date_idx
  on reservations (store_id, date);

create index if not exists reservations_store_date_time_idx
  on reservations (store_id, date, start_minutes);
