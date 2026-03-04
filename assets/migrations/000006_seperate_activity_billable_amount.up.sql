ALTER TABLE activity ADD COLUMN
    billable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE activity ADD COLUMN
    unit INTEGER NOT NULL DEFAULT 0;

UPDATE activity
   SET billable = 1
 WHERE billable_amount_unit = 1;

UPDATE activity
   SET billable = 1,
       unit = 1
 WHERE billable_amount_unit = 2;

ALTER TABLE activity DROP COLUMN billable_amount_unit;
