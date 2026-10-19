import { useEffect, useState } from 'react';
import { listProducts, toggleStock } from '../api/products';
import type { Product } from '../api/products';
import { formatCOP } from '../utils/format';
import NewProductModal from '../components/NewProductModal';

const headerCellClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const cellClass = 'px-4 py-3 text-sm text-slate-700';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((items) => {
        if (!cancelled) setProducts(items);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el catálogo de productos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleStock(productId: string) {
    try {
      const updated = await toggleStock(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    } catch {
      setError('No se pudo actualizar la disponibilidad del producto.');
    }
  }

  function handleProductCreated(product: Product) {
    setProducts((prev) => [product, ...prev]);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Catálogo de Productos
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando productos…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className={headerCellClass}>Nombre</th>
                <th className={headerCellClass}>Proveedor</th>
                <th className={headerCellClass}>P. Proveedor</th>
                <th className={headerCellClass}>Utilidad</th>
                <th className={headerCellClass}>Precio Catálogo</th>
                <th className={headerCellClass}>Disponible</th>
                <th className={headerCellClass} aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className={`${cellClass} font-medium text-slate-900`}>
                    {product.name}
                  </td>
                  <td className={cellClass}>
                    {product.supplier?.name ?? '—'}
                  </td>
                  <td className={cellClass}>
                    {formatCOP(product.supplierPrice)}
                  </td>
                  <td className={cellClass}>
                    {formatCOP(product.pricing.calculatedProfit)}
                  </td>
                  <td className={cellClass}>
                    {formatCOP(product.pricing.suggestedSalePrice)}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.inStock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {product.inStock ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                  <td className={`${cellClass} text-right`}>
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product.id)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Alternar Stock
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <NewProductModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleProductCreated}
        />
      )}
    </div>
  );
}
