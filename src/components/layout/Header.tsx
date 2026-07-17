import React from 'react';
import {
  makeStyles,
  shorthands,
  Button,
  Text,
} from '@fluentui/react-components';
import { NavigationRegular, WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { useUIStore } from '../../store';
import { useAuth } from '../../hooks/useAuth';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '48px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E8EAED',
    ...shorthands.padding('0px', '24px'),
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  orgTitle: {
    color: '#001F3F',
    letterSpacing: '0.5px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1E3A5F',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '11px',
  },
  userName: {
    color: '#323130',
  },
});

export const Header: React.FC = () => {
  const styles = useStyles();
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useUIStore();
  const { displayName, sgiUsuario } = useAuth();

  const userInitials = React.useMemo(() => {
    if (!displayName) return 'US';
    const parts = displayName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'US';
  }, [displayName]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Button
          icon={<NavigationRegular />}
          appearance="subtle"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
        />
        <Text className={styles.orgTitle} weight="semibold" size={400}>
          {sgiUsuario?.areaNombre || 'Portal SGI — SaaS Shell'}
        </Text>
      </div>

      <div className={styles.rightSection}>
        <Button
          icon={theme === 'light' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
          appearance="subtle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        />
        {displayName && (
          <div className={styles.userSection}>
            <Text className={styles.userName} size={300} weight="medium">
              {displayName}
            </Text>
            <div className={styles.avatarCircle} title={displayName}>
              {userInitials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
