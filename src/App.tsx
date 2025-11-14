import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useSupabaseUser } from './hooks/useSupabaseUser';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import PocketDetailPage from './pages/PocketDetailPage';
import FFSPreloader from './components/preloaders/FFSPreloader';

declare global {
  interface Window {
    __FFSPreloaderPlayed?: boolean;
  }
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useSupabaseUser();
  const [introFinished, setIntroFinished] = useState(() =>
    typeof window !== 'undefined' ? Boolean(window.__FFSPreloaderPlayed) : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user) {
      window.__FFSPreloaderPlayed = false;
      setIntroFinished(false);
      return;
    }

    if (window.__FFSPreloaderPlayed) {
      setIntroFinished(true);
      return;
    }

    setIntroFinished(false);
    const timer = window.setTimeout(() => {
      window.__FFSPreloaderPlayed = true;
      setIntroFinished(true);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [user]);

  if (loading || (user && !introFinished)) {
    return <FFSPreloader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
