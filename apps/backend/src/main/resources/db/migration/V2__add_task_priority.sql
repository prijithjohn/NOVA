ALTER TABLE tasks
    ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE tasks
    ADD CONSTRAINT tasks_priority_valid CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'));
