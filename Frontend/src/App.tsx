import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StoreProvider } from './contexts/store-provider';
import AuthProvider from './contexts/auth-provider';
import ThemeProvider from './contexts/theme-provider';
import AppTitleSync from './shared-components/app-title-sync';
import ProtectedRoute from './shared-components/protected-route';
import Layout from './shared-components/layout';
import Login from './modules/auth/login';
import Dashboard from './modules/dashboard/dashboard';
import Product from './modules/product/product';
import CreateInvoice from './modules/invoice/create-invoice';
import Invoices from './modules/invoice/invoices';
import Settings from './modules/settings/settings';
import PublicInvoice from './modules/public-invoice/public-invoice';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StoreProvider>
          <AuthProvider>
            <AppTitleSync />
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/invoice/:id" element={<PublicInvoice />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Product />} />
                <Route path="/invoices/new" element={<CreateInvoice />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </AuthProvider>
        </StoreProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
