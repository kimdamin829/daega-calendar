alter table reservations drop constraint if exists reservations_color_check;

alter table reservations
  alter column color drop not null,
  alter column color drop default;

alter table reservations
  add constraint reservations_color_check
    check (color is null or color in ('yellow', 'pink', 'sky'));
