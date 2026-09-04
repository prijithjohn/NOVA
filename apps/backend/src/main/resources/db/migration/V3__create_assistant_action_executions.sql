CREATE TABLE assistant_action_executions (
    id UUID PRIMARY KEY,
    idempotency_key VARCHAR(200) NOT NULL UNIQUE,
    task_id UUID NOT NULL REFERENCES tasks(id),
    created_at TIMESTAMPTZ NOT NULL
);
