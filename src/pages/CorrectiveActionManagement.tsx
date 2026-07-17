import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { serializeError } from '../lib/spClient';
import {
  Text,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  Input,
  Label,
  Textarea,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  WarningRegular,
  ArrowSyncRegular
} from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import type { CorrectiveAction } from '../types';
import type { Process } from '../models/Process';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    ...shorthands.padding('24px'),
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E8EAED',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  badge: {
    ...shorthands.padding('2px', '8px'),
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    display: 'inline-block',
    width: 'fit-content',
  },
  badgeAbierta: {
    backgroundColor: '#FFF4CE',
    color: '#795C00',
  },
  badgeEnCurso: {
    backgroundColor: '#DFF6DD',
    color: '#107C41',
  },
  badgeCerrada: {
    backgroundColor: '#EDEBE9',
    color: '#323130',
  },
});

export const CorrectiveActionManagement: React.FC = () => {
  const styles = useStyles();

  // State
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [procesoId, setProcesoId] = useState('');
  const [origen, setOrigen] = useState('');
  const [hallazgo, setHallazgo] = useState('');
  const [acciones, setAcciones] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [estado, setEstado] = useState('Abierta');
  const [categorizacion, setCategorizacion] = useState('');
  const [norma, setNorma] = useState('');
  const [requisitos, setRequisitos] = useState('');

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [actionList, processList] = await Promise.all([
        sharePointService.getCorrectiveActions(),
        sharePointService.getProcesses(),
      ]);
      setActions(actionList);
      setProcesses(processList);
    } catch (err) {
      setError(serializeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Form
  const openForm = (action: CorrectiveAction | null = null) => {
    setSelectedAction(action);
    setFormError(null);
    if (action) {
      setNombre(action.nombre);
      setProcesoId(action.procesoId || '');
      setOrigen(action.origen);
      setHallazgo(action.hallazgo);
      setAcciones(action.acciones);
      setResponsable(action.responsable);
      setFechaCompromiso(action.fechaCompromiso ? action.fechaCompromiso.substring(0, 10) : '');
      setEstado(action.estado);
      setCategorizacion(action.categorizacion || '');
      setNorma(action.norma || '');
      setRequisitos(action.requisitos || '');
    } else {
      setNombre('');
      setProcesoId('');
      setOrigen('');
      setHallazgo('');
      setAcciones('');
      setResponsable('');
      setFechaCompromiso('');
      setEstado('Abierta');
      setCategorizacion('');
      setNorma('');
      setRequisitos('');
    }
    setIsDialogOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !responsable.trim()) {
      setFormError('Los campos Título y Responsable son obligatorios.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        procesoId: procesoId || null,
        origen: origen.trim(),
        hallazgo: hallazgo.trim(),
        acciones: acciones.trim(),
        responsable: responsable.trim(),
        fechaCompromiso: fechaCompromiso || null,
        estado,
        categorizacion: categorizacion.trim() || null,
        norma: norma.trim() || null,
        requisitos: requisitos.trim() || null,
      };

      if (selectedAction) {
        await sharePointService.updateCorrectiveAction(selectedAction.id, payload);
      } else {
        await sharePointService.createCorrectiveAction(payload);
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (err) {
      setFormError(serializeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta acción correctiva?')) return;
    try {
      await sharePointService.deleteCorrectiveAction(id);
      await loadData();
    } catch (err) {
      alert(`Error al eliminar: ${serializeError(err)}`);
    }
  };

  // Process Name Lookup
  const getSelectedProcessName = useMemo(() => {
    const proc = processes.find(p => p.id === procesoId);
    return proc ? `${proc.codigo} - ${proc.nombre}` : '';
  }, [procesoId, processes]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
            Gestión de Acciones Correctivas
          </Text>
          <br />
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Registro, control y seguimiento de las no conformidades y oportunidades de mejora del SGI.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button icon={<ArrowSyncRegular />} onClick={loadData} disabled={loading}>
            Sincronizar
          </Button>
          <Button icon={<AddRegular />} appearance="primary" onClick={() => openForm(null)}>
            Nueva Acción
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WarningRegular />
          <Text>{error}</Text>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner label="Cargando acciones correctivas..." />
        </div>
      ) : (
        <div className={styles.card}>
          <Table aria-label="Tabla de acciones correctivas">
            <TableHeader>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>Título / Origen</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Proceso Asociado</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Hallazgo / Acción</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Responsable</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Fecha Límite</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '120px', textAlign: 'right' }}>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#636F7D' }}>
                    No hay acciones correctivas registradas en esta organización.
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text weight="semibold">{act.nombre}</Text>
                        <Text size={100} style={{ color: '#636F7D' }}>Origen: {act.origen}</Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text>{act.procesoAsociado || 'No asignado'}</Text>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
                        <Text style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <strong>H:</strong> {act.hallazgo}
                        </Text>
                        <Text size={100} style={{ color: '#636F7D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <strong>A:</strong> {act.acciones}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text>{act.responsable}</Text>
                    </TableCell>
                    <TableCell>
                      <Text>{act.fechaCompromiso ? act.fechaCompromiso.substring(0, 10) : 'Pendiente'}</Text>
                    </TableCell>
                    <TableCell>
                      <span className={`${styles.badge} ${
                        act.estado === 'Abierta' ? styles.badgeAbierta :
                        act.estado === 'En Curso' ? styles.badgeEnCurso : styles.badgeCerrada
                      }`}>
                        {act.estado}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <Button size="small" icon={<EditRegular />} onClick={() => openForm(act)} title="Editar" />
                        <Button size="small" icon={<DeleteRegular />} onClick={() => handleDelete(act.id)} title="Eliminar" style={{ color: '#DC143C' }} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '600px', width: '100%' }}>
          <DialogBody>
            <DialogTitle>
              {selectedAction ? 'Editar Acción Correctiva' : 'Nueva Acción Correctiva'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent className={styles.formGrid}>
                {formError && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <WarningRegular />
                    <Text>{formError}</Text>
                  </div>
                )}

                <div className={styles.formField}>
                  <Label htmlFor="act-nombre" required>Título de la Acción:</Label>
                  <Input id="act-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej: Corregir cálculo de KPIs en reporte anual" />
                </div>

                <div className={styles.formField}>
                  <Label htmlFor="act-proceso">Proceso Relacionado:</Label>
                  <Dropdown
                    id="act-proceso"
                    value={getSelectedProcessName}
                    selectedOptions={[procesoId]}
                    onOptionSelect={(_, data) => setProcesoId(data.optionValue as string)}
                    placeholder="Seleccione un proceso..."
                  >
                    <Option value="">Sin Proceso Asociado</Option>
                    {processes.map(p => (
                      <Option key={p.id} value={p.id} text={`${p.codigo} - ${p.nombre}`}>
                        {p.codigo} - {p.nombre}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-origen">Origen del Hallazgo:</Label>
                    <Input id="act-origen" value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="ej: Auditoría Interna 2026" />
                  </div>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-responsable" required>Responsable:</Label>
                    <Input id="act-responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Responsable de ejecución" />
                  </div>
                </div>

                <div className={styles.formField}>
                  <Label htmlFor="act-hallazgo">Descripción del Hallazgo / No Conformidad:</Label>
                  <Textarea id="act-hallazgo" value={hallazgo} onChange={(e) => setHallazgo(e.target.value)} rows={3} placeholder="Detalle qué falló o se desvió..." />
                </div>

                <div className={styles.formField}>
                  <Label htmlFor="act-acciones">Acciones Correctivas a Tomar:</Label>
                  <Textarea id="act-acciones" value={acciones} onChange={(e) => setAcciones(e.target.value)} rows={3} placeholder="Describa el plan de acción propuesto..." />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-fecha">Fecha Límite:</Label>
                    <Input id="act-fecha" type="date" value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} />
                  </div>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-estado">Estado Actual:</Label>
                    <Dropdown
                      id="act-estado"
                      value={estado}
                      selectedOptions={[estado]}
                      onOptionSelect={(_, data) => setEstado(data.optionValue as string)}
                    >
                      <Option value="Abierta">Abierta</Option>
                      <Option value="En Curso">En Curso</Option>
                      <Option value="Cerrada">Cerrada</Option>
                    </Dropdown>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-cat">Categorización:</Label>
                    <Input id="act-cat" value={categorizacion} onChange={(e) => setCategorizacion(e.target.value)} placeholder="ej: Calidad, Seguridad" />
                  </div>
                  <div className={styles.formField} style={{ flex: 1 }}>
                    <Label htmlFor="act-norma">Norma ISO:</Label>
                    <Input id="act-norma" value={norma} onChange={(e) => setNorma(e.target.value)} placeholder="ej: ISO 9001:2015" />
                  </div>
                </div>
              </DialogContent>
              <DialogActions style={{ marginTop: '16px' }}>
                <Button appearance="secondary" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button appearance="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogActions>
            </form>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
