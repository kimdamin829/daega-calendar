alter table reservations drop constraint if exists reservations_color_check;

alter table reservations
  add constraint reservations_color_check
    check (color is null or color in ('sky', 'yellow', 'green', 'pink', 'purple'));
