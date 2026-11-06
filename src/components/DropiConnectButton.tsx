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

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY ?? '';

// This is the only redirect. If Dropi changes its login domain, update this.
const DROPI_AUTH_ORIGIN = 'https://oauth.dropi.co';

type ConnectionStatus = 'loading' | 'not_connected' | 'CONNECTED' | 'NEEDS_REAUTH' | 'REVOKED' | 'error';

const MSG_KEY_MISMATCH =
  'La clave de administración no coincide con la de la API. Revisa VITE_ADMIN_API_KEY y reinicia Vite.';
const MSG_NO_API = 'No se pudo conectar con la API. Comprueba que esté encendida.';

function describeError(e: unknown): string {
  if (e instanceof TypeError) return MSG_NO_API; // fallo de red o de CORS
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}

function isDropiAuthUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).origin === DROPI_AUTH_ORIGIN;
  } catch {
    return false;
  }
}

async function fetchStatus(): Promise<ConnectionStatus> {
  const res = await fetch(`${API_BASE}/dropi/status`, {
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  if (res.status === 401) throw new Error(MSG_KEY_MISMATCH);
  if (!res.ok) throw new Error('La API respondió con un error al consultar Dropi. Revisa la consola de la API.');
  const data = await res.json();
  return data.status ?? (data.connected ? 'CONNECTED' : 'not_connected');
}

async function disconnect(): Promise<void> {
  const res = await fetch(`${API_BASE}/dropi/disconnect`, {
    method: 'POST',
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  if (res.status === 401) throw new Error(MSG_KEY_MISMATCH);
  if (!res.ok) throw new Error('No se pudo desconectar Dropi. Revisa la consola de la API.');
}

export function DropiConnectButton() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setStatus('loading');
    try {
      setStatus(await fetchStatus());
    } catch (e) {
      setMessage(describeError(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // Reads ?dropi=connected|error after returning from Dropi and clears the URL without reloading.
    const dropiParam = new URLSearchParams(window.location.search).get('dropi');
    if (dropiParam) {
      window.history.replaceState({}, '', window.location.pathname);
      if (dropiParam === 'error') {
        setMessage('No se pudo completar la conexión con Dropi. Inténtalo de nuevo.');
      }
    }
    void loadStatus();

    // If the user uses the “Back” button to return from Dropi, the browser may
    // reload the page with the button still locked.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setWorking(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [loadStatus]);

  const handleConnect = async () => {
    if (working) return;
    setWorking(true);
    setMessage(null);
    try {
      // The POST request returns { authUrl }; the browser is then redirected.
      const res = await fetch(`${API_BASE}/dropi/connect`, {
        method: 'POST',
        headers: { 'X-Admin-Key': ADMIN_KEY },
      });
      if (res.status === 401) throw new Error(MSG_KEY_MISMATCH);
      if (!res.ok) throw new Error('No se pudo iniciar la conexión con Dropi. Revisa la consola de la API.');

      const body = (await res.json()) as { authUrl?: unknown };
      if (!isDropiAuthUrl(body.authUrl)) {
        throw new Error('La API devolvió una dirección de login que no es de Dropi, así que no se redirigió.');
      }

      // The button is not re-enabled: the page is redirecting to Dropi.
      window.location.href = body.authUrl;
    } catch (e) {
      setMessage(describeError(e));
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (working) return;
    const ok = window.confirm(
      '¿Desconectar Dropi? Para volver a conectar tendrás que iniciar sesión con tu autenticador.'
    );
    if (!ok) return;

    setWorking(true);
    setMessage(null);
    try {
      await disconnect();
      setStatus('not_connected');
    } catch (e) {
      setMessage(describeError(e));
    } finally {
      setWorking(false);
    }
  };

  const renderStatus = () => {
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
          <button style={styles.btn('blue')} onClick={handleConnect} disabled={working}>
            {working ? 'Abriendo Dropi…' : 'Reconectar'}
          </button>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div style={styles.row}>
          <span style={styles.badge('orange')}>No se pudo consultar el estado de Dropi</span>
          <button style={styles.btn('blue')} onClick={() => void loadStatus()}>
            Reintentar
          </button>
        </div>
      );
    }

    // 'not_connected' and 'REVOKED'
    return (
      <div style={styles.row}>
        <span style={styles.badge('gray')}>— Dropi no conectado</span>
        <button style={styles.btn('blue')} onClick={handleConnect} disabled={working}>
          {working ? 'Abriendo Dropi…' : 'Conectar Dropi'}
        </button>
      </div>
    );
  };

  return (
    <div style={styles.column}>
      {renderStatus()}
      {message && (
        <span role="alert" style={styles.badge('orange')}>
          {message}
        </span>
      )}
    </div>
  );
}

// Minimal inline styles — replace with your design system.
const styles = {
  column: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' } as CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem' } as CSSProperties,
  badge: (color: string): CSSProperties => ({
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    background: color === 'green' ? '#d1fae5' : color === 'orange' ? '#fef3c7' : '#f3f4f6',
    color: color === 'green' ? '#065f46' : color === 'orange' ? '#92400e' : '#374151',
  }),
  btn: (color: string): CSSProperties => ({
    padding: '0.35rem 0.85rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    background: color === 'blue' ? '#2563eb' : '#ef4444',
    color: '#fff',
  }),
};