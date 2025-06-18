CREATE TABLE IF NOT EXISTS client (
    id          INTEGER
        PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS project (
    id          INTEGER
        PRIMARY KEY,
    client_id   INTEGER NOT NULL
        REFERENCES client (id),
    name        TEXT    NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS slot (
    id          INTEGER
        PRIMARY KEY,
    project_id  INTEGER   NOT NULL
        REFERENCES project (id),
    activity    INTEGER   NOT NULL,
    started_at  TIMESTAMP NOT NULL,
    ended_at    TIMESTAMP,
    description TEXT,
    UNIQUE (project_id, activity, started_at)
);


