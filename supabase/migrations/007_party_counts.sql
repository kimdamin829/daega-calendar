alter table reservations
  add column if not exists adult_count smallint not null default 1,
  add column if not exists child_count smallint not null default 0,
  add column if not exists infant_count smallint not null default 0;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'party_size'
  ) then
    update reservations
    set adult_count = party_size
    where party_size is not null;

    alter table reservations drop column party_size;
  end if;
end $$;

alter table reservations drop constraint if exists reservations_adult_count_check;
alter table reservations drop constraint if exists reservations_child_count_check;
alter table reservations drop constraint if exists reservations_infant_count_check;

alter table reservations
  add constraint reservations_adult_count_check check (adult_count >= 0),
  add constraint reservations_child_count_check check (child_count >= 0),
  add constraint reservations_infant_count_check check (infant_count >= 0);
