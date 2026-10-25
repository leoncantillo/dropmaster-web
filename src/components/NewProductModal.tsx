import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listSuppliers } from '../api/suppliers';
import type { Supplier } from '../api/suppliers';
import { createProduct } from '../api/products';
import type { Product } from '../api/products';
import NewSupplierModal from './NewSupplierModal';

interface NewProductModalProps {
  onClose: () => void;
  onSuccess: (product: Product) => void;
}

export default function NewProductModal({
  onClose,
  onSuccess,
}: NewProductModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [name, setName] = useState('');
  const [supplierPrice, setSupplierPrice] = useState('');
  const [dropiId, setDropiId] = useState('');
  const [details, setDetails] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSuppliers()
      .then((items) => {
        if (cancelled) return;
        setSuppliers(items);
        const first = items[0];
        if (first) setSupplierId(first.id);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar la lista de proveedores.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSuppliers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSupplierCreated(supplier: Supplier) {
    setSuppliers((prev) => [...prev, supplier]);
    setSupplierId(supplier.id);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const price = Number(supplierPrice);
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (!supplierId) {
      setError('Debes seleccionar un proveedor.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('El precio proveedor debe ser un número mayor que 0.');
      return;
    }

    setSubmitting(true);
    try {
      const product = await createProduct({
        supplierId,
        name: name.trim(),
        supplierPrice: price,
        dropiId: dropiId.trim() ? dropiId.trim() : null,
        details: details.trim() ? details.trim() : null,
      });
      onSuccess(product);
      onClose();
    } catch {
      setError('No se pudo crear el producto. Intenta nuevamente.');
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
          Nuevo Producto
        </h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Proveedor
            </label>
            <div className="flex items-center gap-2">
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
                required
              >
                {loadingSuppliers && <option value="">Cargando…</option>}
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewSupplierOpen(true)}
                className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Nuevo
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Precio Proveedor (COP)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={supplierPrice}
              onChange={(e) => setSupplierPrice(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              ID Dropi <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={dropiId}
              onChange={(e) => setDropiId(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Detalles <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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
              disabled={submitting || loadingSuppliers}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creando…' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>

      {newSupplierOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <NewSupplierModal
            onClose={() => setNewSupplierOpen(false)}
            onSuccess={handleSupplierCreated}
          />
        </div>
      )}
    </div>
  );
}
