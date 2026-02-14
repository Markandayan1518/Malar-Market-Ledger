import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { I18nextProvider } from './i18n/i18n';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DailyEntryPage from './pages/DailyEntryPage';
import FarmersPage from './pages/FarmersPage';
import MarketRatesPage from './pages/MarketRatesPage';
import CashAdvancesPage from './pages/CashAdvancesPage';
import SettlementsPage from './pages/SettlementsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }, [isAuthenticated, loading, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
