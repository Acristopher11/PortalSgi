import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
  Checkbox,
  Dropdown,
  Option,
  Label,
  Badge,
} from '@fluentui/react-components';
import { ShareRegular, DocumentAddRegular, WarningRegular, ArrowLeftRegular } from '@fluentui/react-icons';
import { useKPIStore } from '../store';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { KPI } from '../types';

interface KPIFormState {
  kpiId: string;
  kpiName: string;
  value: string;
  comment: string;
  isNA: boolean;
}

export const KPIReports: React.FC = () => {
  const { getSharePointToken, email: userEmail, isAdmin } = useAuth();
  const { kpis, loading, setKPIs, setLoading, setError } = useKPIStore();
  const navigate = useNavigate();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProcessName, setSelectedProcessName] = useState<string | null>(null);

  // Form Fields
  const [reportStates, setReportStates] = useState<KPIFormState[]>([]);
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  const [reportQuarter, setReportQuarter] = useState<string>('Q1');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getKPIs(token);
      setKPIs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading KPIs');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setKPIs, setError, getSharePointToken]);

  useEffect(() => {
    if (kpis.length === 0) {
      loadKPIs();
    }
  }, [kpis.length, loadKPIs]);

  const handleExport = () => {
    console.log('Exporting KPI reports...');
  };

  // Helper to extract clean names from claims
  const cleanResponsable = (r?: string): string => {
    if (!r) return 'Sin asignar';
    const emailMatch = r.match(/membership\|([^|]+)/i) || r.match(/i:0#\.f\|membership\|([^|]+)/i);
    const email = emailMatch ? emailMatch[1] : r;
    if (email.includes('@')) {
      const parts = email.split('@')[0].split('.');
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return r;
  };

  // Helper to verify if the current user is the responsible
  const isUserResponsible = (responsableClaim?: string): boolean => {
    if (isAdmin) return true;
    if (!responsableClaim) return false;
    
    const emailMatch = responsableClaim.match(/membership\|([^|]+)/i) || responsableClaim.match(/i:0#\.f\|membership\|([^|]+)/i);
    const email = emailMatch ? emailMatch[1] : responsableClaim;
    
    return email.toLowerCase().trim() === userEmail.toLowerCase().trim();
  };

  // Check if current user can report for a process
  const canUserReportProcess = (kpisInProcess: KPI[]): boolean => {
    if (isAdmin) return true;
    return kpisInProcess.some(kpi => isUserResponsible(kpi.responsable));
  };

  // Group KPIs by process
  const processRows = useMemo(() => {
    const groups: Record<string, KPI[]> = {};
    kpis.forEach(kpi => {
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

      // Responsibles
      const responsibles = Array.from(new Set(kpisInGroup.map(k => k.responsable).filter(Boolean)));
      const cleanedResponsibles = responsibles.map(r => cleanResponsable(r)).join(', ');

      return {
        processName,
        meta: avgMeta,
        actual: avgActual,
        estado,
        responsable: cleanedResponsibles,
        kpis: kpisInGroup,
        canReport: canUserReportProcess(kpisInGroup)
      };
    });
  }, [kpis, isAdmin, userEmail]);

  // Open Dialog for reporting
  const openReportDialog = (processName: string, kpisInProcess: KPI[]) => {
    setSelectedProcessName(processName);
    
    // Filter to indicators that the user is responsible for (or all if admin)
    const reportableKPIs = kpisInProcess.filter(k => isAdmin || isUserResponsible(k.responsable));

    const initialStates: KPIFormState[] = reportableKPIs.map(k => ({
      kpiId: k.id,
      kpiName: k.nombre,
      value: '',
      comment: '',
      isNA: false,
    }));
    
    setReportStates(initialStates);
    setReportYear(new Date().getFullYear().toString());
    setReportQuarter('Q1');
    setAttachedFiles([]);
    setFormError(null);
    setIsDialogOpen(true);
  };

  // Handle global file attachment input
  const handleGlobalFilesChange = (fileList: FileList | null) => {
    if (fileList) {
      const filesArray = Array.from(fileList);
      setAttachedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachedFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle field change in single KPI item inside the parallel form
  const handleKPIStateChange = (idx: number, fields: Partial<KPIFormState>) => {
    setReportStates(prev => prev.map((s, i) => {
      if (i === idx) {
        const updated = { ...s, ...fields };
        if (fields.isNA !== undefined) {
          if (fields.isNA) {
            updated.value = '100';
            updated.comment = 'N/A';
          } else {
            updated.value = '';
            updated.comment = '';
          }
        }
        return updated;
      }
      return s;
    }));
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate parent fields
    if (!reportYear) {
      setFormError('Debe ingresar el año.');
      return;
    }
    if (!reportQuarter) {
      setFormError('Debe seleccionar el trimestre.');
      return;
    }

    // Validate inputs for each KPI in the list
    for (const state of reportStates) {
      if (!state.isNA) {
        if (!state.value) {
          setFormError(`Debe ingresar el valor real para: "${state.kpiName}".`);
          return;
        }
        const numericValue = parseFloat(state.value);
        if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
          setFormError(`El valor real de "${state.kpiName}" debe ser un número entre 0 y 100.`);
          return;
        }
        if (!state.comment.trim()) {
          setFormError(`Debe ingresar un comentario para: "${state.kpiName}".`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const token = await getSharePointToken();

      // Sequentially save each KPI measurement to avoid proxy collision or race conditions
      for (const state of reportStates) {
        const isNA = state.isNA;
        const numericValue = isNA ? 100 : parseFloat(state.value);
        const comment = isNA ? 'N/A' : state.comment;
        
        await sharePointService.createMeasurement({
          kpiId: state.kpiId,
          year: parseInt(reportYear),
          quarter: reportQuarter,
          value: numericValue,
          comment: comment,
        }, token, attachedFiles.length > 0 ? attachedFiles : undefined);
      }

      // Success, close dialog and refresh data
      setIsDialogOpen(false);
      await loadKPIs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar las mediciones.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            icon={<ArrowLeftRegular />} 
            appearance="subtle" 
            onClick={() => navigate('/kpis-admin', { viewTransition: true })}
            title="Volver a Indicadores"
          />
          <Text size={600} weight="bold">
            Reportes de KPI
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            icon={<ShareRegular />}
            onClick={handleExport}
            appearance="outline"
          >
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Cargando reportes de procesos..." />
      ) : (
        <Table aria-label="Tabla de reportes por proceso">
          <TableHeader>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Proceso</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Meta Promedio</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Resultado Actual Promedio</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Responsable</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '140px' }}>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processRows.map((row) => (
              <TableRow key={row.processName}>
                <TableCell style={{ fontWeight: 'semibold' }}>{row.processName}</TableCell>
                <TableCell>{row.meta.toFixed(1)}%</TableCell>
                <TableCell>
                  {row.actual !== null ? `${row.actual.toFixed(1)}%` : 'SIN DATOS'}
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="tint"
                    color={
                      row.estado === 'on_track'
                        ? 'success'
                        : row.estado === 'at_risk'
                        ? 'warning'
                        : row.estado === 'off_track'
                        ? 'danger'
                        : 'subtle'
                    }
                  >
                    {row.estado === 'no_data' ? 'SIN DATOS' : row.estado.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{row.responsable}</TableCell>
                <TableCell>
                  <Button
                    icon={<DocumentAddRegular />}
                    appearance="primary"
                    disabled={!row.canReport}
                    onClick={() => openReportDialog(row.processName, row.kpis)}
                    title={row.canReport ? 'Registrar nueva medición' : 'No es responsable de este proceso'}
                  >
                    Reportar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* FORM DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>Registrar Mediciones de Proceso</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #E8EAED', paddingBottom: '12px' }}>
                <Label style={{ fontWeight: 'bold', fontSize: '14px' }}>Proceso:</Label>
                <Text size={400} weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>{selectedProcessName}</Text>
              </div>

              {/* Año y Trimestre seleccionados una sola vez */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid #E8EAED', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="year-select" style={{ fontWeight: 'bold' }}>Año:</Label>
                  <Dropdown
                    id="year-select"
                    value={reportYear}
                    selectedOptions={[reportYear]}
                    onOptionSelect={(_, data) => setReportYear(data.optionValue as string)}
                  >
                    <Option value="2024">2024</Option>
                    <Option value="2025">2025</Option>
                    <Option value="2026">2026</Option>
                    <Option value="2027">2027</Option>
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="quarter-select" style={{ fontWeight: 'bold' }}>Trimestre:</Label>
                  <Dropdown
                    id="quarter-select"
                    value={reportQuarter}
                    selectedOptions={[reportQuarter]}
                    onOptionSelect={(_, data) => setReportQuarter(data.optionValue as string)}
                  >
                    <Option value="Q1">Q1</Option>
                    <Option value="Q2">Q2</Option>
                    <Option value="Q3">Q3</Option>
                    <Option value="Q4">Q4</Option>
                  </Dropdown>
                </div>
              </div>

              {/* Sección de Adjuntos de Evidencia Global del Proceso */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E8EAED', paddingBottom: '16px' }}>
                <Label style={{ fontWeight: 'bold' }}>Documentos de Evidencia (Común para todo el proceso):</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    id="global-file-input"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => handleGlobalFilesChange(e.target.files)}
                  />
                  <Button
                    appearance="outline"
                    icon={<DocumentAddRegular />}
                    onClick={() => document.getElementById('global-file-input')?.click()}
                  >
                    Seleccionar Archivos
                  </Button>
                  <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                    {attachedFiles.length === 0 ? 'Ningún archivo seleccionado' : `${attachedFiles.length} archivo(s) seleccionado(s)`}
                  </Text>
                </div>
                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {attachedFiles.map((file, fileIdx) => (
                      <div key={fileIdx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        backgroundColor: '#F0F4F8', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        border: '1px solid #D0D9E0',
                        fontSize: '12px'
                      }}>
                        <span>📎 {file.name}</span>
                        <Button 
                          size="small" 
                          appearance="subtle" 
                          style={{ minWidth: 'auto', padding: '2px', color: '#DC143C' }}
                          onClick={() => removeAttachedFile(fileIdx)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenedor de indicadores con alto fijo para prevenir scrolls horizontales y desbordes */}
              <div style={{ 
                maxHeight: '380px', 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                paddingRight: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {reportStates.map((state, idx) => (
                  <div key={state.kpiId} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px dashed #E8EAED'
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary, #2D3748)', fontSize: '13px' }}>
                      {state.kpiName}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', alignItems: 'end' }}>
                      
                      {/* Campo Valor y Checkbox N/A */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Checkbox
                          id={`na-checkbox-${state.kpiId}`}
                          label="No aplica (N/A)"
                          checked={state.isNA}
                          onChange={(_, data) => handleKPIStateChange(idx, { isNA: !!data.checked })}
                          style={{ marginBottom: '4px' }}
                        />
                        <Input
                          id={`value-input-${state.kpiId}`}
                          type="number"
                          placeholder="Valor (%)"
                          value={state.value}
                          disabled={state.isNA}
                          onChange={(e) => handleKPIStateChange(idx, { value: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Campo Comentarios */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Label htmlFor={`comment-input-${state.kpiId}`} style={{ fontSize: '11px', fontWeight: 'bold' }}>Comentario:</Label>
                        <Input
                          id={`comment-input-${state.kpiId}`}
                          placeholder={state.isNA ? 'No aplica (N/A)' : 'Escriba justificación/evidencia...'}
                          value={state.comment}
                          disabled={state.isNA}
                          onChange={(e) => handleKPIStateChange(idx, { comment: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {formError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                  <WarningRegular />
                  <Text>{formError}</Text>
                </div>
              )}

            </DialogContent>
            
            <DialogActions style={{ marginTop: '24px', borderTop: '1px solid #E8EAED', paddingTop: '16px' }}>
              <Button appearance="secondary" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleFormSubmit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
