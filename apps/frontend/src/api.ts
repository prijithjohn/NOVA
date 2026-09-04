export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type TaskStatus = 'all' | 'active' | 'completed';
export type TaskSort = 'newest' | 'oldest';
export type TaskPriority = 'all' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskQuery {
  status: TaskStatus;
  priority: TaskPriority;
  search: string;
  sort: TaskSort;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(
  path: string,
  options?: Parameters<typeof fetch>[1],
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      body?.error ?? `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listTasks(query?: Partial<TaskQuery>): Promise<Task[]> {
  const params = new URLSearchParams();
  if (query?.status && query.status !== 'all') {
    params.set('status', query.status);
  }
  if (query?.priority && query.priority !== 'all') {
    params.set('priority', query.priority);
  }
  if (query?.search?.trim()) {
    params.set('search', query.search.trim());
  }
  if (query?.sort && query.sort !== 'newest') {
    params.set('sort', query.sort);
  }
  const queryString = params.toString();
  return request<Task[]>(`/tasks${queryString ? `?${queryString}` : ''}`);
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}
