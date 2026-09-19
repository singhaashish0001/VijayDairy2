/**
 * @file store-provider.tsx
 * @summary MobX root-store context provider and consumer hook.
 */
import React from 'react';
import rootStore, { type RootStore } from '../core/stores';

const storeContext = React.createContext<RootStore | null>(null);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  return <storeContext.Provider value={rootStore}>{children}</storeContext.Provider>;
};

export const useStore = (): RootStore => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }
  return store;
};
