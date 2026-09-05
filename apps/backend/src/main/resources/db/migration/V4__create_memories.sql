CREATE TABLE memories (
    id UUID PRIMARY KEY,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT memories_content_not_blank CHECK (char_length(btrim(content)) > 0)
);

CREATE INDEX memories_created_at_idx ON memories (created_at DESC);
