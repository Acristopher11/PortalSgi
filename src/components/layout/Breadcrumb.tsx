import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Breadcrumb.css';

// Map routes to human-readable labels and optional icons
const ROUTE_MAP: Record<string, { label: string; icon: string }> = {
  '/dashboard':     { label: 'Dashboard',                  icon: '⊞' },
  '/kpis':          { label: 'Reportes de Indicadores',    icon: '📊' },
  '/kpis-admin':    { label: 'Gestión de Indicadores',     icon: '⚙️' },
  '/procesos':      { label: 'Gestión de Procesos',        icon: '🔄' },
  '/riesgos':       { label: 'Gestión de Riesgos',         icon: '⚠️' },
  '/glosario':      { label: 'Glosario SGI',               icon: '📖' },
  '/documentos':    { label: 'Gestión Documental',         icon: '📄' },
  '/aprobaciones':  { label: 'Consola de Aprobaciones',   icon: '✅' },
  '/bitacora':      { label: 'Bitácora de Cambios',        icon: '🕐' },
  '/diagnostico':   { label: 'Diagnóstico',                icon: '🔧' },
};

interface Crumb {
  label: string;
  icon: string;
  path: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [
    { label: 'Inicio', icon: '🏠', path: '/dashboard' },
  ];

  // Match dynamic routes first (e.g. /procesos/:id)
  const processMatch = pathname.match(/^\/procesos\/(.+)$/);
  if (processMatch) {
    crumbs.push({ label: 'Gestión de Procesos', icon: '🔄', path: '/procesos' });
    crumbs.push({ label: 'Detalle del Proceso', icon: '📋', path: pathname });
    return crumbs;
  }

  // Static routes
  const entry = ROUTE_MAP[pathname];
  if (entry && pathname !== '/dashboard') {
    crumbs.push({ label: entry.label, icon: entry.icon, path: pathname });
  }

  return crumbs;
}

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = buildCrumbs(location.pathname);

  // Only show breadcrumb when deeper than root / dashboard
  if (crumbs.length <= 1) return null;

  const canGoBack = crumbs.length > 1;

  return (
    <nav className="breadcrumb-bar" aria-label="Navegación de migas de pan">
      {canGoBack && (
        <>
          <button
            className="breadcrumb-back-btn"
            onClick={() => navigate(-1)}
            title="Volver a la página anterior"
          >
            ← Volver
          </button>
          <span className="breadcrumb-divider-sep" aria-hidden="true" />
        </>
      )}

      <div className="breadcrumb-crumbs">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <React.Fragment key={crumb.path + index}>
              {isLast ? (
                <span className="breadcrumb-item-current" aria-current="page">
                  <span>{crumb.icon}</span>
                  {crumb.label}
                </span>
              ) : (
                <button
                  className="breadcrumb-item-link"
                  onClick={() => navigate(crumb.path)}
                  title={`Ir a ${crumb.label}`}
                >
                  <span>{crumb.icon}</span>
                  {crumb.label}
                </button>
              )}
              {!isLast && (
                <span className="breadcrumb-separator" aria-hidden="true">›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
