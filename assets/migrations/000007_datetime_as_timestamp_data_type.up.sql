ALTER TABLE booking
    ADD COLUMN started_at_dt DATETIME NOT NULL DEFAULT 0;

ALTER TABLE booking
    ADD COLUMN ended_at_dt DATETIME NULL DEFAULT 0;

UPDATE booking
   SET started_at_dt = UNIXEPOCH(started_at),
       ended_at_dt = UNIXEPOCH(ended_at);

DROP INDEX slot_u_index_project_activity_started_at;

ALTER TABLE booking DROP COLUMN started_at;
ALTER TABLE booking RENAME COLUMN started_at_dt TO started_at;

ALTER TABLE booking DROP COLUMN ended_at;
ALTER TABLE booking RENAME COLUMN ended_at_dt TO ended_at;

CREATE UNIQUE INDEX booking_u_index_project_activity_started_at ON booking (project_id, activity_id, started_at);
