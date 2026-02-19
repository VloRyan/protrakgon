ALTER TABLE booking
    ADD COLUMN amount INTEGER NOT NULL DEFAULT -1;

UPDATE booking
   SET amount = (UNIXEPOCH(ended_at) - UNIXEPOCH(started_at)) / 60
  FROM activity AS act
 WHERE booking.activity_id = act.id
   AND booking.ended_at IS NOT NULL
   AND act.billable_amount_unit IN (0, 1);

UPDATE booking
   SET amount = 1
  FROM activity act
 WHERE booking.activity_id = act.id
   AND act.billable_amount_unit = 2;
