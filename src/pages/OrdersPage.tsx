import { useEffect, useState } from 'react';
import { deleteOrder, listOrders } from '../api/orders';
import { DropiConnectButton } from '../components/DropiConnectButton';
import type { Order } from '../api/orders';
import { getErrorMessage } from '../api/client';
import { formatCOP, formatPercent } from '../utils/format';
import NewOrderModal from '../components/NewOrderModal';
import EditOrderModal from '../components/EditOrderModal';

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      listOrders(search)
        .then((items) => {
          if (!cancelled) setOrders(items);
        })
        .catch(() => {
          if (!cancelled) {
            setError('No se pudieron cargar las órdenes.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, reloadToken]);

  async function handleDelete(order: Order) {
    const confirmed = window.confirm(
      `¿Eliminar la orden ${order.dropiOrderId}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleting(order);
    setDeleteError(null);
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
    } catch (err) {
      setDeleteError(
        getErrorMessage(err, 'No se pudo eliminar la orden. Intenta nuevamente.')
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <DropiConnectButton />
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nueva Orden
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID de Dropi o notas…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="ml-4 rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando órdenes…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={headerCellClass}>ID Dropi</th>
                <th className={headerCellClass}>Flete Cobrado</th>
                <th className={headerCellClass}>Descuento</th>
                <th className={headerCellClass}>Notas</th>
                <th className={headerCellClass}>Fecha de Registro</th>
                <th className={headerCellClass} aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className={`${cellClass} font-medium text-slate-900`}>
                    {order.dropiOrderId}
                  </td>
                  <td className={cellClass}>
                    {formatCOP(order.shippingFee)}
                  </td>
                  <td className={cellClass}>
                    {formatPercent(order.discountPercentage * 100)}
                  </td>
                  <td className={`${cellClass} max-w-xs truncate`}>
                    {order.notes ?? '—'}
                  </td>
                  <td className={cellClass}>
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className={`${cellClass} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(order)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        disabled={deleting?.id === order.id}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleting?.id === order.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No hay órdenes registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {newOpen && (
        <NewOrderModal
          onClose={() => setNewOpen(false)}
          onSuccess={(order) => setOrders((prev) => [order, ...prev])}
        />
      )}

      {editing && (
        <EditOrderModal
          order={editing}
          onClose={() => setEditing(null)}
          onSuccess={(updated) =>
            setOrders((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            )
          }
        />
      )}
    </div>
  );
}
