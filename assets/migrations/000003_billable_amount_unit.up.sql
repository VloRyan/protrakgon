ALTER TABLE activity ADD COLUMN billable_amount_unit INTEGER NOT NULL DEFAULT 0;

UPDATE activity
   SET billable_amount_unit = 1
 WHERE billable = 1;

ALTER TABLE activity DROP COLUMN billable;
