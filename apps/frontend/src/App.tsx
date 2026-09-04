import { useEffect, useState } from 'react';

import './styles.css';

type ConnectionState = 'checking' | 'connected' | 'unavailable';

interface HealthResponse {
  status: 'ok';
  service: 'backend';
}

export function getHealthLabel(state: ConnectionState): string {
  if (state === 'connected') {
    return 'Backend connected';
  }

  if (state === 'unavailable') {
    return 'Backend unavailable';
  }

  return 'Checking backend';
}

async function checkBackend(): Promise<HealthResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
  const response = await fetch(`${baseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export function App() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('checking');

  useEffect(() => {
    let active = true;

    checkBackend()
      .then((health) => {
        if (active && health.status === 'ok' && health.service === 'backend') {
          setConnectionState('connected');
        }
      })
      .catch(() => {
        if (active) {
          setConnectionState('unavailable');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Personal AI Operating System</p>
        <h1 id="page-title">NOVA</h1>
        <p className="summary">
          A clear foundation for thinking, planning, remembering, and acting.
        </p>
      </section>
      <section className="status-panel" aria-live="polite">
        <span
          className={`status-dot status-${connectionState}`}
          aria-hidden="true"
        />
        <div>
          <p className="status-label">{getHealthLabel(connectionState)}</p>
          <p className="status-detail">
            {connectionState === 'connected'
              ? 'The frontend can reach the NOVA backend.'
              : 'The foundation is checking the local service connection.'}
          </p>
        </div>
      </section>
    </main>
  );
}
