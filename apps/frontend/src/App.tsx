import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
  createMemory,
  createTask,
  createTaskWithAssistant,
  deleteMemory,
  deleteTask,
  listMemories,
  listTasks,
  updateTask,
} from './api';
import type {
  Memory,
  Task,
  TaskPriority,
  TaskQuery,
  TaskSort,
  TaskStatus,
} from './api';
import './styles.css';

type ViewState = 'loading' | 'ready' | 'error';
type Domain = 'tasks' | 'memories';

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
  const [activeDomain, setActiveDomain] = useState<Domain>('tasks');
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

  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryViewState, setMemoryViewState] = useState<ViewState>('loading');
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [memoryContent, setMemoryContent] = useState('');
  const [memorySubmitting, setMemorySubmitting] = useState(false);
  const [busyMemoryId, setBusyMemoryId] = useState<string | null>(null);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeDomain !== 'memories') {
      return;
    }
    let active = true;
    setMemoryViewState('loading');
    setMemoryError(null);

    listMemories()
      .then((loadedMemories) => {
        if (active) {
          setMemories(loadedMemories);
          setMemoryViewState('ready');
        }
      })
      .catch((loadError: Error) => {
        if (active) {
          setMemoryError(loadError.message);
          setMemoryViewState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [activeDomain]);

  async function reloadMemories() {
    const loadedMemories = await listMemories();
    setMemories(loadedMemories);
    setMemoryViewState('ready');
  }

  async function handleCreateMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memoryContent.trim() || memorySubmitting) {
      return;
    }

    setMemorySubmitting(true);
    setMemoryError(null);
    setMemoryNotice(null);
    try {
      await createMemory({ content: memoryContent });
      await reloadMemories();
      setMemoryContent('');
      setMemoryNotice('Memory saved.');
    } catch (saveError) {
      setMemoryError((saveError as Error).message);
    } finally {
      setMemorySubmitting(false);
    }
  }

  async function handleDeleteMemory(memory: Memory) {
    if (busyMemoryId) {
      return;
    }

    setBusyMemoryId(memory.id);
    setMemoryError(null);
    setMemoryNotice(null);
    try {
      await deleteMemory(memory.id);
      await reloadMemories();
      setMemoryNotice('Memory deleted.');
    } catch (delError) {
      setMemoryError((delError as Error).message);
    } finally {
      setBusyMemoryId(null);
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
          <nav className="domain-nav" aria-label="Core domains">
            <button
              className={`domain-tab ${activeDomain === 'tasks' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveDomain('tasks')}
            >
              Tasks
            </button>
            <button
              className={`domain-tab ${activeDomain === 'memories' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveDomain('memories')}
            >
              Memory
            </button>
          </nav>
          <p className="eyebrow">
            {activeDomain === 'tasks' ? 'NOVA / Tasks' : 'NOVA / Memory'}
          </p>
          <h1>
            {activeDomain === 'tasks'
              ? 'Make the next thing clear.'
              : 'Remember what matters.'}
          </h1>
          <p className="page-summary">
            {activeDomain === 'tasks'
              ? 'Capture work you intend to complete, then keep its state honest.'
              : 'Capture durable context, preferences, and facts to preserve personal continuity.'}
          </p>
        </div>
        <span className="connection-label">Live persistence</span>
      </header>

      {activeDomain === 'tasks' && (
        <>
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
                onChange={(event) =>
                  setAssistantDescription(event.target.value)
                }
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
                  {tasks.length}{' '}
                  {tasks.length === 1 ? 'task shown' : 'tasks shown'}
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
                      updateQuery(
                        'priority',
                        event.target.value as TaskPriority,
                      )
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
                    onChange={(event) =>
                      updateQuery('search', event.target.value)
                    }
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
                <p className="state-message">
                  Loading tasks from the database...
                </p>
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
        </>
      )}

      {activeDomain === 'memories' && (
        <section
          className="workspace memory-workspace"
          aria-label="Memory workspace"
        >
          <form className="memory-form" onSubmit={handleCreateMemory}>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Durable context</p>
                <h2>Remember what matters</h2>
              </div>
              <span className="required-note">Content required</span>
            </div>
            <label>
              Memory content
              <textarea
                aria-label="Memory content"
                value={memoryContent}
                onChange={(event) => setMemoryContent(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Capture a durable preference, decision, or personal fact"
                required
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={memorySubmitting || !memoryContent.trim()}
            >
              {memorySubmitting ? 'Saving...' : 'Save memory'}
            </button>
          </form>

          <section className="memory-list" aria-labelledby="memories-heading">
            <div className="section-heading list-heading">
              <div>
                <p className="section-kicker">Stored context</p>
                <h2 id="memories-heading">Memories</h2>
              </div>
              <span className="task-count">
                {memories.length}{' '}
                {memories.length === 1 ? 'memory shown' : 'memories shown'}
              </span>
            </div>

            {memoryNotice && (
              <p className="notice" role="status">
                {memoryNotice}
              </p>
            )}
            {memoryError && (
              <p className="error-message" role="alert">
                {memoryError}
              </p>
            )}
            {memoryViewState === 'loading' && (
              <p className="state-message">
                Loading memories from the database...
              </p>
            )}
            {memoryViewState === 'error' && (
              <p className="state-message">
                Memories could not be loaded. Check the backend and database
                connection.
              </p>
            )}
            {memoryViewState === 'ready' && memories.length === 0 && (
              <p className="state-message">
                No memories saved yet. Capture durable context to remember what
                matters.
              </p>
            )}
            {memories.length > 0 && (
              <ul className="memories">
                {memories.map((memory) => (
                  <li className="memory-item" key={memory.id}>
                    <div className="memory-content">
                      <p>{memory.content}</p>
                      <time dateTime={memory.createdAt}>
                        Saved {formatTaskDate(memory.createdAt)}
                      </time>
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`Delete memory: ${memory.content}`}
                      onClick={() => handleDeleteMemory(memory)}
                      disabled={busyMemoryId !== null}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
