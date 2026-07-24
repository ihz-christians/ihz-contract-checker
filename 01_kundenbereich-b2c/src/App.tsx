import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Upload from './pages/Upload';
import AgencyReports from './pages/AgencyReports';
import RegulatorReports from './pages/RegulatorReports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function LoginRedirect() {
  const landingPageUrl = import.meta.env.VITE_LANDINGPAGE_URL || 'https://ihrezuhauseberatung.de';
  window.location.href = `${landingPageUrl}/login`;
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Sitzung wird geladen...
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <LoginRedirect />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Sitzung wird geladen...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={state.isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginRedirect />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/reports/agency" element={<AgencyReports />} />
        <Route path="/reports/regulator" element={<RegulatorReports />} />
        <Route path="/settings/profile" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
