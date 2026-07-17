import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { serializeError } from '../lib/spClient';
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
import { 
  AddRegular, 
  EditRegular, 
  DeleteRegular, 
  WarningRegular,
  ChevronDownRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';
import { useProcessStore } from '../store';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import { getSipocByProcessId } from '../repositories/sipocRepository';
import { PeoplePicker } from '../components/common/PeoplePicker';
import { Link } from 'react-router-dom';
import type { Process, Area, SIPOCItem, QualityObjective } from '../types';

export const ProcessManagement: React.FC = () => {
  const { getSharePointToken, isDeveloper, isAdmin, isProcessOwner, canModifyProcess } = useAuth();
  const { processes, loading, error, setProcesses, setLoading, setError } = useProcessStore();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  // Search and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'codigo' | 'nombre'>('codigo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Fields
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [alcance, setAlcance] = useState('');
  const [selectedArea, setSelectedArea] = useState('General');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [responsable, setResponsable] = useState('');
  const [tipoProceso, setTipoProceso] = useState('Operativo');
  const [allObjectives, setAllObjectives] = useState<QualityObjective[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // SIPOC Form States
  const [isSipocExpanded, setIsSipocExpanded] = useState(false);
  const [sipocRows, setSipocRows] = useState<Array<{
    id?: string;
    actividad: string;
    proveedores: string;
    insumos: string;
    productos: string;
    cliente: string;
    descripcion?: string;
    responsable?: string;
  }>>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredAndSortedProcesses = useMemo(() => {
    let result = [...processes];
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.codigo.toLowerCase().includes(term) || 
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
    }
    
    result.sort((a, b) => {
      const valA = (sortBy === 'codigo' ? a.codigo : a.nombre).toLowerCase();
      const valB = (sortBy === 'codigo' ? b.codigo : b.nombre).toLowerCase();
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [processes, searchTerm, sortBy, sortOrder]);

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getSharePointToken();
      const data = await sharePointService.getProcesses(token);
      setProcesses(data);

      const areasData = await sharePointService.getAreas(token);
      setAreas(areasData);

      const objectivesData = await sharePointService.getQualityObjectives(token);
      setAllObjectives(objectivesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading processes');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProcesses, setError, getSharePointToken]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const openCreateDialog = () => {
    setSelectedProcess(null);
    setCodigo('');
    setNombre('');
    setDescripcion('');
    setAlcance('');
    setSelectedArea('General');
    setSelectedAreaId('');
    setResponsable('');
    setTipoProceso('Operativo');
    setSelectedObjectives([]);
    setSipocRows([]);
    setIsSipocExpanded(false);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = async (proc: Process) => {
    setSelectedProcess(proc);
    setCodigo(proc.codigo);
    setNombre(proc.nombre);
    setDescripcion(proc.descripcion);
    setAlcance(proc.alcance || '');
    // Resolve areaId from the loaded areas list
    const matchingArea = areas.find(a => a.nombre === proc.area);
    setSelectedArea(proc.area || 'General');
    setSelectedAreaId(matchingArea?.id || '');
    // Extract first email from responsable display name (e.g. 'Ana Gomez' won't have @)
    // Use responsableEmails if available, otherwise use the raw responsable string
    const respEmails = proc.responsableEmails && proc.responsableEmails.length > 0
      ? proc.responsableEmails.join(', ')
      : (proc.responsable || '');
    setResponsable(respEmails);
    setTipoProceso(proc.tipoProceso || 'Operativo');
    setSelectedObjectives(proc.objetivosIds || []);
    setSipocRows([]);
    setIsSipocExpanded(false);
    setFormError(null);
    setIsFormOpen(true);

    // Cargar SIPOC asociado
    try {
      const token = await getSharePointToken();
      const items = await getSipocByProcessId(proc.id, token);
      setSipocRows(items.map(item => ({
        id: item.id,
        actividad: item.actividad,
        proveedores: item.proveedores,
        insumos: item.insumos,
        productos: item.productos,
        cliente: item.cliente,
      })));
    } catch (err) {
      console.error('[ProcessManagement] Error loading SIPOC items for process:', err);
    }
  };

  const openConfirmDelete = (proc: Process) => {
    setSelectedProcess(proc);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!codigo.trim()) {
      setFormError('Debe ingresar el código del proceso.');
      return;
    }
    if (!nombre.trim()) {
      setFormError('Debe ingresar el nombre del proceso.');
      return;
    }
    if (!descripcion.trim()) {
      setFormError('Debe ingresar el objetivo/descripción del proceso.');
      return;
    }
    if (!alcance.trim()) {
      setFormError('Debe ingresar el alcance del proceso.');
      return;
    }

    // Validación básica de filas SIPOC si hay datos ingresados
    for (let i = 0; i < sipocRows.length; i++) {
      if (!sipocRows[i].actividad.trim()) {
        setFormError(`La Actividad #${i + 1} del SIPOC no puede estar vacía.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = await getSharePointToken();
      const payload: Partial<Process> & { sipoc: Partial<SIPOCItem>[]; areaId?: string } = {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        alcance: alcance.trim(),
        area: selectedArea,
        areaId: selectedAreaId || undefined,
        responsable: responsable.trim(),
        tipoProceso: tipoProceso,
        estado: selectedProcess ? selectedProcess.estado : 'activo',
        objetivosIds: selectedObjectives,
        sipoc: sipocRows.map(row => ({
          id: row.id,
          actividad: row.actividad.trim(),
          proveedores: row.proveedores.trim(),
          insumos: row.insumos.trim(),
          productos: row.productos.trim(),
          cliente: row.cliente.trim(),
        })),
      };

      if (selectedProcess) {
        await sharePointService.updateProcess(selectedProcess.id, payload, token);
      } else {
        await sharePointService.createProcess(payload, token);
      }

      setIsFormOpen(false);
      await loadProcesses();
    } catch (err) {
      const msg = serializeError(err);
      const elementName = codigo.trim() || (selectedProcess?.codigo ?? 'nuevo proceso');
      setFormError(`Error al guardar el proceso "${elementName}": ${msg}`);
    } finally {
      setSubmitting(false);
    }
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

  const handleDeleteProcess = async () => {
    if (!selectedProcess) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteProcess(selectedProcess.id, token);
      setIsDeleteOpen(false);
      await loadProcesses();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar el proceso.');
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedProcesses = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredAndSortedProcesses.slice(start, start + 20);
  }, [filteredAndSortedProcesses, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProcesses.length / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
          Gestión de Procesos
        </Text>
        {(isDeveloper || isAdmin || isProcessOwner) && (
          <Button icon={<AddRegular />} appearance="primary" onClick={openCreateDialog}>
            Nuevo Proceso
          </Button>
        )}
      </div>

      {/* Search and Sort controls */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--color-neutral-background2, #F3F4F6)', padding: '16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
          <Label htmlFor="search-input" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Buscar Proceso:</Label>
          <Input
            id="search-input"
            value={searchTerm}
            placeholder="Buscar por código, nombre u objetivo..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
          <Label htmlFor="sort-by" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Ordenar por:</Label>
          <Dropdown
            id="sort-by"
            value={sortBy === 'codigo' ? 'Código' : 'Nombre'}
            selectedOptions={[sortBy]}
            onOptionSelect={(_, data) => setSortBy(data.optionValue as 'codigo' | 'nombre')}
          >
            <Option value="codigo">Código</Option>
            <Option value="nombre">Nombre</Option>
          </Dropdown>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
          <Label htmlFor="sort-order" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Orden:</Label>
          <Dropdown
            id="sort-order"
            value={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            selectedOptions={[sortOrder]}
            onOptionSelect={(_, data) => setSortOrder(data.optionValue as 'asc' | 'desc')}
          >
            <Option value="asc">Ascendente</Option>
            <Option value="desc">Descendente</Option>
          </Dropdown>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error al cargar datos:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {loading ? (
        <Spinner label="Cargando procesos..." />
      ) : (
        <Table aria-label="Tabla de Procesos">
          <TableHeader>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Código</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Objetivo</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Alcance</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Área</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Responsables</TableCell>
              {(isDeveloper || isAdmin || isProcessOwner) && (
                <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acciones</TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProcesses.map((process: Process, index: number) => (
              <TableRow key={process.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                <TableCell style={{ fontWeight: 'semibold' }}>
                  <Link to={`/procesos/${process.id}`} style={{ color: 'var(--color-midnight-blue, #001F3F)', textDecoration: 'none', fontWeight: 'bold' }}>
                    {process.codigo}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link to={`/procesos/${process.id}`} style={{ color: 'var(--color-midnight-blue, #001F3F)', textDecoration: 'none' }}>
                    {process.nombre}
                  </Link>
                </TableCell>
                <TableCell>{process.descripcion}</TableCell>
                <TableCell>{process.alcance || 'Sin definir'}</TableCell>
                <TableCell>{process.area}</TableCell>
                <TableCell>{cleanResponsable(process.responsable)}</TableCell>
                {(isDeveloper || isAdmin || isProcessOwner) && (
                  <TableCell>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canModifyProcess(process) && (
                        <>
                          <Button
                            icon={<EditRegular />}
                            appearance="subtle"
                            onClick={() => openEditDialog(process)}
                            title="Editar Proceso"
                          />
                          <Button
                            icon={<DeleteRegular />}
                            appearance="subtle"
                            style={{ color: '#DC143C' }}
                            onClick={() => openConfirmDelete(process)}
                            title="Eliminar Proceso"
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
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

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={(_, data) => setIsFormOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>{selectedProcess ? 'Editar Proceso' : 'Crear Nuevo Proceso'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="proc-code" style={{ fontWeight: 'bold' }}>Código del Proceso:</Label>
                <Input
                  id="proc-code"
                  value={codigo}
                  placeholder="ej: PR-GC-01"
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="proc-name" style={{ fontWeight: 'bold' }}>Nombre del Proceso:</Label>
                <Input
                  id="proc-name"
                  value={nombre}
                  placeholder="ej: Gestión de Calidad SGI"
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="proc-desc" style={{ fontWeight: 'bold' }}>Objetivo / Descripción:</Label>
                <Input
                  id="proc-desc"
                  value={descripcion}
                  placeholder="ej: Asegurar que los procesos cumplan con la norma ISO 9001..."
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="proc-alcance" style={{ fontWeight: 'bold' }}>Alcance del Proceso:</Label>
                <Input
                  id="proc-alcance"
                  value={alcance}
                  placeholder="ej: Aplica a todas las auditorías internas del portal SGI..."
                  onChange={(e) => setAlcance(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="proc-area" style={{ fontWeight: 'bold' }}>Área:</Label>
                  <Dropdown
                    id="proc-area"
                    value={selectedArea}
                    selectedOptions={[selectedArea]}
                    onOptionSelect={(_, data) => {
                      setSelectedArea(data.optionValue as string);
                      // Also track the areaId for the lookup field
                      const found = areas.find(a => a.nombre === data.optionValue);
                      setSelectedAreaId(found?.id || '');
                    }}
                  >
                    <Option value="General">General</Option>
                    {areas.map(a => (
                      <Option key={a.id} value={a.nombre}>{a.nombre}</Option>
                    ))}
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <PeoplePicker
                    id="proc-resp"
                    label="Responsable (Claims o Cuentas):"
                    value={responsable}
                    onChange={(val) => setResponsable(val)}
                    placeholder="ej: usuario@empresa.com"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="proc-tipo" style={{ fontWeight: 'bold' }}>Tipo de Proceso:</Label>
                  <Dropdown
                    id="proc-tipo"
                    value={tipoProceso}
                    selectedOptions={[tipoProceso]}
                    onOptionSelect={(_, data) => setTipoProceso(data.optionValue as string)}
                  >
                    <Option value="Estratégico">Estratégico</Option>
                    <Option value="Operativo">Operativo</Option>
                    <Option value="Apoyo">Apoyo</Option>
                  </Dropdown>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <Label style={{ fontWeight: 'bold' }}>Objetivos de Calidad Asociados (Política de Calidad):</Label>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #CBD5E0',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: '#FFF'
                }}>
                  {allObjectives.map(obj => {
                    const isChecked = selectedObjectives.includes(Number(obj.id));
                    return (
                      <label key={obj.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const idNum = Number(obj.id);
                            if (e.target.checked) {
                              setSelectedObjectives([...selectedObjectives, idNum]);
                            } else {
                              setSelectedObjectives(selectedObjectives.filter(id => id !== idNum));
                            }
                          }}
                          style={{ marginTop: '3px' }}
                        />
                        <Text><strong>{obj.codigo}</strong>: {obj.nombre}</Text>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Collapsible SIPOC Section */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', marginTop: '8px' }}>
                <div 
                  onClick={() => setIsSipocExpanded(!isSipocExpanded)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F8FAFC', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Text weight="semibold" size={200} style={{ color: '#475569' }}>
                    Diagrama SIPOC ({sipocRows.length} actividades)
                  </Text>
                  {isSipocExpanded ? <ChevronDownRegular style={{ fontSize: '18px', color: '#64748B' }} /> : <ChevronRightRegular style={{ fontSize: '18px', color: '#64748B' }} />}
                </div>

                {isSipocExpanded && (
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', maxHeight: '300px', overflowY: 'auto' }}>
                    {sipocRows.map((row, index) => (
                      <div key={index} style={{ border: '1px solid #E5E7EB', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F9FAFB', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text weight="bold" size={100} style={{ color: '#4b5563' }}>Actividad #{index + 1}</Text>
                          <Button 
                            icon={<DeleteRegular />} 
                            appearance="subtle" 
                            style={{ color: '#DC143C' }} 
                            onClick={() => {
                              setSipocRows(prev => prev.filter((_, i) => i !== index));
                            }} 
                            title="Eliminar actividad"
                          />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <Label size="small" style={{ fontWeight: 'semibold' }}>Actividad/Tarea:</Label>
                          <Input
                            value={row.actividad}
                            placeholder="ej: Recepción de solicitud"
                            onChange={(e) => {
                              const updated = [...sipocRows];
                              updated[index].actividad = e.target.value;
                              setSipocRows(updated);
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Label size="small">Proveedores:</Label>
                            <Input
                              value={row.proveedores}
                              placeholder="Quién provee los insumos"
                              onChange={(e) => {
                                const updated = [...sipocRows];
                                updated[index].proveedores = e.target.value;
                                setSipocRows(updated);
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Label size="small">Insumos:</Label>
                            <Input
                              value={row.insumos}
                              placeholder="Qué materiales o datos entran"
                              onChange={(e) => {
                                const updated = [...sipocRows];
                                updated[index].insumos = e.target.value;
                                setSipocRows(updated);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Label size="small">Productos/Salidas:</Label>
                            <Input
                              value={row.productos}
                              placeholder="Qué resultado se obtiene"
                              onChange={(e) => {
                                const updated = [...sipocRows];
                                updated[index].productos = e.target.value;
                                setSipocRows(updated);
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Label size="small">Clientes:</Label>
                            <Input
                              value={row.cliente}
                              placeholder="Quién recibe el resultado"
                              onChange={(e) => {
                                const updated = [...sipocRows];
                                updated[index].cliente = e.target.value;
                                setSipocRows(updated);
                              }}
                            />
                          </div>
                        </div>

                        {/* Removed description and responsible inputs from generic SIPOC */}
                      </div>
                    ))}
                    
                    <Button 
                      icon={<AddRegular />} 
                      onClick={() => {
                        setSipocRows(prev => [...prev, {
                          id: `temp-${Date.now()}`,
                          actividad: '',
                          proveedores: '',
                          insumos: '',
                          productos: '',
                          cliente: '',
                        }]);
                      }}
                      style={{ marginTop: '4px' }}
                    >
                      Agregar Actividad (SIPOC)
                    </Button>
                  </div>
                )}
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
            <DialogTitle>Eliminar Proceso</DialogTitle>
            <DialogContent style={{ marginTop: '12px' }}>
              <Text>
                ¿Está seguro de que desea eliminar el proceso <strong>{selectedProcess?.nombre}</strong> ({selectedProcess?.codigo})? Esta acción no se puede deshacer.
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
              <Button appearance="primary" onClick={handleDeleteProcess} style={{ backgroundColor: '#DC143C', borderColor: '#DC143C' }} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

