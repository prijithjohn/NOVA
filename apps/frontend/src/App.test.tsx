// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const task = {
  id: 'task-1',
  title: 'Review the persisted task',
  description: 'Confirm the API flow.',
  completed: false,
  createdAt: '2026-09-04T10:00:00Z',
  updatedAt: '2026-09-04T10:00:00Z',
};

describe('task workspace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates, completes, and deletes a task through the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([task]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...task, id: 'task-2', title: 'New task' }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...task,
            id: 'task-2',
            title: 'New task',
            completed: true,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

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
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('shows a meaningful empty state', async () => {
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
