import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
  createTask,
  createTaskWithAssistant,
  deleteTask,
  listTasks,
  updateTask,
} from './api';
import type {
  Task,
  TaskPriority,
  TaskQuery,
  TaskSort,
  TaskStatus,
} from './api';
import './styles.css';

type ViewState = 'loading' | 'ready' | 'error';

export function formatTaskDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const initialQuery: TaskQuery = {
  status: 'all',
  priority: 'all',
  search: '',
  sort: 'newest',
};

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState<TaskQuery>(initialQuery);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] =
    useState<Exclude<TaskPriority, 'all'>>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assistantTitle, setAssistantTitle] = useState('');
  const [assistantDescription, setAssistantDescription] = useState('');
  const [assistantPriority, setAssistantPriority] =
    useState<Exclude<TaskPriority, 'all'>>('MEDIUM');
  const [assistantState, setAssistantState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantResult, setAssistantResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setViewState('loading');
    setError(null);

    listTasks(query)
      .then((loadedTasks) => {
        if (active) {
          setTasks(loadedTasks);
          setViewState('ready');
        }
      })
      .catch((loadError: Error) => {
        if (active) {
          setError(loadError.message);
          setViewState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  function updateQuery<K extends keyof TaskQuery>(key: K, value: TaskQuery[K]) {
    setQuery((currentQuery) => ({ ...currentQuery, [key]: value }));
    setNotice(null);
  }

  async function reloadCurrentView() {
    const loadedTasks = await listTasks(query);
    setTasks(loadedTasks);
    setViewState('ready');
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await createTask({ title, description, priority: newTaskPriority });
      await reloadCurrentView();
      setTitle('');
      setDescription('');
      setNewTaskPriority('MEDIUM');
      setNotice('Task created.');
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssistantCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assistantTitle.trim() || assistantState === 'loading') {
      return;
    }

    setAssistantState('loading');
    setAssistantError(null);
    setAssistantResult(null);
    try {
      const response = await createTaskWithAssistant(
        assistantTitle,
        assistantDescription,
        assistantPriority,
        crypto.randomUUID(),
      );
      await reloadCurrentView();
      setAssistantTitle('');
      setAssistantDescription('');
      setAssistantPriority('MEDIUM');
      setAssistantResult(
        `${response.replayed ? 'Existing' : 'Created'} task: ${response.result.title}`,
      );
      setAssistantState('success');
    } catch (assistantActionError) {
      setAssistantError((assistantActionError as Error).message);
      setAssistantState('error');
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
      await reloadCurrentView();
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
      await reloadCurrentView();
      setNotice('Task deleted.');
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setBusyTaskId(null);
    }
  }

  const hasQuery =
    query.status !== 'all' ||
    query.priority !== 'all' ||
    query.search.trim() !== '';

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

      <form className="assistant-panel" onSubmit={handleAssistantCreate}>
        <div className="section-heading">
          <div>
            <p className="section-kicker">Assistant action</p>
            <h2>Create a task</h2>
          </div>
          <span className="required-note">Controlled tool</span>
        </div>
        <div className="assistant-fields">
          <label>
            Task title
            <input
              aria-label="Assistant task title"
              value={assistantTitle}
              onChange={(event) => setAssistantTitle(event.target.value)}
              maxLength={200}
              placeholder="Ask NOVA to create a task"
              required
            />
          </label>
          <label>
            Priority
            <select
              aria-label="Assistant task priority"
              value={assistantPriority}
              onChange={(event) =>
                setAssistantPriority(
                  event.target.value as Exclude<TaskPriority, 'all'>,
                )
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
        <label>
          Context <span className="optional">Optional</span>
          <textarea
            aria-label="Assistant task description"
            value={assistantDescription}
            onChange={(event) => setAssistantDescription(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Add task context"
          />
        </label>
        <button
          className="primary-button assistant-submit"
          type="submit"
          disabled={assistantState === 'loading' || !assistantTitle.trim()}
        >
          {assistantState === 'loading'
            ? 'Working...'
            : 'Create with Assistant'}
        </button>
        {assistantResult && (
          <p className="notice" role="status">
            {assistantResult}
          </p>
        )}
        {assistantError && (
          <p className="error-message" role="alert">
            {assistantError}
          </p>
        )}
      </form>

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
          <label>
            Priority
            <select
              aria-label="New task priority"
              value={newTaskPriority}
              onChange={(event) =>
                setNewTaskPriority(
                  event.target.value as Exclude<TaskPriority, 'all'>,
                )
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
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
              {tasks.length} {tasks.length === 1 ? 'task shown' : 'tasks shown'}
            </span>
          </div>

          <div className="task-controls" aria-label="Task query controls">
            <label>
              Filter
              <select
                aria-label="Task status filter"
                value={query.status}
                onChange={(event) =>
                  updateQuery('status', event.target.value as TaskStatus)
                }
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label>
              Priority
              <select
                aria-label="Task priority filter"
                value={query.priority}
                onChange={(event) =>
                  updateQuery('priority', event.target.value as TaskPriority)
                }
              >
                <option value="all">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label>
              Search
              <input
                aria-label="Search tasks"
                value={query.search}
                onChange={(event) => updateQuery('search', event.target.value)}
                placeholder="Title or description"
              />
            </label>
            <label>
              Sort
              <select
                aria-label="Task sort order"
                value={query.sort}
                onChange={(event) =>
                  updateQuery('sort', event.target.value as TaskSort)
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
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
            <p className="state-message">Loading tasks from the database...</p>
          )}
          {viewState === 'error' && (
            <p className="state-message">
              Tasks could not be loaded. Check the backend and database
              connection.
            </p>
          )}
          {viewState === 'ready' && tasks.length === 0 && (
            <p className="state-message">
              {hasQuery
                ? 'No matching tasks. Try a different filter or search.'
                : 'No tasks yet. Add the first one when you are ready.'}
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
                    <div className="task-title-row">
                      <h3>{task.title}</h3>
                      <span
                        className={`priority-badge priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>
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
