import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { createTask, deleteTask, listTasks, updateTask } from './api';
import type { Task } from './api';
import './styles.css';

type ViewState = 'loading' | 'ready' | 'error';

export function formatTaskDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then((loadedTasks) => {
        setTasks(loadedTasks);
        setViewState('ready');
      })
      .catch((loadError: Error) => {
        setError(loadError.message);
        setViewState('error');
      });
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const task = await createTask({ title, description });
      setTasks((currentTasks) => [task, ...currentTasks]);
      setTitle('');
      setDescription('');
      setNotice('Task created.');
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    if (busyTaskId) {
      return;
    }

    setBusyTaskId(task.id);
    setError(null);
    setNotice(null);
    try {
      const updatedTask = await updateTask(task.id, {
        completed: !task.completed,
      });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask,
        ),
      );
      setNotice(updatedTask.completed ? 'Task completed.' : 'Task reopened.');
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDelete(task: Task) {
    if (busyTaskId) {
      return;
    }

    setBusyTaskId(task.id);
    setError(null);
    setNotice(null);
    try {
      await deleteTask(task.id);
      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask.id !== task.id),
      );
      setNotice('Task deleted.');
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">NOVA / Tasks</p>
          <h1>Make the next thing clear.</h1>
          <p className="page-summary">
            Capture work you intend to complete, then keep its state honest.
          </p>
        </div>
        <span className="connection-label">Live persistence</span>
      </header>

      <section className="workspace" aria-label="Task workspace">
        <form className="task-form" onSubmit={handleCreate}>
          <div className="section-heading">
            <div>
              <p className="section-kicker">New task</p>
              <h2>What needs doing?</h2>
            </div>
            <span className="required-note">Title required</span>
          </div>
          <label>
            Title
            <input
              aria-label="Task title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Write a clear next action"
              required
            />
          </label>
          <label>
            Description <span className="optional">Optional</span>
            <textarea
              aria-label="Task description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Add useful context"
            />
          </label>
          <button
            className="primary-button"
            type="submit"
            disabled={submitting || !title.trim()}
          >
            {submitting ? 'Saving...' : 'Create task'}
          </button>
        </form>

        <section className="task-list" aria-labelledby="tasks-heading">
          <div className="section-heading list-heading">
            <div>
              <p className="section-kicker">Your work</p>
              <h2 id="tasks-heading">Tasks</h2>
            </div>
            <span className="task-count">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {viewState === 'loading' && (
            <p className="state-message">Loading persisted tasks...</p>
          )}
          {viewState === 'error' && (
            <p className="state-message">
              Tasks could not be loaded. Check the backend and database
              connection.
            </p>
          )}
          {viewState === 'ready' && tasks.length === 0 && (
            <p className="state-message">
              No tasks yet. Add the first one when you are ready.
            </p>
          )}
          {tasks.length > 0 && (
            <ul className="tasks">
              {tasks.map((task) => (
                <li
                  className={`task-item ${task.completed ? 'is-complete' : ''}`}
                  key={task.id}
                >
                  <button
                    className="complete-button"
                    type="button"
                    aria-label={
                      task.completed
                        ? `Reopen ${task.title}`
                        : `Complete ${task.title}`
                    }
                    onClick={() => handleToggle(task)}
                    disabled={busyTaskId !== null}
                  >
                    {task.completed ? '✓' : ''}
                  </button>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <time dateTime={task.updatedAt}>
                      Updated {formatTaskDate(task.updatedAt)}
                    </time>
                  </div>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`Delete ${task.title}`}
                    onClick={() => handleDelete(task)}
                    disabled={busyTaskId !== null}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
