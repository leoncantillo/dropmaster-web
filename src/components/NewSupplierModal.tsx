import { useState } from 'react';
import type { FormEvent } from 'react';
import { createSupplier } from '../api/suppliers';
import type { Supplier } from '../api/suppliers';
import { getErrorMessage } from '../api/client';

interface NewSupplierModalProps {
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
}

export default function NewSupplierModal({
  onClose,
  onSuccess,
}: NewSupplierModalProps) {
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedContact = contactInfo.trim();

    if (!trimmedName) {
      setError('El nombre del proveedor es obligatorio.');
      return;
    }
    if (trimmedName.length > 150) {
      setError('El nombre del proveedor no puede superar 150 caracteres.');
      return;
    }
    if (trimmedContact.length > 255) {
      setError(
        'La información de contacto no puede superar 255 caracteres.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const supplier = await createSupplier({
        name: trimmedName,
        contactInfo: trimmedContact ? trimmedContact : null,
        notes: notes.trim() ? notes.trim() : null,
        isActive,
      });
      onSuccess(supplier);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'No se pudo crear el proveedor. Intenta nuevamente.'
        )
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
          Nuevo Proveedor
        </h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              maxLength={150}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Información de Contacto{' '}
              <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className={inputClass}
              maxLength={255}
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

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            Estado Activo
          </label>

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
              {submitting ? 'Creando…' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
