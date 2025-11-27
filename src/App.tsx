import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { useSupabaseUser } from './hooks/useSupabaseUser';
import { AccountsProvider } from './hooks/useAccountsStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import PocketDetailPage from './pages/PocketDetailPage';
import FFSPreloader from './components/preloaders/FFSPreloader';
import TransactionsPage from './pages/TransactionsPage';

import InvoiceAIPage from './pages/InvoiceAIPage';
import { preloaderManager } from './utils/PreloaderManager';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useSupabaseUser();
  const [introFinished, setIntroFinished] = useState(false);
  const [allowExit, setAllowExit] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    preloaderManager.initializeSession();
  }, []);

  // Handle user changes and preloader logic
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset on logout
    if (!user) {
      preloaderManager.reset();
      setIntroFinished(false);
      setAllowExit(false);
      return;
    }

    // Set user ID in manager
    preloaderManager.setUserId(user.id);

    // Check if preloader should show
    const { shouldShow, reason } = preloaderManager.shouldShowPreloader();

    // Debug logging (can be removed in production)
    console.log('[PreloaderManager]', { shouldShow, reason, debug: preloaderManager.getDebugInfo() });

    if (!shouldShow) {
      setIntroFinished(true);
      return;
    }

    // Show preloader
    setIntroFinished(false);
    setAllowExit(false);

    // Allow exit after animations complete (Apple-style timing)
    const allowExitTimer = window.setTimeout(() => {
      setAllowExit(true);
    }, 2800); // Slightly longer for smoother feel

    return () => window.clearTimeout(allowExitTimer);
  }, [user]);

  const handlePreloaderFinish = () => {
    preloaderManager.markAsShown();
    setIntroFinished(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!introFinished && (
          <FFSPreloader key="preloader" allowExit={allowExit} onFinish={handlePreloaderFinish} />
        )}
      </AnimatePresence>
      {introFinished && children}
    </>
  );
}

export default function App() {
  console.log('Rendering App.tsx, current path:', window.location.pathname);
  return (
    <AuthProvider>
      <AccountsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/pocket/:pocketId"
              element={
                <ProtectedRoute>
                  <PocketDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/resto/*"
              element={
                <ProtectedRoute>
                  <InvoiceAIPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Router>
      </AccountsProvider>
    </AuthProvider>
  );
}
