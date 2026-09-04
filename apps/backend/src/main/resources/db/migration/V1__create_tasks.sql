CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT tasks_title_not_blank CHECK (char_length(btrim(title)) > 0)
);

CREATE INDEX tasks_created_at_idx ON tasks (created_at DESC);