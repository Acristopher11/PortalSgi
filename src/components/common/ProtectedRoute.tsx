import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDeveloper?: boolean;
  requireAdminOrOwner?: boolean;
  requireApprover?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireDeveloper = false,
  requireAdminOrOwner = false,
  requireApprover = false,
}) => {
  const { isAuthenticated, isAdmin, isDeveloper, isProcessOwner, isEncargado } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireDeveloper && !isDeveloper) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        marginTop: '60px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <h2 style={{ color: 'var(--color-brand-stroke1, #DC143C)' }}>Acceso No Autorizado</h2>
        <p style={{ color: 'var(--color-text-secondary, #636F7D)', maxWidth: '450px' }}>
          Lo sentimos, esta sección es de uso exclusivo para el usuario Desarrollador del Portal SGI.
        </p>
      </div>
    );
  }

  if (requireApprover && !isAdmin && !isDeveloper && !isProcessOwner && !isEncargado) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        marginTop: '60px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <h2 style={{ color: 'var(--color-brand-stroke1, #DC143C)' }}>Acceso No Autorizado</h2>
        <p style={{ color: 'var(--color-text-secondary, #636F7D)', maxWidth: '450px' }}>
          Lo sentimos, esta sección es de uso exclusivo para Aprobadores autorizados (Administradores, Dueños de Proceso o Encargados SGI).
        </p>
      </div>
    );
  }

  if (requireAdminOrOwner && !isAdmin && !isDeveloper && !isProcessOwner) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        marginTop: '60px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <h2 style={{ color: 'var(--color-brand-stroke1, #DC143C)' }}>Acceso No Autorizado</h2>
        <p style={{ color: 'var(--color-text-secondary, #636F7D)', maxWidth: '450px' }}>
          Lo sentimos, esta sección es de uso exclusivo para Administradores o Dueños de Proceso del Portal SGI.
        </p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin && !isDeveloper) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        marginTop: '60px',
        textAlign: 'center',
        gap: '16px'
      }}>
        <h2 style={{ color: 'var(--color-brand-stroke1, #DC143C)' }}>Acceso No Autorizado</h2>
        <p style={{ color: 'var(--color-text-secondary, #636F7D)', maxWidth: '450px' }}>
          Lo sentimos, esta sección es de uso exclusivo para usuarios administradores del Portal SGI.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
