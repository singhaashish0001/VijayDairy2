import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import type { IUpdateSettings } from '../../models/forms/IUpdateSettings';
import ThemeSwitcher from '../../shared-components/theme-switcher';
import PageHeader from '../../shared-components/page-header';
import { MilkDropSpinner, PageLoader } from '../../shared-components/illustrations/loaders';
import { MilkCan } from '../../shared-components/illustrations/dairy-illustrations';

const Settings = () => {
  const { settingsStore } = useStore();
  const [form, setForm] = useState<IUpdateSettings | null>(null);

  useEffect(() => {
    settingsStore.fetchAsync();
  }, [settingsStore]);

  useEffect(() => {
    if (settingsStore.settings && !form) {
      const s = settingsStore.settings;
      setForm({ shopName: s.shopName, address: s.address, phone: s.phone, gstNumber: s.gstNumber, footerNote: s.footerNote, inventoryEnabled: s.inventoryEnabled });
    }
  }, [settingsStore.settings, form]);

  function update<K extends keyof IUpdateSettings>(field: K, value: IUpdateSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }
    try {
      await settingsStore.updateAsync(form);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }

  if (!form) return <PageLoader variant="pour" label="Loading your settings…" />;

  return (
    <div data-testid="settings-page">
      <PageHeader icon={SettingsIcon} title="Business Settings" subtitle="Shop Name also sets the app title shown in the browser tab." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 card p-6 space-y-4 self-start">
          <div className="flex items-center gap-3 pb-4 border-b border-[#e6e9df]">
            <MilkCan size={44} className="shrink-0" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">Business profile</div>
              <div className="text-xs text-slate-500">Shown on every invoice and PDF.</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
            <input data-testid="settings-shop-name" className="input-base" value={form.shopName} onChange={(e) => update('shopName', e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input data-testid="settings-address" className="input-base" value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input data-testid="settings-phone" className="input-base" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
              <input data-testid="settings-gst" className="input-base" value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Footer Note</label>
              <input data-testid="settings-footer" className="input-base" value={form.footerNote} onChange={(e) => update('footerNote', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div>
              <div className="text-sm font-medium text-slate-900">Inventory Tracking</div>
              <div className="text-xs text-slate-500">Show stock fields and low-stock alerts.</div>
            </div>
            <button
              type="button"
              data-testid="settings-inventory-toggle"
              role="switch"
              aria-checked={form.inventoryEnabled}
              aria-label="Inventory tracking"
              onClick={() => update('inventoryEnabled', !form.inventoryEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.inventoryEnabled ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.inventoryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="pt-2">
            <button type="submit" data-testid="settings-save-button" disabled={settingsStore.updateState.inProgress} className="btn-primary">
              {settingsStore.updateState.inProgress ? (
                <span className="inline-flex items-center gap-2">
                  <MilkDropSpinner size={18} label="Saving" /> Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>

        <div className="card p-6 self-start">
          <div className="mb-4">
            <div className="text-sm font-medium text-slate-900">Appearance</div>
            <div className="text-xs text-slate-500">Choose a color theme for the whole app.</div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
};

export default observer(Settings);
