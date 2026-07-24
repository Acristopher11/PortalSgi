import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  BoardRegular,
  FlowRegular,
  AlertRegular,
  SignOutRegular,
  SettingsRegular,
  BookRegular,
  DocumentRegular,
  CheckmarkUnderlineCircleRegular,
  DocumentSearchRegular,
} from '@fluentui/react-icons';

import { useUIStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-glass-bg)',
    backdropFilter: 'var(--backdrop-blur)',
    WebkitBackdropFilter: 'var(--backdrop-blur)',
    color: tokens.colorNeutralForeground1,
    height: '100vh',
    ...shorthands.padding('16px'),
    transition: 'width 0.3s ease',
    borderRight: '1px solid var(--color-glass-border)',
  },
  sidebarCollapsed: {
    ...shorthands.padding('16px', '8px'),
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '32px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    color: tokens.colorBrandForeground1,
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '12px',
    overflowX: 'hidden',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...shorthands.padding('12px', '16px'),
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    '&.active': {
      backgroundColor: 'var(--color-midnight-blue)',
      color: '#ffffff',
      fontWeight: 600,
    },
  },
  menuItemCollapsed: {
    ...shorthands.padding('12px', '0px'),
    justifyContent: 'center',
  },
  footer: {
    borderTop: '1px solid var(--color-glass-border)',
    paddingTop: '16px',
    overflowX: 'hidden',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding('10px'),
    borderRadius: '6px',
    marginBottom: '12px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  userCardCollapsed: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    margin: '0 auto 12px auto',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  avatarCircle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-caribbean-red)',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  userName: {
    fontWeight: 600,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: tokens.fontSizeBase200,
    fontWeight: 'bold',
    ...shorthands.padding('1px', '5px'),
    borderRadius: '8px',
    color: '#fff',
    width: 'fit-content',
    marginTop: '1px',
    textTransform: 'uppercase',
  },
});

interface MenuItem {
  icon?: React.ReactNode;
  label: string;
  path: string;
  id: string;
  isSectionHeader?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    icon: <BoardRegular />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    id: 'politica-calidad',
    icon: <BookRegular />,
    label: 'Política de Calidad',
    path: '/politica-calidad',
  },
  {
    id: 'kpis-admin',
    icon: <SettingsRegular />,
    label: 'Gestión de Indicadores',
    path: '/kpis-admin',
  },
  {
    id: 'procesos',
    icon: <FlowRegular />,
    label: 'Gestión de Procesos',
    path: '/procesos',
  },
  {
    id: 'riesgos',
    icon: <AlertRegular />,
    label: 'Gestión de Riesgos',
    path: '/riesgos',
  },
  {
    id: 'glosario',
    icon: <BookRegular />,
    label: 'Glosario SGI',
    path: '/glosario',
  },
  {
    id: 'documentos',
    icon: <DocumentRegular />,
    label: 'Gestión Documental',
    path: '/documentos',
  },
  {
    id: 'acciones-correctivas',
    icon: <DocumentSearchRegular />,
    label: 'Gestión de acciones correctivas',
    path: '/acciones-correctivas',
  },
  {
    id: 'aprobaciones',
    icon: <CheckmarkUnderlineCircleRegular />,
    label: 'Consola de Aprobaciones',
    path: '/aprobaciones',
  },
  {
    id: 'configuracion',
    icon: <SettingsRegular />,
    label: 'Configuración',
    path: '/configuracion',
  },
];

export const Sidebar: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { activeMenu, setActiveMenu, sidebarOpen } = useUIStore();
  const { logout, isAdmin, isDeveloper, isProcessOwner, isEncargado, displayName, email, sgiUsuario } = useAuth();

  const userInitials = React.useMemo(() => {
    if (!displayName) return 'US';
    const parts = displayName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'US';
  }, [displayName]);

  const userRoleLabel = React.useMemo(() => {
    if (isDeveloper) return 'Desarrollador';
    if (isAdmin) return 'Admin SGI';
    if (isEncargado) return 'Encargado';
    if (isProcessOwner) return 'Dueño Proceso';
    return sgiUsuario?.rol || 'Usuario';
  }, [isDeveloper, isAdmin, isEncargado, isProcessOwner, sgiUsuario?.rol]);

  const userRoleColor = React.useMemo(() => {
    if (isDeveloper) return '#0078D4'; // Blue
    if (isAdmin) return '#DC143C'; // Caribbean Red
    if (isEncargado) return '#FF8C00'; // Dark Orange
    if (isProcessOwner) return '#107C41'; // Green
    return '#605E5C'; // Gray
  }, [isDeveloper, isAdmin, isEncargado, isProcessOwner]);

  const handleMenuClick = (item: MenuItem) => {
    setActiveMenu(item.id);
    navigate(item.path, { viewTransition: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { viewTransition: true });
  };

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.id === 'aprobaciones') {
      return isAdmin || isDeveloper || isProcessOwner || isEncargado;
    }
    if (item.id === 'configuracion') {
      return isAdmin || isDeveloper;
    }
    return true;
  });


  return (
    <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`} style={{ width: sidebarOpen ? '250px' : '64px' }}>
      <div className={styles.logo}>
        {sidebarOpen ? <span>GEMS Portal</span> : <span>GEMS</span>}
      </div>

      <div className={styles.menu}>
        {visibleMenuItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.menuItem} ${!sidebarOpen ? styles.menuItemCollapsed : ''} ${activeMenu === item.id || (activeMenu !== 'configuracion' && item.id === 'configuracion' && window.location.pathname.startsWith('/configuracion')) ? 'active' : ''}`}
            onClick={() => handleMenuClick(item as MenuItem)}
            title={!sidebarOpen ? item.label : undefined}
          >
            <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
              {item.icon}
            </div>
            {sidebarOpen && <span>{item.label}</span>}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div
          className={`${styles.menuItem} ${!sidebarOpen ? styles.menuItemCollapsed : ''}`}
          onClick={handleLogout}
          style={{ marginTop: '0px' }}
          title={!sidebarOpen ? 'Salir' : undefined}
        >
          <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
            <SignOutRegular />
          </div>
          {sidebarOpen && <span>Salir</span>}
        </div>
      </div>
    </div>
  );
};
