import { Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../contexts/store-provider';
import { PageLoader } from './illustrations/loaders';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  if (authStore.loadingMe) {
    return <PageLoader variant="pour" fullScreen label="Getting things ready…" />;
  }

  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default observer(ProtectedRoute);
