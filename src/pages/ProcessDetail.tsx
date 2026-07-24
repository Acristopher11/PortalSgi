import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Text,
  Button,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Input,
  Label,
  Badge,
} from '@fluentui/react-components';
import { 
  ArrowLeftRegular, 
  DocumentRegular, 
  BookRegular, 
  ClipboardRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { Process, SIPOCItem, KPI, Risk, DocumentItem, ProcessActivity } from '../types';

export const ProcessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSharePointToken, canModifyProcess } = useAuth();

  // Data States
  const [process, setProcess] = useState<Process | null>(null);
  const [sipoc, setSipoc] = useState<SIPOCItem[]>([]);
  const [activities, setActivities] = useState<ProcessActivity[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [forms, setForms] = useState<DocumentItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivities, setShowActivities] = useState(false);

  // Dialog States for Activity CRUD
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ProcessActivity | null>(null);
  
  // Form fields for Activity
  const [actividadName, setActividadName] = useState('');
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const [responsableAct, setResponsableAct] = useState('');
  const [descripcionAct, setDescripcionAct] = useState('');
  const [activityFormError, setActivityFormError] = useState<string | null>(null);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  const isEditable = process ? canModifyProcess(process) : false;

  const loadProcessDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      
      // 1. Fetch Process General Info
      const processData = await sharePointService.getProcessById(id, token);
      setProcess(processData);

      // 2. Fetch SIPOC list for this process
      const sipocData = await sharePointService.getSipocByProcess(id, token);
      setSipoc(sipocData);

      // 2b. Fetch Activities list for this process
      const activitiesData = await sharePointService.getActivitiesByProcess(id, token);
      setActivities(activitiesData);

      // 3. Fetch related KPIs (filter by process name)
      const allKpis = await sharePointService.getKPIs(token);
      const filteredKpis = allKpis.filter(k => 
        k.area?.toLowerCase() === processData.nombre.toLowerCase() || 
        k.area?.toLowerCase() === processData.codigo.toLowerCase()
      );
      setKpis(filteredKpis);

      // 4. Fetch related Risks
      const allRisks = await sharePointService.getRisks(token);
      const filteredRisks = allRisks.filter(r => 
        r.proceso_asociado?.toLowerCase() === processData.nombre.toLowerCase() ||
        r.proceso_asociado?.toLowerCase() === processData.codigo.toLowerCase()
      );
      setRisks(filteredRisks);

      // 5. Fetch related Forms (documents with tipoDocumento = 'Formularios')
      const allDocs = await sharePointService.getDocuments(token);
      const filteredForms = allDocs.filter(d => {
        const matchesTipo = d.tipoDocumento?.toLowerCase() === 'formularios';
        const matchesProceso =
          d.procesoId === id ||
          (processData && d.procesoAsociado && (
            d.procesoAsociado.toLowerCase() === processData.nombre.toLowerCase() ||
            d.procesoAsociado.toLowerCase() === processData.codigo.toLowerCase()
          ));
        return matchesTipo && matchesProceso;
      });
      setForms(filteredForms);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el detalle del proceso.');
    } finally {
      setLoading(false);
    }
  }, [id, getSharePointToken]);

  useEffect(() => {
    loadProcessDetail();
  }, [loadProcessDetail]);

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

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#107C10'; // Verde
      case 'at_risk': return '#9a6e00'; // Amarillo oscuro de alto contraste
      case 'off_track': return '#DC143C'; // Rojo
      default: return '#8A8886'; // Gris
    }
  };

  const getKPIStatusText = (status: string) => {
    switch (status) {
      case 'on_track': return 'En Meta';
      case 'at_risk': return 'En Riesgo';
      case 'off_track': return 'Fuera de Meta';
      default: return 'Sin Datos';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 6) return '#DC143C'; // Alto
    if (score >= 4) return '#9a6e00'; // Moderado (alto contraste)
    return '#107C10'; // Bajo
  };

  // CRUD handlers for Activities
  const openCreateActivity = () => {
    setSelectedActivity(null);
    setActividadName('');
    setEntrada('');
    setSalida('');
    setResponsableAct('');
    setDescripcionAct('');
    setActivityFormError(null);
    setIsActivityFormOpen(true);
  };

  const openEditActivity = (act: ProcessActivity) => {
    setSelectedActivity(act);
    setActividadName(act.actividad);
    setEntrada(act.entrada);
    setSalida(act.salida);
    setResponsableAct(act.responsable);
    setDescripcionAct(act.descripcion);
    setActivityFormError(null);
    setIsActivityFormOpen(true);
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!actividadName.trim()) {
      setActivityFormError('El nombre de la actividad es requerido.');
      return;
    }
    setSubmittingActivity(true);
    setActivityFormError(null);

    try {
      const token = await getSharePointToken();
      if (selectedActivity) {
        // Update
        await sharePointService.updateActivity(selectedActivity.id, {
          actividad: actividadName.trim(),
          entrada: entrada.trim(),
          salida: salida.trim(),
          responsable: responsableAct.trim(),
          descripcion: descripcionAct.trim(),
        }, token);
      } else {
        // Create
        await sharePointService.createActivity({
          procesoId: id,
          actividad: actividadName.trim(),
          entrada: entrada.trim(),
          salida: salida.trim(),
          responsable: responsableAct.trim(),
          descripcion: descripcionAct.trim(),
        }, token);
      }
      setIsActivityFormOpen(false);
      
      // Reload activities
      const updatedActs = await sharePointService.getActivitiesByProcess(id, token);
      setActivities(updatedActs);
    } catch (err) {
      setActivityFormError(err instanceof Error ? err.message : 'Error al guardar la actividad.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!id) return;
    if (!window.confirm('¿Está seguro de que desea eliminar esta actividad?')) return;
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteActivity(activityId, token);
      
      // Reload activities
      const updatedActs = await sharePointService.getActivitiesByProcess(id, token);
      setActivities(updatedActs);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la actividad.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner label="Cargando detalles de proceso..." />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <Button icon={<ArrowLeftRegular />} onClick={() => navigate('/procesos', { viewTransition: true })}>
          Volver a procesos
        </Button>
        <div style={{ padding: '16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4' }}>
          <Text weight="bold">Error:</Text>
          <p>{error || 'No se pudo encontrar el proceso especificado.'}</p>
        </div>
      </div>
    );
  }

  // De-duplicate elements in each column to show them once if identical
  const proveedoresList = Array.from(new Set(sipoc.map(item => item.proveedores?.trim()).filter(Boolean)));
  const insumosList = Array.from(new Set(sipoc.map(item => item.insumos?.trim()).filter(Boolean)));
  
  // Connect P column to the newly created process activities list (numbered!)
  const actividadesList = activities.map((item, idx) => `${idx + 1}. ${item.actividad}`);
  
  const productosList = Array.from(new Set(sipoc.map(item => item.productos?.trim()).filter(Boolean)));
  const clientesList = Array.from(new Set(sipoc.map(item => item.cliente?.trim()).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button icon={<ArrowLeftRegular />} appearance="subtle" onClick={() => navigate('/procesos', { viewTransition: true })} title="Volver al listado" />
            <Text size={300} style={{ color: 'var(--color-text-secondary, #636F7D)', fontWeight: 'semibold' }}>{process.codigo}</Text>
          </div>
          <Text size={700} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', marginLeft: '40px' }}>
            {process.nombre}
          </Text>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '12px', marginLeft: '40px' }}>
          <Button icon={<ClipboardRegular />} onClick={() => setShowActivities(prev => !prev)} appearance={showActivities ? "primary" : undefined}>
            Descripción de Actividades
          </Button>
          <Button icon={<DocumentRegular />} onClick={() => navigate(`/documentos?procesoId=${process.id}`, { viewTransition: true })}>
            Documentos Relacionados
          </Button>
          <Button icon={<BookRegular />} onClick={() => navigate('/glosario', { viewTransition: true })}>
            Glosario SGI
          </Button>
        </div>
      </div>

      {/* General Details Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Text size={400} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', borderBottom: '2px solid var(--color-caribbean-red, #DC143C)', paddingBottom: '4px', width: 'fit-content' }}>
            Objetivo
          </Text>
          <Text size={200} style={{ color: '#334155', lineHeight: '1.5' }}>
            {process.descripcion}
          </Text>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Text size={400} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', borderBottom: '2px solid var(--color-caribbean-red, #DC143C)', paddingBottom: '4px', width: 'fit-content' }}>
            Alcance del Proceso
          </Text>
          <Text size={200} style={{ color: '#334155', lineHeight: '1.5' }}>
            {process.alcance || 'Alcance no definido para este proceso.'}
          </Text>
        </div>

        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Text size={400} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', borderBottom: '2px solid var(--color-caribbean-red, #DC143C)', paddingBottom: '4px', width: 'fit-content' }}>
            Responsabilidad e Información
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px' }}>
            <strong>Área:</strong>
            <span>{process.area}</span>
            <strong>Responsable:</strong>
            <span>{cleanResponsable(process.responsable)}</span>
          </div>
        </div>
      </div>

      {/* SIPOC DIAGRAM PANEL */}
      <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <Text size={500} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '20px' }}>
          Diagrama SIPOC del Proceso
        </Text>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', minWidth: '800px' }}>
          {/* S - Suppliers */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-midnight-blue, #001F3F)', color: 'white', fontWeight: 'bold', padding: '6px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
              S - Proveedores
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proveedoresList.map((val, idx) => (
                <div key={`s-${idx}`} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                  {val}
                </div>
              ))}
              {proveedoresList.length === 0 && <span style={{ color: '#8A8886', fontSize: '12px', textAlign: 'center' }}>Sin asignar</span>}
            </div>
          </div>

          {/* I - Inputs */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-midnight-blue, #001F3F)', color: 'white', fontWeight: 'bold', padding: '6px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
              I - Entradas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {insumosList.map((val, idx) => (
                <div key={`i-${idx}`} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                  {val}
                </div>
              ))}
              {insumosList.length === 0 && <span style={{ color: '#8A8886', fontSize: '12px', textAlign: 'center' }}>Sin asignar</span>}
            </div>
          </div>

          {/* P - Process */}
          <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FBC2C4', borderRadius: '6px', padding: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-caribbean-red, #DC143C)', color: 'white', fontWeight: 'bold', padding: '6px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
              P - Actividades
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {actividadesList.map((val, idx) => (
                <div key={`p-${idx}`} style={{ backgroundColor: 'white', border: '1px solid #FBC2C4', padding: '8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'semibold', boxShadow: '0 1px 2px rgba(0,0,0,0.01)', textAlign: 'center' }}>
                  {val}
                </div>
              ))}
              {actividadesList.length === 0 && <span style={{ color: '#8A8886', fontSize: '12px', textAlign: 'center' }}>Sin asignar</span>}
            </div>
          </div>

          {/* O - Outputs */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-midnight-blue, #001F3F)', color: 'white', fontWeight: 'bold', padding: '6px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
              O - Salidas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productosList.map((val, idx) => (
                <div key={`o-${idx}`} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                  {val}
                </div>
              ))}
              {productosList.length === 0 && <span style={{ color: '#8A8886', fontSize: '12px', textAlign: 'center' }}>Sin asignar</span>}
            </div>
          </div>

          {/* C - Customers */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
            <div style={{ backgroundColor: 'var(--color-midnight-blue, #001F3F)', color: 'white', fontWeight: 'bold', padding: '6px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
              C - Clientes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clientesList.map((val, idx) => (
                <div key={`c-${idx}`} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                  {val}
                </div>
              ))}
              {clientesList.length === 0 && <span style={{ color: '#8A8886', fontSize: '12px', textAlign: 'center' }}>Sin asignar</span>}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: ACTIVIDADES DEL PROCESO */}
      {showActivities && (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Text size={500} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
              Actividades del Proceso ({activities.length} actividades)
            </Text>
            {isEditable && (
              <Button icon={<AddRegular />} appearance="primary" onClick={openCreateActivity}>
                Agregar Actividad
              </Button>
            )}
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <Table style={{ width: '100%', minWidth: '900px' }}>
              <TableHeader>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold', width: '50px' }}>#</TableCell>
                  <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Código de Proceso</TableCell>
                  <TableCell style={{ fontWeight: 'bold', width: '180px' }}>Entrada (Insumos)</TableCell>
                  <TableCell style={{ fontWeight: 'bold', width: '220px' }}>Nombre de la Actividad</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell style={{ fontWeight: 'bold', width: '180px' }}>Salida (Productos)</TableCell>
                  <TableCell style={{ fontWeight: 'bold', width: '150px' }}>Responsable</TableCell>
                  {isEditable && <TableCell style={{ fontWeight: 'bold', width: '120px', textAlign: 'center' }}>Acciones</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((item, idx) => (
                  <TableRow key={item.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell style={{ fontWeight: 'semibold', color: '#64748B' }}>{process.codigo}</TableCell>
                    <TableCell>{item.entrada || 'N/A'}</TableCell>
                    <TableCell style={{ fontWeight: 'bold', color: 'var(--color-midnight-blue, #001F3F)' }}>{item.actividad}</TableCell>
                    <TableCell>{item.descripcion || 'Sin descripción'}</TableCell>
                    <TableCell>{item.salida || 'N/A'}</TableCell>
                    <TableCell>{item.responsable || 'Sin asignar'}</TableCell>
                    {isEditable && (
                      <TableCell style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Button icon={<EditRegular />} size="small" appearance="subtle" onClick={() => openEditActivity(item)} title="Editar actividad" />
                          <Button icon={<DeleteRegular />} size="small" appearance="subtle" onClick={() => handleDeleteActivity(item.id)} title="Eliminar actividad" style={{ color: '#DC143C' }} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isEditable ? 8 : 7} style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                      No se han registrado actividades para este proceso.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* KPI, RISK, & FORM SECTIONS (Hidden when activities table is active) */}
      {!showActivities && (
        <>
          {/* KPI & RISK SECTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Related KPIs */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <Text size={500} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '16px' }}>
                Indicadores de Desempeño (KPIs)
              </Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {kpis.map(kpi => (
                  <div key={kpi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#F9FAFB' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Text weight="bold" style={{ fontSize: '13px' }}>{kpi.nombre}</Text>
                      <Text size={100} style={{ color: '#64748B' }}>Meta: {kpi.meta}{kpi.unidad} | Actual: {kpi.valor_actual !== null ? `${kpi.valor_actual}${kpi.unidad}` : 'Sin registrar'}</Text>
                    </div>
                    <Badge
                      appearance="tint"
                      color={
                        kpi.estado === 'on_track'
                          ? 'success'
                          : kpi.estado === 'at_risk'
                          ? 'warning'
                          : kpi.estado === 'off_track'
                          ? 'danger'
                          : 'subtle'
                      }
                    >
                      {getKPIStatusText(kpi.estado)}
                    </Badge>
                  </div>
                ))}
                {kpis.length === 0 && (
                  <div style={{ color: '#8A8886', padding: '16px', textAlign: 'center', fontSize: '13px' }}>
                    No hay KPIs vinculados directamente a este proceso.
                  </div>
                )}
              </div>
            </div>

            {/* Related Risks */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <Text size={500} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '16px' }}>
                Riesgos Identificados
              </Text>

              <Table aria-label="Riesgos del Proceso" style={{ width: '100%' }}>
                <TableHeader>
                  <TableRow>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '12px' }}>Riesgo</TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '12px', width: '80px', textAlign: 'center' }}>VNR</TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '12px', width: '100px' }}>Estado</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map(risk => {
                    const vnr = (risk.probabilidad || 1) * (risk.impacto || 1);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell style={{ fontSize: '12px', fontWeight: 'medium' }}>
                          <Link to={`/riesgos?proceso=${encodeURIComponent(process.codigo)}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{risk.nombre}</Link>
                        </TableCell>
                        <TableCell style={{ fontSize: '12px', fontWeight: 'bold', color: getRiskScoreColor(vnr), textAlign: 'center' }}>
                          {vnr}
                        </TableCell>
                        <TableCell style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {risk.estado.replace('_', ' ')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {risks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#8A8886', fontSize: '12px' }}>
                        No hay riesgos asociados a este proceso.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* FORMULARIOS ASOCIADOS */}
          <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <Text size={500} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '16px' }}>
              Formularios Asociados
            </Text>
            {forms.length === 0 ? (
              <div style={{ color: '#8A8886', padding: '16px', textAlign: 'center', fontSize: '13px', border: '1px dashed #E5E7EB', borderRadius: '6px' }}>
                No hay formularios asociados a este proceso.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {forms.map(form => (
                  <div
                    key={form.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                  >
                    <DocumentRegular style={{ color: 'var(--color-midnight-blue, #001F3F)', fontSize: '20px', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                      {form.link && form.link !== '#' ? (
                        <a
                          href={form.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-midnight-blue, #001F3F)', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {form.nombre}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-midnight-blue, #001F3F)', fontWeight: 'bold', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.nombre}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {form.codigo} &middot; V{form.version}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialog for Activity Add/Edit */}
      <Dialog open={isActivityFormOpen} onOpenChange={(_, data) => setIsActivityFormOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <form onSubmit={handleActivitySubmit}>
            <DialogBody>
              <DialogTitle>{selectedActivity ? 'Editar Actividad' : 'Agregar Actividad'}</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="act-name" required style={{ fontWeight: 'semibold' }}>Nombre de la Actividad:</Label>
                  <Input
                    id="act-name"
                    value={actividadName}
                    placeholder="ej: Recepción de solicitud"
                    onChange={(e) => setActividadName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="act-entrada" style={{ fontWeight: 'semibold' }}>Entrada (Insumos):</Label>
                  <Input
                    id="act-entrada"
                    value={entrada}
                    placeholder="Insumos o materiales recibidos"
                    onChange={(e) => setEntrada(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="act-salida" style={{ fontWeight: 'semibold' }}>Salida (Productos):</Label>
                  <Input
                    id="act-salida"
                    value={salida}
                    placeholder="Productos o resultados entregados"
                    onChange={(e) => setSalida(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="act-resp" style={{ fontWeight: 'semibold' }}>Responsable:</Label>
                  <Input
                    id="act-resp"
                    value={responsableAct}
                    placeholder="Rol o encargado de la actividad"
                    onChange={(e) => setResponsableAct(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="act-desc" style={{ fontWeight: 'semibold' }}>Descripción:</Label>
                  <Input
                    id="act-desc"
                    value={descripcionAct}
                    placeholder="Descripción detallada de la actividad"
                    onChange={(e) => setDescripcionAct(e.target.value)}
                  />
                </div>

                {activityFormError && (
                  <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                    <WarningRegular />
                    <span>{activityFormError}</span>
                  </div>
                )}
              </DialogContent>
              <DialogActions style={{ marginTop: '24px' }}>
                <Button type="button" appearance="secondary" onClick={() => setIsActivityFormOpen(false)} disabled={submittingActivity}>
                  Cancelar
                </Button>
                <Button type="submit" appearance="primary" disabled={submittingActivity}>
                  {submittingActivity ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
