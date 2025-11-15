import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
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
  const [allowExit, setAllowExit] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user) {
      window.__FFSPreloaderPlayed = false;
      setIntroFinished(false);
      setAllowExit(false);
      return;
    }

    if (window.__FFSPreloaderPlayed) {
      setIntroFinished(true);
      return;
    }

    setIntroFinished(false);
    setAllowExit(false);
    
    // Esperar a que las letras FFS aparezcan antes de permitir salida
    const allowExitTimer = window.setTimeout(() => {
      setAllowExit(true);
    }, 2500);

    return () => window.clearTimeout(allowExitTimer);
  }, [user]);

  const handlePreloaderFinish = () => {
    window.__FFSPreloaderPlayed = true;
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
