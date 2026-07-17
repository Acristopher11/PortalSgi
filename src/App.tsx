import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Button } from '@fluentui/react-components';
import { customTheme } from './theme/customTheme';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { KPIReports } from './pages/KPIReports';
import { ProcessManagement } from './pages/ProcessManagement';
import { RiskManagement } from './pages/RiskManagement';
import { KPIManagement } from './pages/KPIManagement';
import { DeveloperDiagnostics } from './pages/DeveloperDiagnostics';
import { GlossaryManagement } from './pages/GlossaryManagement';
import { ProcessDetail } from './pages/ProcessDetail';
import { DocumentManagement } from './pages/DocumentManagement';
import { QualityPolicy } from './pages/QualityPolicy';
import { Login } from './pages/Login';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ActivityLogs } from './pages/ActivityLogs';
import { ApprovalConsole } from './pages/ApprovalConsole';
import { FlowManagement } from './pages/FlowManagement';
import { CorrectiveActionManagement } from './pages/CorrectiveActionManagement';
import { Configuration } from './pages/Configuration';
import './App.css';

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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

function App() {
  return (
    <FluentProvider theme={customTheme}>
      <AppContent />
    </FluentProvider>
  );
}

export default App;
