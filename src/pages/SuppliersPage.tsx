import { useEffect, useState } from 'react';
import { listSuppliers } from '../api/suppliers';
import type { Supplier } from '../api/suppliers';
import { getErrorMessage } from '../api/client';
import NewSupplierModal from '../components/NewSupplierModal';

const headerCellClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const cellClass = 'px-4 py-3 text-sm text-slate-700';

/** Formats an ISO timestamp as a readable local date and time. */
function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listSuppliers(includeInactive)
      .then((items) => {
        if (!cancelled) setSuppliers(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              'No se pudieron cargar los proveedores. Intenta nuevamente.'
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeInactive, reloadToken]);

  function handleSupplierCreated(supplier: Supplier) {
    if (includeInactive || supplier.isActive) {
      setSuppliers((prev) => [supplier, ...prev]);
    }
  }

  function handleIncludeInactiveChange(value: boolean) {
    setLoading(true);
    setError(null);
    setIncludeInactive(value);
  }

  function handleRetry() {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Proveedores</h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nuevo Proveedor
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => handleIncludeInactiveChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          Mostrar inactivos
        </label>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="ml-4 rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando proveedores…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={headerCellClass}>Nombre</th>
                <th className={headerCellClass}>Contacto</th>
                <th className={headerCellClass}>Notas</th>
                <th className={headerCellClass}>Estado</th>
                <th className={headerCellClass}>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className={`${cellClass} font-medium text-slate-900`}>
                    {supplier.name}
                  </td>
                  <td className={cellClass}>{supplier.contactInfo ?? '—'}</td>
                  <td className={`${cellClass} max-w-xs truncate`}>
                    {supplier.notes ?? '—'}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        supplier.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={cellClass}>
                    {formatDateTime(supplier.createdAt)}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <p>
                        {includeInactive
                          ? 'No hay proveedores registrados.'
                          : 'No hay proveedores activos registrados.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        + Registrar el primero
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <NewSupplierModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleSupplierCreated}
        />
      )}
    </div>
  );
}
