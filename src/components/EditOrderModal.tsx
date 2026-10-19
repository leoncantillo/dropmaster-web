import { useState } from 'react';
import type { FormEvent } from 'react';
import { updateOrder } from '../api/orders';
import type { Order } from '../api/orders';
import { getErrorMessage } from '../api/client';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export default function EditOrderModal({
  order,
  onClose,
  onSuccess,
}: EditOrderModalProps) {
  const [shippingFee, setShippingFee] = useState(String(order.shippingFee));
  const [discountPercent, setDiscountPercent] = useState(
    String(Number((order.discountPercentage * 100).toFixed(2)))
  );
  const [notes, setNotes] = useState(order.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fee = Number(shippingFee);
    const discount =
      discountPercent.trim() === '' ? 0 : Number(discountPercent);

    if (!Number.isFinite(fee) || fee < 0) {
      setError('El flete cobrado debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setError('El descuento debe ser un número entre 0 y 100.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateOrder(order.id, {
        shippingFee: fee,
        discountPercentage: discount / 100,
        notes: notes.trim() ? notes.trim() : null,
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(err, 'No se pudo actualizar la orden. Intenta nuevamente.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Editar Orden
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          ID en Dropi: <span className="font-medium">{order.dropiOrderId}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Flete Cobrado (COP)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descuento Aplicado (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notas <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
