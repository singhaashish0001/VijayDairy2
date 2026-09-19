import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { MilkBottle } from '../../../shared-components/illustrations/dairy-illustrations';
import { MilkDropSpinner } from '../../../shared-components/illustrations/loaders';
import { useStore } from '../../../contexts/store-provider';
import type IProductResponse from '../../../models/response/IProductResponse';
import type { ProductUnit } from '../../../models/forms/IAddEditProduct';

const UNITS: ProductUnit[] = ['LTR', 'KG', 'PCS'];

interface Props {
  product: IProductResponse | null;
  inventoryEnabled: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ProductDialog = ({ product, inventoryEnabled, onClose, onSaved }: Props) => {
  const { productStore } = useStore();
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name || '');
  const [unit, setUnit] = useState<ProductUnit>((product?.unit as ProductUnit) || 'LTR');
  const [price, setPrice] = useState<number | ''>(product?.price ?? '');
  const [stock, setStock] = useState<number | ''>(product?.stock ?? 0);
  const [threshold, setThreshold] = useState<number | ''>(product?.lowStockThreshold ?? 0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || price === '') {
      toast.error('Name and price are required');
      return;
    }
    try {
      if (isEdit && product) {
        await productStore.updateAsync(product.id, { name, unit, price, stock, lowStockThreshold: threshold });
        toast.success('Product updated');
      } else {
        await productStore.addAsync({ name, unit, price, stock, lowStockThreshold: threshold });
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save product');
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div data-testid="product-dialog" role="dialog" aria-modal="true" className="card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 rounded-t-2xl bg-linear-to-r from-primary-light to-accent-light/60 border-b border-[#e6e9df]">
          <div className="flex items-center gap-3">
            <MilkBottle size={46} className="shrink-0" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
              <p className="text-xs text-slate-500">{isEdit ? 'Update the details below.' : 'Add an item to your catalog.'}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/70">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <input data-testid="product-name-input" className="input-base" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select data-testid="product-unit-select" className="input-base" value={unit} onChange={(e) => setUnit(e.target.value as ProductUnit)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
              <input
                data-testid="product-price-input"
                type="number"
                min="0"
                step="0.01"
                className="input-base"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
            </div>
          </div>

          {inventoryEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                <input
                  data-testid="product-stock-input"
                  type="number"
                  step="0.01"
                  className="input-base"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock At</label>
                <input
                  data-testid="product-threshold-input"
                  type="number"
                  step="0.01"
                  className="input-base"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" data-testid="product-cancel" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" data-testid="product-save" disabled={productStore.addUpdateState.inProgress} className="btn-primary">
              {productStore.addUpdateState.inProgress ? (
                <span className="inline-flex items-center gap-2">
                  <MilkDropSpinner size={18} label="Saving" /> Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default observer(ProductDialog);
