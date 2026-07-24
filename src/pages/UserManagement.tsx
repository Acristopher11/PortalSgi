import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Input,
  Select,
  Switch,
  makeStyles,
  shorthands,
  Spinner,
  tokens,
  Card,
  Badge,
} from '@fluentui/react-components';
import {
  PeopleRegular,
  AddRegular,
  EditRegular,
  ArrowLeftRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import { getAllUsuarios, upsertUsuario } from '../repositories/usuarioRepository';
import { getAllAreas } from '../repositories/areaRepository';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SgiUsuario, Area } from '../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    ...shorthands.padding('24px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    paddingBottom: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    fontSize: '32px',
    color: 'var(--color-midnight-blue, #001F3F)',
  },
  backButton: {
    marginRight: '8px',
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('16px'),
    boxShadow: 'var(--shadow-subtle)',
    overflow: 'auto',
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    ...shorthands.padding('16px', '0px'),
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  dialogSurface: {
    maxWidth: '500px',
    width: '90%',
  },
});

export const UserManagement: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  // State
  const queryClient = useQueryClient();

  // Queries
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery<SgiUsuario[]>({
    queryKey: ['users'],
    queryFn: () => getAllUsuarios(),
  });

  const { data: areas = [], isLoading: loadingAreas } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => getAllAreas(),
  });

  const loading = loadingUsers || loadingAreas;

  // Mutations
  const userMutation = useMutation({
    mutationFn: (payload: any) => upsertUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al guardar el usuario. Verifica los datos.');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (user: SgiUsuario) => upsertUsuario({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      roles: user.roles || [user.rol],
      areaId: user.areaId || null,
      activo: !user.activo,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // State
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SgiUsuario | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<SgiUsuario['rol']>('Usuario');
  const [areaId, setAreaId] = useState<string>('');
  const [activo, setActivo] = useState(true);

  // Open Add Dialog
  const handleAddClick = () => {
    setSelectedUser(null);
    setNombre('');
    setEmail('');
    setRol('Usuario');
    setAreaId('');
    setActivo(true);
    setError(null);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleEditClick = (user: SgiUsuario) => {
    setSelectedUser(user);
    setNombre(user.nombre);
    setEmail(user.email);
    setRol(user.rol);
    setAreaId(user.areaId || '');
    setActivo(user.activo);
    setError(null);
    setIsDialogOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      setError('Por favor completa los campos obligatorios.');
      return;
    }

    setError(null);
    const payload = {
      id: selectedUser ? selectedUser.id : undefined,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
      roles: [rol],
      areaId: rol === 'Encargado' || rol === 'DP' ? (areaId || null) : null,
      activo,
    };

    userMutation.mutate(payload);
  };

  // Toggle user active status directly
  const handleToggleStatus = (user: SgiUsuario) => {
    toggleMutation.mutate(user);
  };

  const saving = userMutation.isPending;
  const displayError = error || (usersError ? 'Error al cargar usuarios de la base de datos.' : null);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            icon={<ArrowLeftRegular />}
            appearance="subtle"
            className={styles.backButton}
            onClick={() => navigate('/configuracion')}
            title="Volver a Configuración"
          />
          <PeopleRegular className={styles.headerIcon} />
          <div>
            <Text size={700} weight="semibold">Gestión de Usuarios</Text>
            <br />
            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
              Administra los accesos, roles y áreas asociadas de los usuarios del sistema.
            </Text>
          </div>
        </div>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={handleAddClick}
        >
          Agregar Usuario
        </Button>
      </div>

      {displayError && !isDialogOpen && (
        <Badge appearance="filled" color="danger" style={{ padding: '12px', width: 'fit-content' }}>
          {displayError}
        </Badge>
      )}

      {/* Main Table Card */}
      {loading ? (
        <Spinner label="Cargando usuarios..." style={{ margin: '40px auto' }} />
      ) : (
        <Card className={styles.card}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Nombre</TableHeaderCell>
                <TableHeaderCell>Correo Electrónico</TableHeaderCell>
                <TableHeaderCell>Rol</TableHeaderCell>
                <TableHeaderCell>Área</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Acciones</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Text weight="medium">{user.nombre}</Text>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      appearance="tint"
                      color={
                        user.rol === 'Admin'
                          ? 'danger'
                          : user.rol === 'DP'
                          ? 'success'
                          : user.rol === 'Encargado'
                          ? 'warning'
                          : 'brand'
                      }
                    >
                      {user.rol === 'DP'
                        ? 'Dueño de Proceso'
                        : user.rol === 'Admin'
                        ? 'Administrador'
                        : user.rol}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.areaNombre || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      appearance="filled"
                      color={user.activo ? 'success' : 'subtle'}
                      icon={user.activo ? <CheckmarkCircleRegular /> : <DismissCircleRegular />}
                    >
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={styles.actionsCell}>
                      <Button
                        size="small"
                        icon={<EditRegular />}
                        onClick={() => handleEditClick(user)}
                        title="Editar Usuario"
                      />
                      <Button
                        size="small"
                        appearance="subtle"
                        color={user.activo ? 'danger' : 'success'}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    No se encontraron usuarios en el sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <form onSubmit={handleSubmit}>
            <DialogBody>
              <DialogTitle>
                {selectedUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
              </DialogTitle>
              <DialogContent className={styles.dialogForm}>
                {error && (
                  <Badge appearance="filled" color="danger" style={{ padding: '8px', marginBottom: '8px' }}>
                    {error}
                  </Badge>
                )}

                <Field label="Nombre Completo" required>
                  <Input
                    value={nombre}
                    onChange={(e, data) => setNombre(data.value)}
                    placeholder="Ej. Juan Pérez"
                    disabled={saving}
                  />
                </Field>

                <Field label="Correo Electrónico" required>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e, data) => setEmail(data.value)}
                    placeholder="juan.perez@empresa.com"
                    disabled={saving || !!selectedUser} // Do not allow email changes for existing users to preserve auth mappings
                  />
                </Field>

                <div className={styles.formRow}>
                  <Field label="Rol del Sistema" required style={{ flex: 1 }}>
                    <Select
                      value={rol}
                      onChange={(e) => setRol(e.target.value as SgiUsuario['rol'])}
                      disabled={saving}
                    >
                      <option value="Usuario">Usuario (Visor)</option>
                      <option value="DP">Dueño de Proceso (DP)</option>
                      <option value="Encargado">Encargado SGI</option>
                      <option value="Admin">Administrador</option>
                    </Select>
                  </Field>

                  {(rol === 'Encargado' || rol === 'DP') && (
                    <Field label="Área Asociada" required style={{ flex: 1 }}>
                      <Select
                        value={areaId}
                        onChange={(e) => setAreaId(e.target.value)}
                        disabled={saving}
                      >
                        <option value="">-- Seleccionar Área --</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.nombre} ({area.codigo})
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </div>

                <Field label="Estado de Acceso">
                  <Switch
                    label={activo ? 'Acceso Habilitado' : 'Acceso Suspendido'}
                    checked={activo}
                    onChange={(e, data) => setActivo(data.checked)}
                    disabled={saving}
                  />
                </Field>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  appearance="primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
