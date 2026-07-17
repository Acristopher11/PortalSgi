import React, { useEffect, useState } from 'react';
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
  TabList,
  Tab,
  Spinner,
} from '@fluentui/react-components';
import {
  AddRegular,
  DeleteRegular,
  WarningRegular,
} from '@fluentui/react-icons';
import { useKPIStore, useProcessStore, useRiskStore } from '../store';

export const DeveloperDiagnostics: React.FC = () => {
  // Stores
  const { kpis } = useKPIStore();
  const { processes, loading: loadingProcs } = useProcessStore();
  const { risks, loading: loadingRisks } = useRiskStore();

  const [activeTab, setActiveTab] = useState<'measurements' | 'processes' | 'risks' | 'permissions'>('measurements');

  // Permissions state
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sgi_admin_emails');
    if (stored) {
      setAdminEmails(JSON.parse(stored));
    } else {
      const defaults = ['alejandro.cristopher@gmail.com', 'admin@acme.com'];
      setAdminEmails(defaults);
      localStorage.setItem('sgi_admin_emails', JSON.stringify(defaults));
    }
  }, []);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionError(null);
    const email = newAdminEmail.trim().toLowerCase();
    
    if (!email) return;
    if (!email.includes('@')) {
      setPermissionError('Debe ingresar un correo electrónico válido.');
      return;
    }
    if (adminEmails.includes(email)) {
      setPermissionError('El correo ya está registrado como administrador.');
      return;
    }

    const updated = [...adminEmails, email];
    setAdminEmails(updated);
    localStorage.setItem('sgi_admin_emails', JSON.stringify(updated));
    setNewAdminEmail('');
  };

  const handleRemoveAdmin = (email: string) => {
    if (email === 'alejandro.cristopher@gmail.com') {
      alert('No puedes eliminar al desarrollador principal de la lista de administradores.');
      return;
    }
    const updated = adminEmails.filter(e => e !== email);
    setAdminEmails(updated);
    localStorage.setItem('sgi_admin_emails', JSON.stringify(updated));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
          Panel de Diagnóstico y Control (Desarrollador)
        </Text>
      </div>

      <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as any)}>
        <Tab value="measurements">Diagnóstico de Mediciones</Tab>
        <Tab value="processes">Diagnóstico de Procesos</Tab>
        <Tab value="risks">Diagnóstico de Riesgos</Tab>
        <Tab value="permissions">Gestión de Permisos</Tab>
      </TabList>

      {/* TABS CONTENT */}
      {activeTab === 'measurements' && (
        <div style={{ padding: '16px', backgroundColor: '#F0F4F8', border: '1px solid #D0D9E0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text weight="bold" style={{ color: '#003366' }}>Resumen de KPIs y Mediciones:</Text>
          <Text size={200}>Cantidad de KPIs cargados: <strong>{kpis.length}</strong></Text>
          <Text size={200}>
            Mediciones crudas en window (total): <strong>{String((window as any).debugMedicionesCount ?? 'Cargando...')}</strong>
          </Text>
          <Text size={200}>
            KPIs con mediciones históricas: <strong>{kpis.filter(k => k.mediciones && k.mediciones.length > 0).length}</strong>
          </Text>

          {(window as any).debugSampleMedicion && (
            <div style={{ marginTop: '8px' }}>
              <Text size={200} weight="semibold" style={{ color: '#003366' }}>Muestra de medición cruda en el proxy:</Text>
              <pre style={{ fontSize: '11px', margin: '4px 0 0 0', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #E1E4E8' }}>
                {JSON.stringify((window as any).debugSampleMedicion, null, 2)}
              </pre>
            </div>
          )}

          {kpis.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Text size={200} weight="semibold">Mapeo del primer KPI en el store:</Text>
              <pre style={{ fontSize: '11px', margin: '4px 0 0 0', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #E1E4E8' }}>
                {JSON.stringify({
                  id: kpis[0].id,
                  nombre: kpis[0].nombre,
                  medicionesCount: kpis[0].mediciones?.length || 0,
                  firstMedicion: kpis[0].mediciones?.[0] || null
                }, null, 2)}
              </pre>
            </div>
          )}

          {(window as any).debugComparison && (
            <div style={{ marginTop: '8px' }}>
              <Text size={200} weight="semibold" style={{ color: '#003366' }}>Diagnóstico de Comparación de IDs (KPIs vs Mediciones):</Text>
              <pre style={{ fontSize: '11px', margin: '4px 0 0 0', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #E1E4E8' }}>
                {JSON.stringify((window as any).debugComparison, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'processes' && (
        <div style={{ padding: '16px', backgroundColor: '#F0F4F8', border: '1px solid #D0D9E0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text weight="bold" style={{ color: '#003366' }}>Diagnóstico de Procesos:</Text>
          <Text size={200}>Cantidad de procesos en el store: <strong>{processes.length}</strong></Text>

          {loadingProcs ? (
            <Spinner label="Cargando procesos..." />
          ) : (
            <Table aria-label="Tabla de diagnóstico de procesos">
              <TableHeader>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Código</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Responsable (Nombre)</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Responsable (Emails)</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.codigo}</TableCell>
                    <TableCell style={{ fontWeight: 'semibold' }}>{p.nombre}</TableCell>
                    <TableCell>{p.responsable}</TableCell>
                    <TableCell>
                      <pre style={{ margin: 0, fontSize: '11px' }}>
                        {JSON.stringify(p.responsableEmails || [], null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {processes.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Text size={200} weight="semibold">Muestra JSON de proceso cargado:</Text>
              <pre style={{ fontSize: '11px', margin: '4px 0 0 0', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #E1E4E8' }}>
                {JSON.stringify(processes[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'risks' && (
        <div style={{ padding: '16px', backgroundColor: '#F0F4F8', border: '1px solid #D0D9E0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text weight="bold" style={{ color: '#003366' }}>Diagnóstico de Riesgos:</Text>
          <Text size={200}>Cantidad de riesgos en el store: <strong>{risks.length}</strong></Text>

          {loadingRisks ? (
            <Spinner label="Cargando riesgos..." />
          ) : (
            <Table aria-label="Tabla de diagnóstico de riesgos">
              <TableHeader>
                <TableRow>
                  <TableCell style={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Probabilidad</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Impacto</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Score</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Proceso Asociado</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell style={{ fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map(r => {
                  const score = r.probabilidad * r.impacto;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell style={{ fontWeight: 'semibold' }}>{r.nombre}</TableCell>
                      <TableCell>{r.probabilidad}</TableCell>
                      <TableCell>{r.impacto}</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{score}</TableCell>
                      <TableCell>{r.proceso_asociado}</TableCell>
                      <TableCell>{r.tipo_riesgo || 'Operacional'}</TableCell>
                      <TableCell>{r.estado}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {risks.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Text size={200} weight="semibold">Muestra JSON de riesgo cargado:</Text>
              <pre style={{ fontSize: '11px', margin: '4px 0 0 0', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #E1E4E8' }}>
                {JSON.stringify(risks[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div style={{ padding: '16px', backgroundColor: '#F0F4F8', border: '1px solid #D0D9E0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Text weight="bold" style={{ color: '#003366' }}>Gestión de Correos Administradores (Simulado):</Text>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Modifica en tiempo real quién tiene rol de <strong>Admin</strong> agregando o quitando correos. Esta lista persiste en tu <code>localStorage</code> para facilitar pruebas de jerarquías.
          </Text>

          <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', maxWidth: '500px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <Label htmlFor="admin-email" style={{ fontWeight: 'bold', fontSize: '12px' }}>Añadir Correo Administrador:</Label>
              <Input
                id="admin-email"
                value={newAdminEmail}
                placeholder="ej: usuario@acme.com"
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <Button icon={<AddRegular />} appearance="primary" type="submit">
              Agregar
            </Button>
          </form>

          {permissionError && (
            <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <WarningRegular />
              <Text>{permissionError}</Text>
            </div>
          )}

          <Table aria-label="Tabla de administradores">
            <TableHeader>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>Correo Autorizado</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '100px' }}>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminEmails.map(email => (
                <TableRow key={email}>
                  <TableCell style={{ fontWeight: 'semibold' }}>{email}</TableCell>
                  <TableCell>
                    <Button
                      icon={<DeleteRegular />}
                      appearance="subtle"
                      style={{ color: email === 'alejandro.cristopher@gmail.com' ? '#A0A0A0' : '#DC143C' }}
                      disabled={email === 'alejandro.cristopher@gmail.com'}
                      onClick={() => handleRemoveAdmin(email)}
                      title="Eliminar administrador"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
