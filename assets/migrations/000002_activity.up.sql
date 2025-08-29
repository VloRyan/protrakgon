CREATE TABLE IF NOT EXISTS activity (
    id          INTEGER
        PRIMARY KEY,
    project_id  INTEGER NOT NULL
        REFERENCES project (id),
    name        TEXT    NOT NULL,
    description TEXT,
    billable    INTEGER NOT NULL,
    amount      REAL    NOT NULL,
    icon        TEXT
);

INSERT INTO activity (project_id, name, billable, amount, icon)
SELECT id, 'Work', TRUE, 0, 'gear'
  FROM project;

INSERT INTO activity (project_id, name, billable, amount, icon)
SELECT id, 'Break', FALSE, 0, 'mug-hot'
  FROM project;

CREATE TABLE IF NOT EXISTS slot_tmp (
    id          INTEGER,
    project_id  INTEGER   NOT NULL,
    activity_id INTEGER   NOT NULL,
    started_at  TIMESTAMP NOT NULL,
    ended_at    TIMESTAMP,
    description TEXT
);

INSERT INTO slot_tmp (id, project_id, activity_id, started_at, ended_at, description)
SELECT id, project_id,
       (SELECT id
          FROM activity
         WHERE activity.project_id = slot.project_id
           AND activity.name = (CASE WHEN slot.activity = 0 THEN 'Work' ELSE 'Break' END)), started_at, ended_at,
       description
  FROM slot;

DROP TABLE slot;

CREATE TABLE IF NOT EXISTS slot (
    id          INTEGER
        PRIMARY KEY,
    project_id  INTEGER   NOT NULL
        REFERENCES project (id),
    activity_id INTEGER   NOT NULL
        REFERENCES activity (id),
    started_at  TIMESTAMP NOT NULL,
    ended_at    TIMESTAMP,
    description TEXT
);

CREATE UNIQUE INDEX slot_u_index_project_activity_started_at ON slot (project_id, activity_id, started_at);

INSERT INTO slot (id, project_id, activity_id, started_at, ended_at, description)
SELECT id, project_id, activity_id, started_at, ended_at, description
  FROM slot_tmp;




