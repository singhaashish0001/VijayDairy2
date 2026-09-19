import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { Trash2, FilePlus } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { formatCurrency } from '../../helpers/format-helper';
import { downloadInvoicePdf } from '../../helpers/pdf-helper';
import PageHeader from '../../shared-components/page-header';
import EmptyState from '../../shared-components/empty-state';
import { MilkDropSpinner } from '../../shared-components/illustrations/loaders';
import { calculateLine, formatQuantityPretty, lineTotal, quantityDecimals, supportsAmountMode, type SellingMode } from '../../helpers/line-item-calc';
import type { IInvoiceLineItem } from '../../models/forms/IAddEditInvoice';

const CreateInvoice = () => {
  const { productStore, settingsStore, invoiceStore } = useStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<IInvoiceLineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sellingMode, setSellingMode] = useState<SellingMode>('QUANTITY');
  // What the cashier typed: the quantity in QUANTITY mode, the amount in AMOUNT mode. The other value is derived.
  const [entry, setEntry] = useState('1');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [taxPercent, setTaxPercent] = useState<number | ''>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productStore.fetchAllAsync();
    settingsStore.fetchAsync();
  }, [productStore, settingsStore]);

  const products = productStore.products;
  const bestsellers = useMemo(() => products.slice(0, 8), [products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const amountModeAvailable = !!selectedProduct && supportsAmountMode(selectedProduct.unit);
  const rateIsZero = !!selectedProduct && selectedProduct.price <= 0;
  // PCS can never be in AMOUNT mode, even if state is briefly stale after a product change.
  const activeMode: SellingMode = amountModeAvailable ? sellingMode : 'QUANTITY';
  const preview = selectedProduct ? calculateLine(selectedProduct.unit, selectedProduct.price, activeMode, entry) : null;

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    // New product: fall back to By Quantity (the only mode PCS supports) and drop any value entered for the old one.
    setSellingMode('QUANTITY');
    setEntry('1');
  }

  function handleModeChange(mode: SellingMode) {
    if (mode === 'AMOUNT' && (!amountModeAvailable || rateIsZero)) return;
    setSellingMode(mode);
    setEntry(mode === 'QUANTITY' ? '1' : '');
  }

  /** Builds a line from one entered value (quantity or amount); the other is derived from the rate. Null if not calculable. */
  function buildLine(product: { id: string; name: string; unit: string; price: number }, mode: SellingMode, value: number | string, itemDiscount = 0): IInvoiceLineItem | null {
    const calc = calculateLine(product.unit, product.price, mode, value);
    if (!calc.ok || calc.quantity === null || calc.amount === null) return null;
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity: calc.quantity,
      discount: itemDiscount,
      amount: calc.amount,
      sellingMode: mode,
      total: lineTotal(calc.amount, itemDiscount),
    };
  }

  function addItem(productId: string, mode: SellingMode = 'QUANTITY', value: number | string = 1) {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;
    const fresh = buildLine(product, mode, value);
    if (!fresh) return false;
    setItems((prev) => {
      // Same product entered the same way merges into one line; a different mode stays a separate line.
      const existingIdx = prev.findIndex((i) => i.productId === productId && i.sellingMode === mode);
      if (existingIdx < 0) return [...prev, fresh];
      const existing = prev[existingIdx];
      const combinedValue = mode === 'AMOUNT' ? existing.amount + fresh.amount : existing.quantity + fresh.quantity;
      const merged = buildLine(product, mode, combinedValue, existing.discount);
      if (!merged) return prev;
      const copy = [...prev];
      copy[existingIdx] = merged;
      return copy;
    });
    return true;
  }

  function updateItem(index: number, field: 'entry' | 'discount', value: number) {
    setItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const discount = field === 'discount' ? value : item.discount;
      // Re-derive the dependent value from the line's stored rate. An invalid entry (blank/0) zeroes the line;
      // handleSave blocks it with a clear message.
      const entered = field === 'entry' ? value : item.sellingMode === 'AMOUNT' ? item.amount : item.quantity;
      const calc = calculateLine(item.unit, item.price, item.sellingMode, entered);
      const quantity = calc.ok ? calc.quantity! : item.sellingMode === 'AMOUNT' ? 0 : Number(entered) || 0;
      const amount = calc.ok ? calc.amount! : item.sellingMode === 'AMOUNT' ? Number(entered) || 0 : 0;
      copy[index] = { ...item, quantity, amount, discount, total: lineTotal(amount, discount) };
      return copy;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const taxAmount = useMemo(() => Math.max(0, (subtotal - Number(discount || 0)) * (Number(taxPercent || 0) / 100)), [subtotal, discount, taxPercent]);
  const total = useMemo(() => Math.max(0, subtotal - Number(discount || 0) + taxAmount), [subtotal, discount, taxAmount]);

  async function handleSave(downloadPdf: boolean) {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    for (const item of items) {
      const calc = calculateLine(item.unit, item.price, item.sellingMode, item.sellingMode === 'AMOUNT' ? item.amount : item.quantity);
      if (!calc.ok) {
        toast.error(`${item.name}: ${calc.error}`);
        return;
      }
    }
    setSaving(true);
    try {
      const created = await invoiceStore.addAsync({
        items,
        notes,
        discount: Number(discount) || 0,
        taxPercent: Number(taxPercent) || 0,
      });
      toast.success('Invoice created');
      if (downloadPdf) {
        downloadInvoicePdf(created, settingsStore.settings);
      }
      navigate('/invoices');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="create-invoice-page">
      <PageHeader icon={FilePlus} title="Create Invoice" subtitle="Add items, apply discounts, and generate a branded PDF." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {bestsellers.length > 0 && (
            <div className="card p-4">
              <h3 className="section-title mb-3">Quick Add</h3>
              <div data-testid="quick-pick-chips" className="flex flex-wrap gap-2">
                {bestsellers.map((p) => (
                  <button key={p.id} onClick={() => addItem(p.id, 'QUANTITY', 1)} className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-primary-light/70 text-primary-dark border border-primary/15 hover:bg-primary-light hover:border-primary/40 hover:-translate-y-px transition-all">
                    {p.name} · {formatCurrency(p.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="section-title mb-3">Add Item</h3>
            <div className="space-y-3">
              <select data-testid="invoice-product-select" className="input-base w-full min-w-0" value={selectedProductId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — {formatCurrency(p.price)}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div data-testid="invoice-entry-panel" className="space-y-3">
                  {amountModeAvailable && (
                    <div data-testid="invoice-mode-selector" role="group" aria-label="Selling mode" className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      {(['QUANTITY', 'AMOUNT'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          data-testid={`invoice-mode-${mode.toLowerCase()}`}
                          aria-pressed={activeMode === mode}
                          disabled={mode === 'AMOUNT' && rateIsZero}
                          onClick={() => handleModeChange(mode)}
                          className={`px-3 py-1.5 text-sm rounded-md disabled:opacity-40 ${activeMode === mode ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                        >
                          {mode === 'QUANTITY' ? 'By Quantity' : 'By Amount'}
                        </button>
                      ))}
                    </div>
                  )}
                  {amountModeAvailable && rateIsZero && <p className="text-xs text-amber-600">Rate must be greater than zero to calculate quantity.</p>}

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                    <div>
                      <span className="block text-xs font-medium text-slate-500 mb-1">Unit</span>
                      <div data-testid="invoice-entry-unit" className="input-base bg-slate-50">{selectedProduct.unit}</div>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-500 mb-1">Rate</span>
                      <div data-testid="invoice-entry-rate" className="input-base bg-slate-50">
                        {formatCurrency(selectedProduct.price)}/{selectedProduct.unit}
                      </div>
                    </div>
                    {activeMode === 'QUANTITY' ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                          <input
                            data-testid="invoice-qty-input"
                            type="number"
                            min="0"
                            step={quantityDecimals(selectedProduct.unit) === 0 ? '1' : '0.001'}
                            className="input-base"
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                          />
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Amount</span>
                          <div data-testid="invoice-entry-amount" className="input-base bg-slate-50">
                            {preview?.ok ? formatCurrency(preview.amount) : '—'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</label>
                          <input
                            data-testid="invoice-amount-input"
                            type="number"
                            min="0"
                            step="0.01"
                            className="input-base"
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                          />
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-slate-500 mb-1">Quantity (calculated)</span>
                          <div data-testid="invoice-entry-calculated-qty" className="input-base bg-slate-50">
                            {preview?.ok ? formatQuantityPretty(preview.quantity, selectedProduct.unit) : '—'}
                          </div>
                        </div>
                      </>
                    )}
                    <button
                      data-testid="invoice-add-item"
                      className="btn-primary"
                      disabled={!preview?.ok}
                      onClick={() => {
                        if (!addItem(selectedProduct.id, activeMode, entry)) return;
                        setEntry(activeMode === 'QUANTITY' ? '1' : '');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {entry !== '' && preview && !preview.ok && (
                    <p data-testid="invoice-entry-error" className="text-xs text-red-600">
                      {preview.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table data-testid="invoice-items-table" className="data-table w-full">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Discount</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState illustration="can" title="No items added yet" description="Use Quick Add or the picker above to start building this invoice." />
                    </td>
                  </tr>
                )}
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-slate-900">{item.name}</td>
                    <td>{item.unit}</td>
                    <td className="num">{formatCurrency(item.price)}</td>
                    <td className="num">
                      {item.sellingMode === 'AMOUNT' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <input
                            data-testid={`invoice-item-amount-${idx}`}
                            aria-label="Amount"
                            type="number"
                            min="0"
                            step="0.01"
                            className="input-base w-24 text-right"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'entry', Number(e.target.value))}
                          />
                          <span data-testid={`invoice-item-qty-${idx}`} className="text-xs text-slate-500">
                            = {formatQuantityPretty(item.quantity, item.unit)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <input
                            data-testid={`invoice-item-qty-${idx}`}
                            aria-label="Quantity"
                            type="number"
                            min="0"
                            step={quantityDecimals(item.unit) === 0 ? '1' : '0.001'}
                            className="input-base w-20 text-right"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'entry', Number(e.target.value))}
                          />
                          {!Number.isInteger(item.quantity) && quantityDecimals(item.unit) > 0 && (
                            <span className="text-xs text-slate-500">= {formatQuantityPretty(item.quantity, item.unit)}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="num">
                      <input
                        data-testid={`invoice-item-discount-${idx}`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-base w-20 text-right"
                        value={item.discount}
                        onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                      />
                    </td>
                    <td className="num font-semibold">{formatCurrency(item.total)}</td>
                    <td className="num">
                      <button data-testid={`invoice-item-remove-${idx}`} onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea data-testid="invoice-notes" className="input-base" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this invoice..." />
          </div>
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          <div className="card p-5 space-y-4">
            <h3 className="section-title">Summary</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Discount (₹)</label>
                <input
                  data-testid="invoice-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tax (%)</label>
                <input
                  data-testid="invoice-tax"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-base"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span data-testid="invoice-subtotal" className="font-medium">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium">- {formatCurrency(Number(discount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-base mt-2 px-4 py-3 rounded-xl bg-primary-light">
                <span className="font-extrabold text-slate-900">Total</span>
                <span data-testid="invoice-total" className="text-xl font-extrabold text-primary-dark tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button data-testid="invoice-save-download" disabled={saving || items.length === 0} onClick={() => handleSave(true)} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {saving && <MilkDropSpinner size={18} label="Saving" />}
                Save & Download PDF
              </button>
              <button data-testid="invoice-save" disabled={saving || items.length === 0} onClick={() => handleSave(false)} className="btn-secondary w-full">
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(CreateInvoice);
