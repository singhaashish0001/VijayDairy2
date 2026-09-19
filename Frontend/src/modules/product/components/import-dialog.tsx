import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { X, Download, UploadCloud, FileSpreadsheet, Boxes, Package } from 'lucide-react';
import { MilkDropSpinner } from '../../../shared-components/illustrations/loaders';
import { downloadProductSampleCsv, downloadStockCsv, type StockImportMode } from '../../../helpers/product-csv-template';
import { useStore } from '../../../contexts/store-provider';

export type ImportTab = 'products' | 'stock';

interface Props {
  onClose: () => void;
  initialTab?: ImportTab;
}

const ImportDialog = ({ onClose, initialTab = 'products' }: Props) => {
  const { productStore } = useStore();
  const [tab, setTab] = useState<ImportTab>(initialTab);
  const [mode, setMode] = useState<StockImportMode>('ADD');
  const [file, setFile] = useState<File | null>(null);

  function switchTab(next: ImportTab) {
    if (next === tab) return;
    setTab(next);
    setFile(null);
    productStore.resetImportState();
  }

  async function handleImport() {
    if (!file) return;
    try {
      if (tab === 'stock') await productStore.importStockAsync(file, mode);
      else await productStore.bulkImportAsync(file);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Import failed');
    }
  }

  const result = productStore.importResult;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Import from CSV</h2>
          <button
            onClick={() => {
              productStore.resetImportState();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div role="tablist" aria-label="Import type" className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 mb-4">
          {(
            [
              ['products', 'Products', Package],
              ['stock', 'Stock only', Boxes],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              data-testid={`import-tab-${id}`}
              onClick={() => switchTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${tab === id ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'products' ? (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-4 text-sm text-slate-600 space-y-2">
            <p>Download the sample, add your products (one per row), then upload it here. Existing products with the same name are updated.</p>
            <ul className="list-disc pl-5 text-xs space-y-0.5">
              <li>
                <b>name</b>, <b>unit</b> and <b>price</b> are required.
              </li>
              <li>
                <b>unit</b> must be LTR, KG or PCS.
              </li>
              <li>
                <b>stock</b> and <b>low_stock_threshold</b> are optional (default 0).
              </li>
            </ul>
            <button data-testid="download-sample-csv-dialog" type="button" onClick={downloadProductSampleCsv} className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline">
              <Download size={14} /> Download sample CSV
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-4 text-sm text-slate-600 space-y-2.5">
            <p>Add stock to the products you already have. Products in the file that don&apos;t exist are reported and skipped — nothing new is created, and prices and units are never changed.</p>
            <ul className="list-disc pl-5 text-xs space-y-0.5">
              <li>
                <b>name</b> (must match an existing product) and <b>stock</b> are required. In "Add to stock" mode, <b>stock</b> is the quantity received.
              </li>
              <li>
                <b>low_stock_threshold</b> is optional. If the column is in your file, a blank value means 0. If the column is left out, thresholds stay as they are.
              </li>
            </ul>
            <fieldset className="flex flex-wrap gap-2" aria-label="How to apply stock">
              {(
                [
                  ['ADD', 'Add to stock', 'CSV value is added to the present stock (negative subtracts)'],
                  ['SET', 'Replace stock', 'CSV value becomes the stock'],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  className={`flex-1 min-w-[170px] cursor-pointer rounded-lg border px-3 py-2 ${mode === value ? 'border-primary bg-primary-light/50 ring-1 ring-primary/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <input type="radio" name="stock-mode" data-testid={`stock-mode-${value.toLowerCase()}`} className="sr-only" checked={mode === value} onChange={() => setMode(value)} />
                  <span className="block text-sm font-semibold text-slate-800">{title}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </label>
              ))}
            </fieldset>
            <button data-testid="download-stock-csv-dialog" type="button" onClick={() => downloadStockCsv(productStore.products, mode)} className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline">
              <Download size={14} /> {productStore.products.length > 0 ? 'Download CSV with my products' : 'Download sample CSV'}
            </button>
          </div>
        )}

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files?.[0];
            if (dropped && dropped.name.toLowerCase().endsWith('.csv')) setFile(dropped);
          }}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary/30 bg-primary-light/30 hover:bg-primary-light/60 hover:border-primary/60 transition-colors px-4 py-6 mb-4 cursor-pointer text-center focus-within:ring-2 focus-within:ring-primary-mid"
        >
          {file ? <FileSpreadsheet size={26} className="text-primary" /> : <UploadCloud size={26} className="text-primary" />}
          <span className="text-sm font-semibold text-slate-700">{file ? file.name : 'Drop your CSV here or click to browse'}</span>
          <span className="text-xs text-slate-500">{file ? `${(file.size / 1024).toFixed(1)} KB · click to replace` : '.csv files only'}</span>
          <input data-testid="import-file-input" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sr-only" />
        </label>

        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => {
              productStore.resetImportState();
              onClose();
            }}
            className="btn-secondary"
          >
            Close
          </button>
          <button data-testid="import-submit" onClick={handleImport} disabled={!file || productStore.importState.inProgress} className="btn-primary">
            {productStore.importState.inProgress ? (
              <span className="inline-flex items-center gap-2">
                <MilkDropSpinner size={18} label="Importing" /> Importing...
              </span>
            ) : (
              'Import'
            )}
          </button>
        </div>

        {result && (
          <div data-testid="import-result" className="border-t border-slate-200 pt-4 text-sm">
            <p className="font-medium text-slate-900 mb-2">
              {tab === 'stock'
                ? `Stock updated for ${result.updated} product${result.updated === 1 ? '' : 's'}${result.errors?.length ? ` · ${result.errors.length} row${result.errors.length === 1 ? '' : 's'} skipped` : ''}`
                : `Created: ${result.created} · Updated: ${result.updated} · Total: ${result.total}`}
            </p>
            {result.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-red-700">
                    Row {e.row}: {e.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(ImportDialog);
