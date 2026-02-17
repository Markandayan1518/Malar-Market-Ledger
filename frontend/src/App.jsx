import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import i18n from './i18n/i18n';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DailyEntryPage from './pages/DailyEntryPage';
import FarmersPage from './pages/FarmersPage';
import MarketRatesPage from './pages/MarketRatesPage';
import CashAdvancesPage from './pages/CashAdvancesPage';
import SettlementsPage from './pages/SettlementsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import InvoicePage from './pages/InvoicePage';
import BusinessSettingsPage from './pages/BusinessSettingsPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <I18nextProvider>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <DashboardPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <DashboardPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/daily-entry"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <MainLayout>
                          <DailyEntryPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/farmers"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <FarmersPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/market-rates"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <MainLayout>
                          <MarketRatesPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cash-advances"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <CashAdvancesPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settlements"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <SettlementsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <MainLayout>
                          <ReportsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout>
                          <SettingsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoices"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'staff']}>
                        <MainLayout>
                          <InvoicePage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/business-settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout>
                          <BusinessSettingsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App;
