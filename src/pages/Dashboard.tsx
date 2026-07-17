import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Spinner,
  Dropdown,
  Option,
  TabList,
  Tab,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  FilterRegular,
  FlowRegular,
  DataLineRegular,
} from '@fluentui/react-icons';
import { KPICard } from '../components/kpi/KPICard';
import type { DashboardMetrics, KPIMeasurement, KPI, QualityObjective, Process } from '../types';
import { sharePointService } from '../services/sharePointService';
import { useKPIStore, useRiskStore, useProcessStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--color-white, #FFFFFF)',
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('8px'),
    boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08))',
    border: '1px solid var(--color-border, #E8EAED)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filtersContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    backgroundColor: 'var(--color-white, #FFFFFF)',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.04))',
    border: '1px solid var(--color-border, #E8EAED)',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '180px',
  },
  kpisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
});

export const Dashboard: React.FC = () => {
  const styles = useStyles();
  const { getSharePointToken } = useAuth();

  // Stores
  const { kpis, loading: loadingKPIs, error: errorKPIs, setKPIs, setLoading: setLoadingKPIs, setError: setErrorKPIs } = useKPIStore();
  const { risks, loading: loadingRisks, error: errorRisks, setRisks, setLoading: setLoadingRisks, setError: setErrorRisks } = useRiskStore();
  const { setProcesses } = useProcessStore();

  // Primary toggle
  const [dashboardType, setDashboardType] = useState<'kpi' | 'risk' | 'policy'>('kpi');

  // KPI Filter states
  const [selectedProcess, setSelectedProcess] = useState<string>('Todos');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Todos');
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [selectedTab, setSelectedTab] = useState<'process' | 'indicator'>('process');

  // Risk Filter states
  const [selectedRiskProcess, setSelectedRiskProcess] = useState<string>('Todos');
  const [selectedRiskType, setSelectedRiskType] = useState<string>('Todos');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('Todos');
  const [selectedRiskExposure, setSelectedRiskExposure] = useState<string>('Todos');
  const [selectedRiskStatus, setSelectedRiskStatus] = useState<string>('Todos');

  // Quality Policy States
  const [objectives, setObjectives] = useState<QualityObjective[]>([]);
  const [processesList, setProcessesList] = useState<Process[]>([]);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [errorPolicy, setErrorPolicy] = useState<string | null>(null);
  const [selectedObjectiveDetail, setSelectedObjectiveDetail] = useState<QualityObjective | null>(null);

  // Data Loading
  const loadKPIs = useCallback(async () => {
    setLoadingKPIs(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getKPIs(token);
      setKPIs(data);
    } catch (err) {
      setErrorKPIs(err instanceof Error ? err.message : 'Error al cargar KPIs');
    } finally {
      setLoadingKPIs(false);
    }
  }, [setLoadingKPIs, setKPIs, setErrorKPIs, getSharePointToken]);

  const loadRisks = useCallback(async () => {
    setLoadingRisks(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getRisks(token);
      setRisks(data);

      const procs = await sharePointService.getProcesses(token);
      setProcesses(procs);
    } catch (err) {
      setErrorRisks(err instanceof Error ? err.message : 'Error al cargar riesgos');
    } finally {
      setLoadingRisks(false);
    }
  }, [setLoadingRisks, setRisks, setProcesses, setErrorRisks, getSharePointToken]);

  const loadPolicyData = useCallback(async () => {
    setLoadingPolicy(true);
    setErrorPolicy(null);
    try {
      const token = await getSharePointToken();
      const objs = await sharePointService.getQualityObjectives(token);
      setObjectives(objs.sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })));
      const procs = await sharePointService.getProcesses(token);
      setProcessesList(procs);
    } catch (err) {
      setErrorPolicy(err instanceof Error ? err.message : 'Error al cargar política de calidad');
    } finally {
      setLoadingPolicy(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadKPIs();
    loadRisks();
    loadPolicyData();
  }, [loadKPIs, loadRisks, loadPolicyData]);

  // Refresher
  const handleRefresh = () => {
    if (dashboardType === 'kpi') {
      loadKPIs();
    } else if (dashboardType === 'risk') {
      loadRisks();
    } else {
      loadPolicyData();
      loadKPIs();
    }
  };

  // --- KPI LOGIC ---
  const processOptions = useMemo(() => {
    const procs = new Set(kpis.map(k => k.area).filter(Boolean));
    return ['Todos', ...Array.from(procs)];
  }, [kpis]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    kpis.forEach(kpi => {
      if (kpi.mediciones) {
        kpi.mediciones.forEach(m => {
          if (m.anio) {
            years.add(m.anio.toString());
          }
        });
      }
      if (kpi.fecha_ultima_actualizacion) {
        years.add(new Date(kpi.fecha_ultima_actualizacion).getFullYear().toString());
      }
    });
    return ['Todos', ...Array.from(years).sort().reverse()];
  }, [kpis]);

  const quarterOptions = ['Todos', 'Q1', 'Q2', 'Q3', 'Q4'];

  const filteredKPIs = useMemo(() => {
    return kpis.map(kpi => {
      const measurements = kpi.mediciones || [];
      let targetMed: KPIMeasurement | undefined = undefined;

      if (selectedYear === 'Todos' && selectedQuarter === 'Todos') {
        const validMeds = measurements.filter(m => m.valor !== null && m.comentarios?.toUpperCase() !== 'N/A');
        if (validMeds.length > 0) {
          const sorted = [...validMeds].sort((a, b) => {
            const yearDiff = (b.anio || 0) - (a.anio || 0);
            if (yearDiff !== 0) return yearDiff;
            const monthA = sharePointService.mapMonthNameToMonthIndex(a.mes);
            const monthB = sharePointService.mapMonthNameToMonthIndex(b.mes);
            return monthB - monthA;
          });
          targetMed = sorted[0];
        } else if (measurements.length > 0) {
          targetMed = measurements[measurements.length - 1];
        }
      } else {
        targetMed = measurements.find(m => {
          const matchesYear = selectedYear === 'Todos' || String(m.anio) === selectedYear;
          const matchesQuarter = selectedQuarter === 'Todos' || m.trimestre === selectedQuarter;
          return matchesYear && matchesQuarter;
        });
      }

      let valor_actual = kpi.valor_actual;
      let estado = kpi.estado;
      let fecha = kpi.fecha_ultima_actualizacion;
      let periodo_medido_trimestre = kpi.periodo_medido_trimestre;
      let periodo_medido_anio = kpi.periodo_medido_anio;

      if (targetMed) {
        valor_actual = targetMed.valor;
        if (valor_actual === null) {
          estado = 'no_data';
        } else {
          estado = sharePointService.calculateKPIStatus(valor_actual, kpi.meta);
        }
        fecha = targetMed.fecha;
        periodo_medido_trimestre = targetMed.trimestre;
        periodo_medido_anio = targetMed.anio;
      } else if (selectedYear !== 'Todos' || selectedQuarter !== 'Todos') {
        valor_actual = null;
        estado = 'no_data';
        const year = selectedYear !== 'Todos' ? parseInt(selectedYear) : new Date().getFullYear();
        let month = 2;
        if (selectedQuarter === 'Q2') month = 5;
        else if (selectedQuarter === 'Q3') month = 8;
        else if (selectedQuarter === 'Q4') month = 11;
        fecha = new Date(year, month, 28);
        periodo_medido_trimestre = selectedQuarter !== 'Todos' ? selectedQuarter : undefined;
        periodo_medido_anio = selectedYear !== 'Todos' ? parseInt(selectedYear) : undefined;
      }

      return {
        ...kpi,
        valor_actual,
        estado,
        fecha_ultima_actualizacion: fecha,
        periodo_medido_trimestre,
        periodo_medido_anio
      };
    }).filter(kpi => {
      return selectedProcess === 'Todos' || kpi.area === selectedProcess;
    }).sort((a, b) => {
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [kpis, selectedProcess, selectedQuarter, selectedYear]);

  const policyPerformance = useMemo(() => {
    return objectives.map(obj => {
      const associatedProcesses = processesList.filter(p => p.objetivosIds?.includes(Number(obj.id)));
      const procIds = associatedProcesses.map(p => p.id);
      const procCodes = associatedProcesses.map(p => p.codigo.toLowerCase());
      const procNames = associatedProcesses.map(p => p.nombre.toLowerCase());

      const associatedKPIs = filteredKPIs.filter(k => 
        (k.processId && procIds.includes(k.processId)) ||
        (k.area && (procCodes.includes(k.area.toLowerCase()) || procNames.includes(k.area.toLowerCase())))
      );

      const validKPIs = associatedKPIs.filter(k => k.valor_actual !== null);

      let complianceAvg: number | null = null;
      if (validKPIs.length > 0) {
        const totalCompliance = validKPIs.reduce((sum, k) => {
          const actual = k.valor_actual!;
          const meta = k.meta || 1;
          const pct = Math.min((actual / meta) * 100, 100);
          return sum + pct;
        }, 0);
        complianceAvg = Math.round(totalCompliance / validKPIs.length);
      }

      return {
        objective: obj,
        processes: associatedProcesses,
        kpis: associatedKPIs,
        compliance: complianceAvg
      };
    });
  }, [objectives, processesList, filteredKPIs]);

  const overallPolicyCompliance = useMemo(() => {
    const validObjectives = policyPerformance.filter(p => p.compliance !== null);
    if (validObjectives.length === 0) return null;
    const sum = validObjectives.reduce((acc, p) => acc + p.compliance!, 0);
    return Math.round(sum / validObjectives.length);
  }, [policyPerformance]);

  const processCards = useMemo(() => {
    const groups: Record<string, typeof kpis> = {};
    filteredKPIs.forEach(kpi => {
      const processName = kpi.area || 'General';
      if (!groups[processName]) {
        groups[processName] = [];
      }
      groups[processName].push(kpi);
    });

    return Object.entries(groups).map(([processName, kpisInGroup]) => {
      const totalMeta = kpisInGroup.reduce((sum, k) => sum + k.meta, 0);
      const avgMeta = kpisInGroup.length > 0 ? totalMeta / kpisInGroup.length : 0;

      const validKPIs = kpisInGroup.filter(k => k.valor_actual !== null);
      let avgActual: number | null = null;
      if (validKPIs.length > 0) {
        const totalActual = validKPIs.reduce((sum, k) => sum + k.valor_actual!, 0);
        avgActual = totalActual / validKPIs.length;
      }

      let latestDate = new Date(0);
      kpisInGroup.forEach(k => {
        const d = new Date(k.fecha_ultima_actualizacion);
        if (d.getTime() > latestDate.getTime()) {
          latestDate = d;
        }
      });
      if (latestDate.getTime() === 0) {
        latestDate = new Date();
      }

      let estado: 'on_track' | 'at_risk' | 'off_track' | 'no_data' = 'no_data';
      if (avgActual !== null) {
        estado = sharePointService.calculateKPIStatus(avgActual, avgMeta);
      }

      const responsibles = Array.from(new Set(kpisInGroup.map(k => k.responsable).filter(Boolean)));
      const cleanResponsibles = responsibles.map(r => {
        const emailMatch = r.match(/membership\|([^|]+)/i) || r.match(/i:0#\.f\|membership\|([^|]+)/i);
        const email = emailMatch ? emailMatch[1] : r;
        if (email.includes('@')) {
          const name = email.split('@')[0].replace('.', ' ');
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return r;
      });

      let latestQuarter: string | undefined = undefined;
      let latestYear: number | undefined = undefined;
      let maxPeriodScore = -1;

      kpisInGroup.forEach(k => {
        if (k.periodo_medido_trimestre && k.periodo_medido_anio) {
          const qMap: Record<string, number> = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
          const qScore = qMap[k.periodo_medido_trimestre] || 0;
          const score = k.periodo_medido_anio * 10 + qScore;
          const isVal = k.valor_actual !== null;
          const finalScore = score + (isVal ? 100000 : 0);
          if (finalScore > maxPeriodScore) {
            maxPeriodScore = finalScore;
            latestQuarter = k.periodo_medido_trimestre;
            latestYear = k.periodo_medido_anio;
          }
        }
      });

      const virtualKPI: KPI = {
        id: `process-${processName}`,
        nombre: processName,
        descripcion: `Consolidado de ${kpisInGroup.length} indicadores.`,
        meta: avgMeta,
        valor_actual: avgActual,
        unidad: '%',
        responsable: cleanResponsibles.join(', ') || 'Sin asignar',
        area: 'Proceso',
        fecha_ultima_actualizacion: latestDate,
        estado: estado,
        tendencia: 'stable',
        mediciones: kpisInGroup.reduce<KPIMeasurement[]>((acc, k) => {
          return acc.concat(k.mediciones || []);
        }, []),
        periodo_medido_trimestre: latestQuarter,
        periodo_medido_anio: latestYear
      };

      (virtualKPI as KPI & { kpisCount?: number }).kpisCount = kpisInGroup.length;
      return virtualKPI;
    }).sort((a, b) => {
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [filteredKPIs]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeCards = selectedTab === 'process' ? processCards : filteredKPIs;
    const onTrack = activeCards.filter(k => k.estado === 'on_track').length;
    const atRisk = activeCards.filter(k => k.estado === 'at_risk').length;
    const offTrack = activeCards.filter(k => k.estado === 'off_track').length;

    return {
      totalKPIs: activeCards.length,
      kpisOnTrack: onTrack,
      kpisAtRisk: atRisk,
      kpisOffTrack: offTrack,
      totalProcesses: 0,
      activeRisks: 0,
      riskScore: 0,
    };
  }, [filteredKPIs, processCards, selectedTab]);

  // --- RISK LOGIC ---
  const riskProcessOptions = useMemo(() => {
    const procs = new Set(risks.map(r => r.proceso_asociado).filter((p): p is string => !!p));
    return ['Todos', ...Array.from(procs)];
  }, [risks]);

  const riskTypeOptions = useMemo(() => {
    const types = new Set(risks.map(r => r.tipo_riesgo).filter((t): t is string => !!t));
    return ['Todos', ...Array.from(types)];
  }, [risks]);

  const riskLevelOptions = ['Todos', 'Bajo', 'Moderado', 'Alto'];
  const riskExposureOptions = ['Todos', 'Bajo (1-3)', 'Moderado (4-5)', 'Alto (6-9)'];
  const riskStatusOptions = ['Todos', 'Controlado', 'No controlado'];

  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesProcess = selectedRiskProcess === 'Todos' || risk.proceso_asociado === selectedRiskProcess;
      const matchesType = selectedRiskType === 'Todos' || risk.tipo_riesgo === selectedRiskType;

      const score = risk.probabilidad * risk.impacto;
      let level = 'Bajo';
      if (score >= 6) level = 'Alto';
      else if (score >= 4) level = 'Moderado';

      const matchesLevel = selectedRiskLevel === 'Todos' || level === selectedRiskLevel;

      let matchesExposure = true;
      if (selectedRiskExposure !== 'Todos') {
        if (selectedRiskExposure === 'Bajo (1-3)') matchesExposure = score <= 3;
        else if (selectedRiskExposure === 'Moderado (4-5)') matchesExposure = score >= 4 && score <= 5;
        else if (selectedRiskExposure === 'Alto (6-9)') matchesExposure = score >= 6;
      }

      const matchesStatus = selectedRiskStatus === 'Todos' || risk.estado === selectedRiskStatus;

      return matchesProcess && matchesType && matchesLevel && matchesExposure && matchesStatus;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }, [risks, selectedRiskProcess, selectedRiskType, selectedRiskLevel, selectedRiskExposure, selectedRiskStatus]);

  const riskMetrics = useMemo(() => {
    const total = filteredRisks.length;
    const critical = filteredRisks.filter(r => (r.probabilidad * r.impacto) >= 6).length;
    const inMitigation = filteredRisks.filter(r => r.estado === 'No controlado' || r.estado === 'en_mitigacion' || r.estado === 'identificado').length;
    const closed = filteredRisks.filter(r => r.estado === 'Controlado' || r.estado === 'mitigado' || r.estado === 'cerrado').length;
    
    let avgScore = 0;
    if (total > 0) {
      const sum = filteredRisks.reduce((s, r) => s + (r.probabilidad * r.impacto), 0);
      avgScore = sum / total;
    }

    return {
      total,
      critical,
      inMitigation,
      closed,
      avgScore
    };
  }, [filteredRisks]);



  const isMainLoading = dashboardType === 'kpi' ? loadingKPIs : (dashboardType === 'risk' ? loadingRisks : loadingPolicy);
  const mainError = dashboardType === 'kpi' ? errorKPIs : (dashboardType === 'risk' ? errorRisks : errorPolicy);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-text-primary, #2D3748)' }}>
          Dashboard SGI
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <TabList 
            selectedValue={dashboardType} 
            onTabSelect={(_, data) => setDashboardType(data.value as 'kpi' | 'risk' | 'policy')}
          >
            <Tab value="kpi">Gestión de Indicadores</Tab>
            <Tab value="risk">Gestión de Riesgos</Tab>
            <Tab value="policy">Política de Calidad</Tab>
          </TabList>

          <Button
            icon={<ArrowSyncRegular />}
            onClick={handleRefresh}
            appearance="outline"
          >
            Refrescar
          </Button>
        </div>
      </div>

      {mainError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error al cargar datos:</Text>
          <Text size={200}>{mainError}</Text>
        </div>
      )}

      {/* --- KPI VIEW RENDER --- */}
      {dashboardType === 'kpi' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                {selectedTab === 'process' ? 'Total de Procesos' : 'Total KPIs (Filtrados)'}
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                {metrics.totalKPIs}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                En Camino
              </Text>
              <Text size={800} weight="bold" style={{ color: '#107C10' }}>
                {metrics.kpisOnTrack}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                En Riesgo
              </Text>
              <Text size={800} weight="bold" style={{ color: '#FFB900' }}>
                {metrics.kpisAtRisk}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Fuera de Meta
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-caribbean-red, #DC143C)' }}>
                {metrics.kpisOffTrack}
              </Text>
            </div>
          </div>

          <div className={styles.filtersContainer}>
            <FilterRegular style={{ color: 'var(--color-text-secondary, #636F7D)', fontSize: '20px' }} />
            <Text weight="semibold" style={{ marginRight: '16px' }}>Filtros:</Text>
            
            <div className={styles.filterGroup}>
              <Text size={200} id="process-dropdown">Proceso</Text>
              <Dropdown
                aria-labelledby="process-dropdown"
                value={selectedProcess}
                selectedOptions={[selectedProcess]}
                onOptionSelect={(_, data) => setSelectedProcess(data.optionValue as string)}
              >
                {processOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="quarter-dropdown">Trimestre</Text>
              <Dropdown
                aria-labelledby="quarter-dropdown"
                value={selectedQuarter}
                selectedOptions={[selectedQuarter]}
                onOptionSelect={(_, data) => setSelectedQuarter(data.optionValue as string)}
              >
                {quarterOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="year-dropdown">Año</Text>
              <Dropdown
                aria-labelledby="year-dropdown"
                value={selectedYear}
                selectedOptions={[selectedYear]}
                onOptionSelect={(_, data) => setSelectedYear(data.optionValue as string)}
              >
                {yearOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            {/* Control de Visualización en el extremo derecho */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text size={200} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)', marginRight: '4px' }}>
                Visualización:
              </Text>
              <Button
                icon={<FlowRegular />}
                appearance={selectedTab === 'process' ? 'primary' : 'subtle'}
                onClick={() => setSelectedTab('process')}
                title="Vista por Proceso"
                style={{
                  backgroundColor: selectedTab === 'process' ? 'var(--color-midnight-blue, #001F3F)' : 'transparent',
                  color: selectedTab === 'process' ? '#ffffff' : 'var(--color-text-primary, #2D3748)',
                  border: selectedTab === 'process' ? 'none' : '1px solid var(--color-border, #E8EAED)'
                }}
              >
                Proceso
              </Button>
              <Button
                icon={<DataLineRegular />}
                appearance={selectedTab === 'indicator' ? 'primary' : 'subtle'}
                onClick={() => setSelectedTab('indicator')}
                title="Vista por Indicador"
                style={{
                  backgroundColor: selectedTab === 'indicator' ? 'var(--color-midnight-blue, #001F3F)' : 'transparent',
                  color: selectedTab === 'indicator' ? '#ffffff' : 'var(--color-text-primary, #2D3748)',
                  border: selectedTab === 'indicator' ? 'none' : '1px solid var(--color-border, #E8EAED)'
                }}
              >
                Indicador
              </Button>
            </div>
          </div>

          <div className={styles.section}>
            <Text size={500} weight="bold" style={{ color: 'var(--color-text-primary, #2D3748)' }}>
              {selectedTab === 'process' ? 'Desempeño por Proceso' : 'KPIs Principales'}
            </Text>
            {isMainLoading ? (
              <div className={styles.loading}>
                <Spinner label="Cargando KPIs..." />
              </div>
            ) : (
              <div className={styles.kpisGrid}>
                {selectedTab === 'process' ? (
                  processCards.map((kpi) => (
                    <KPICard 
                      key={kpi.id} 
                      kpi={kpi} 
                      selectedYear={selectedYear} 
                      selectedQuarter={selectedQuarter} 
                    />
                  ))
                ) : (
                  filteredKPIs.map((kpi) => (
                    <KPICard 
                      key={kpi.id} 
                      kpi={kpi} 
                      selectedYear={selectedYear} 
                      selectedQuarter={selectedQuarter} 
                    />
                  ))
                )}
                {((selectedTab === 'process' ? processCards : filteredKPIs).length === 0) && (
                  <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center' }}>
                    <Text style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                      No se encontraron datos con los filtros seleccionados.
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- RISK VIEW RENDER --- */}
      {dashboardType === 'risk' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Total Riesgos (Filtrados)
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                {riskMetrics.total}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Riesgos Críticos/Altos
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-caribbean-red, #DC143C)' }}>
                {riskMetrics.critical}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                No Controlados
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-caribbean-red, #DC143C)' }}>
                {riskMetrics.inMitigation}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Controlados
              </Text>
              <Text size={800} weight="bold" style={{ color: '#107C10' }}>
                {riskMetrics.closed}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Exposición Promedio
              </Text>
              <Text size={800} weight="bold" style={{ color: '#008080' }}>
                {riskMetrics.avgScore.toFixed(1)}
              </Text>
            </div>
          </div>

          <div className={styles.filtersContainer}>
            <FilterRegular style={{ color: 'var(--color-text-secondary, #636F7D)', fontSize: '20px' }} />
            <Text weight="semibold" style={{ marginRight: '16px' }}>Filtros:</Text>
            
            <div className={styles.filterGroup}>
              <Text size={200} id="risk-process-dropdown">Proceso Asociado</Text>
              <Dropdown
                aria-labelledby="risk-process-dropdown"
                value={selectedRiskProcess}
                selectedOptions={[selectedRiskProcess]}
                onOptionSelect={(_, data) => setSelectedRiskProcess(data.optionValue as string)}
              >
                {riskProcessOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="risk-type-dropdown">Tipo de Riesgo</Text>
              <Dropdown
                aria-labelledby="risk-type-dropdown"
                value={selectedRiskType}
                selectedOptions={[selectedRiskType]}
                onOptionSelect={(_, data) => setSelectedRiskType(data.optionValue as string)}
              >
                {riskTypeOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="risk-level-dropdown">Nivel de Riesgo</Text>
              <Dropdown
                aria-labelledby="risk-level-dropdown"
                value={selectedRiskLevel}
                selectedOptions={[selectedRiskLevel]}
                onOptionSelect={(_, data) => setSelectedRiskLevel(data.optionValue as string)}
              >
                {riskLevelOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="risk-exposure-dropdown">Exposición (Score)</Text>
              <Dropdown
                aria-labelledby="risk-exposure-dropdown"
                value={selectedRiskExposure}
                selectedOptions={[selectedRiskExposure]}
                onOptionSelect={(_, data) => setSelectedRiskExposure(data.optionValue as string)}
              >
                {riskExposureOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="risk-status-dropdown">Estado</Text>
              <Dropdown
                aria-labelledby="risk-status-dropdown"
                value={selectedRiskStatus}
                selectedOptions={[selectedRiskStatus]}
                onOptionSelect={(_, data) => setSelectedRiskStatus(data.optionValue as string)}
              >
                {riskStatusOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
          </div>



          <div className={styles.section}>
            <Text size={500} weight="bold" style={{ color: 'var(--color-text-primary, #2D3748)' }}>
              Detalle de Riesgos Identificados
            </Text>
            {isMainLoading ? (
              <div className={styles.loading}>
                <Spinner label="Cargando riesgos..." />
              </div>
            ) : (
              <div className={styles.kpisGrid}>
                {filteredRisks.map((risk) => {
                  const score = risk.probabilidad * risk.impacto;
                  let scoreColor = '#107C10';
                  let severity = 'Bajo';
                  if (score >= 15) {
                    scoreColor = 'var(--color-caribbean-red, #DC143C)';
                    severity = 'Crítico';
                  } else if (score >= 8) {
                    scoreColor = '#FFB900';
                    severity = 'Alto';
                  } else if (score >= 4) {
                    scoreColor = '#FFB900';
                    severity = 'Medio';
                  }

                  return (
                    <div 
                      key={risk.id} 
                      className={styles.metricCard} 
                      style={{ gap: '12px', transition: 'box-shadow 0.2s', cursor: 'default' }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <Text size={400} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                          {risk.nombre}
                        </Text>
                        <span 
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            backgroundColor: scoreColor, 
                            color: 'white', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {severity} ({score})
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #E8EAED', paddingTop: '8px' }}>
                        <Text size={200} style={{ color: '#636F7D' }}>
                          Proceso: <strong style={{ color: '#2D3748' }}>{risk.proceso_asociado}</strong>
                        </Text>
                        <Text size={200} style={{ color: '#636F7D' }}>
                          Tipo: <strong style={{ color: '#2D3748' }}>{risk.tipo_riesgo || 'Operacional'}</strong>
                        </Text>
                        <Text size={200} style={{ color: '#636F7D' }}>
                          Responsable: <strong style={{ color: '#2D3748' }}>{risk.responsable}</strong>
                        </Text>
                        <Text size={200} style={{ color: '#636F7D' }}>
                          Estado: <span style={{ textTransform: 'capitalize', fontWeight: 'semibold', color: risk.estado === 'Controlado' || risk.estado === 'mitigado' || risk.estado === 'cerrado' ? '#107C10' : '#DC143C' }}>{risk.estado}</span>
                        </Text>
                      </div>

                      <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '4px', minHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {risk.descripcion}
                      </div>

                      <div style={{ backgroundColor: '#F9FAFB', padding: '8px', borderRadius: '4px', border: '1px solid #EDF2F7', marginTop: '4px' }}>
                        <Text size={100} weight="semibold" style={{ color: '#4A5568' }}>Plan de Mitigación:</Text>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#718096' }}>
                          {risk.plan_mitigacion && risk.plan_mitigacion.trim() ? risk.plan_mitigacion : 'No hay planes de mitigación para este riesgo'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- QUALITY POLICY VIEW RENDER --- */}
      {dashboardType === 'policy' && (
        <>
          <div className={styles.filtersContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <FilterRegular style={{ color: 'var(--color-midnight-blue, #001F3F)' }} />
              <Text weight="bold" size={200} style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>Filtros de Desempeño SGI</Text>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="policy-quarter-dropdown">Trimestre</Text>
              <Dropdown
                aria-labelledby="policy-quarter-dropdown"
                value={selectedQuarter}
                selectedOptions={[selectedQuarter]}
                onOptionSelect={(_, data) => setSelectedQuarter(data.optionValue as string)}
              >
                {quarterOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>

            <div className={styles.filterGroup}>
              <Text size={200} id="policy-year-dropdown">Año</Text>
              <Dropdown
                aria-labelledby="policy-year-dropdown"
                value={selectedYear}
                selectedOptions={[selectedYear]}
                onOptionSelect={(_, data) => setSelectedYear(data.optionValue as string)}
              >
                {yearOptions.map(option => (
                  <Option key={option} value={option} text={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Índice de Calidad SGI (Promedio)
              </Text>
              <Text size={800} weight="bold" style={{ color: overallPolicyCompliance === null ? '#64748B' : (overallPolicyCompliance >= 90 ? '#107C10' : (overallPolicyCompliance >= 70 ? '#FF8C00' : '#A80000')) }}>
                {overallPolicyCompliance === null ? 'S/D' : `${overallPolicyCompliance}%`}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Compromisos de la Política
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                {objectives.length}
              </Text>
            </div>
            <div className={styles.metricCard}>
              <Text size={300} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Procesos Vinculados
              </Text>
              <Text size={800} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                {processesList.filter(p => p.objetivosIds && p.objetivosIds.length > 0).length}
              </Text>
            </div>
          </div>

          <div className={styles.section} style={{ marginTop: '16px' }}>
            {isMainLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner label="Calculando desempeño de compromisos..." />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {policyPerformance.map((perf) => {
                  const hasData = perf.compliance !== null;
                  const value = perf.compliance ?? 0;
                  const meta = perf.objective.meta ?? 90;
                  
                  let statusColor = '#E2E8F0';
                  let progressColor = '#E2E8F0';
                  if (hasData) {
                    if (value >= meta) {
                      statusColor = '#107C10';
                      progressColor = '#107C10';
                    } else if (value >= 70) {
                      statusColor = '#FF8C00';
                      progressColor = '#FF8C00';
                    } else {
                      statusColor = '#A80000';
                      progressColor = '#A80000';
                    }
                  }

                  return (
                    <div 
                      key={perf.objective.id}
                      onClick={() => setSelectedObjectiveDetail(perf.objective)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E8EAED',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderLeft: `5px solid ${statusColor}`,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                          {perf.objective.codigo}
                        </Text>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: hasData ? `${statusColor}15` : '#F3F4F6',
                          color: hasData ? statusColor : '#6B7280',
                          border: `1px solid ${hasData ? `${statusColor}30` : '#E5E7EB'}`
                        }}>
                          {hasData ? `${value}%` : 'Sin datos'}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#334155', minHeight: '54px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {perf.objective.nombre}
                      </div>

                      <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${hasData ? value : 0}%`, height: '100%', backgroundColor: progressColor, borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                        <span>Meta: {meta}%</span>
                        <span>{perf.processes.length} procesos asociados</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drill-down Detail Dialog */}
          <Dialog open={selectedObjectiveDetail !== null} onOpenChange={(_, data) => { if (!data.open) setSelectedObjectiveDetail(null); }}>
            <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
              <DialogBody>
                {selectedObjectiveDetail && (() => {
                  const perf = policyPerformance.find(p => p.objective.id === selectedObjectiveDetail.id);
                  const hasData = perf && perf.compliance !== null;
                  const val = perf?.compliance ?? 0;
                  const meta = selectedObjectiveDetail.meta ?? 90;
                  
                  let statusColor = '#6B7280';
                  if (hasData) {
                    if (val >= meta) statusColor = '#107C10';
                    else if (val >= 70) statusColor = '#FF8C00';
                    else statusColor = '#A80000';
                  }

                  return (
                    <>
                      <DialogTitle>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '95%' }}>
                          <span>Detalle de Desempeño: {selectedObjectiveDetail.codigo}</span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: statusColor }}>
                            {hasData ? `Fulfillment: ${val}%` : 'Sin datos'}
                          </span>
                        </div>
                      </DialogTitle>
                      <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', borderLeft: `4px solid ${statusColor}`, fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                          <strong>Compromiso:</strong> {selectedObjectiveDetail.nombre}
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', fontWeight: 'semibold' }}>
                            Meta de calidad JAC: {meta}%
                          </div>
                        </div>

                        <div>
                          <Text weight="bold" style={{ fontSize: '14px', color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '8px' }}>
                            Procesos e Indicadores Vinculados
                          </Text>

                          {perf && perf.processes.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px dashed #E2E8F0' }}>
                              <Text style={{ color: '#64748B', fontSize: '13px' }}>
                                No hay procesos asociados a este compromiso de la política de calidad.
                              </Text>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {perf?.processes.map(proc => {
                                const procKPIs = perf.kpis.filter(k => 
                                  k.processId === proc.id || 
                                  (k.area && (k.area.toLowerCase() === proc.codigo.toLowerCase() || k.area.toLowerCase() === proc.nombre.toLowerCase()))
                                );

                                return (
                                  <div key={proc.id} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ backgroundColor: '#F1F5F9', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text weight="semibold" style={{ fontSize: '13px', color: '#1E293B' }}>
                                        {proc.codigo} - {proc.nombre}
                                      </Text>
                                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                        Área: {proc.area}
                                      </span>
                                    </div>
                                    <div style={{ padding: '8px 12px' }}>
                                      {procKPIs.length === 0 ? (
                                        <div style={{ padding: '8px', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                                          No hay indicadores registrados para este proceso.
                                        </div>
                                      ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                                              <th style={{ padding: '6px 4px', fontWeight: 'semibold' }}>Indicador (KPI)</th>
                                              <th style={{ padding: '6px 4px', fontWeight: 'semibold', width: '80px' }}>Meta</th>
                                              <th style={{ padding: '6px 4px', fontWeight: 'semibold', width: '80px' }}>Actual</th>
                                              <th style={{ padding: '6px 4px', fontWeight: 'semibold', width: '100px', textAlign: 'right' }}>Cumplimiento</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {procKPIs.map(k => {
                                              const kHasData = k.valor_actual !== null;
                                              const kVal = k.valor_actual ?? 0;
                                              const kMeta = k.meta || 1;
                                              const kPct = Math.round(Math.min((kVal / kMeta) * 100, 100));
                                              
                                              let kColor = '#6B7280';
                                              if (kHasData) {
                                                if (kPct >= 90) kColor = '#107C10';
                                                else if (kPct >= 70) kColor = '#FF8C00';
                                                else kColor = '#A80000';
                                              }

                                              return (
                                                <tr key={k.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                  <td style={{ padding: '8px 4px', color: '#334155' }}>{k.nombre}</td>
                                                  <td style={{ padding: '8px 4px', color: '#334155' }}>{k.meta}{k.unidad}</td>
                                                  <td style={{ padding: '8px 4px', color: '#334155' }}>{kHasData ? `${kVal}${k.unidad}` : 'S/D'}</td>
                                                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', color: kColor }}>
                                                    {kHasData ? `${kPct}%` : 'S/D'}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                      <DialogActions>
                        <Button appearance="secondary" onClick={() => setSelectedObjectiveDetail(null)}>
                          Cerrar
                        </Button>
                      </DialogActions>
                    </>
                  );
                })()}
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </>
      )}
    </div>
  );
};
