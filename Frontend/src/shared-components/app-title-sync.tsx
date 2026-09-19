import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../contexts/store-provider';

const DEFAULT_TITLE = 'Vijay Dairy';

/**
 * Keeps the browser tab title in sync with the editable Shop Name field on the
 * Settings page — so the app's displayed name isn't hardcoded, it's whatever
 * the admin has set for their business.
 */
const AppTitleSync = () => {
  const { authStore, settingsStore } = useStore();

  useEffect(() => {
    if (authStore.isAuthenticated && !settingsStore.settings) {
      settingsStore.fetchAsync();
    }
  }, [authStore.isAuthenticated, settingsStore]);

  const shopName = settingsStore.settings?.shopName?.trim();

  useEffect(() => {
    document.title = shopName ? `${shopName} — Dairy Ops` : DEFAULT_TITLE;
  }, [shopName]);

  return null;
};

export default observer(AppTitleSync);
