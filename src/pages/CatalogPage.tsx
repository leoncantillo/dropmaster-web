import { useEffect, useState } from 'react';
import { deleteProduct, listProducts, toggleStock } from '../api/products';
import type { Product, ProductFilterParams } from '../api/products';
import { listSuppliers } from '../api/suppliers';
import type { Supplier } from '../api/suppliers';
import { formatCOP } from '../utils/format';
import NewProductModal from '../components/NewProductModal';
import EditProductModal from '../components/EditProductModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const headerCellClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const cellClass = 'px-4 py-3 text-sm text-slate-700';
const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';

type StockStatus = ProductFilterParams['stockStatus'];

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSuppliers()
      .then((items) => {
        if (!cancelled) setSuppliers(items);
      })
      .catch(() => {
        /* Si falla la carga de proveedores, el filtro queda con la opción por defecto. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setFiltering(true);
      setError(null);
      listProducts({
        search: search.trim() || undefined,
        supplierId: supplierId || undefined,
        stockStatus,
      })
        .then((items) => {
          if (!cancelled) setProducts(items);
        })
        .catch(() => {
          if (!cancelled) {
            setError('No se pudieron cargar los productos.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setFiltering(false);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, supplierId, stockStatus]);

  const filtersActive =
    search.trim() !== '' || supplierId !== '' || stockStatus !== 'all';

  function clearFilters() {
    setSearch('');
    setSupplierId('');
    setStockStatus('all');
  }

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

  function handleProductUpdated(product: Product) {
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? product : item))
    );
  }

  async function handleDeleteProduct() {
    if (!deleting) return;
    await deleteProduct(deleting.id);
    setProducts((prev) => prev.filter((item) => item.id !== deleting.id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, ID Dropi o proveedor…"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className={`${inputClass} max-w-[12rem]`}
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <select
          value={stockStatus ?? 'all'}
          onChange={(e) => setStockStatus(e.target.value as StockStatus)}
          className={`${inputClass} max-w-[10rem]`}
        >
          <option value="all">Todos</option>
          <option value="in_stock">Disponibles</option>
          <option value="out_of_stock">Agotados</option>
        </select>
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
        {filtering && <span className="text-sm text-slate-500">Buscando…</span>}
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
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product.id)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Alternar Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(product)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(product)}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    {filtersActive ? (
                      <div className="flex flex-col items-center gap-3">
                        <p>
                          No se encontraron productos con los filtros
                          seleccionados.
                        </p>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Restablecer filtros
                        </button>
                      </div>
                    ) : (
                      <p>No hay productos registrados.</p>
                    )}
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

      {editing && (
        <EditProductModal
          product={editing}
          suppliers={suppliers}
          onClose={() => setEditing(null)}
          onSuccess={handleProductUpdated}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title="Eliminar Producto"
          message={
            <>
              ¿Eliminar el producto{' '}
              <span className="font-medium text-slate-900">
                {deleting.name}
              </span>
              ? Esta acción no se puede deshacer.
            </>
          }
          onClose={() => setDeleting(null)}
          onConfirm={handleDeleteProduct}
        />
      )}
    </div>
  );
}
