alter table reservations
  add column if not exists color text not null default 'yellow'
    check (color in ('yellow', 'pink', 'sky'));
