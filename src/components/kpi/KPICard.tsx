import React from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowUpRegular,
  ArrowDownRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import type { KPI } from '../../types';
import './KPICard.css';

const useStyles = makeStyles({
  card: {
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('8px'),
    minHeight: '180px',
    boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08))',
    backgroundColor: 'var(--color-white, #FFFFFF)',
    border: '1px solid var(--color-border, #E8EAED)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  title: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  metrics: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-border, #E8EAED)',
  },
  badge: {
    fontWeight: 'bold',
  }
});

interface KPICardProps {
  kpi: KPI;
  onClick?: () => void;
  selectedYear?: string;
  selectedQuarter?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, onClick, selectedYear, selectedQuarter }) => {
  const styles = useStyles();
  const hasValue = kpi.valor_actual !== null;
  const percentage = (hasValue && kpi.meta > 0) ? (kpi.valor_actual! / kpi.meta) * 100 : 0;

  const getStatusColor = () => {
    switch (kpi.estado) {
      case 'on_track':
        return '#107C10'; // Green
      case 'at_risk':
        return '#FFB900'; // Yellow/Orange
      case 'off_track':
        return 'var(--color-caribbean-red, #DC143C)'; // Caribbean Red
      case 'no_data':
        return '#7A8B9E'; // Neutral Gray
      default:
        return 'var(--color-midnight-blue, #001F3F)'; // Default Midnight Blue
    }
  };

  const getStatusIcon = () => {
    switch (kpi.estado) {
      case 'on_track':
        return <CheckmarkCircleRegular style={{ color: getStatusColor() }} />;
      case 'at_risk':
        return <WarningRegular style={{ color: getStatusColor() }} />;
      case 'off_track':
      case 'no_data':
        return <ErrorCircleRegular style={{ color: getStatusColor() }} />;
      default:
        return null;
    }
  };

  const getTrendIcon = () => {
    switch (kpi.tendencia) {
      case 'up':
        return <ArrowUpRegular style={{ color: '#107C10' }} />;
      case 'down':
        return <ArrowDownRegular style={{ color: 'var(--color-caribbean-red, #DC143C)' }} />;
      default:
        return null;
    }
  };

  // Calculate missing periods for the selected or current year
  const getMissingPeriods = (): string[] => {
    if (!kpi.mediciones) return [];
    
    const targetYear = (selectedYear && selectedYear !== 'Todos') 
      ? parseInt(selectedYear) 
      : new Date().getFullYear();
      
    const kpisCount = (kpi as any).kpisCount || 1;
    
    // Filter measurements by the target year
    const yearMeds = kpi.mediciones.filter(m => m.anio === targetYear);
    
    let expected: string[] = [];
    const periodicity = (kpi.periodicidad || 'Trimestral').toLowerCase().trim();
    if (periodicity.includes('trimestral') || periodicity.includes('quarterly')) {
      expected = ['Q1', 'Q2', 'Q3', 'Q4'];
    } else if (periodicity.includes('semestral')) {
      expected = ['Q2', 'Q4'];
    } else if (periodicity.includes('anual')) {
      expected = ['Q4'];
    } else {
      expected = ['Q1', 'Q2', 'Q3', 'Q4'];
    }
    
    const quarterCounts: Record<string, number> = {};
    yearMeds.forEach(m => {
      if (m.trimestre) {
        quarterCounts[m.trimestre] = (quarterCounts[m.trimestre] || 0) + 1;
      }
    });
    
    return expected.filter(q => (quarterCounts[q] || 0) < kpisCount);
  };

  // Extract Quarter and Year for the legend
  const date = new Date(kpi.fecha_ultima_actualizacion);
  
  // Prioritize the KPI's own mapped period_medido fields if they exist
  const displayQuarter = kpi.periodo_medido_trimestre || ((selectedQuarter && selectedQuarter !== 'Todos')
    ? selectedQuarter
    : `Q${Math.floor((date.getMonth() + 3) / 3)}`);
    
  const displayYear = kpi.periodo_medido_anio ? String(kpi.periodo_medido_anio) : ((selectedYear && selectedYear !== 'Todos')
    ? selectedYear
    : String(date.getFullYear()));
    
  const periodicityLabel = kpi.periodicidad ? ` (${kpi.periodicidad})` : '';
  const missingPeriods = getMissingPeriods();

  return (
    <Card className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Text weight="bold" size={400} style={{ color: 'var(--color-text-primary, #2D3748)' }}>
            {kpi.nombre}
          </Text>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            {kpi.area}
          </Text>
        </div>
        {getStatusIcon()}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Actual
          </Text>
          <Text weight="bold" size={500} style={{ color: getStatusColor() }}>
            {hasValue ? `${kpi.valor_actual!.toFixed(1)}%` : 'N/A'}
          </Text>
        </div>
        <div className={styles.metric}>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Meta
          </Text>
          <Text weight="bold" size={500} style={{ color: 'var(--color-text-primary, #2D3748)' }}>
            {kpi.meta.toFixed(1)}%
          </Text>
        </div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
         <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
           Periodo medido: {displayQuarter} {displayYear}{periodicityLabel}
         </Text>
      </div>

      {missingPeriods.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#B78C00' }}>
          <WarningRegular style={{ fontSize: '14px' }} />
          <Text size={100} weight="semibold">Falta medir: {missingPeriods.join(', ')}</Text>
        </div>
      )}

      <div className="kpi-progress-bar">
        <div
          className="kpi-progress-bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getStatusColor(),
          }}
        />
      </div>

      <div className={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getTrendIcon()}
          <Badge
            appearance="outline"
            className={styles.badge}
            style={{ color: getStatusColor(), borderColor: getStatusColor() }}
          >
            {kpi.estado === 'no_data' ? 'SIN DATOS' : kpi.estado.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

