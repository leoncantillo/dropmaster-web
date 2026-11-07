import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listSuppliers } from '../api/suppliers';
import type { Supplier } from '../api/suppliers';
import { createProduct } from '../api/products';
import type { Product, ProductVariationInput } from '../api/products';
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
  const [variations, setVariations] = useState<ProductVariationInput[]>([]);
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

  function handleAddVariation() {
    setVariations((prev) => [
      ...prev,
      {
        name: `Variante ${prev.length + 1}`,
        sku: '',
        stockQuantity: 0,
        supplierPrice: undefined,
      },
    ]);
  }

  function handleRemoveVariation(index: number) {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVariationChange(index: number, field: keyof ProductVariationInput, value: unknown) {
    setVariations((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
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

    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.name.trim()) {
        setError(`El nombre de la variante #${i + 1} no puede estar vacío.`);
        return;
      }
      if (v.supplierPrice !== undefined && v.supplierPrice !== null && v.supplierPrice <= 0) {
        setError(`El precio de la variante #${i + 1} debe ser mayor que 0.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const product = await createProduct({
        supplierId,
        name: name.trim(),
        supplierPrice: price,
        dropiId: dropiId.trim() ? dropiId.trim() : null,
        details: details.trim() ? details.trim() : null,
        variations: variations.length > 0 ? variations : undefined,
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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
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
              Precio Proveedor Base (COP)
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

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">
                Variaciones <span className="text-slate-400">({variations.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddVariation}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Añadir Variante
              </button>
            </div>

            {variations.length === 0 ? (
              <p className="text-xs text-slate-500">
                Opcional: Si el producto tiene tallas, colores u otras opciones, añádelas aquí.
              </p>
            ) : (
              <div className="space-y-3">
                {variations.map((v, idx) => (
                  <div key={idx} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Variante #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-slate-600">Nombre / Título</label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => handleVariationChange(idx, 'name', e.target.value)}
                          placeholder="p. ej. M / Rojo"
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-600">SKU</label>
                        <input
                          type="text"
                          value={v.sku ?? ''}
                          onChange={(e) => handleVariationChange(idx, 'sku', e.target.value || null)}
                          placeholder="SKU-001"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-600">Stock Inicial</label>
                        <input
                          type="number"
                          min="0"
                          value={v.stockQuantity ?? 0}
                          onChange={(e) => handleVariationChange(idx, 'stockQuantity', Number(e.target.value))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-600">Precio Proveedor (Override)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={v.supplierPrice ?? ''}
                          onChange={(e) =>
                            handleVariationChange(
                              idx,
                              'supplierPrice',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="Igual al padre si vacío"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
