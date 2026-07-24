import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Button, Spinner } from '@fluentui/react-components';
import { customTheme, customDarkTheme } from './theme/customTheme';
import { useUIStore } from './store';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Lazy loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const KPIReports = lazy(() => import('./pages/KPIReports').then(m => ({ default: m.KPIReports })));
const ProcessManagement = lazy(() => import('./pages/ProcessManagement').then(m => ({ default: m.ProcessManagement })));
const RiskManagement = lazy(() => import('./pages/RiskManagement').then(m => ({ default: m.RiskManagement })));
const KPIManagement = lazy(() => import('./pages/KPIManagement').then(m => ({ default: m.KPIManagement })));
const DeveloperDiagnostics = lazy(() => import('./pages/DeveloperDiagnostics').then(m => ({ default: m.DeveloperDiagnostics })));
const GlossaryManagement = lazy(() => import('./pages/GlossaryManagement').then(m => ({ default: m.GlossaryManagement })));
const ProcessDetail = lazy(() => import('./pages/ProcessDetail').then(m => ({ default: m.ProcessDetail })));
const DocumentManagement = lazy(() => import('./pages/DocumentManagement').then(m => ({ default: m.DocumentManagement })));
const QualityPolicy = lazy(() => import('./pages/QualityPolicy').then(m => ({ default: m.QualityPolicy })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs').then(m => ({ default: m.ActivityLogs })));
const ApprovalConsole = lazy(() => import('./pages/ApprovalConsole').then(m => ({ default: m.ApprovalConsole })));
const FlowManagement = lazy(() => import('./pages/FlowManagement').then(m => ({ default: m.FlowManagement })));
const CorrectiveActionManagement = lazy(() => import('./pages/CorrectiveActionManagement').then(m => ({ default: m.CorrectiveActionManagement })));
const Configuration = lazy(() => import('./pages/Configuration').then(m => ({ default: m.Configuration })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));

function AppContent() {
  const [devEmail, setDevEmail] = useState<{ to: string[]; subject: string; body: string } | null>(null);

  useEffect(() => {
    const handleDevEmail = (e: Event) => {
      const customEvent = e as CustomEvent;
      setDevEmail(customEvent.detail);
    };
    window.addEventListener('sgi-dev-email', handleDevEmail);
    return () => {
      window.removeEventListener('sgi-dev-email', handleDevEmail);
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%' }}>
            <Spinner label="Cargando módulo..." size="large" />
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/politica-calidad" 
              element={
                <ProtectedRoute>
                  <QualityPolicy />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kpis" 
              element={
                <ProtectedRoute>
                  <KPIReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kpis-admin" 
              element={
                <ProtectedRoute>
                  <KPIManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/procesos" 
              element={
                <ProtectedRoute>
                  <ProcessManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/procesos/:id" 
              element={
                <ProtectedRoute>
                  <ProcessDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/riesgos" 
              element={
                <ProtectedRoute>
                  <RiskManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/glosario" 
              element={
                <ProtectedRoute>
                  <GlossaryManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documentos" 
              element={
                <ProtectedRoute>
                  <DocumentManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/acciones-correctivas" 
              element={
                <ProtectedRoute>
                  <CorrectiveActionManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/aprobaciones" 
              element={
                <ProtectedRoute requireApprover>
                  <ApprovalConsole />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gestion-flujos" 
              element={
                <ProtectedRoute requireAdmin>
                  <FlowManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bitacora" 
              element={
                <ProtectedRoute requireAdmin>
                  <ActivityLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/diagnostico" 
              element={
                <ProtectedRoute requireDeveloper>
                  <DeveloperDiagnostics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracion" 
              element={
                <ProtectedRoute requireAdmin>
                  <Configuration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>

      {devEmail && (
        <Dialog open={true} onOpenChange={() => setDevEmail(null)}>
          <DialogSurface style={{ maxWidth: '700px', width: '90%', border: '2px solid #0078D4', borderRadius: '8px', padding: '24px' }}>
            <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DialogTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0078D4' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>📧 Notificación de Correo Simulado (Modo Desarrollo)</span>
                </div>
              </DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F3F2F1', padding: '12px', borderRadius: '6px', border: '1px solid #D2D0CE', fontSize: '13px', color: '#323130' }}>
                  <div><strong>Para:</strong> {devEmail.to.join(', ')}</div>
                  <div><strong>Asunto:</strong> {devEmail.subject}</div>
                </div>
                <div 
                  style={{ 
                    marginTop: '8px', 
                    border: '1px solid #D2D0CE', 
                    borderRadius: '6px', 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  dangerouslySetInnerHTML={{ __html: devEmail.body }}
                />
              </DialogContent>
              <DialogActions style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button appearance="primary" onClick={() => setDevEmail(null)}>
                  Cerrar Vista Previa
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </Router>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const { theme } = useUIStore();
  const currentTheme = theme === 'dark' ? customDarkTheme : customTheme;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <FluentProvider theme={currentTheme}>
        <AppContent />
      </FluentProvider>
    </QueryClientProvider>
  );
}

export default App;
