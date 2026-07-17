import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { serializeError } from '../lib/spClient';
import { useNavigate } from 'react-router-dom';
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
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular, WarningRegular, DataLineRegular } from '@fluentui/react-icons';
import { useKPIStore } from '../store';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { KPI, Process } from '../types';

export const KPIManagement: React.FC = () => {
  const { getSharePointToken, isAdmin, isDeveloper, isProcessOwner, canModifyKPI, email } = useAuth();
  const navigate = useNavigate();
  const canEdit = isAdmin || isDeveloper || isProcessOwner;
  const { kpis, loading, error, setKPIs, setLoading, setError } = useKPIStore();

  // Filter State
  const [selectedFilterProcess, setSelectedFilterProcess] = useState('Todos');

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [meta, setMeta] = useState('');
  const [periodicidad, setPeriodicidad] = useState('Trimestral');
  const [processId, setProcessId] = useState('');
  const [processName, setProcessName] = useState('Seleccione Proceso...');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derived filter options from loaded KPIs
  const processFilterOptions = useMemo(() => {
    const procs = new Set(kpis.map(k => k.area).filter(Boolean));
    return ['Todos', ...Array.from(procs).sort()];
  }, [kpis]);

  // Filtered KPIs
  const filteredKPIs = useMemo(() => {
    if (selectedFilterProcess === 'Todos') return kpis;
    return kpis.filter(k => k.area === selectedFilterProcess);
  }, [kpis, selectedFilterProcess]);

  const loadKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getKPIs(token);
      setKPIs(data);

      const procs = await sharePointService.getProcesses(token);
      setProcesses(procs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading KPIs');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setKPIs, setError, getSharePointToken]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  const openCreateDialog = () => {
    setSelectedKPI(null);
    setNombre('');
    setDescripcion('');
    setMeta('');
    setPeriodicidad('Trimestral');
    setProcessId('');
    setProcessName('Seleccione Proceso...');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setNombre(kpi.nombre);
    setDescripcion(kpi.descripcion);
    setMeta(kpi.meta ? String(kpi.meta) : '');
    setPeriodicidad(kpi.periodicidad || 'Trimestral');

    // Find matching process
    const proc = processes.find(p => p.nombre === kpi.area);
    if (proc) {
      setProcessId(proc.id);
      setProcessName(`[${proc.codigo}] - ${proc.nombre}`);
    } else {
      setProcessId('');
      setProcessName('Seleccione Proceso...');
    }

    setFormError(null);
    setIsFormOpen(true);
  };

  const openConfirmDelete = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError('Debe ingresar el nombre del KPI.');
      return;
    }
    if (!descripcion.trim()) {
      setFormError('Debe ingresar la descripción o comentarios del KPI.');
      return;
    }
    if (!meta.trim()) {
      setFormError('Debe ingresar la meta del KPI.');
      return;
    }
    const numericMeta = parseFloat(meta);
    if (isNaN(numericMeta) || numericMeta < 0 || numericMeta > 100) {
      setFormError('La meta debe ser un número válido entre 0 y 100.');
      return;
    }
    if (!processId) {
      setFormError('Debe seleccionar un proceso asociado.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSharePointToken();
      const payload: Partial<KPI> = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        meta: numericMeta,
        unidad: '%',
        periodicidad: periodicidad,
        area: processId, // In the kpiRepository mapped write, area represents processId lookup
      };

      if (selectedKPI) {
        await sharePointService.updateKPI(selectedKPI.id, payload, token);
      } else {
        await sharePointService.createKPI(payload, token);
      }

      setIsFormOpen(false);
      await loadKPIs();
    } catch (err) {
      const msg = serializeError(err);
      const elementName = nombre.trim() || (selectedKPI?.nombre ?? 'nuevo KPI');
      setFormError(`Error al guardar el KPI "${elementName}": ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKPI = async () => {
    if (!selectedKPI) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteKPI(selectedKPI.id, token);
      setIsDeleteOpen(false);
      await loadKPIs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar el KPI.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
          Gestión de Indicadores
        </Text>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button icon={<DataLineRegular />} appearance="outline" onClick={() => navigate('/kpis')}>
            Ver Reportes
          </Button>
          {canEdit && (
            <Button icon={<AddRegular />} appearance="primary" onClick={openCreateDialog}>
              Nuevo KPI
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error al cargar datos:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {/* Filtros */}
      {!loading && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E8EAED' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
            <Label htmlFor="kpi-filter-process" style={{ fontSize: '12px', fontWeight: 'bold' }}>Proceso Asociado:</Label>
            <Dropdown
              id="kpi-filter-process"
              value={selectedFilterProcess}
              selectedOptions={[selectedFilterProcess]}
              onOptionSelect={(_, data) => setSelectedFilterProcess(data.optionValue as string)}
            >
              {processFilterOptions.map(opt => (
                <Option key={opt} value={opt}>{opt}</Option>
              ))}
            </Dropdown>
          </div>
          {selectedFilterProcess !== 'Todos' && (
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
              <Button
                appearance="subtle"
                size="small"
                onClick={() => setSelectedFilterProcess('Todos')}
                style={{ color: '#636F7D', fontSize: '12px' }}
              >
                ✕ Limpiar filtro
              </Button>
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
            <Text size={200} style={{ color: '#636F7D' }}>
              {filteredKPIs.length} de {kpis.length} indicador{kpis.length !== 1 ? 'es' : ''}
            </Text>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner label="Cargando indicadores..." />
      ) : (
        <Table aria-label="Tabla de KPIs">
          <TableHeader>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Descripción / Comentario</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Meta</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Periodicidad</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Proceso Asociado</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKPIs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div style={{ padding: '24px', textAlign: 'center', color: '#636F7D' }}>
                    No hay indicadores que coincidan con el filtro seleccionado.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredKPIs.map((kpi: KPI) => (
                <TableRow key={kpi.id}>
                  <TableCell style={{ fontWeight: 'semibold' }}>{kpi.nombre}</TableCell>
                  <TableCell>{kpi.descripcion}</TableCell>
                  <TableCell>{kpi.meta.toFixed(1)}%</TableCell>
                  <TableCell>{kpi.periodicidad}</TableCell>
                  <TableCell>{kpi.area}</TableCell>
                  <TableCell>
                  {canModifyKPI(kpi) ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          icon={<EditRegular />}
                          appearance="subtle"
                          onClick={() => openEditDialog(kpi)}
                          title="Editar KPI"
                        />
                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          style={{ color: '#DC143C' }}
                          onClick={() => openConfirmDelete(kpi)}
                          title="Eliminar KPI"
                        />
                      </div>
                  ) : (
                      <span style={{ color: '#8A8886', fontSize: '11px' }}>Sólo lectura</span>
                  )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={(_, data) => setIsFormOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>{selectedKPI ? 'Editar KPI' : 'Crear Nuevo KPI'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="kpi-name" style={{ fontWeight: 'bold' }}>Nombre del KPI:</Label>
                <Input
                  id="kpi-name"
                  value={nombre}
                  placeholder="ej: Porcentaje de Control de manifestación de riesgos."
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="kpi-desc" style={{ fontWeight: 'bold' }}>Descripción / Comentario:</Label>
                <Input
                  id="kpi-desc"
                  value={descripcion}
                  placeholder="Escriba detalle o comentarios del KPI..."
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="kpi-meta" style={{ fontWeight: 'bold' }}>Meta (%):</Label>
                  <Input
                    id="kpi-meta"
                    type="number"
                    value={meta}
                    placeholder="ej: 90"
                    onChange={(e) => setMeta(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="kpi-period" style={{ fontWeight: 'bold' }}>Periodicidad:</Label>
                  <Dropdown
                    id="kpi-period"
                    value={periodicidad}
                    selectedOptions={[periodicidad]}
                    onOptionSelect={(_, data) => setPeriodicidad(data.optionValue as string)}
                  >
                    <Option value="Trimestral">Trimestral</Option>
                    <Option value="Semestral">Semestral</Option>
                    <Option value="Anual">Anual</Option>
                  </Dropdown>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="kpi-process" style={{ fontWeight: 'bold' }}>Proceso Asociado:</Label>
                <Dropdown
                  id="kpi-process"
                  value={processName}
                  selectedOptions={[processId]}
                  onOptionSelect={(_, data) => {
                    setProcessId(data.optionValue as string);
                    setProcessName(data.optionText || 'Seleccione Proceso...');
                  }}
                >
                  {processes.map(p => {
                    const userEmail = email.toLowerCase();
                    const isOwner = p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
                    const isAllowed = isDeveloper || isAdmin || isOwner;
                    const optText = `[${p.codigo}] - ${p.nombre}${!isAllowed ? ' (No Permitido)' : ''}`;
                    return (
                      <Option key={p.id} value={p.id} disabled={!isAllowed} text={optText}>
                        {optText}
                      </Option>
                    );
                  })}
                </Dropdown>
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
            <DialogTitle>Eliminar KPI</DialogTitle>
            <DialogContent style={{ marginTop: '12px' }}>
              <Text>
                ¿Está seguro de que desea eliminar el KPI <strong>{selectedKPI?.nombre}</strong>? Esta acción no se puede deshacer.
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
              <Button appearance="primary" onClick={handleDeleteKPI} style={{ backgroundColor: '#DC143C', borderColor: '#DC143C' }} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

