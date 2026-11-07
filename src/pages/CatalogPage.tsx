import { Fragment, useEffect, useState } from 'react';
import { deleteProduct, listProducts, syncAllProductsStock, syncProductStock, toggleStock } from '../api/products';
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
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [stockAlertOpen, setStockAlertOpen] = useState(true);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  function toggleExpandProduct(id: string) {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

  async function handleSyncProduct(productId: string) {
    setSyncingProductId(productId);
    setError(null);
    try {
      const updated = await syncProductStock(productId);
      setProducts((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    } catch {
      setError('No se pudo sincronizar el stock del producto con Dropi.');
    } finally {
      setSyncingProductId(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    setError(null);
    try {
      const summary = await syncAllProductsStock();
      setSyncNotice(`Inventario actualizado: ${summary.updatedCount - summary.lowStockCount - summary.outOfStockCount} disponibles, ${summary.lowStockCount} con stock bajo, ${summary.outOfStockCount} agotados`);
      const items = await listProducts({ search: search.trim() || undefined, supplierId: supplierId || undefined, stockStatus });
      setProducts(items);
    } catch {
      setError('No se pudo sincronizar el inventario con Dropi.');
    } finally {
      setSyncingAll(false);
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

  const criticalProducts = products.filter((product) => product.stockQuantity < 5 || !product.inStock);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          Catálogo de Productos
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncingAll ? 'Sincronizando…' : 'Sincronizar Stock con Dropi'}
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{syncNotice}</span>
          <button type="button" onClick={() => setSyncNotice(null)} className="font-medium">Cerrar</button>
        </div>
      )}

      {stockAlertOpen && criticalProducts.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{criticalProducts.length} producto{criticalProducts.length === 1 ? '' : 's'} requiere{criticalProducts.length === 1 ? '' : 'n'} atención por stock bajo o agotado.</span>
          <button type="button" onClick={() => setStockAlertOpen(false)} className="font-medium">Ocultar</button>
        </div>
      )}

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
                <th className="w-10 px-4 py-3" aria-label="Expandir" />
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
              {products.map((product) => {
                const hasVariations = product.variations && product.variations.length > 0;
                const isExpanded = expandedProductIds.has(product.id);

                return (
                  <Fragment key={product.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-center">
                        {hasVariations ? (
                          <button
                            type="button"
                            onClick={() => toggleExpandProduct(product.id)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                            title={isExpanded ? 'Ocultar variaciones' : 'Ver variaciones'}
                          >
                            <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className={`${cellClass} font-medium text-slate-900`}>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {hasVariations && (
                            <span className="text-xs font-normal text-slate-500">
                              {product.variations.length} variante{product.variations.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
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
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            product.stockQuantity <= 0 || !product.inStock
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : product.stockQuantity < 5
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {product.stockQuantity <= 0 || !product.inStock
                            ? 'Agotado (0)'
                            : product.stockQuantity < 5
                              ? `Stock Bajo (${product.stockQuantity})`
                              : `Disponible (${product.stockQuantity})`}
                        </span>
                      </td>
                      <td className={`${cellClass} text-right`}>
                        <div className="flex justify-end gap-2">
                          {product.dropiId && (
                            <button
                              type="button"
                              onClick={() => handleSyncProduct(product.id)}
                              disabled={syncingProductId === product.id}
                              className="rounded-md border border-sky-300 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {syncingProductId === product.id ? 'Sincronizando…' : 'Sync Dropi'}
                            </button>
                          )}
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
                    {isExpanded && hasVariations && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="rounded-md border border-slate-200 bg-white p-3">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Variaciones de {product.name}
                            </h4>
                            <table className="min-w-full divide-y divide-slate-100 text-xs">
                              <thead>
                                <tr className="text-slate-500">
                                  <th className="py-1.5 text-left font-medium">Nombre / Atributos</th>
                                  <th className="py-1.5 text-left font-medium">SKU / ID Dropi</th>
                                  <th className="py-1.5 text-left font-medium">P. Proveedor</th>
                                  <th className="py-1.5 text-left font-medium">Utilidad</th>
                                  <th className="py-1.5 text-left font-medium">P. Venta Sugerido</th>
                                  <th className="py-1.5 text-left font-medium">Stock</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {product.variations.map((v) => (
                                  <tr key={v.id} className="hover:bg-slate-50">
                                    <td className="py-2 text-slate-900 font-medium">
                                      {v.name}
                                      {v.attributes && Object.keys(v.attributes).length > 0 && (
                                        <div className="text-[11px] text-slate-500">
                                          {Object.entries(v.attributes)
                                            .map(([key, val]) => `${key}: ${val}`)
                                            .join(' | ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2 text-slate-600">
                                      {v.sku ?? '—'}
                                      {v.dropiVariationId && (
                                        <span className="block text-[10px] text-slate-400">
                                          Dropi ID: {v.dropiVariationId}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 text-slate-700">
                                      {formatCOP(v.supplierPrice ?? product.supplierPrice)}
                                    </td>
                                    <td className="py-2 text-slate-700">
                                      {formatCOP(v.pricing.calculatedProfit)}
                                    </td>
                                    <td className="py-2 font-medium text-slate-900">
                                      {formatCOP(v.pricing.suggestedSalePrice)}
                                    </td>
                                    <td className="py-2">
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                          v.stockQuantity <= 0
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : v.stockQuantity < 5
                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}
                                      >
                                        {v.stockQuantity <= 0
                                          ? 'Agotado (0)'
                                          : v.stockQuantity < 5
                                            ? `Stock Bajo (${v.stockQuantity})`
                                            : `Disponible (${v.stockQuantity})`}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
