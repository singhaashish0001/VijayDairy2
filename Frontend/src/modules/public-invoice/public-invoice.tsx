import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Phone, MapPin, BadgeCheck } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { formatCurrency, formatDateTime } from '../../helpers/format-helper';
import { formatQuantityPretty } from '../../helpers/line-item-calc';
import { BrandMark } from '../../shared-components/illustrations/brand-logo';
import { PageLoader } from '../../shared-components/illustrations/loaders';
import EmptyState from '../../shared-components/empty-state';

const PublicInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const { publicInvoiceStore } = useStore();

  useEffect(() => {
    if (id) publicInvoiceStore.fetchAsync(id);
  }, [id, publicInvoiceStore]);

  if (publicInvoiceStore.inProgress) {
    return <PageLoader variant="pour" fullScreen label="Fetching your invoice…" />;
  }

  if (publicInvoiceStore.error || !publicInvoiceStore.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState illustration="can" title="Invoice not found" description="This link may be incorrect or the invoice was removed." />
      </div>
    );
  }

  const { invoice, settings } = publicInvoiceStore.data;

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] py-10 px-4">
      <div className="max-w-lg mx-auto card overflow-hidden animate-fade-in">
        <div className="px-6 py-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-primary-mid), var(--color-primary-dark))' }}>
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <BrandMark size={46} />
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold leading-tight truncate" style={{ fontFamily: 'var(--font-serif-accent)' }}>
                {settings.shopName}
              </h1>
              <p className="text-xs text-white/75">Fresh from the farm. Daily.</p>
            </div>
          </div>
          <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/85">
            {settings.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {settings.address}
              </span>
            )}
            {settings.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={12} /> {settings.phone}
              </span>
            )}
            {settings.gstNumber && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck size={12} /> GSTIN: {settings.gstNumber}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="badge badge-green text-xs">Invoice #{invoice.invoiceNumber}</span>
            <span className="text-slate-500">{formatDateTime(invoice.createdAt)}</span>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wide">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="py-2 text-right text-slate-600">{formatQuantityPretty(item.quantity, item.unit)}</td>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="tabular-nums">- {formatCurrency(invoice.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span className="tabular-nums">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-base font-extrabold mt-2 px-4 py-3 rounded-xl bg-primary-light text-primary-dark">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <p className="mt-4 text-sm text-slate-600">
              <strong>Notes:</strong> {invoice.notes}
            </p>
          )}

          <p className="mt-6 text-xs text-slate-400 text-center">{settings.footerNote}</p>
        </div>
      </div>
    </div>
  );
};

export default observer(PublicInvoice);
