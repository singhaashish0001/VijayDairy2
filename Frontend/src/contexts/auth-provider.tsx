/**
 * @file auth-provider.tsx
 * @description On mount, if a persisted token exists, re-validates the session against
 *              /auth/me so a stale/expired token doesn't leave the app in a falsely
 *              "logged in" state after a reload.
 */
import { useEffect } from 'react';
import { useStore } from './store-provider';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  useEffect(() => {
    if (authStore.getToken) {
      authStore.fetchCurrentUser();
    }
  }, [authStore]);

  return <>{children}</>;
};

export default AuthProvider;
