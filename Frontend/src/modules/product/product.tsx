import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { downloadProductSampleCsv } from '../../helpers/product-csv-template';
import { Plus, Upload, Download, Pencil, Trash2, Search, Package, Boxes } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { formatCurrency } from '../../helpers/format-helper';
import ProductDialog from './components/product-dialog';
import ImportDialog, { type ImportTab } from './components/import-dialog';
import PageHeader from '../../shared-components/page-header';
import EmptyState from '../../shared-components/empty-state';
import { TableSkeleton } from '../../shared-components/illustrations/loaders';
import type IProductResponse from '../../models/response/IProductResponse';
import type { ProductUnit } from '../../models/forms/IAddEditProduct';

const UNITS: ProductUnit[] = ['LTR', 'KG', 'PCS'];

const UNIT_BADGE: Record<ProductUnit, string> = {
  LTR: 'bg-sky-50 text-sky-700',
  KG: 'bg-emerald-50 text-emerald-700',
  PCS: 'bg-amber-50 text-amber-700',
};

/** Slim fill bar showing stock relative to twice the low-stock threshold (red when at/below the threshold). */
const StockBar = ({ stock, threshold }: { stock: number; threshold: number }) => {
  const max = Math.max(threshold * 2, stock, 1);
  const pct = Math.min(100, Math.max(0, (stock / max) * 100));
  const low = threshold > 0 && stock <= threshold;
  return (
    <div className="h-1.5 w-20 ml-auto mt-1 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
      <div className={`h-full rounded-full ${low ? 'bg-red-500' : 'bg-primary-mid'}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const Product = () => {
  const { productStore, settingsStore } = useStore();
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState<ProductUnit | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IProductResponse | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>('products');

  useEffect(() => {
    productStore.fetchAllAsync();
    settingsStore.fetchAsync();
  }, [productStore, settingsStore]);

  const inventoryEnabled = settingsStore.settings?.inventoryEnabled ?? false;

  const filtered = useMemo(() => {
    return productStore.products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesUnit = unitFilter === 'ALL' || p.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });
  }, [productStore.products, search, unitFilter]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      await productStore.deleteAsync(id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  }

  return (
    <div data-testid="products-page">
      <PageHeader
        icon={Package}
        title="Products"
        subtitle={`${productStore.products.length} product${productStore.products.length === 1 ? '' : 's'} in your catalog`}
        action={
          <>
            <button data-testid="download-sample-csv-button" onClick={downloadProductSampleCsv} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Sample CSV
            </button>
            <button
              data-testid="import-stock-button"
              onClick={() => {
                setImportTab('stock');
                setImportOpen(true);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Boxes size={16} /> Import Stock
            </button>
            <button
              data-testid="import-csv-button"
              onClick={() => {
                setImportTab('products');
                setImportOpen(true);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload size={16} /> Import CSV
            </button>
            <button
              data-testid="add-product-button"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Add Product
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative w-full sm:w-auto sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            data-testid="products-search-input"
            placeholder="Search products..."
            className="input-base pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          data-testid="products-unit-filter"
          className="input-base w-full sm:w-auto sm:max-w-[160px]"
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value as ProductUnit | 'ALL')}
        >
          <option value="ALL">All Units</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto animate-fade-in">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Unit</th>
              <th className="text-right">Price</th>
              {inventoryEnabled && <th className="text-right">Stock</th>}
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productStore.inProgress && <TableSkeleton rows={6} cols={inventoryEnabled ? 5 : 4} />}
            {!productStore.inProgress && filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    illustration={productStore.products.length === 0 ? 'bottle' : 'drops'}
                    title={productStore.products.length === 0 ? 'No products yet' : 'No products match your filters'}
                    description={productStore.products.length === 0 ? 'Add your first product or import a CSV to get started.' : undefined}
                    action={
                      productStore.products.length === 0 ? (
                        <button onClick={() => setImportOpen(true)} className="btn-secondary inline-flex items-center gap-2">
                          <Upload size={15} /> Import CSV
                        </button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const low = inventoryEnabled && p.lowStockThreshold > 0 && p.stock <= p.lowStockThreshold;
              return (
                <tr key={p.id}>
                  <td className="font-medium text-slate-900">{p.name}</td>
                  <td>
                    <span className={`badge ${UNIT_BADGE[p.unit as ProductUnit] ?? 'bg-slate-100 text-slate-600'}`}>{p.unit}</span>
                  </td>
                  <td className="num">{formatCurrency(p.price)}</td>
                  {inventoryEnabled && (
                    <td className="num">
                      <span className={low ? 'text-red-600 font-semibold' : ''}>{p.stock}</span>
                      {low && <span className="badge badge-red ml-2 uppercase">Low</span>}
                      <StockBar stock={p.stock} threshold={p.lowStockThreshold} />
                    </td>
                  )}
                  <td className="num">
                    <div className="flex justify-end gap-2">
                      <button
                        data-testid={`edit-product-${p.id}`}
                        onClick={() => {
                          setEditing(p);
                          setDialogOpen(true);
                        }}
                        aria-label="Edit product" className="p-1.5 rounded-lg hover:bg-primary-light text-slate-500 hover:text-primary"
                      >
                        <Pencil size={15} />
                      </button>
                      <button data-testid={`delete-product-${p.id}`} onClick={() => handleDelete(p.id)} aria-label="Delete product" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <ProductDialog
          product={editing}
          inventoryEnabled={inventoryEnabled}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setDialogOpen(false)}
        />
      )}

      {importOpen && <ImportDialog initialTab={importTab} onClose={() => setImportOpen(false)} />}
    </div>
  );
};

export default observer(Product);
