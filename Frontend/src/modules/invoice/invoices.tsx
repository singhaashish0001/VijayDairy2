import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { Eye, Share2, Printer, Download, Trash2, X, Plus, Search, FileText, Receipt } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { formatCurrency, formatDate, formatDateTime } from '../../helpers/format-helper';
import { formatQuantityPretty } from '../../helpers/line-item-calc';
import { downloadInvoicePdf, buildPrintHtml } from '../../helpers/pdf-helper';
import PageHeader from '../../shared-components/page-header';
import EmptyState from '../../shared-components/empty-state';
import { TableSkeleton } from '../../shared-components/illustrations/loaders';
import { BrandMark } from '../../shared-components/illustrations/brand-logo';
import type IInvoiceResponse from '../../models/response/IInvoiceResponse';

const Invoices = () => {
  const { invoiceStore, settingsStore } = useStore();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<IInvoiceResponse | null>(null);

  useEffect(() => {
    invoiceStore.fetchAllAsync();
    settingsStore.fetchAsync();
  }, [invoiceStore, settingsStore]);

  const invoices = invoiceStore.invoices;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const createdDate = new Date(inv.createdAt);
      const matchesFrom = !dateFrom || createdDate >= new Date(dateFrom);
      const matchesTo = !dateTo || createdDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [invoices, search, dateFrom, dateTo]);

  function resetFilters() {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoiceStore.deleteAsync(id);
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete invoice');
    }
  }

  function handleWhatsApp(inv: IInvoiceResponse) {
    const url = `${window.location.origin}/invoice/${inv.id}`;
    const message = `Invoice ${inv.invoiceNumber} — Total ${formatCurrency(inv.total)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  function handlePrint(inv: IInvoiceResponse) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHtml(inv, settingsStore.settings));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div data-testid="invoices-page">
      <PageHeader
        icon={Receipt}
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length === 1 ? '' : 's'} on record`}
        action={
          <Link to="/invoices/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Invoice
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input data-testid="invoices-search-input" placeholder="Invoice number..." className="input-base pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input data-testid="invoices-date-from" type="date" className="input-base" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input data-testid="invoices-date-to" type="date" className="input-base" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button data-testid="invoices-clear-filters" onClick={resetFilters} className="btn-secondary">
          Reset
        </button>
      </div>

      <div className="card overflow-x-auto animate-fade-in">
        <table data-testid="invoices-table" className="data-table w-full">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th className="text-right">Items</th>
              <th className="text-right">Total</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoiceStore.inProgress && <TableSkeleton rows={6} cols={5} />}
            {!invoiceStore.inProgress && filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    illustration={invoices.length === 0 ? 'cheese' : 'drops'}
                    title={invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
                    description={invoices.length === 0 ? 'Create your first invoice to see it here.' : undefined}
                  />
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <span className="badge badge-green tabular-nums">{inv.invoiceNumber}</span>
                </td>
                <td>{formatDate(inv.createdAt)}</td>
                <td className="num">{inv.items.length}</td>
                <td className="num font-semibold">{formatCurrency(inv.total)}</td>
                <td className="num">
                  <div className="flex justify-end gap-1">
                    <button data-testid={`preview-invoice-${inv.id}`} onClick={() => setPreviewInvoice(inv)} aria-label="Preview invoice" title="Preview" className="p-1.5 rounded-lg hover:bg-primary-light text-slate-500 hover:text-primary">
                      <Eye size={15} />
                    </button>
                    <button data-testid={`whatsapp-invoice-${inv.id}`} onClick={() => handleWhatsApp(inv)} aria-label="Share on WhatsApp" title="Share on WhatsApp" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600">
                      <Share2 size={15} />
                    </button>
                    <button data-testid={`print-invoice-${inv.id}`} onClick={() => handlePrint(inv)} aria-label="Print invoice" title="Print" className="p-1.5 rounded-lg hover:bg-primary-light text-slate-500 hover:text-primary">
                      <Printer size={15} />
                    </button>
                    <button data-testid={`download-invoice-${inv.id}`} onClick={() => downloadInvoicePdf(inv, settingsStore.settings)} aria-label="Download PDF" title="Download PDF" className="p-1.5 rounded-lg hover:bg-primary-light text-primary">
                      <Download size={15} />
                    </button>
                    <button data-testid={`delete-invoice-${inv.id}`} onClick={() => handleDelete(inv.id)} aria-label="Delete invoice" title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div data-testid="invoice-preview-dialog" role="dialog" aria-modal="true" className="card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between gap-3 px-6 py-4 rounded-t-2xl text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary-mid), var(--color-primary-dark))' }}>
              <div className="flex items-center gap-3 min-w-0">
                <BrandMark size={38} />
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold leading-tight truncate">{previewInvoice.invoiceNumber}</h2>
                  <p className="text-xs text-white/75">{formatDateTime(previewInvoice.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setPreviewInvoice(null)} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/15">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-1.5">Item</th>
                  <th className="py-1.5 text-right">Qty</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {previewInvoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1.5">{item.name}</td>
                    <td className="py-1.5 text-right">{formatQuantityPretty(item.quantity, item.unit)}</td>
                    <td className="py-1.5 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(previewInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span>- {formatCurrency(previewInvoice.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span>{formatCurrency(previewInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200">
                <span>Total</span>
                <span>{formatCurrency(previewInvoice.total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => handlePrint(previewInvoice)} className="btn-secondary flex-1">
                Print
              </button>
              <button onClick={() => downloadInvoicePdf(previewInvoice, settingsStore.settings)} className="btn-primary flex-1">
                Download PDF
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default observer(Invoices);
