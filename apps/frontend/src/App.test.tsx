// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const activeTask = {
  id: 'task-1',
  title: 'Review the persisted task',
  description: 'Confirm the API flow.',
  completed: false,
  priority: 'MEDIUM' as const,
  createdAt: '2026-09-04T10:00:00Z',
  updatedAt: '2026-09-04T10:00:00Z',
};

const completedTask = {
  id: 'task-2',
  title: 'Close the old task',
  description: 'This one is already done.',
  completed: true,
  priority: 'HIGH' as const,
  createdAt: '2026-09-04T11:00:00Z',
  updatedAt: '2026-09-04T11:00:00Z',
};

describe('task workspace', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates, completes, and deletes a task through the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([activeTask]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...activeTask,
            id: 'task-3',
            title: 'New task',
            priority: 'HIGH',
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            activeTask,
            {
              ...activeTask,
              id: 'task-3',
              title: 'New task',
              priority: 'HIGH',
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...activeTask,
            id: 'task-3',
            title: 'New task',
            completed: true,
            priority: 'HIGH',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            activeTask,
            {
              ...activeTask,
              id: 'task-3',
              title: 'New task',
              completed: true,
              priority: 'HIGH',
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([activeTask]), { status: 200 }),
      );

    render(<App />);
    expect(
      await screen.findByText('Review the persisted task'),
    ).toBeInTheDocument();

    const taskTitleInput = screen
      .getAllByRole('textbox')
      .find((element) => element.getAttribute('aria-label') === 'Task title');
    await user.type(taskTitleInput!, 'New task');
    await user.selectOptions(
      screen.getByLabelText('New task priority'),
      'HIGH',
    );
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(await screen.findByText('Task created.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete New task' }));
    expect(await screen.findByText('Task completed.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete New task' }));
    expect(await screen.findByText('Task deleted.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(fetchMock.mock.calls[1][1]?.body).toBe(
      JSON.stringify({ title: 'New task', description: '', priority: 'HIGH' }),
    );
  });

  it('sends filter, search, and sort changes to the backend', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([activeTask, completedTask]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([completedTask]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([completedTask]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([completedTask]), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    render(<App />);
    expect(
      await screen.findByText('Review the persisted task'),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Task status filter'),
      'completed',
    );
    expect(await screen.findByText('Close the old task')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks?status=completed',
      expect.anything(),
    );

    await user.selectOptions(
      screen.getByLabelText('Task priority filter'),
      'HIGH',
    );
    await screen.findByText('Close the old task');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks?status=completed&priority=HIGH',
      expect.anything(),
    );

    await user.selectOptions(
      screen.getByLabelText('Task sort order'),
      'oldest',
    );
    await screen.findByText('Close the old task');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks?status=completed&priority=HIGH&sort=oldest',
      expect.anything(),
    );

    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: { value: 'missing' },
    });
    expect(
      await screen.findByText(
        'No matching tasks. Try a different filter or search.',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks?status=completed&priority=HIGH&search=missing&sort=oldest',
      expect.anything(),
    );
  });

  it('shows a meaningful empty state without active filters', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('[]', { status: 200 }),
    );

    render(<App />);

    expect(
      await screen.findByText(
        'No tasks yet. Add the first one when you are ready.',
      ),
    ).toBeInTheDocument();
  });

  it('submits a create-task action and shows the assistant result', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            action: 'create_task',
            tool: 'create_task',
            idempotencyKey: 'assistant-key',
            status: 'completed',
            replayed: false,
            result: {
              ...activeTask,
              id: 'assistant-task',
              title: 'Assistant task',
              priority: 'HIGH',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );
    await user.type(
      screen.getByLabelText('Assistant task title'),
      'Assistant task',
    );
    await user.selectOptions(
      screen.getByLabelText('Assistant task priority'),
      'HIGH',
    );
    await user.click(
      screen.getByRole('button', { name: 'Create with Assistant' }),
    );

    expect(
      await screen.findByText('Created task: Assistant task'),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('/api/assistant/actions');
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string).tool).toBe(
      'create_task',
    );
  });

  it('shows assistant loading and error states', async () => {
    const user = userEvent.setup();
    let rejectAction: (error: Error) => void = () => undefined;
    const actionPromise = new Promise<Response>((_, reject) => {
      rejectAction = reject;
    });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockReturnValueOnce(actionPromise);

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );
    await user.type(screen.getByLabelText('Assistant task title'), 'Will fail');
    await user.click(
      screen.getByRole('button', { name: 'Create with Assistant' }),
    );
    expect(screen.getByRole('button', { name: 'Working...' })).toBeDisabled();
    rejectAction(new Error('Assistant action failed'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assistant action failed',
    );
  });

  it('creates, lists, and deletes a memory through the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const existingMemory = {
      id: 'mem-1',
      content: 'User prefers concise answers.',
      createdAt: '2026-09-04T10:00:00Z',
      updatedAt: '2026-09-04T10:00:00Z',
    };
    const newMemory = {
      id: 'mem-2',
      content: 'Prefers dark mode.',
      createdAt: '2026-09-04T10:05:00Z',
      updatedAt: '2026-09-04T10:05:00Z',
    };

    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockResolvedValueOnce(
        new Response(JSON.stringify([existingMemory]), { status: 200 }), // memories on switch
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(newMemory), { status: 201 }), // create memory
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([existingMemory, newMemory]), {
          status: 200,
        }), // reload memories
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // delete memory
      .mockResolvedValueOnce(
        new Response(JSON.stringify([newMemory]), { status: 200 }), // reload memories
      );

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Memory' }));
    expect(
      await screen.findByText('User prefers concise answers.'),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Memory content'),
      'Prefers dark mode.',
    );
    await user.click(screen.getByRole('button', { name: 'Save memory' }));
    expect(await screen.findByText('Memory saved.')).toBeInTheDocument();
    expect(await screen.findByText('Prefers dark mode.')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Delete memory: User prefers concise answers.',
      }),
    );
    expect(await screen.findByText('Memory deleted.')).toBeInTheDocument();
    expect(
      screen.queryByText('User prefers concise answers.'),
    ).not.toBeInTheDocument();
  });

  it('shows memory loading, empty, and error states', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockResolvedValueOnce(new Response('[]', { status: 200 })); // memories on switch

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Memory' }));
    expect(
      await screen.findByText(
        'No memories saved yet. Capture durable context to remember what matters.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('0 memories shown')).toBeInTheDocument();
  });

  it('shows memory error states when request fails', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockRejectedValueOnce(new Error('Failed to load memories'));

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Memory' }));
    expect(
      await screen.findByText(
        'Memories could not be loaded. Check the backend and database connection.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load memories',
    );
  });

  it('sends chat message to assistant and displays reply', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ reply: 'Hello from Ollama' }), {
          status: 200,
        }),
      );

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Assistant' }));
    expect(
      screen.getByText(
        'Send a message to the local AI provider and receive a direct reply.',
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Your message'), 'Hello AI');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Hello from Ollama')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/assistant/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Hello AI' }),
      }),
    );
  });

  it('shows error when assistant chat fails', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockRejectedValueOnce(new Error('AI provider unavailable'));

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Assistant' }));
    await user.type(screen.getByLabelText('Your message'), 'Test question');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AI provider unavailable',
    );
  });

  it('displays created task badge when assistant chat creates a task', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const createdTask = {
      id: 'task-100',
      title: 'Apply for backend jobs',
      description: 'Send resume',
      completed: false,
      priority: 'HIGH' as const,
      createdAt: '2026-09-05T10:00:00Z',
      updatedAt: '2026-09-05T10:00:00Z',
    };

    fetchMock
      .mockResolvedValueOnce(new Response('[]', { status: 200 })) // tasks on mount
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reply: 'Task created successfully.',
            action: 'create_task',
            task: createdTask,
          }),
          { status: 200 },
        ),
      );

    render(<App />);
    await screen.findByText(
      'No tasks yet. Add the first one when you are ready.',
    );

    await user.click(screen.getByRole('button', { name: 'Assistant' }));
    await user.type(
      screen.getByLabelText('Your message'),
      'Create a task to apply for backend jobs',
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(
      await screen.findByText('Task created successfully.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Apply for backend jobs'),
    ).toBeInTheDocument();
  });
});



