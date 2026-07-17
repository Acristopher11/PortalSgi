import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { serializeError } from '../lib/spClient';
import { useSearchParams } from 'react-router-dom';
import {
  Text,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Input,
  Label,
  Dropdown,
  Option,
  TabList,
  Tab,
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular, WarningRegular } from '@fluentui/react-icons';
import { useRiskStore } from '../store';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import { RiskHeatmap } from '../components/risk/RiskHeatmap';
import { PeoplePicker } from '../components/common/PeoplePicker';
import type { Risk, Process } from '../types';

export const RiskManagement: React.FC = () => {
  const { getSharePointToken, isDeveloper, isAdmin, isProcessOwner, canModifyRisk, email } = useAuth();
  const { risks, loading, setRisks, setLoading, setError } = useRiskStore();
  const [searchParams] = useSearchParams();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);

  const allowedProcesses = useMemo(() => {
    if (isDeveloper || isAdmin) return processes;
    return processes.filter(p => p.responsableEmails?.map(e => e.toLowerCase()).includes(email.toLowerCase()));
  }, [processes, isDeveloper, isAdmin, email]);

  // View Toggle & Filter States
  const [activeTab, setActiveTab] = useState<'riesgos' | 'controles'>('riesgos');
  const [selectedFilterProcess, setSelectedFilterProcess] = useState('Todos');
  const [selectedFilterType, setSelectedFilterType] = useState('Todos');
  const [selectedFilterLevel, setSelectedFilterLevel] = useState('Todos');
  const [selectedFilterExposure, setSelectedFilterExposure] = useState('Todos');
  const [selectedFilterStatus, setSelectedFilterStatus] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [probabilidad, setProbabilidad] = useState<string>('3');
  const [impacto, setImpacto] = useState<string>('3');
  const [vpd, setVpd] = useState<string>('3');
  const [vo, setVo] = useState<string>('3');
  const [ve, setVe] = useState<string>('3');
  const [responsable, setResponsable] = useState('');
  const [procesoAsociado, setProcesoAsociado] = useState('');
  const [control, setControl] = useState('');
  const [tipoRiesgo, setTipoRiesgo] = useState('Operacional');
  const [estado, setEstado] = useState('No controlado');
  const [planMitigacion, setPlanMitigacion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilterProcess, selectedFilterType, selectedFilterLevel, selectedFilterExposure, selectedFilterStatus]);

  const loadRisks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getRisks(token);
      setRisks(data);

      const procs = await sharePointService.getProcesses(token);
      setProcesses(procs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading risks');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setRisks, setError, getSharePointToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRisks();
  }, [loadRisks]);

  // Pre-apply process filter from URL param (?proceso=P-SGI-01)
  useEffect(() => {
    const codigoParam = searchParams.get('proceso');
    if (codigoParam) {
      setSelectedFilterProcess(decodeURIComponent(codigoParam));
    }
  }, [searchParams]);

  const openCreateDialog = () => {
    setSelectedRisk(null);
    setNombre('');
    setDescripcion('');
    setProbabilidad('3');
    setImpacto('3');
    setVpd('3');
    setVo('3');
    setVe('3');
    setResponsable('');
    const defaultProc = (isDeveloper || isAdmin) ? 'General' : (allowedProcesses[0]?.nombre || '');
    setProcesoAsociado(defaultProc);
    setControl('');
    setTipoRiesgo('Operacional');
    setEstado('No controlado');
    setPlanMitigacion('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (risk: Risk) => {
    setSelectedRisk(risk);
    setNombre(risk.nombre);
    setDescripcion(risk.descripcion);
    setProbabilidad(String(risk.probabilidad));
    setImpacto(String(risk.impacto));
    setVpd(String(risk.vpd !== undefined ? risk.vpd : '3'));
    setVo(String(risk.vo !== undefined ? risk.vo : '3'));
    setVe(String(risk.ve !== undefined ? risk.ve : '3'));
    setResponsable(risk.responsable);
    setProcesoAsociado(risk.proceso_asociado || 'General');
    setControl(risk.control || '');
    setTipoRiesgo(risk.tipo_riesgo || 'Operacional');
    setEstado(risk.estado || 'No controlado');
    setPlanMitigacion(risk.plan_mitigacion || risk.pa_asoc || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openConfirmDelete = (risk: Risk) => {
    setSelectedRisk(risk);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError('Debe ingresar el nombre del riesgo.');
      return;
    }
    if (!descripcion.trim()) {
      setFormError('Debe ingresar la descripción del riesgo.');
      return;
    }

    const p = parseInt(probabilidad) || 1;
    const i = parseInt(impacto) || 1;
    const parsedVpd = parseFloat(vpd) || 0;
    const parsedVo = parseFloat(vo) || 0;
    const parsedVe = parseFloat(ve) || 0;

    setSubmitting(true);
    try {
      const token = await getSharePointToken();
      const selectedProc = processes.find(proc => proc.nombre === procesoAsociado);
      const payload: Partial<Risk> & { procesoId?: string } = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        probabilidad: p as Risk['probabilidad'],
        impacto: i as Risk['impacto'],
        responsable: responsable.trim(),
        proceso_asociado: procesoAsociado,
        vpd: parsedVpd,
        vo: parsedVo,
        ve: parsedVe,
        control: control.trim(),
        tipo_riesgo: tipoRiesgo,
        estado: estado,
        plan_mitigacion: planMitigacion.trim(),
        procesoId: selectedProc?.id,
      };

      if (selectedRisk) {
        await sharePointService.updateRisk(selectedRisk.id, payload, token);
      } else {
        await sharePointService.createRisk(payload, token);
      }

      setIsFormOpen(false);
      await loadRisks();
    } catch (err) {
      const msg = serializeError(err);
      const elementName = nombre.trim() || (selectedRisk?.nombre ?? 'nuevo riesgo');
      setFormError(`Error al guardar el riesgo "${elementName}": ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRisk = async () => {
    if (!selectedRisk) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteRisk(selectedRisk.id, token);
      setIsDeleteOpen(false);
      await loadRisks();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar el riesgo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 6) return 'var(--color-caribbean-red, #DC143C)'; // Alto
    if (score >= 4) return '#FFB900'; // Moderado
    return '#107C10'; // Bajo
  };

  // Dynamically build filter options
  const processFilterOptions = useMemo(() => {
    const procs = new Set(risks.map(r => r.proceso_asociado).filter(Boolean));
    return ['Todos', ...Array.from(procs)];
  }, [risks]);

  const typeFilterOptions = useMemo(() => {
    const types = new Set(risks.map(r => r.tipo_riesgo).filter((t): t is string => !!t));
    return ['Todos', ...Array.from(types)];
  }, [risks]);

  const levelFilterOptions = ['Todos', 'Bajo', 'Moderado', 'Alto'];
  const exposureFilterOptions = ['Todos', 'Bajo (1-3)', 'Moderado (4-5)', 'Alto (6-9)'];
  const statusFilterOptions = ['Todos', 'Controlado', 'No controlado'];

  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesProcess = selectedFilterProcess === 'Todos' || risk.proceso_asociado === selectedFilterProcess;
      const matchesType = selectedFilterType === 'Todos' || risk.tipo_riesgo === selectedFilterType;

      const score = risk.probabilidad * risk.impacto;
      let level = 'Bajo';
      if (score >= 6) level = 'Alto';
      else if (score >= 4) level = 'Moderado';
      const matchesLevel = selectedFilterLevel === 'Todos' || level === selectedFilterLevel;

      let matchesExposure = true;
      if (selectedFilterExposure !== 'Todos') {
        if (selectedFilterExposure === 'Bajo (1-3)') matchesExposure = score <= 3;
        else if (selectedFilterExposure === 'Moderado (4-5)') matchesExposure = score >= 4 && score <= 5;
        else if (selectedFilterExposure === 'Alto (6-9)') matchesExposure = score >= 6;
      }

      const matchesStatus = selectedFilterStatus === 'Todos' || risk.estado === selectedFilterStatus;

      return matchesProcess && matchesType && matchesLevel && matchesExposure && matchesStatus;
    });
  }, [risks, selectedFilterProcess, selectedFilterType, selectedFilterLevel, selectedFilterExposure, selectedFilterStatus]);

  // Pagination
  const paginatedRisks = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredRisks.slice(start, start + 20);
  }, [filteredRisks, currentPage]);

  const totalPages = Math.ceil(filteredRisks.length / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
          Gestión de Riesgos
        </Text>
        {(isDeveloper || isAdmin || isProcessOwner) && (
          <Button icon={<AddRegular />} appearance="primary" onClick={openCreateDialog}>
            Nuevo Riesgo
          </Button>
        )}
      </div>

      {loading ? (
        <Spinner label="Cargando riesgos..." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '12px' }}>
            <RiskHeatmap risks={filteredRisks} />
          </div>

          <div style={{ borderBottom: '1px solid #E8EAED', marginBottom: '8px' }}>
            <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as 'riesgos' | 'controles')}>
              <Tab value="riesgos">Vista de Riesgos</Tab>
              <Tab value="controles">Vista de Controles</Tab>
            </TabList>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E8EAED', marginBottom: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
              <Label htmlFor="filter-process" style={{ fontSize: '12px', fontWeight: 'bold' }}>Proceso Asociado:</Label>
              <Dropdown
                id="filter-process"
                value={selectedFilterProcess}
                selectedOptions={[selectedFilterProcess]}
                onOptionSelect={(_, data) => setSelectedFilterProcess(data.optionValue as string)}
              >
                {processFilterOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
              <Label htmlFor="filter-type" style={{ fontSize: '12px', fontWeight: 'bold' }}>Tipo de Riesgo:</Label>
              <Dropdown
                id="filter-type"
                value={selectedFilterType}
                selectedOptions={[selectedFilterType]}
                onOptionSelect={(_, data) => setSelectedFilterType(data.optionValue as string)}
              >
                {typeFilterOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
              <Label htmlFor="filter-level" style={{ fontSize: '12px', fontWeight: 'bold' }}>Nivel de Riesgo:</Label>
              <Dropdown
                id="filter-level"
                value={selectedFilterLevel}
                selectedOptions={[selectedFilterLevel]}
                onOptionSelect={(_, data) => setSelectedFilterLevel(data.optionValue as string)}
              >
                {levelFilterOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
              <Label htmlFor="filter-exposure" style={{ fontSize: '12px', fontWeight: 'bold' }}>Exposición (Score):</Label>
              <Dropdown
                id="filter-exposure"
                value={selectedFilterExposure}
                selectedOptions={[selectedFilterExposure]}
                onOptionSelect={(_, data) => setSelectedFilterExposure(data.optionValue as string)}
              >
                {exposureFilterOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
              <Label htmlFor="filter-status" style={{ fontSize: '12px', fontWeight: 'bold' }}>Estado del Riesgo:</Label>
              <Dropdown
                id="filter-status"
                value={selectedFilterStatus}
                selectedOptions={[selectedFilterStatus]}
                onOptionSelect={(_, data) => setSelectedFilterStatus(data.optionValue as string)}
              >
                {statusFilterOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Dropdown>
            </div>
          </div>

          {activeTab === 'riesgos' ? (
            <Table aria-label="Tabla de Riesgos">
              <TableHeader>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold', width: '25%', minWidth: '220px' }}>EVENTO NO DESEADO</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Tipo de Riesgo</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Probabilidad (VP)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Impacto (VI)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Nivel (VNR)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Efectividad (VCC)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Exposición (VER)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Proceso Asociado</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Responsable</TableCell>
                  {(isDeveloper || isAdmin || isProcessOwner) && (
                    <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acciones</TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRisks.map((risk: Risk, index: number) => {
                  const vp = risk.probabilidad || 1;
                  const vi = risk.impacto || 1;
                  const vnr = vp * vi;
                  const rVpd = risk.vpd !== undefined ? risk.vpd : 0;
                  const rVo = risk.vo !== undefined ? risk.vo : 0;
                  const rVe = risk.ve !== undefined ? risk.ve : 0;
                  const vcc = risk.vcc !== undefined ? risk.vcc : (rVpd + rVo + rVe) / 3;
                  const ver = risk.ver !== undefined ? risk.ver : vnr - vcc;

                  let verLevel = 'Menor';
                  let verColor = '#107C10';
                  if (ver >= 6.01) {
                    verLevel = 'No Aceptable';
                    verColor = 'var(--color-caribbean-red, #DC143C)';
                  } else if (ver > 4.0) {
                    verLevel = 'Medio';
                    verColor = '#FFB900';
                  }

                  return (
                    <TableRow key={risk.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <TableCell style={{ fontWeight: 'semibold', width: '25%', minWidth: '220px' }}>{risk.nombre}</TableCell>
                      <TableCell>{risk.tipo_riesgo || 'Operacional'}</TableCell>
                      <TableCell>{vp}/3</TableCell>
                      <TableCell>{vi}/3</TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 'bold', color: getScoreColor(vnr) }}>
                          {vnr}
                        </span>
                      </TableCell>
                      <TableCell>{vcc.toFixed(2)}</TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 'bold', color: verColor }} title={verLevel}>
                          {ver.toFixed(2)} ({verLevel})
                        </span>
                      </TableCell>
                      <TableCell>{risk.proceso_asociado}</TableCell>
                      <TableCell>{risk.responsable}</TableCell>
                      {(isDeveloper || isAdmin || isProcessOwner) && (
                        <TableCell>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canModifyRisk(risk) && (
                              <>
                                <Button
                                  icon={<EditRegular />}
                                  appearance="subtle"
                                  onClick={() => openEditDialog(risk)}
                                  title="Editar Riesgo"
                                />
                                <Button
                                  icon={<DeleteRegular />}
                                  appearance="subtle"
                                  style={{ color: '#DC143C' }}
                                  onClick={() => openConfirmDelete(risk)}
                                  title="Eliminar Riesgo"
                                />
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Table aria-label="Tabla de Controles">
              <TableHeader>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold', width: '25%', minWidth: '220px' }}>EVENTO NO DESEADO</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Control</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Periodicidad (VPD)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Oportunidad (VO)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Ejecución (VE)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Clasificación (VCC)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Exposición (VER)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Responsables</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Plan de Mitigación</TableCell>
                  {(isDeveloper || isAdmin || isProcessOwner) && (
                    <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acciones</TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRisks.map((risk: Risk, index: number) => {
                  const vp = risk.probabilidad || 1;
                  const vi = risk.impacto || 1;
                  const vnr = vp * vi;
                  const rVpd = risk.vpd !== undefined ? risk.vpd : 0;
                  const rVo = risk.vo !== undefined ? risk.vo : 0;
                  const rVe = risk.ve !== undefined ? risk.ve : 0;
                  const vcc = risk.vcc !== undefined ? risk.vcc : (rVpd + rVo + rVe) / 3;
                  const ver = risk.ver !== undefined ? risk.ver : vnr - vcc;

                  let verLevel = 'Menor';
                  let verColor = '#107C10';
                  if (ver >= 6.01) {
                    verLevel = 'No Aceptable';
                    verColor = 'var(--color-caribbean-red, #DC143C)';
                  } else if (ver > 4.0) {
                    verLevel = 'Medio';
                    verColor = '#FFB900';
                  }

                  return (
                    <TableRow key={risk.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <TableCell style={{ fontWeight: 'semibold', width: '25%', minWidth: '220px' }}>{risk.nombre}</TableCell>
                      <TableCell>{risk.control || 'Sin control registrado'}</TableCell>
                      <TableCell>{risk.periodicidad || 'No Determinado'} ({rVpd})</TableCell>
                      <TableCell>{risk.oportunidad || 'No Determinado'} ({rVo})</TableCell>
                      <TableCell>{risk.ejecucion || 'No Determinado'} ({rVe})</TableCell>
                      <TableCell>{vcc.toFixed(2)}</TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 'bold', color: verColor }} title={verLevel}>
                          {ver.toFixed(2)} ({verLevel})
                        </span>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 'bold', color: risk.estado === 'Controlado' ? '#107C10' : '#DC143C' }}>
                          {risk.estado || 'No controlado'}
                        </span>
                      </TableCell>
                      <TableCell>{risk.responsable}</TableCell>
                      <TableCell>
                        {(() => {
                          const paValue = risk.pa_asoc || risk.plan_mitigacion || '';
                          if (!paValue.trim()) {
                            return (
                              <span style={{ color: '#9CA3AF', fontSize: '13px', fontStyle: 'italic' }}>
                                Sin plan registrado
                              </span>
                            );
                          }
                          const spUrl = `https://juntaaviacioncivil.sharepoint.com/teams/SGI/prueba%20seguimeitno/Forms/AllItems.aspx?FilterField1=PA&FilterValue1=${encodeURIComponent(paValue.trim())}`;
                          return (
                            <a
                              href={spUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Abrir Plan de Seguimiento #${paValue.trim()} en SharePoint`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: '#0078D4',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: '1px solid rgba(0, 120, 212, 0.25)',
                                background: 'rgba(0, 120, 212, 0.05)',
                                transition: 'background 0.15s, border-color 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,120,212,0.12)';
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,120,212,0.5)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,120,212,0.05)';
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,120,212,0.25)';
                              }}
                            >
                              📂 Plan #{paValue.trim()}
                            </a>
                          );
                        })()}
                      </TableCell>
                      {(isDeveloper || isAdmin || isProcessOwner) && (
                        <TableCell>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {canModifyRisk(risk) && (
                              <>
                                <Button
                                  icon={<EditRegular />}
                                  appearance="subtle"
                                  onClick={() => openEditDialog(risk)}
                                  title="Editar Riesgo"
                                />
                                <Button
                                  icon={<DeleteRegular />}
                                  appearance="subtle"
                                  style={{ color: '#DC143C' }}
                                  onClick={() => openConfirmDelete(risk)}
                                  title="Eliminar Riesgo"
                                />
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '12px', borderTop: '1px solid var(--color-border, #E8EAED)' }}>
              <Button
                appearance="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ minWidth: '80px' }}
              >
                Anterior
              </Button>
              <Text size={200} weight="semibold" style={{ color: 'var(--color-text-primary, #2D3748)', margin: '0 8px' }}>
                Página {currentPage} de {totalPages}
              </Text>
              <Button
                appearance="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{ minWidth: '80px' }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={(_, data) => setIsFormOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>{selectedRisk ? 'Editar Riesgo' : 'Crear Nuevo Riesgo'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="risk-name" style={{ fontWeight: 'bold' }}>Evento no deseado:</Label>
                <Input
                  id="risk-name"
                  value={nombre}
                  placeholder="ej: Fuga de Información Confidencial..."
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="risk-desc" style={{ fontWeight: 'bold' }}>Descripción:</Label>
                <Input
                  id="risk-desc"
                  value={descripcion}
                  placeholder="Escriba detalle o descripción del riesgo..."
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="risk-type" style={{ fontWeight: 'bold' }}>Tipo de Riesgo:</Label>
                  <Dropdown
                    id="risk-type"
                    value={tipoRiesgo}
                    selectedOptions={[tipoRiesgo]}
                    onOptionSelect={(_, data) => setTipoRiesgo(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    {['Operacional', 'Tecnológico', 'Estratégico', 'Financiero', 'Cumplimiento'].map(t => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="risk-status" style={{ fontWeight: 'bold' }}>Estado del Riesgo:</Label>
                  <Dropdown
                    id="risk-status"
                    value={estado}
                    selectedOptions={[estado]}
                    onOptionSelect={(_, data) => setEstado(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    {['Controlado', 'No controlado'].map(st => (
                      <Option key={st} value={st}>{st}</Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="risk-prob" style={{ fontWeight: 'bold' }}>Probabilidad (1-3):</Label>
                  <Dropdown
                    id="risk-prob"
                    value={probabilidad}
                    selectedOptions={[probabilidad]}
                    onOptionSelect={(_, data) => setProbabilidad(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    <Option value="1">1 - Baja</Option>
                    <Option value="2">2 - Moderada</Option>
                    <Option value="3">3 - Alta</Option>
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="risk-imp" style={{ fontWeight: 'bold' }}>Impacto (1-3):</Label>
                  <Dropdown
                    id="risk-imp"
                    value={impacto}
                    selectedOptions={[impacto]}
                    onOptionSelect={(_, data) => setImpacto(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    <Option value="1">1 - Bajo</Option>
                    <Option value="2">2 - Moderado</Option>
                    <Option value="3">3 - Alto</Option>
                  </Dropdown>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="risk-control" style={{ fontWeight: 'bold' }}>Control:</Label>
                <Input
                  id="risk-control"
                  value={control}
                  placeholder="Describa el control aplicado..."
                  onChange={(e) => setControl(e.target.value)}
                />
              </div>

              {/* Categorización de Controles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px', borderTop: '1px solid #E8EAED', paddingTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="control-vpd" style={{ fontWeight: 'bold' }}>Periodicidad (VPD):</Label>
                  <Dropdown
                    id="control-vpd"
                    value={vpd}
                    selectedOptions={[vpd]}
                    onOptionSelect={(_, data) => setVpd(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    <Option value="3">Permanente (3)</Option>
                    <Option value="2">Periódico (2)</Option>
                    <Option value="0.5">Ocasional (0.5)</Option>
                    <Option value="0">No Determinado (0)</Option>
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="control-vo" style={{ fontWeight: 'bold' }}>Oportunidad (VO):</Label>
                  <Dropdown
                    id="control-vo"
                    value={vo}
                    selectedOptions={[vo]}
                    onOptionSelect={(_, data) => setVo(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    <Option value="3">Preventivo (3)</Option>
                    <Option value="2">Correctivo (2)</Option>
                    <Option value="0.5">Detectivo (0.5)</Option>
                    <Option value="0">No Determinado (0)</Option>
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="control-ve" style={{ fontWeight: 'bold' }}>Ejecución (VE):</Label>
                  <Dropdown
                    id="control-ve"
                    value={ve}
                    selectedOptions={[ve]}
                    onOptionSelect={(_, data) => setVe(data.optionValue as string)}
                    style={{ width: '200px' }}
                  >
                    <Option value="3">Automatizado (3)</Option>
                    <Option value="2">Semi Automatizado (2)</Option>
                    <Option value="0.5">Manual (0.5)</Option>
                    <Option value="0">No Determinado (0)</Option>
                  </Dropdown>
                </div>
              </div>

              {/* Cálculo en tiempo real */}
              {(() => {
                const pVal = parseInt(probabilidad) || 1;
                const iVal = parseInt(impacto) || 1;
                const vnrVal = pVal * iVal;
                const vpdVal = parseFloat(vpd) || 0;
                const voVal = parseFloat(vo) || 0;
                const veVal = parseFloat(ve) || 0;
                const vccVal = (vpdVal + voVal + veVal) / 3;
                const verVal = vnrVal - vccVal;

                let verLevel = 'Menor';
                let verColor = '#107C10';
                if (verVal >= 6.01) {
                  verLevel = 'No Aceptable';
                  verColor = 'var(--color-caribbean-red, #DC143C)';
                } else if (verVal > 4.0) {
                  verLevel = 'Medio';
                  verColor = '#FFB900';
                }

                return (
                  <div style={{ backgroundColor: '#F3F4F6', padding: '12px', borderRadius: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px', border: '1px solid #E5E7EB', marginTop: '8px' }}>
                    <div>
                      <strong>Nivel (VNR)</strong>: <span style={{ color: getScoreColor(vnrVal), fontWeight: 'bold' }}>{vnrVal}</span>
                    </div>
                    <div>
                      <strong>Efectividad (VCC)</strong>: <span style={{ fontWeight: 'bold' }}>{vccVal.toFixed(2)}</span>
                    </div>
                    <div>
                      <strong>Exposición (VER)</strong>: <span style={{ color: verColor, fontWeight: 'bold' }}>{verVal.toFixed(2)} ({verLevel})</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <PeoplePicker
                    id="risk-resp"
                    label="Responsable:"
                    value={responsable}
                    onChange={(val) => setResponsable(val)}
                    placeholder="Buscar responsable..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="risk-proc" style={{ fontWeight: 'bold' }}>Proceso Asociado:</Label>
                  <Dropdown
                    id="risk-proc"
                    value={procesoAsociado}
                    selectedOptions={[procesoAsociado]}
                    onOptionSelect={(_, data) => {
                      const selectedVal = data.optionValue as string;
                      setProcesoAsociado(selectedVal);
                      const matchedProc = processes.find(p => p.nombre === selectedVal);
                      if (matchedProc && matchedProc.responsable) {
                        setResponsable(matchedProc.responsable);
                      }
                    }}
                    style={{ width: '200px' }}
                  >
                    {(isAdmin || isDeveloper) && <Option value="General">General</Option>}
                    {allowedProcesses.map(p => (
                      <Option key={p.id} value={p.nombre}>{p.nombre}</Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="risk-mitigation" style={{ fontWeight: 'bold' }}>Plan de Mitigación:</Label>
                <Input
                  id="risk-mitigation"
                  value={planMitigacion}
                  placeholder="Describa el plan de mitigación..."
                  onChange={(e) => setPlanMitigacion(e.target.value)}
                />
              </div>

              {formError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                  <WarningRegular />
                  <Text>{formError}</Text>
                </div>
              )}
            </DialogContent>

            <DialogActions style={{ marginTop: '24px', borderTop: '1px solid #E8EAED', paddingTop: '16px' }}>
              <Button appearance="secondary" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleFormSubmit} disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={(_, data) => setIsDeleteOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '440px', width: '90%' }}>
          <DialogBody>
            <DialogTitle>Eliminar Riesgo</DialogTitle>
            <DialogContent style={{ marginTop: '12px' }}>
              <Text>
                ¿Está seguro de que desea eliminar el riesgo <strong>{selectedRisk?.nombre}</strong>? Esta acción no se puede deshacer.
              </Text>
              {formError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '12px' }}>
                  <WarningRegular />
                  <Text>{formError}</Text>
                </div>
              )}
            </DialogContent>
            <DialogActions style={{ marginTop: '20px' }}>
              <Button appearance="secondary" onClick={() => setIsDeleteOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleDeleteRisk} style={{ backgroundColor: '#DC143C', borderColor: '#DC143C' }} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

