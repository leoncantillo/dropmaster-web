import { useState } from 'react';
import type { FormEvent } from 'react';
import { createOrder } from '../api/orders';
import type { Order } from '../api/orders';
import { getErrorMessage } from '../api/client';

interface NewOrderModalProps {
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export default function NewOrderModal({
  onClose,
  onSuccess,
}: NewOrderModalProps) {
  const [dropiOrderId, setDropiOrderId] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const id = dropiOrderId.trim();
    const fee = Number(shippingFee);
    const discount =
      discountPercent.trim() === '' ? 0 : Number(discountPercent);

    if (!id) {
      setError('El ID de la orden en Dropi es obligatorio.');
      return;
    }
    if (id.length > 100) {
      setError('El ID de la orden en Dropi no puede superar 100 caracteres.');
      return;
    }
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
      const order = await createOrder({
        dropiOrderId: id,
        shippingFee: fee,
        discountPercentage: discount / 100,
        notes: notes.trim() ? notes.trim() : null,
      });
      onSuccess(order);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(err, 'No se pudo crear la orden. Intenta nuevamente.')
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
          Nueva Orden
        </h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              ID de Orden en Dropi
            </label>
            <input
              type="text"
              value={dropiOrderId}
              onChange={(e) => setDropiOrderId(e.target.value)}
              className={inputClass}
              maxLength={100}
              required
            />
          </div>

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
              Descuento Aplicado (%){' '}
              <span className="text-slate-400">(opcional)</span>
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
              {submitting ? 'Creando…' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
