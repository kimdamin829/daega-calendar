alter table reservations
  add column if not exists party_separator text;

alter table reservations drop constraint if exists reservations_party_separator_check;

alter table reservations
  add constraint reservations_party_separator_check
  check (party_separator is null or party_separator in ('.', ',', '&'));
