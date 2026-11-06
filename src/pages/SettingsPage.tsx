import { DropiConnectButton } from '../components/DropiConnectButton';

export function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl" style={{ padding: '1.5rem' }}>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Ajustes</h1>
      <h2 className="mb-4 text-xl font-medium text-slate-800">Conexión con Dropi</h2>
      <DropiConnectButton />
    </main>
  );
}