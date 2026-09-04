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
  createdAt: '2026-09-04T10:00:00Z',
  updatedAt: '2026-09-04T10:00:00Z',
};

const completedTask = {
  id: 'task-2',
  title: 'Close the old task',
  description: 'This one is already done.',
  completed: true,
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
          JSON.stringify({ ...activeTask, id: 'task-3', title: 'New task' }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            activeTask,
            { ...activeTask, id: 'task-3', title: 'New task' },
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
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            activeTask,
            { ...activeTask, id: 'task-3', title: 'New task', completed: true },
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

    await user.type(screen.getByLabelText('Task title'), 'New task');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(await screen.findByText('Task created.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete New task' }));
    expect(await screen.findByText('Task completed.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete New task' }));
    expect(await screen.findByText('Task deleted.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(7);
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
      screen.getByLabelText('Task sort order'),
      'oldest',
    );
    await screen.findByText('Close the old task');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks?status=completed&sort=oldest',
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
      '/api/tasks?status=completed&search=missing&sort=oldest',
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
});
