import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  Spinner,
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Textarea,
  Label,
  Tab,
  TabList,
  Input,
  Select,
} from '@fluentui/react-components';
import {
  CheckmarkUnderlineCircleRegular,
  ArrowClockwiseRegular,
  DocumentRegular,
  CheckmarkRegular,
  DismissRegular,
  CalendarRegular,
  PersonRegular,
} from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import { canUserApproveStep } from '../services/approvalFlowEngine';
import type { ApprovalRequest, Process, Area } from '../types';

export const ApprovalConsole: React.FC = () => {
  const { getSharePointToken, email, isAdmin, isDeveloper } = useAuth();
  
  // Data States
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [glossary, setGlossary] = useState<any[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'my-approvals' | 'pending' | 'history'
  const [activeTab, setActiveTab] = useState<'my-approvals' | 'pending' | 'history'>('my-approvals');

  // Review Dialog State
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Paging
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [filterTipoElemento, setFilterTipoElemento] = useState<string>('todos');
  const [filterAccion, setFilterAccion] = useState<string>('todos');
  const [filterTexto, setFilterTexto] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterTipoElemento, filterAccion, filterTexto]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      const [reqData, procData, kpiData, riskData, glossaryData, areasData, objectivesData] = await Promise.all([
        sharePointService.getApprovalRequests(token),
        sharePointService.getProcesses(token),
        sharePointService.getKPIs(token).catch(() => []),
        sharePointService.getRisks(token).catch(() => []),
        sharePointService.getGlossaryTerms(token).catch(() => []),
        sharePointService.getAreas(token).catch(() => []),
        sharePointService.getQualityObjectives(token).catch(() => []),
      ]);
      setRequests(reqData);
      setProcesses(procData);
      setKpis(kpiData);
      setRisks(riskData);
      setGlossary(glossaryData);
      setAreas(areasData);
      setObjectives(objectivesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la consola de aprobaciones.');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    const queryAction = params.get('action');

    if (queryId && (queryAction === 'Aprobado' || queryAction === 'Rechazado')) {
      const processAutoApproval = async () => {
        setLoading(true);
        try {
          const token = await getSharePointToken();
          const reqData = await sharePointService.getApprovalRequests(token);
          const req = reqData.find(r => r.id === queryId);
          
          if (req && req.estado === 'Pendiente') {
            await sharePointService.resolveApprovalRequest(
              queryId,
              queryAction as 'Aprobado' | 'Rechazado',
              'Procesado automáticamente vía enlace de correo electrónico.',
              token
            );
            alert(`Solicitud "${req.titulo}" procesada como "${queryAction}" con éxito.`);
          } else if (req) {
            alert(`La solicitud ya se encuentra en estado: ${req.estado}.`);
          } else {
            alert(`No se encontró la solicitud con ID: ${queryId}`);
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
          loadData();
        } catch (err) {
          console.error('[ApprovalConsole] Error in email auto-approval:', err);
          setError(err instanceof Error ? err.message : 'Error al procesar auto-aprobación.');
        } finally {
          setLoading(false);
        }
      };

      processAutoApproval();
    }
  }, [getSharePointToken, loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Determine if current user can approve/reject the given request
  const canResolve = useCallback((req: ApprovalRequest): boolean => {
    if (isAdmin || isDeveloper) return true;
    return canUserApproveStep(req, email);
  }, [email, isAdmin, isDeveloper]);

  const originalItem = useMemo(() => {
    if (!selectedRequest || !selectedRequest.elementoId) return null;
    const elId = selectedRequest.elementoId;
    const type = selectedRequest.tipoElemento;
    
    if (type === 'Proceso') {
      return processes.find(p => p.id === elId);
    }
    if (type === 'KPI') {
      return kpis.find(k => k.id === elId);
    }
    if (type === 'Riesgo') {
      return risks.find(r => r.id === elId);
    }
    if (type === 'Glosario') {
      return glossary.find(g => g.id === elId);
    }
    return null;
  }, [selectedRequest, processes, kpis, risks, glossary]);

  const changesList = useMemo(() => {
    if (!selectedRequest || selectedRequest.accion !== 'Modificar') return null;
    try {
      const proposed = JSON.parse(selectedRequest.datosJson);
      const original = originalItem;
      if (!original) return null;
      
      const list: { campo: string; anterior: string; nuevo: string }[] = [];
      
      const formatValue = (key: string, val: any): string => {
        if (val === null || val === undefined) return 'Sin asignar';
        if (Array.isArray(val)) {
          if (val.length === 0) return 'Ninguno';
          if (typeof val[0] === 'object') {
            return val.map((item: any) => item.nombre || item.Title || item.DisplayName || JSON.stringify(item)).join(', ');
          }
          // Si el array contiene IDs de objetivos, los resolvemos
          if (key === 'objetivosIds' || key === 'sgi_ObjLookup') {
            return val.map(id => {
              const idStr = String(id);
              const obj = objectives.find(o => String(o.id) === idStr);
              return obj ? `[${obj.codigo}] ${obj.nombre}` : `Objetivo ID: ${idStr}`;
            }).join(', ');
          }
          return val.join(', ');
        }
        if (typeof val === 'object') {
          return val.nombre || val.Title || val.Value || val.DisplayName || JSON.stringify(val);
        }
        
        // Resoluciones personalizadas de lookups
        if (key === 'procesoId' || key === 'proceso_asociado') {
          const pName = processes.find(p => p.id === String(val))?.nombre;
          return pName ? pName : `ID: ${val}`;
        }

        if (key === 'areaId' || key === 'sgi_AreaLookupId' || (key === 'area' && !isNaN(Number(val)))) {
          const areaObj = areas.find(a => String(a.id) === String(val));
          return areaObj ? areaObj.nombre : `Área ID: ${val}`;
        }

        if (key === 'dependenciaId') {
          if (!val || val === '0') return 'Ninguna (Raíz)';
          const areaObj = areas.find(a => String(a.id) === String(val));
          return areaObj ? areaObj.nombre : `Área ID: ${val}`;
        }

        if (key === 'objetivosIds' || key === 'sgi_ObjLookup') {
          const idStr = String(val);
          const obj = objectives.find(o => String(o.id) === idStr);
          return obj ? `[${obj.codigo}] ${obj.nombre}` : `Objetivo ID: ${idStr}`;
        }
        
        return String(val);
      };

      Object.entries(proposed).forEach(([key, val]) => {
        if (['id', 'fecha_creacion', 'fecha_ultima_actualizacion', 'link', 'fullPath'].includes(key)) return;
        
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        const anteriorVal = (original as any)[key];
        
        const anteriorStr = formatValue(key, anteriorVal);
        const nuevoStr = formatValue(key, val);
        
        if (anteriorStr !== nuevoStr) {
          list.push({
            campo: label,
            anterior: anteriorStr,
            nuevo: nuevoStr,
          });
        }
      });
      
      return list;
    } catch (e) {
      console.error('[ApprovalConsole] Error calculating changesList:', e);
      return null;
    }
  }, [selectedRequest, originalItem, processes]);

  // Handle Approval or Rejection
  const handleResolve = async (decision: 'Aprobado' | 'Rechazado') => {
    if (!selectedRequest) return;
    if (decision === 'Rechazado' && !reviewComments.trim()) {
      alert("Por favor, ingrese un comentario explicando el motivo del rechazo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.resolveApprovalRequest(
        selectedRequest.id,
        decision,
        reviewComments,
        token
      );
      
      setSelectedRequest(null);
      setReviewComments('');
      await loadData(); // Reload list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la resolución de la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  // Badge Stylings
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('crear') || act.includes('subir')) {
      return <Badge appearance="filled" color="success">{action}</Badge>;
    }
    if (act.includes('eliminar') || act.includes('borrar')) {
      return <Badge appearance="filled" color="danger">{action}</Badge>;
    }
    return <Badge appearance="filled" style={{ backgroundColor: '#0078D4', color: 'white' }}>{action}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const st = status.toLowerCase();
    if (st === 'pendiente') {
      return <Badge appearance="outline" color="warning">{status}</Badge>;
    }
    if (st === 'aprobado') {
      return <Badge appearance="filled" color="success">{status}</Badge>;
    }
    return <Badge appearance="filled" color="danger">{status}</Badge>;
  };

  const getElementBadge = (element: string) => {
    return <Badge appearance="outline">{element}</Badge>;
  };

  // Filters
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Tab filter
      let matchesTab = false;
      if (activeTab === 'pending') {
        matchesTab = req.estado === 'Pendiente';
      } else if (activeTab === 'my-approvals') {
        matchesTab = req.estado === 'Pendiente' && req.aprobadorPasoActual?.toLowerCase() === email.toLowerCase();
      } else {
        matchesTab = req.estado === 'Aprobado' || req.estado === 'Rechazado';
      }
      if (!matchesTab) return false;

      // Element type filter
      if (filterTipoElemento !== 'todos' && req.tipoElemento !== filterTipoElemento) return false;

      // Action filter
      if (filterAccion !== 'todos' && req.accion !== filterAccion) return false;

      // Text search filter
      if (filterTexto.trim() !== '') {
        const text = filterTexto.toLowerCase();
        const matchesTitle = req.titulo.toLowerCase().includes(text);
        const matchesRequester = req.solicitante.toLowerCase().includes(text);
        const matchesId = req.id.toLowerCase().includes(text);
        const matchesElementId = req.elementoId ? req.elementoId.toLowerCase().includes(text) : false;
        if (!matchesTitle && !matchesRequester && !matchesId && !matchesElementId) return false;
      }

      return true;
    });
  }, [requests, activeTab, email, filterTipoElemento, filterAccion, filterTexto]);

  // Pagination
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredRequests.slice(start, start + 20);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / 20);

  // Parse JSON data for visual display
  const parsedData = useMemo(() => {
    if (!selectedRequest) return null;
    try {
      const data = JSON.parse(selectedRequest.datosJson);
      
      // If it is a document upload
      if (selectedRequest.tipoElemento === 'Documento' && selectedRequest.accion === 'Subir' && selectedRequest.metadataArchivo) {
        const metadata = JSON.parse(selectedRequest.metadataArchivo);
        return {
          'Nombre Archivo': selectedRequest.rutaArchivoTemp?.split('/').pop() || '',
          'Código': metadata.codigo || '',
          'Versión': metadata.version || '',
          'Proceso Asociado': processes.find(p => p.id === metadata.procesoId)?.nombre || 'Sin proceso asociado',
          'Ruta Temporal': selectedRequest.rutaArchivoTemp || '',
        };
      }
      
      // Basic formatting of payload fields
      const formatted: Record<string, string> = {};
      Object.entries(data).forEach(([key, val]) => {
        if (val === null || val === undefined) return;
        
        // Skip technical fields
        if (['id', 'fecha_creacion', 'fecha_ultima_actualizacion', 'link', 'fullPath'].includes(key)) return;
        
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        let displayValue = String(val);
        
        // Custom lookups mapping
        if (key === 'procesoId') {
          label = 'Proceso Asociado';
          const pName = processes.find(p => p.id === String(val))?.nombre;
          displayValue = pName ? pName : `ID: ${val}`;
        }
        
        formatted[label] = displayValue;
      });
      return formatted;
    } catch {
      return { 'Detalle': selectedRequest.datosJson };
    }
  }, [selectedRequest, processes]);

  const userCanApproveSelected = selectedRequest ? canResolve(selectedRequest) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckmarkUnderlineCircleRegular style={{ fontSize: '24px', color: 'var(--color-midnight-blue, #001F3F)' }} />
            <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
              Consola de Aprobaciones
            </Text>
          </div>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Revisión y aprobación de cambios del Sistema de Gestión Integrado (Control de Cambios ISO 9001:2015 6.3)
          </Text>
        </div>

        <Button icon={<ArrowClockwiseRegular />} onClick={loadData} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {/* Tabs list */}
      <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as any)}>
        <Tab value="my-approvals">Mis Aprobaciones Pendientes ({requests.filter(r => r.estado === 'Pendiente' && r.aprobadorPasoActual?.toLowerCase() === email.toLowerCase()).length})</Tab>
        <Tab value="pending">Todas las Pendientes ({requests.filter(r => r.estado === 'Pendiente').length})</Tab>
        <Tab value="history">Historial de Resoluciones</Tab>
      </TabList>

      {/* Filters Panel */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px', flex: '2' }}>
          <Label htmlFor="search-input" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Buscar por título o solicitante:</Label>
          <Input id="search-input" placeholder="Buscar por texto..." value={filterTexto} onChange={(e) => setFilterTexto(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
          <Label htmlFor="filter-tipo" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Tipo de Elemento:</Label>
          <Select id="filter-tipo" value={filterTipoElemento} onChange={(e) => setFilterTipoElemento(e.target.value)} style={{ width: '100%' }}>
            <option value="todos">Todos los elementos</option>
            <option value="Proceso">Procesos</option>
            <option value="Riesgo">Riesgos</option>
            <option value="KPI">KPIs</option>
            <option value="Glosario">Glosario</option>
            <option value="Documento">Documentos</option>
            <option value="Área">Áreas (Jerarquía)</option>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
          <Label htmlFor="filter-accion" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Acción:</Label>
          <Select id="filter-accion" value={filterAccion} onChange={(e) => setFilterAccion(e.target.value)} style={{ width: '100%' }}>
            <option value="todos">Todas las acciones</option>
            <option value="Crear">Crear</option>
            <option value="Modificar">Modificar</option>
            <option value="Subir">Subir (Cargar)</option>
            <option value="Eliminar">Eliminar</option>
          </Select>
        </div>
        {(filterTexto || filterTipoElemento !== 'todos' || filterAccion !== 'todos') && (
          <Button appearance="subtle" onClick={() => { setFilterTexto(''); setFilterTipoElemento('todos'); setFilterAccion('todos'); }} style={{ color: '#DC143C' }}>
            Limpiar Filtros
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {/* Main Table Content */}
      {loading ? (
        <Spinner label="Cargando solicitudes..." />
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
          <Table aria-label="Listado de Aprobaciones SGI">
            <TableHeader>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold', width: '280px' }}>Solicitud</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '130px' }}>Elemento</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '110px' }}>Acción</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '220px' }}>Solicitante</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '160px' }}>Fecha Solicitud</TableCell>
                {activeTab === 'history' && (
                  <>
                    <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Estado</TableCell>
                    <TableCell style={{ fontWeight: 'bold', width: '200px' }}>Aprobador</TableCell>
                  </>
                )}
                <TableCell style={{ fontWeight: 'bold', width: '100px', textAlign: 'right' }}>Acción</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((req: ApprovalRequest, index: number) => (
                <TableRow key={req.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Text weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                        {req.titulo}
                      </Text>
                      {req.flujoVersion && req.flujoVersion > 1 && (
                        <Badge appearance="outline" color="brand" style={{ flexShrink: 0 }}>
                          Reenvío #{req.flujoVersion}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getElementBadge(req.tipoElemento)}</TableCell>
                  <TableCell>{getActionBadge(req.accion)}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PersonRegular style={{ fontSize: '14px', color: '#666' }} />
                      <span style={{ fontSize: '13px' }}>{req.solicitante}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarRegular style={{ fontSize: '14px', color: '#666' }} />
                      <span style={{ fontSize: '13px' }}>{new Date(req.fechaSolicitud).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  {activeTab === 'history' && (
                    <>
                      <TableCell>{getStatusBadge(req.estado)}</TableCell>
                      <TableCell style={{ fontSize: '13px', color: '#555' }}>{req.aprobador || 'N/A'}</TableCell>
                    </>
                  )}
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button 
                      appearance="primary" 
                      size="small"
                      style={{ backgroundColor: activeTab !== 'history' ? 'var(--color-midnight-blue, #001F3F)' : 'var(--color-neutral-stroke-accessible, #616161)' }}
                      onClick={() => {
                        setSelectedRequest(req);
                        setReviewComments(req.comentarios || '');
                      }}
                    >
                      {activeTab !== 'history' ? 'Revisar' : 'Ver Detalle'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={activeTab === 'history' ? 8 : 6} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                    No hay solicitudes pendientes en este momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination component */}
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

      {/* Review Dialog */}
      <Dialog open={selectedRequest !== null} onOpenChange={(_, data) => { if (!data.open) setSelectedRequest(null); }}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>Detalle de la Solicitud</span>
                {selectedRequest && selectedRequest.flujoVersion && selectedRequest.flujoVersion > 1 && (
                  <Badge appearance="filled" color="brand">
                    Reenvío #{selectedRequest.flujoVersion}
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogContent>
              {selectedRequest && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  
                  {/* Stepper visual */}
                  {selectedRequest.historialPasos && selectedRequest.historialPasos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <Text weight="semibold" size={200} style={{ color: '#475569', marginBottom: '4px' }}>
                        Progreso del Flujo de Aprobación ({selectedRequest.pasoActual} de {selectedRequest.totalPasos}):
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', overflowX: 'auto', padding: '8px 0' }}>
                        {selectedRequest.historialPasos.map((step, idx) => {
                          const isCompleted = step.decision === 'Aprobado';
                          const isRejected = step.decision === 'Rechazado';
                          const isCurrent = selectedRequest.pasoActual === step.paso && selectedRequest.estado === 'Pendiente';
                          
                          let circleColor = '#E2E8F0';
                          let textColor = '#64748B';
                          let fontWeight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular';
                          
                          if (isCompleted) {
                            circleColor = '#107C41'; // Green
                            textColor = '#107C41';
                          } else if (isRejected) {
                            circleColor = '#A80000'; // Red
                            textColor = '#A80000';
                            fontWeight = 'bold';
                          } else if (isCurrent) {
                            circleColor = 'var(--color-midnight-blue, #001F3F)'; // Blue
                            textColor = 'var(--color-midnight-blue, #001F3F)';
                            fontWeight = 'bold';
                          }

                          return (
                            <React.Fragment key={step.paso}>
                              {/* Step Node */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '85px', position: 'relative', zIndex: 2 }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: circleColor,
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(0, 31, 63, 0.2)' : 'none',
                                  transition: 'all 0.3s ease',
                                }}>
                                  {isCompleted ? '✓' : isRejected ? '✗' : step.paso}
                                </div>
                                <Text size={100} weight={fontWeight} style={{ color: textColor, marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {step.nombrePaso}
                                </Text>
                                <span style={{ fontSize: '9px', color: '#64748B', display: 'block', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={step.aprobador.replace(/;/g, ', ')}>
                                  {step.aprobador.split(';').map(e => e.split('@')[0]).join(', ')}
                                </span>
                              </div>
                              
                              {/* Connector Line */}
                              {idx < (selectedRequest.historialPasos?.length || 0) - 1 && (
                                <div style={{
                                  flex: 1,
                                  height: '2px',
                                  backgroundColor: isCompleted ? '#107C41' : '#E2E8F0',
                                  margin: '0 -15px',
                                  marginTop: '-24px',
                                  zIndex: 1,
                                  minWidth: '15px',
                                }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Metadata cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <Text size={100} style={{ color: '#64748B', display: 'block' }}>Solicitante</Text>
                      <Text size={200} weight="semibold">{selectedRequest.solicitante}</Text>
                    </div>
                    <div>
                      <Text size={100} style={{ color: '#64748B', display: 'block' }}>Fecha Solicitud</Text>
                      <Text size={200} weight="semibold">{new Date(selectedRequest.fechaSolicitud).toLocaleString()}</Text>
                    </div>
                    <div>
                      <Text size={100} style={{ color: '#64748B', display: 'block' }}>Tipo Elemento</Text>
                      {getElementBadge(selectedRequest.tipoElemento)}
                    </div>
                    <div>
                      <Text size={100} style={{ color: '#64748B', display: 'block' }}>Acción</Text>
                      {getActionBadge(selectedRequest.accion)}
                    </div>
                  </div>

                  {/* Changes Payload display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Text weight="semibold">Datos de la operación:</Text>
                    
                    {selectedRequest.tipoElemento === 'Documento' && selectedRequest.accion === 'Subir' ? (
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <DocumentRegular style={{ fontSize: '32px', color: 'var(--color-midnight-blue, #001F3F)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <Text weight="semibold">{parsedData?.['Nombre Archivo']}</Text>
                          <Text size={100} style={{ color: '#666' }}>Código: {parsedData?.['Código']} | Versión: {parsedData?.['Versión']}</Text>
                          <Text size={100} style={{ color: '#666' }}>Proceso: {parsedData?.['Proceso Asociado']}</Text>
                        </div>
                      </div>
                    ) : changesList && changesList.length > 0 ? (
                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#475569', width: '25%' }}>Propiedad Modificada</th>
                              <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#B91C1C', width: '37%' }}>Valor Anterior (Original)</th>
                              <th style={{ padding: '10px 12px', fontWeight: 'bold', color: '#15803D', width: '38%' }}>Valor Propuesto (Nuevo)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changesList.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 'semibold', color: '#475569' }}>{item.campo}</td>
                                <td style={{ padding: '10px 12px', color: '#DC2626', textDecoration: 'line-through', wordBreak: 'break-all' }}>{item.anterior}</td>
                                <td style={{ padding: '10px 12px', color: '#16A34A', fontWeight: 'semibold', wordBreak: 'break-all', backgroundColor: '#F0FDF4' }}>{item.nuevo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#FAFAFA' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <tbody>
                            {parsedData && Object.entries(parsedData).map(([key, val]) => (
                              <tr key={key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#475569', width: '40%', backgroundColor: '#F8FAFC' }}>{key}</td>
                                <td style={{ padding: '8px 12px', color: '#0F172A', wordBreak: 'break-all' }}>{String(val)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Document warning if document upload */}
                  {selectedRequest.tipoElemento === 'Documento' && selectedRequest.accion === 'Subir' && selectedRequest.estado === 'Pendiente' && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', color: '#1E40AF', fontSize: '12px' }}>
                      <strong>Carga Temporal:</strong> El archivo se cargó temporalmente en la biblioteca de SharePoint. Al aprobar, se moverá a su ruta definitiva; al rechazar se eliminará de forma segura.
                    </div>
                  )}

                  {/* Expandable step history */}
                  {selectedRequest.historialPasos && selectedRequest.historialPasos.some(s => s.decision !== 'Pendiente') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Text weight="semibold" size={200}>Historial de Decisiones del Flujo:</Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#F8FAFC', padding: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                        {selectedRequest.historialPasos
                          .filter(s => s.decision !== 'Pendiente')
                          .map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: idx < selectedRequest.historialPasos!.filter(s => s.decision !== 'Pendiente').length - 1 ? '1px solid #E5E7EB' : 'none', paddingBottom: idx < selectedRequest.historialPasos!.filter(s => s.decision !== 'Pendiente').length - 1 ? '8px' : '0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Badge appearance="filled" color={step.decision === 'Aprobado' ? 'success' : 'danger'} size="small">
                                    {step.nombrePaso}
                                  </Badge>
                                  <Text size={200} weight="semibold">{step.decision}</Text>
                                </div>
                                <Text size={100} style={{ color: '#666' }}>
                                  {step.fecha ? new Date(step.fecha).toLocaleString() : ''}
                                </Text>
                              </div>
                              <Text size={200} style={{ color: '#333' }}>
                                <strong>Aprobador:</strong> {step.aprobador}
                              </Text>
                              {step.comentario && (
                                <Text size={200} style={{ fontStyle: 'italic', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '6px 8px', borderRadius: '4px', marginTop: '2px' }}>
                                  "{step.comentario}"
                                </Text>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy Single Resolution Info if present */}
                  {selectedRequest.estado !== 'Pendiente' && !selectedRequest.historialPasos?.length && (
                    <div style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Text size={200}>
                        <strong>Aprobador:</strong> {selectedRequest.aprobador}
                      </Text>
                      <Text size={200}>
                        <strong>Fecha Acción:</strong> {selectedRequest.fechaAccion ? new Date(selectedRequest.fechaAccion).toLocaleString() : 'N/A'}
                      </Text>
                      {selectedRequest.comentarios && (
                        <Text size={200} style={{ fontStyle: 'italic', color: '#4A5568' }}>
                          <strong>Comentarios:</strong> "{selectedRequest.comentarios}"
                        </Text>
                      )}
                    </div>
                  )}

                  {/* Review inputs (only for pending & authorized users) */}
                  {selectedRequest.estado === 'Pendiente' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {userCanApproveSelected ? (
                        <>
                          <Label htmlFor="review-comments" style={{ fontWeight: 'semibold' }}>
                            Comentarios de Revisión (Obligatorio para rechazar):
                          </Label>
                          <Textarea
                            id="review-comments"
                            value={reviewComments}
                            placeholder="Ingrese comentarios sobre la decisión..."
                            rows={3}
                            onChange={(e) => setReviewComments(e.target.value)}
                          />
                        </>
                      ) : (
                        <div style={{ padding: '10px 14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', color: '#B45309', fontSize: '12px' }}>
                          <strong>Sin Autorización:</strong> No es tu turno para aprobar esta solicitud, o no estás asignado como aprobador en el paso actual del flujo jerárquico.
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewComments('');
                }}
                disabled={submitting}
              >
                Cerrar
              </Button>
              {selectedRequest && selectedRequest.estado === 'Pendiente' && userCanApproveSelected && (
                <>
                  <Button 
                    appearance="primary" 
                    icon={<CheckmarkRegular />}
                    style={{ backgroundColor: '#107C41' }}
                    onClick={() => handleResolve('Aprobado')}
                    disabled={submitting}
                  >
                    Aprobar
                  </Button>
                  <Button 
                    appearance="primary" 
                    icon={<DismissRegular />}
                    style={{ backgroundColor: '#A80000' }}
                    onClick={() => handleResolve('Rechazado')}
                    disabled={submitting}
                  >
                    Rechazar
                  </Button>
                </>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      
    </div>
  );
};
