import React, { useEffect, useState, useCallback } from 'react';
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
  TabList,
  Tab,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { AddRegular, EditRegular, DeleteRegular, WarningRegular } from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { QualityObjective } from '../types';

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
  card: {
    backgroundColor: 'var(--color-white, #FFFFFF)',
    ...shorthands.padding('24px'),
    ...shorthands.borderRadius('8px'),
    boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08))',
    border: '1px solid var(--color-border, #E8EAED)',
  },
  introText: {
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '20px',
    fontSize: '15px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  pointCard: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#F8FAFC',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    borderLeft: '4px solid var(--color-midnight-blue, #001F3F)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    },
  },
  badge: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-midnight-blue, #001F3F)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '13px',
    flexShrink: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
  },
});

export const QualityPolicy: React.FC = () => {
  const styles = useStyles();
  const { getSharePointToken, isAdmin, isDeveloper } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'declaracion' | 'gestion'>('declaracion');
  const [objectives, setObjectives] = useState<QualityObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<QualityObjective | null>(null);

  // Form Fields
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [meta, setMeta] = useState<number>(90);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canManage = isAdmin || isDeveloper;

  const loadObjectives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getQualityObjectives(token);
      
      // Sort objectives by code
      const sorted = [...data].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }));
      setObjectives(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los objetivos de calidad.');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  const openCreateDialog = () => {
    setSelectedObjective(null);
    setCodigo(`OBJ-${String(objectives.length + 1).padStart(2, '0')}`);
    setNombre('');
    setMeta(90);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (obj: QualityObjective) => {
    setSelectedObjective(obj);
    setCodigo(obj.codigo);
    setNombre(obj.nombre);
    setMeta(obj.meta ?? 90);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (obj: QualityObjective) => {
    setSelectedObjective(obj);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!codigo.trim()) {
      setFormError('Debe ingresar un código para el objetivo.');
      return;
    }
    if (!nombre.trim()) {
      setFormError('Debe ingresar el texto del compromiso.');
      return;
    }
    if (meta < 0 || meta > 100) {
      setFormError('La meta de cumplimiento debe estar entre 0 y 100.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSharePointToken();
      if (selectedObjective) {
        await sharePointService.updateQualityObjective(selectedObjective.id, {
          codigo: codigo.trim(),
          nombre: nombre.trim(),
          meta: meta,
        }, token);
      } else {
        await sharePointService.createQualityObjective({
          codigo: codigo.trim(),
          nombre: nombre.trim(),
          meta: meta,
        }, token);
      }
      setIsFormOpen(false);
      await loadObjectives();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el objetivo de calidad.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedObjective) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteQualityObjective(selectedObjective.id, token);
      setIsDeleteOpen(false);
      await loadObjectives();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar el objetivo de calidad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
            Política de Calidad y Antisoborno
          </Text>
          <Text size={200} style={{ color: '#64748B' }}>
            Compromisos oficiales y gestión de objetivos del Sistema de Gestión Integrado (SGI).
          </Text>
        </div>

        <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as any)}>
          <Tab value="declaracion">Declaración Oficial</Tab>
          {canManage && <Tab value="gestion">Gestión de Objetivos</Tab>}
        </TabList>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner label="Cargando compromisos de la política..." />
        </div>
      ) : activeTab === 'declaracion' ? (
        <div className={styles.card}>
          <div className={styles.introText}>
            Nuestra organización está comprometida con los siguientes lineamientos y objetivos del Sistema de Gestión Integrado (SGI), asegurando el cumplimiento de los estándares internacionales de calidad y la mejora continua en todos nuestros procesos:
          </div>

          <div className={styles.grid}>
            {objectives.map((obj) => (
              <div key={obj.id} className={styles.pointCard}>
                <div className={styles.badge}>
                  {obj.codigo.replace('OBJ-', '')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Text weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)', fontSize: '14px' }}>
                    Compromiso {obj.codigo}
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                    {obj.nombre}
                  </Text>
                  <Text size={100} style={{ color: '#64748B', marginTop: '6px', fontWeight: 'bold' }}>
                    Meta de Cumplimiento: {obj.meta ?? 90}%
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text weight="semibold" style={{ fontSize: '16px' }}>Listado de Objetivos SGI (SharePoint)</Text>
            <Button icon={<AddRegular />} appearance="primary" onClick={openCreateDialog}>
              Nuevo Objetivo
            </Button>
          </div>

          <Table aria-label="Tabla de Objetivos de Calidad">
            <TableHeader>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold', width: '100px' }}>Código</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Compromiso / Descripción</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Meta Global</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectives.map((obj) => (
                <TableRow key={obj.id}>
                  <TableCell style={{ fontWeight: 'bold' }}>{obj.codigo}</TableCell>
                  <TableCell>{obj.nombre}</TableCell>
                  <TableCell>{obj.meta ?? 90}%</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        icon={<EditRegular />}
                        appearance="subtle"
                        onClick={() => openEditDialog(obj)}
                        title="Editar Objetivo"
                      />
                      <Button
                        icon={<DeleteRegular />}
                        appearance="subtle"
                        style={{ color: '#DC143C' }}
                        onClick={() => openDeleteDialog(obj)}
                        title="Eliminar Objetivo"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* CRUD Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(_, data) => setIsFormOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>{selectedObjective ? 'Editar Objetivo de Calidad' : 'Nuevo Objetivo de Calidad'}</DialogTitle>
            <form onSubmit={handleFormSubmit}>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
                {formError && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '4px', border: '1px solid #FBC2C4', fontSize: '12px' }}>
                    {formError}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <Label htmlFor="obj-code" required style={{ fontWeight: 'bold' }}>Código:</Label>
                  <Input
                    id="obj-code"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="ej: OBJ-01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="obj-text" required style={{ fontWeight: 'bold' }}>Compromiso / Descripción:</Label>
                  <Input
                    id="obj-text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Escriba la descripción exacta del compromiso..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="obj-meta" required style={{ fontWeight: 'bold' }}>Meta de Cumplimiento (%):</Label>
                  <Input
                    id="obj-meta"
                    type="number"
                    value={String(meta)}
                    onChange={(e) => setMeta(Number(e.target.value))}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsFormOpen(false)} disabled={submitting}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(_, data) => setIsDeleteOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '440px', width: '90%' }}>
          <DialogBody>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px 0' }}>
                <WarningRegular style={{ fontSize: '32px', color: '#DC143C', flexShrink: 0 }} />
                <Text>
                  ¿Está seguro de que desea eliminar el objetivo <strong>{selectedObjective?.codigo}</strong>? Esta acción no se puede deshacer y desvinculará este objetivo de cualquier proceso asociado.
                </Text>
              </div>
              {formError && (
                <div style={{ padding: '8px 12px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '4px', border: '1px solid #FBC2C4', fontSize: '12px', marginTop: '12px' }}>
                  {formError}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsDeleteOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleDeleteConfirm} style={{ backgroundColor: '#DC143C', color: 'white' }} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
