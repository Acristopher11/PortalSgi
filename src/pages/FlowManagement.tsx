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
  Tab,
  TabList,
  Input,
  Select,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Label,
  Switch,
} from '@fluentui/react-components';
import {
  PeopleRegular,
  OrganizationRegular,
  PersonRegular,
  SettingsRegular,
  CheckmarkRegular,
  ArrowClockwiseRegular,
  EditRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../hooks/useAuth';

import { getAllUsuarios, upsertUsuario } from '../repositories/usuarioRepository';
import { getAllApprovals } from '../repositories/approvalRepository';
import { sharePointService } from '../services/sharePointService';
import { PeoplePicker } from '../components/common/PeoplePicker';
import type { Area, SgiUsuario, ApprovalRequest, Process } from '../types';

export const FlowManagement: React.FC = () => {
  const { getSharePointToken } = useAuth();

  // Active Tab: 'areas' | 'users' | 'quality' | 'monitor'
  const [activeTab, setActiveTab] = useState<'areas' | 'users' | 'quality' | 'monitor'>('areas');

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data Lists
  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<SgiUsuario[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  // Dialog & Form States (Areas)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [areaNivel, setAreaNivel] = useState('');
  const [areaDependenciaId, setAreaDependenciaId] = useState('');
  const [areaResponsable, setAreaResponsable] = useState('');
  const [areaResponsableEmail, setAreaResponsableEmail] = useState('');
  const [submittingArea, setSubmittingArea] = useState(false);

  // Dialog & Form States (Users)
  const [selectedUser, setSelectedUser] = useState<SgiUsuario | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userNombre, setUserNombre] = useState('');
  const [userEmailInput, setUserEmailInput] = useState('');
  const [userRol, setUserRol] = useState<'Admin' | 'DP' | 'Encargado' | 'Usuario'>('Usuario');
  const [userAreaId, setUserAreaId] = useState('');
  const [userActivo, setUserActivo] = useState(true);
  const [submittingUser, setSubmittingUser] = useState(false);

  // Dialog & Form States (Quality)
  const [selectedQualityCode, setSelectedQualityCode] = useState<string | null>(null);
  const [qualityResponsable, setQualityResponsable] = useState('');
  const [qualityResponsableEmail, setQualityResponsableEmail] = useState('');
  const [submittingQuality, setSubmittingQuality] = useState(false);

  // Capture current timestamp for calculations (ensures pure rendering)
  const [renderTimestamp, setRenderTimestamp] = useState<number>(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderTimestamp(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, [approvals]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();

      // Load each data source independently so one failure doesn't block the rest
      const [areasData, usersData, procData, appData] = await Promise.all([
        sharePointService.getAreas(token).catch(e => { console.warn('[FlowManagement] getAreas failed:', e); return []; }),
        getAllUsuarios(token).catch(e => { console.warn('[FlowManagement] getAllUsuarios failed:', e); return []; }),
        sharePointService.getProcesses(token).catch(e => { console.warn('[FlowManagement] getProcesses failed:', e); return []; }),
        getAllApprovals(token).catch(e => { console.warn('[FlowManagement] getAllApprovals failed:', e); return []; }),
      ]);

      console.log(`[FlowManagement] Loaded: ${areasData.length} areas, ${usersData.length} users, ${procData.length} processes, ${appData.length} approvals`);

      setAreas(areasData);
      setUsers(usersData);
      setProcesses(procData);
      setApprovals(appData);
    } catch (err) {
      console.error('[FlowManagement] Critical error loading dashboard data:', err);
      setError('Ocurrió un error al cargar la información del panel de administración.');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);


  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);



  const openEditQualityDialog = (code: string) => {
    const proc = processes.find(p => p.codigo.toUpperCase() === code.toUpperCase());
    if (proc) {
      setSelectedQualityCode(code);
      setQualityResponsable(proc.responsable || '');
      setQualityResponsableEmail(proc.responsableEmails?.[0] || '');
    } else {
      alert(`No se encontró el proceso SGI: ${code}. Por favor, créelo en la Maestra de Procesos primero.`);
    }
  };

  const handleSubmitQuality = async () => {
    if (!selectedQualityCode) return;
    const proc = processes.find(p => p.codigo.toUpperCase() === selectedQualityCode.toUpperCase());
    if (!proc) return;

    setSubmittingQuality(true);
    try {
      const token = await getSharePointToken();
      const updatedValues = {
        ...proc,
        responsable: qualityResponsableEmail,
      };

      await sharePointService.updateProcessDirect(proc.id, updatedValues, token);
      alert(`Responsable de ${selectedQualityCode} actualizado con éxito.`);
      setSelectedQualityCode(null);
      await loadData();
    } catch (err) {
      console.error('[FlowManagement] Error updating quality manager:', err);
      alert(err instanceof Error ? err.message : 'Error al actualizar el responsable.');
    } finally {
      setSubmittingQuality(false);
    }
  };

  // Submit Area Form
  const handleSubmitArea = async () => {
    if (!selectedArea) return;
    setSubmittingArea(true);
    try {
      const token = await getSharePointToken();
      await sharePointService.updateArea(
        selectedArea.id,
        {
          nivel: areaNivel,
          dependenciaId: areaDependenciaId || '',
          responsable: areaResponsable,
          responsableEmail: areaResponsableEmail,
        },
        token
      );
      setSelectedArea(null);
      await loadData();
    } catch (err) {
      console.error('[FlowManagement] Error updating area:', err);
      setError(`Error al actualizar el área: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setSubmittingArea(false);
    }
  };

  // Submit User Form
  const handleSubmitUser = async () => {
    if (!userNombre || !userEmailInput) {
      alert('Por favor complete el nombre y el correo.');
      return;
    }
    setSubmittingUser(true);
    try {
      const token = await getSharePointToken();
      await upsertUsuario(
        {
          id: selectedUser?.id || undefined,
          nombre: userNombre,
          email: userEmailInput,
          rol: userRol,
          areaId: userRol === 'Encargado' ? userAreaId : undefined,
          activo: userActivo,
        },
        token
      );
      setShowUserDialog(false);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      console.error('[FlowManagement] Error saving user:', err);
      setError('Error al guardar el perfil de usuario.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const openEditAreaDialog = (area: Area) => {
    setSelectedArea(area);
    setAreaNivel(area.nivel || 'Sección');
    setAreaDependenciaId(area.dependenciaId || '');
    setAreaResponsable(area.responsable || '');
    setAreaResponsableEmail(area.responsableEmail || '');
  };


  // Active Flows calculation
  const activeFlows = useMemo(() => {
    return approvals.filter(app => app.estado === 'Pendiente');
  }, [approvals]);

  // Filter States
  const [filterTexto, setFilterTexto] = useState('');
  const [filterAreaNivel, setFilterAreaNivel] = useState('todos');
  const [filterUserRol, setFilterUserRol] = useState('todos');
  const [filterUserEstado, setFilterUserEstado] = useState('todos');
  const [filterMonitorEstado, setFilterMonitorEstado] = useState('todos');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterTexto('');
      setFilterAreaNivel('todos');
      setFilterUserRol('todos');
      setFilterUserEstado('todos');
      setFilterMonitorEstado('todos');
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const filteredAreas = useMemo(() => {
    return areas.filter(a => {
      if (filterAreaNivel !== 'todos' && a.nivel !== filterAreaNivel) return false;
      if (filterTexto.trim() !== '') {
        const txt = filterTexto.toLowerCase();
        const matchesNombre = a.nombre.toLowerCase().includes(txt);
        const matchesCodigo = a.codigo.toLowerCase().includes(txt);
        const matchesResp = a.responsable?.toLowerCase().includes(txt);
        if (!matchesNombre && !matchesCodigo && !matchesResp) return false;
      }
      return true;
    });
  }, [areas, filterAreaNivel, filterTexto]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (filterUserRol !== 'todos') {
        const userRoles = u.roles || [u.rol];
        if (!userRoles.includes(filterUserRol as string)) return false;
      }
      if (filterUserEstado === 'activo' && !u.activo) return false;
      if (filterUserEstado === 'inactivo' && u.activo) return false;
      if (filterTexto.trim() !== '') {
        const txt = filterTexto.toLowerCase();
        const matchesNombre = u.nombre.toLowerCase().includes(txt);
        const matchesEmail = u.email.toLowerCase().includes(txt);
        const matchesArea = u.areaNombre ? u.areaNombre.toLowerCase().includes(txt) : false;
        if (!matchesNombre && !matchesEmail && !matchesArea) return false;
      }
      return true;
    });
  }, [users, filterUserRol, filterUserEstado, filterTexto]);

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      if (filterTexto.trim() !== '') {
        const txt = filterTexto.toLowerCase();
        const matchesNombre = p.nombre.toLowerCase().includes(txt);
        const matchesCodigo = p.codigo.toLowerCase().includes(txt);
        const matchesResp = p.responsable?.toLowerCase().includes(txt);
        if (!matchesNombre && !matchesCodigo && !matchesResp) return false;
      }
      return true;
    });
  }, [processes, filterTexto]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter(app => {
      const expectedStatus = filterMonitorEstado === 'todos' ? 'Pendiente' : filterMonitorEstado;
      if (app.estado !== expectedStatus) return false;
      
      if (filterTexto.trim() !== '') {
        const txt = filterTexto.toLowerCase();
        const matchesTitulo = app.titulo.toLowerCase().includes(txt);
        const matchesSolicitante = app.solicitante.toLowerCase().includes(txt);
        const matchesElement = app.tipoElemento.toLowerCase().includes(txt);
        if (!matchesTitulo && !matchesSolicitante && !matchesElement) return false;
      }
      return true;
    });
  }, [approvals, filterMonitorEstado, filterTexto]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PeopleRegular style={{ fontSize: '26px', color: 'var(--color-midnight-blue, #001F3F)' }} />
            <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
              Gestión de Flujos y Jerarquías
            </Text>
          </div>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Administración del motor de flujos, usuarios SGI, organigramas y asignación de aprobadores de Calidad.
          </Text>
        </div>

        <Button icon={<ArrowClockwiseRegular />} onClick={loadData} disabled={loading}>
          Actualizar Datos
        </Button>
      </div>

      {/* Tabs */}
      <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as 'areas' | 'users' | 'quality' | 'monitor')}>
        <Tab value="areas" icon={<OrganizationRegular />}>Áreas y Jerarquías ({areas.length})</Tab>
        <Tab value="users" icon={<PersonRegular />}>Usuarios del Sistema ({users.length})</Tab>
        <Tab value="quality" icon={<SettingsRegular />}>Configuración de Calidad</Tab>
        <Tab value="monitor" icon={<AlertRegular />}>Monitor de Flujos Activos ({activeFlows.length})</Tab>
      </TabList>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', fontSize: '13px' }}>
          <strong>Error: </strong> {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Cargando configuración del portal..." />
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          
          {/* Universal Dynamic Filter Card */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px', flex: '2' }}>
              <Label htmlFor="flow-search" style={{ fontWeight: 'semibold', fontSize: '12px' }}>
                {activeTab === 'areas' && 'Buscar por área o responsable:'}
                {activeTab === 'users' && 'Buscar por nombre, correo o departamento:'}
                {activeTab === 'quality' && 'Buscar por proceso o responsable:'}
                {activeTab === 'monitor' && 'Buscar por título, solicitante o tipo:'}
              </Label>
              <Input
                id="flow-search"
                placeholder="Escriba para buscar..."
                value={filterTexto}
                onChange={(e) => setFilterTexto(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {activeTab === 'areas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
                <Label htmlFor="area-nivel-filter" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Nivel Jerárquico:</Label>
                <Select id="area-nivel-filter" value={filterAreaNivel} onChange={(e) => setFilterAreaNivel(e.target.value)} style={{ width: '100%' }}>
                  <option value="todos">Todos los niveles</option>
                  <option value="Presidencia">Presidencia</option>
                  <option value="Dirección">Dirección</option>
                  <option value="Departamento">Departamento</option>
                  <option value="División">División</option>
                  <option value="Sección">Sección</option>
                </Select>
              </div>
            )}

            {activeTab === 'users' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
                  <Label htmlFor="user-rol-filter" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Rol:</Label>
                  <Select id="user-rol-filter" value={filterUserRol} onChange={(e) => setFilterUserRol(e.target.value)} style={{ width: '100%' }}>
                    <option value="todos">Todos los roles</option>
                    <option value="Admin">Administrador</option>
                    <option value="Encargado">Encargado de Área</option>
                    <option value="DP">Dueño de Proceso</option>
                    <option value="Usuario">Usuario General</option>
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
                  <Label htmlFor="user-estado-filter" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Estado:</Label>
                  <Select id="user-estado-filter" value={filterUserEstado} onChange={(e) => setFilterUserEstado(e.target.value)} style={{ width: '100%' }}>
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                  </Select>
                </div>
              </>
            )}

            {activeTab === 'monitor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: '1' }}>
                <Label htmlFor="monitor-estado-filter" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Estado de Solicitud:</Label>
                <Select id="monitor-estado-filter" value={filterMonitorEstado} onChange={(e) => setFilterMonitorEstado(e.target.value)} style={{ width: '100%' }}>
                  <option value="todos">Pendiente (Activas)</option>
                  <option value="Aprobado">Aprobado (Historial)</option>
                  <option value="Rechazado">Rechazado (Historial)</option>
                </Select>
              </div>
            )}

            {(filterTexto || filterAreaNivel !== 'todos' || filterUserRol !== 'todos' || filterUserEstado !== 'todos' || filterMonitorEstado !== 'todos') && (
              <Button appearance="subtle" onClick={() => {
                setFilterTexto('');
                setFilterAreaNivel('todos');
                setFilterUserRol('todos');
                setFilterUserEstado('todos');
                setFilterMonitorEstado('todos');
              }} style={{ color: '#DC143C' }}>
                Limpiar
              </Button>
            )}
          </div>
          
          {/* TAB 1: Areas & Hierarchy */}
          {activeTab === 'areas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size={400} weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>Estructura de Áreas (Jerarquía Lookup)</Text>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell style={{ fontWeight: 'bold' }}>Área</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Código</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Nivel Jerárquico</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Dependencia (Padre)</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Responsable Principal</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Responsable Email</TableCell>
                      <TableCell style={{ fontWeight: 'bold', textAlign: 'right' }}>Acción</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAreas.map(area => (
                      <TableRow key={area.id}>
                        <TableCell><Text weight="semibold">{area.nombre}</Text></TableCell>
                        <TableCell>{area.codigo}</TableCell>
                        <TableCell>
                          <Badge 
                            appearance="outline" 
                            color={
                              area.nivel === 'Presidencia' ? 'danger' :
                              area.nivel === 'Dirección' ? 'brand' :
                              area.nivel === 'Departamento' ? 'informative' :
                              area.nivel === 'División' ? 'success' :
                              area.nivel === 'Sección' ? 'warning' :
                              'subtle'
                            }
                          >
                            {area.nivel || 'Sin asignar'}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ color: area.dependencia ? '#1a202c' : '#718096' }}>
                          {area.dependencia || 'Raíz / Ninguno'}
                        </TableCell>
                        <TableCell>{area.responsable}</TableCell>
                        <TableCell style={{ fontSize: '12px', color: '#4a5568' }}>{area.responsableEmail || 'N/A'}</TableCell>
                        <TableCell style={{ textAlign: 'right' }}>
                          <Button size="small" icon={<EditRegular />} onClick={() => openEditAreaDialog(area)}>
                            Configurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB 2: Users Management (CRUD) */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size={400} weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>Usuarios Registrados en el Sistema</Text>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                color: '#1E40AF',
              }}>
                <Text weight="semibold" style={{ fontSize: '14px' }}>
                  💡 Roles y Permisos Resueltos Dinámicamente
                </Text>
                <Text>
                  Los usuarios y sus respectivos niveles de acceso se calculan automáticamente a partir de las asignaciones de negocio en el ERP:
                </Text>
                <ul style={{ margin: '4px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <li><strong>Dueño de Proceso (DP)</strong>: Asignado en la <em>Maestra de Procesos</em>.</li>
                  <li><strong>Encargado de Área (Encargado)</strong>: Asignado como responsable principal en la <em>Estructura de Áreas</em>.</li>
                  <li><strong>Administrador SGI (Admin)</strong>: Administradores de Calidad (responsables de los procesos P-SGI-01, P-SGI-02 y P-SGI-07) y administradores locales del portal.</li>
                </ul>
                <Text style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '4px' }}>
                  Para modificar o agregar un usuario o rol, actualice el responsable directo en la sección de Procesos o en la pestaña de Áreas y Jerarquías.
                </Text>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Correo Electrónico</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Rol Asignado</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Área Asociada (Encargados)</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Estado</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell><Text weight="semibold">{u.nombre}</Text></TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell style={{ minWidth: '180px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(u.roles || [u.rol]).map(role => (
                              <Badge
                                key={role}
                                appearance="filled"
                                color={role === 'Admin' ? 'danger' : role === 'DP' ? 'brand' : role === 'Encargado' ? 'warning' : 'subtle'}
                              >
                                {role === 'Admin' ? 'Administrador' : role === 'DP' ? 'Dueño de Proceso' : role === 'Encargado' ? 'Encargado' : 'Usuario'}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{u.areaNombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge appearance="outline" color={u.activo ? 'success' : 'danger'}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* TAB 3: Quality Config Informative */}
          {activeTab === 'quality' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <Text size={400} weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)', display: 'block', marginBottom: '4px' }}>
                  Matriz de Aprobación Inicial de Calidad (Paso 1 del Flujo)
                </Text>
                <Text size={200} style={{ color: '#636F7D' }}>
                  Cada tipo de elemento del SGI es revisado inicialmente por el Dueño de Proceso de Calidad correspondiente (P-SGI-01, P-SGI-02 o P-SGI-07).
                </Text>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell style={{ fontWeight: 'bold' }}>Proceso SGI Responsable</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Aprobador(es) de Calidad (Paso 1)</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Elementos Cubiertos</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Descripción del Alcance de Calidad</TableCell>
                      <TableCell style={{ fontWeight: 'bold', textAlign: 'right' }}>Acción</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Text weight="semibold">P-CAL-01 (Gestión de Calidad)</Text></TableCell>
                      <TableCell>
                        {filteredProcesses.find(p => p.codigo === 'P-CAL-01')?.responsableEmails?.join(', ') || 'ana@acme.com'}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <Badge size="small">Procesos</Badge>
                          <Badge size="small">Glosario</Badge>
                          <Badge size="small">Documentos</Badge>
                          <Badge size="small">SIPOC</Badge>
                        </div>
                      </TableCell>
                      <TableCell>Revisión estructural, cumplimiento de nomenclatura ISO y plantillas oficiales.</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button size="small" icon={<EditRegular />} onClick={() => openEditQualityDialog('P-CAL-01')}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Text weight="semibold">P-OPS-01 (Gestión de Operaciones)</Text></TableCell>
                      <TableCell>
                        {filteredProcesses.find(p => p.codigo === 'P-OPS-01')?.responsableEmails?.join(', ') || 'luis@acme.com'}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <Badge size="small">KPIs / Indicadores</Badge>
                          <Badge size="small">Mediciones</Badge>
                        </div>
                      </TableCell>
                      <TableCell>Validación de metas, consistencia de fórmulas y coherencia de reportes de cumplimiento.</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button size="small" icon={<EditRegular />} onClick={() => openEditQualityDialog('P-OPS-01')}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Text weight="semibold">P-RIE-01 (Gestión de Riesgos)</Text></TableCell>
                      <TableCell>
                        {filteredProcesses.find(p => p.codigo === 'P-RIE-01')?.responsableEmails?.join(', ') || 'luis@acme.com'}
                      </TableCell>
                      <TableCell>
                        <Badge size="small">Riesgos</Badge>
                      </TableCell>
                      <TableCell>Monitoreo de controles operacionales, evaluación de probabilidad/impacto y planes de mitigación.</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Button size="small" icon={<EditRegular />} onClick={() => openEditQualityDialog('P-RIE-01')}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '13px', color: '#1E40AF', marginTop: '12px' }}>
                <strong>Nota:</strong> Los correos electrónicos de los responsables se leen dinámicamente de la lista <em>SGI_MaestraProceso</em> de SharePoint. Para modificar estos aprobadores, edite los responsables asignados a los procesos SGI-01, SGI-02 y SGI-07 correspondientes.
              </div>
            </div>
          )}

          {/* TAB 4: Active Flows Monitor */}
          {activeTab === 'monitor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size={400} weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>Seguimiento en Tiempo Real de Solicitudes Activas</Text>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell style={{ fontWeight: 'bold' }}>Título de Solicitud</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Tipo</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Solicitante</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Paso en Curso</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Aprobador del Paso</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Fecha de Inicio</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>Días Pendiente</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApprovals.map(flow => {
                      const dias = Math.floor((renderTimestamp - new Date(flow.fechaSolicitud).getTime()) / (1000 * 60 * 60 * 24));
                      const stepName = flow.historialPasos?.find(s => s.paso === flow.pasoActual)?.nombrePaso || 'Calidad';
                      
                      return (
                        <TableRow key={flow.id}>
                          <TableCell>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <Text weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>{flow.titulo}</Text>
                              {flow.flujoVersion && flow.flujoVersion > 1 && (
                                <Text size={100} style={{ color: '#0078D4' }}>Reenvío #{flow.flujoVersion}</Text>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge appearance="outline">{flow.tipoElemento}</Badge>
                          </TableCell>
                          <TableCell>{flow.solicitante}</TableCell>
                          <TableCell>
                            <Badge color="brand">
                              {stepName} ({flow.pasoActual}/{flow.totalPasos})
                            </Badge>
                          </TableCell>
                          <TableCell style={{ fontSize: '13px' }}>{flow.aprobadorPasoActual || 'Sin asignar'}</TableCell>
                          <TableCell style={{ fontSize: '13px' }}>{new Date(flow.fechaSolicitud).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge color={dias > 5 ? 'danger' : dias > 2 ? 'warning' : 'success'}>
                              {dias} {dias === 1 ? 'día' : 'días'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeFlows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                          No hay flujos de aprobación activos en este momento.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </div>
          </div>
        )}

        </div>
      )}

      {/* AREA CONFIGURATION DIALOG */}
      <Dialog open={selectedArea !== null} onOpenChange={(_, data) => { if (!data.open) setSelectedArea(null); }}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>Configurar Estructura de Área</DialogTitle>
            <DialogContent>
              {selectedArea && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  <div>
                    <Text weight="semibold">Área:</Text>{' '}
                    <Text>{selectedArea.nombre} ({selectedArea.codigo})</Text>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Label htmlFor="area-nivel">Nivel Jerárquico:</Label>
                    <Select id="area-nivel" value={areaNivel} onChange={(e) => setAreaNivel(e.target.value)}>
                      <option value="Sección">Sección</option>
                      <option value="División">División</option>
                      <option value="Departamento">Departamento</option>
                      <option value="Dirección">Dirección</option>
                      <option value="Área">Área / Raíz</option>
                    </Select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Label htmlFor="area-dependencia">Depende de (Área Padre):</Label>
                    <Select
                      id="area-dependencia"
                      value={areaDependenciaId}
                      onChange={(e) => setAreaDependenciaId(e.target.value)}
                    >
                      <option value="">Ninguno (Área de nivel superior)</option>
                      {areas
                        .filter(a => a.id !== selectedArea.id) // Evitar autoreferencia
                        .map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                    </Select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <PeoplePicker
                      id="area-responsable"
                      label="Responsable Principal:"
                      value={areaResponsableEmail}
                      onChange={(val) => {
                        setAreaResponsableEmail(val);
                        if (!val) setAreaResponsable('');
                      }}
                      onSelectUser={(u) => {
                        setAreaResponsable(u.name);
                        setAreaResponsableEmail(u.email);
                      }}
                      placeholder="Buscar por nombre o correo corporativo..."
                    />
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSelectedArea(null)} disabled={submittingArea}>
                Cancelar
              </Button>
              <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleSubmitArea} disabled={submittingArea}>
                Guardar Estructura
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* USER DIALOG (CREATE/EDIT) */}
      <Dialog open={showUserDialog} onOpenChange={(_, data) => { if (!data.open) { setShowUserDialog(false); setSelectedUser(null); } }}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>
              {selectedUser ? 'Editar Perfil de Usuario SGI' : 'Registrar Nuevo Usuario SGI'}
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                
                {/* People Picker (Búsqueda en Site Users) */}
                <PeoplePicker
                  id="user-search"
                  label="Buscar en SharePoint / Directorio:"
                  value={userEmailInput}
                  onChange={(val) => setUserEmailInput(val)}
                  onSelectUser={(u) => {
                    setUserNombre(u.name);
                    setUserEmailInput(u.email);
                  }}
                  placeholder="Escriba nombre o correo..."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="user-nombre">Nombre Completo:</Label>
                  <Input
                    id="user-nombre"
                    value={userNombre}
                    placeholder="Nombre del usuario..."
                    onChange={(e) => setUserNombre(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="user-email">Correo Electrónico:</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={userEmailInput}
                    placeholder="correo@acme.com..."
                    onChange={(e) => setUserEmailInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="user-rol">Rol en el Portal SGI:</Label>
                  <Select id="user-rol" value={userRol} onChange={(e) => setUserRol(e.target.value as 'Admin' | 'DP' | 'Encargado' | 'Usuario')}>
                    <option value="Usuario">Usuario (Visualización general)</option>
                    <option value="DP">Dueño de Proceso (Crea elementos SGI)</option>
                    <option value="Encargado">Encargado de Área (Aprobador del flujo)</option>
                    <option value="Admin">Administrador SGI (Acceso Total)</option>
                  </Select>
                </div>

                {/* Área para encargado */}
                {userRol === 'Encargado' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Label htmlFor="user-area">Área Asignada para Aprobaciones:</Label>
                    <Select
                      id="user-area"
                      value={userAreaId}
                      onChange={(e) => setUserAreaId(e.target.value)}
                    >
                      <option value="">-- Seleccionar Área --</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Switch
                    id="user-activo"
                    checked={userActivo}
                    onChange={(_, data) => setUserActivo(data.checked)}
                  />
                  <Label htmlFor="user-activo">Usuario Activo</Label>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setShowUserDialog(false); setSelectedUser(null); }} disabled={submittingUser}>
                Cancelar
              </Button>
              <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleSubmitUser} disabled={submittingUser}>
                {selectedUser ? 'Actualizar Perfil' : 'Registrar Perfil'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* QUALITY CONFIG DIALOG (EDIT) */}
      <Dialog open={!!selectedQualityCode} onOpenChange={(_, data) => { if (!data.open) setSelectedQualityCode(null); }}>
        <DialogSurface style={{ maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>
              Modificar Responsable de Calidad ({selectedQualityCode})
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <Text size={200} style={{ color: '#636F7D' }}>
                  Seleccione el nuevo encargado que actuará como aprobador inicial de Calidad (Paso 1 del Flujo SGI) para esta sección.
                </Text>
                
                <PeoplePicker
                  id="quality-search"
                  label="Buscar Aprobador en Directorio:"
                  value={qualityResponsableEmail}
                  onChange={(val) => {
                    setQualityResponsableEmail(val);
                    if (!val) setQualityResponsable('');
                  }}
                  onSelectUser={(u) => {
                    setQualityResponsable(u.name);
                    setQualityResponsableEmail(u.email);
                  }}
                  placeholder="Escriba nombre o correo..."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="quality-nombre">Nombre Confirmado:</Label>
                  <Input
                    id="quality-nombre"
                    value={qualityResponsable}
                    readOnly
                    placeholder="Se auto-rellena al seleccionar..."
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSelectedQualityCode(null)} disabled={submittingQuality}>
                Cancelar
              </Button>
              <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleSubmitQuality} disabled={submittingQuality}>
                Guardar Responsable
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      
    </div>
  );
};
