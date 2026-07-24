import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner, Button, Text, tokens } from '@fluentui/react-components';
import { ClockRegular, SignOutRegular } from '@fluentui/react-icons';
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
  const { isAuthenticated, isAdmin, isDeveloper, isProcessOwner, isEncargado, loadingUser, sgiUsuario, displayName, logout } = useAuth();

  if (loadingUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check active profile - Block authenticated users without active profile
  if (isAuthenticated && (!sgiUsuario || !sgiUsuario.activo)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: tokens.colorNeutralBackground1,
        padding: '24px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          backgroundColor: tokens.colorNeutralBackground2,
          padding: '40px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08))',
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          maxWidth: '480px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fff7e6',
            color: '#d46b08',
            fontSize: '32px',
          }}>
            <ClockRegular />
          </div>
          
          <div>
            <Text size={600} weight="bold" style={{ color: tokens.colorNeutralForeground1, display: 'block', marginBottom: '8px' }}>
              Cuenta Pendiente de Aprobación
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2, lineHeight: '1.6' }}>
              Hola, <strong style={{ color: tokens.colorNeutralForeground1 }}>{displayName}</strong>. Tu cuenta ha sido registrada correctamente en <strong>GEMS</strong>, pero debe ser aprobada por un administrador antes de poder ingresar.
            </Text>
          </div>

          <Button
            appearance="outline"
            icon={<SignOutRegular />}
            onClick={logout}
            style={{ width: '100%' }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
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
          Lo sentimos, esta sección es de uso exclusivo para el usuario Desarrollador de la plataforma GEMS.
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
          Lo sentimos, esta sección es de uso exclusivo para Aprobadores autorizados (Administradores, Dueños de Proceso o Encargados GEMS).
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
          Lo sentimos, esta sección es de uso exclusivo para Administradores o Dueños de Proceso de la plataforma GEMS.
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
          Lo sentimos, esta sección es de uso exclusivo para usuarios administradores de la plataforma GEMS.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
