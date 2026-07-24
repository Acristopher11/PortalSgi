import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  PeopleRegular,
  HistoryRegular,
  WrenchRegular,
  SettingsRegular,
  FlowRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    ...shorthands.padding('24px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  headerIcon: {
    fontSize: '32px',
    color: 'var(--color-midnight-blue, #001F3F)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    border: '1px solid #E8EAED',
    ...shorthands.borderRadius('12px'),
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  },
  cardIcon: {
    fontSize: '48px',
    color: 'var(--color-caribbean-red, #DC143C)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('32px'),
    backgroundColor: 'rgba(220, 20, 60, 0.05)',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    ...shorthands.padding('20px'),
  }
});

export const Configuration: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const configOptions = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Crea, edita y administra los usuarios, roles y áreas asociadas en el sistema.',
      icon: <PeopleRegular />,
      path: '/usuarios',
    },
    {
      id: 'gestion-flujos',
      title: 'Gestión de Flujos',
      description: 'Configura y administra los flujos de aprobación y procesos asociados.',
      icon: <FlowRegular />,
      path: '/gestion-flujos',
    },
    {
      id: 'bitacora',
      title: 'Bitácora de Cambios',
      description: 'Revisa el historial detallado de todas las acciones y auditorías del SGI.',
      icon: <HistoryRegular />,
      path: '/bitacora',
    },
    {
      id: 'diagnostico',
      title: 'Diagnóstico',
      description: 'Herramientas de desarrollador para verificar la conexión y estado del sistema.',
      icon: <WrenchRegular />,
      path: '/diagnostico',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SettingsRegular className={styles.headerIcon} />
        <Text size={700} weight="semibold">Configuración del Sistema</Text>
      </div>
      
      <Text style={{ color: 'var(--color-neutral-foreground-2)', marginBottom: '16px' }}>
        Opciones avanzadas y herramientas administrativas para el correcto funcionamiento del portal.
      </Text>

      <div className={styles.grid}>
        {configOptions.map(option => (
          <div 
            key={option.id} 
            className={styles.card} 
            onClick={() => navigate(option.path, { viewTransition: true })}
          >
            <div className={styles.cardIcon}>
              {option.icon}
            </div>
            <div className={styles.cardBody}>
              <Text weight="semibold" size={400}>{option.title}</Text>
              <Text size={300}>{option.description}</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
