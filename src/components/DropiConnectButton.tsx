/**
 * DropiConnectButton — minimal UI for connecting/disconnecting a Dropi account.
 *
 * Reads the connection status from GET /api/dropi/status.
 * Initiates connection via GET /api/dropi/connect (redirects to Dropi OAuth).
 * Disconnects via POST /api/dropi/disconnect.
 *
 * Uses the X-Admin-Key header from VITE_ADMIN_API_KEY env var.
 * The status query param (?dropi=connected|error) from the OAuth callback
 * is read from the URL to update the display after redirect.
 */

import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY ?? '';

type ConnectionStatus = 'loading' | 'not_connected' | 'CONNECTED' | 'NEEDS_REAUTH' | 'REVOKED';

async function fetchStatus(): Promise<ConnectionStatus> {
  const res = await fetch(`${API_BASE}/api/dropi/status`, {
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  if (!res.ok) return 'not_connected';
  const data = await res.json();
  return data.status ?? (data.connected ? 'CONNECTED' : 'not_connected');
}

async function disconnect(): Promise<void> {
  await fetch(`${API_BASE}/api/dropi/disconnect`, {
    method: 'POST',
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
}

export function DropiConnectButton() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [working, setWorking] = useState(false);
  // Read ?dropi=connected|error from URL after OAuth redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dropiParam = params.get('dropi');
    if (dropiParam) {
      // Clean the URL without reloading.
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetchStatus().then(setStatus);
  }, []);

  const handleConnect = async () => {
    setWorking(true);
    try {
      // POST returns { authUrl }; we then redirect the browser.
      const res = await fetch(`${API_BASE}/api/dropi/connect`, {
        method: 'POST',
        headers: { 'X-Admin-Key': ADMIN_KEY },
      });
      if (!res.ok) throw new Error('Failed to start Dropi connection');
      const { authUrl } = (await res.json()) as { authUrl: string };
      window.location.href = authUrl;
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    setWorking(true);
    try {
      await disconnect();
      setStatus('not_connected');
    } finally {
      setWorking(false);
    }
  };

  if (status === 'loading') {
    return <span style={styles.badge('gray')}>Verificando conexión Dropi…</span>;
  }

  if (status === 'CONNECTED') {
    return (
      <div style={styles.row}>
        <span style={styles.badge('green')}>✅ Dropi conectado</span>
        <button style={styles.btn('red')} onClick={handleDisconnect} disabled={working}>
          {working ? 'Desconectando…' : 'Desconectar'}
        </button>
      </div>
    );
  }

  if (status === 'NEEDS_REAUTH') {
    return (
      <div style={styles.row}>
        <span style={styles.badge('orange')}>⚠ Dropi requiere reconexión</span>
        <button style={styles.btn('blue')} onClick={handleConnect}>
          Reconectar
        </button>
      </div>
    );
  }

  return (
    <div style={styles.row}>
      <span style={styles.badge('gray')}>— Dropi no conectado</span>
      <button style={styles.btn('blue')} onClick={handleConnect}>
        Conectar Dropi
      </button>
    </div>
  );
}

// Minimal inline styles — replace with your design system.
const styles = {
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem' } as React.CSSProperties,
  badge: (color: string): React.CSSProperties => ({
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    background: color === 'green' ? '#d1fae5' : color === 'orange' ? '#fef3c7' : '#f3f4f6',
    color: color === 'green' ? '#065f46' : color === 'orange' ? '#92400e' : '#374151',
  }),
  btn: (color: string): React.CSSProperties => ({
    padding: '0.35rem 0.85rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    background: color === 'blue' ? '#2563eb' : '#ef4444',
    color: '#fff',
  }),
};
