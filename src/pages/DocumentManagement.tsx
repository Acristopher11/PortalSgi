import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { DocumentRegular, EditRegular, DeleteRegular, WarningRegular, ArrowLeftRegular } from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { DocumentItem, Process } from '../types';

export const DocumentManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getSharePointToken, isAdmin, isDeveloper, email } = useAuth();

  // Route Params
  const queryProcessId = searchParams.get('procesoId');

  // Data States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // dynamic check for P-SGI-01 owner
  const isOwnerOfP_SGI_01 = useMemo(() => {
    const p_sgi_01 = processes.find(p => p.codigo === 'P-SGI-01');
    if (!p_sgi_01 || !p_sgi_01.responsableEmails) return false;
    return p_sgi_01.responsableEmails.map(e => e.toLowerCase()).includes(email.toLowerCase());
  }, [processes, email]);

  // Edit Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<DocumentItem | null>(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editVersion, setEditVersion] = useState('1');
  const [editProcesoId, setEditProcesoId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo]);

  // Upload Dialog States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docCodigo, setDocCodigo] = useState('');
  const [docVersion, setDocVersion] = useState('1');
  const [docProcesoId, setDocProcesoId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      const docsData = await sharePointService.getDocuments(token);
      setDocuments(docsData);

      const procsData = await sharePointService.getProcesses(token);
      setProcesses(procsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine user edit permissions per document
  const canModifyDocument = useCallback((doc: DocumentItem) => {
    if (isDeveloper || isAdmin) return true;
    if (isOwnerOfP_SGI_01) return true;

    const userEmail = email.toLowerCase();
    // Check if the user is owner of the specific process this document belongs to
    // Match either by process ID or name/code fallback using 'procesoAsociado' lookup column
    const process = processes.find(p => 
      p.id === doc.procesoId ||
      (doc.procesoAsociado && (
        p.nombre.toLowerCase() === doc.procesoAsociado.toLowerCase() ||
        p.codigo.toLowerCase() === doc.procesoAsociado.toLowerCase()
      ))
    );
    if (!process || !process.responsableEmails) return false;
    return process.responsableEmails.map(e => e.toLowerCase()).includes(userEmail);
  }, [isDeveloper, isAdmin, isOwnerOfP_SGI_01, email, processes]);

  // Determine if the user is allowed to upload/modify at least some documents
  const canUpload = useMemo(() => {
    if (isDeveloper || isAdmin) return true;
    if (isOwnerOfP_SGI_01) return true;
    
    const userEmail = email.toLowerCase();
    // Any process owner can upload to their own processes
    return processes.some(p => p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail));
  }, [isDeveloper, isAdmin, isOwnerOfP_SGI_01, email, processes]);

  const openUploadDialog = () => {
    setSelectedFile(null);
    setDocCodigo('');
    setDocVersion('1');
    setDocProcesoId(queryProcessId || '');
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Debe seleccionar un archivo para cargar.');
      return;
    }
    if (!docCodigo.trim()) {
      setUploadError('Debe ingresar el código del documento.');
      return;
    }
    const versionNum = parseInt(docVersion);
    if (isNaN(versionNum) || versionNum < 1) {
      setUploadError('La versión del documento debe ser un número entero mayor a cero.');
      return;
    }

    // Security Gate: Verify if user is owner of selected process or has global rights
    const userEmail = email.toLowerCase();
    const isGlobalAprobador = isDeveloper || isAdmin || isOwnerOfP_SGI_01;
    if (!isGlobalAprobador) {
      if (!docProcesoId) {
        setUploadError('Debe asociar el documento a uno de sus procesos asignados. No tiene permisos para subir documentos generales.');
        return;
      }
      const selectedProc = processes.find(p => p.id === docProcesoId);
      const isOwnerOfSelected = selectedProc?.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
      if (!isOwnerOfSelected) {
        setUploadError('No tiene permisos para subir documentos asociados a este proceso. Solo puede subir documentos para sus propios procesos.');
        return;
      }
    }

    setUploading(true);
    try {
      const token = await getSharePointToken();
      await sharePointService.uploadDocument(selectedFile, {
        codigo: docCodigo.trim(),
        version: versionNum,
        procesoId: docProcesoId || undefined,
      }, token);

      setIsUploadOpen(false);
      await loadData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al cargar el documento.');
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (doc: DocumentItem) => {
    setDocToEdit(doc);
    setEditCodigo(doc.codigo);
    setEditVersion(String(doc.version));
    setEditProcesoId(doc.procesoId || '');
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editCodigo.trim()) {
      setEditError('Debe ingresar el código del documento.');
      return;
    }
    const versionNum = parseInt(editVersion);
    if (isNaN(versionNum) || versionNum < 1) {
      setEditError('La versión del documento debe ser un número entero mayor a cero.');
      return;
    }

    if (!docToEdit) return;

    // Security check
    const userEmail = email.toLowerCase();
    const isGlobalAprobador = isDeveloper || isAdmin || isOwnerOfP_SGI_01;
    if (!isGlobalAprobador) {
      if (!editProcesoId) {
        setEditError('Debe asociar el documento a uno de sus procesos asignados. No tiene permisos para asociar documentos a General.');
        return;
      }
      const targetProc = processes.find(p => p.id === editProcesoId);
      const isOwnerOfTarget = targetProc?.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
      if (!isOwnerOfTarget) {
        setEditError('No tiene permisos para asociar documentos a este proceso. Solo puede asociar documentos a sus propios procesos.');
        return;
      }
    }

    setUpdating(true);
    try {
      const token = await getSharePointToken();
      await sharePointService.updateDocument(docToEdit.id, {
        codigo: editCodigo.trim(),
        version: versionNum,
        procesoId: editProcesoId || undefined,
      }, token);

      setIsEditOpen(false);
      await loadData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar el documento.');
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteDialog = (doc: DocumentItem) => {
    setDocToDelete(doc);
    setUploadError(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    setUploadError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteDocument(docToDelete.id, token);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al eliminar el documento.');
    } finally {
      setDeleting(false);
    }
  };

  const clearProcessFilter = () => {
    searchParams.delete('procesoId');
    setSearchParams(searchParams);
  };

  // Collect unique tipoDocumento values for filter dropdown
  const tipoOptions = useMemo(() => {
    const tipos = new Set(documents.map(d => d.tipoDocumento).filter(Boolean) as string[]);
    return Array.from(tipos).sort();
  }, [documents]);

  // Filter and Search documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // 1. Process filter (query parameter)
    if (queryProcessId) {
      const targetProcess = processes.find(p => p.id === queryProcessId);
      result = result.filter(d => 
        d.procesoId === queryProcessId ||
        (targetProcess && d.procesoAsociado && (
          d.procesoAsociado.toLowerCase() === targetProcess.nombre.toLowerCase() ||
          d.procesoAsociado.toLowerCase() === targetProcess.codigo.toLowerCase()
        ))
      );
    }

    // 2. Tipo de Documento filter
    if (filterTipo) {
      result = result.filter(d => d.tipoDocumento === filterTipo);
    }

    // 3. Search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.nombre.toLowerCase().includes(term) ||
        d.codigo.toLowerCase().includes(term) ||
        (d.procesoAsociado && d.procesoAsociado.toLowerCase().includes(term)) ||
        (d.tipoDocumento && d.tipoDocumento.toLowerCase().includes(term))
      );
    }

    return result;
  }, [documents, queryProcessId, processes, searchTerm, filterTipo]);

  const activeProcessName = useMemo(() => {
    if (!queryProcessId) return '';
    return processes.find(p => p.id === queryProcessId)?.nombre || '';
  }, [queryProcessId, processes]);

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredDocuments.slice(start, start + 20);
  }, [filteredDocuments, currentPage]);

  const totalPages = Math.ceil(filteredDocuments.length / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
            Información Documentada
          </Text>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Workspace de Gestión Documental y Archivos de Calidad
          </Text>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {queryProcessId && (
            <Button icon={<ArrowLeftRegular />} onClick={clearProcessFilter}>
              Ver todos los documentos
            </Button>
          )}
          {canUpload && (
            <Button icon={<DocumentRegular />} appearance="primary" onClick={openUploadDialog}>
              Subir Documento
            </Button>
          )}
        </div>
      </div>

      {/* Filter indicator */}
      {queryProcessId && (
        <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#1E40AF', fontSize: '13px' }}>
            Filtrado por proceso: <strong>{activeProcessName} ({processes.find(p => p.id === queryProcessId)?.codigo})</strong>
          </Text>
          <Button size="small" appearance="subtle" onClick={clearProcessFilter} style={{ color: '#1E40AF' }}>
            Limpiar filtro
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--color-neutral-background2, #F3F4F6)', padding: '16px', borderRadius: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
          <Label htmlFor="search-docs" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Buscar Documentos:</Label>
          <Input
            id="search-docs"
            value={searchTerm}
            placeholder="Buscar por código, nombre de archivo o proceso..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
          <Label htmlFor="filter-tipo-doc" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Tipo de Documento:</Label>
          <Dropdown
            id="filter-tipo-doc"
            value={filterTipo || 'Todos'}
            selectedOptions={[filterTipo]}
            onOptionSelect={(_, data) => setFilterTipo(data.optionValue === 'Todos' ? '' : (data.optionValue as string))}
          >
            <Option value="Todos">Todos</Option>
            {tipoOptions.map(tipo => (
              <Option key={tipo} value={tipo}>{tipo}</Option>
            ))}
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
        <Spinner label="Cargando biblioteca de documentos..." />
      ) : (
        <Table aria-label="Biblioteca de Documentos">
          <TableHeader>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>Nombre del Documento</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Código</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '80px', textAlign: 'center' }}>Versión</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '130px' }}>Tipo de Documento</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '140px' }}>Fecha Publicación</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '200px' }}>Proceso Asociado</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '100px', textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDocuments.map((doc: DocumentItem, index: number) => (
              <TableRow key={doc.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                <TableCell style={{ fontWeight: 'medium' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DocumentRegular style={{ color: 'var(--color-midnight-blue, #001F3F)' }} />
                    {doc.link && doc.link !== '#' ? (
                      <a href={doc.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-midnight-blue, #001F3F)', textDecoration: 'none', fontWeight: 'semibold' }}>
                        {doc.nombre}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--color-midnight-blue, #001F3F)', fontWeight: 'semibold' }}>{doc.nombre}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{doc.codigo}</TableCell>
                <TableCell style={{ textAlign: 'center' }}>V{doc.version}</TableCell>
                <TableCell>
                  {doc.tipoDocumento ? (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE'
                    }}>
                      {doc.tipoDocumento}
                    </span>
                  ) : (
                    <span style={{ color: '#8A8886', fontSize: '11px' }}>—</span>
                  )}
                </TableCell>
                <TableCell>{new Date(doc.fechaPublicacion).toLocaleDateString()}</TableCell>
                <TableCell>{doc.procesoAsociado || 'General'}</TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  {canModifyDocument(doc) ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        icon={<EditRegular />}
                        appearance="subtle"
                        onClick={() => openEditDialog(doc)}
                        title="Editar Documento"
                      />
                      <Button
                        icon={<DeleteRegular />}
                        appearance="subtle"
                        style={{ color: '#DC143C' }}
                        onClick={() => openDeleteDialog(doc)}
                        title="Eliminar Documento"
                      />
                    </div>
                  ) : (
                    <span style={{ color: '#8A8886', fontSize: '11px' }}>Sólo lectura</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  No se encontraron documentos en este espacio de trabajo.
                </TableCell>
              </TableRow>
            )}
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

      {/* UPLOAD DIALOG */}
      <Dialog open={isUploadOpen} onOpenChange={(_, data) => setIsUploadOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>Subir Documento de Calidad</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="doc-file" style={{ fontWeight: 'bold' }}>Archivo:</Label>
                <input
                  id="doc-file"
                  type="file"
                  onChange={handleFileChange}
                  style={{
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    width: '100%',
                    backgroundColor: 'white'
                  }}
                />
                {selectedFile && (
                  <Text size={100} style={{ color: '#107C10', marginTop: '2px' }}>
                    Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Text>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="doc-code" style={{ fontWeight: 'bold' }}>Código del Documento:</Label>
                <Input
                  id="doc-code"
                  value={docCodigo}
                  placeholder="ej: PR-SGI-01, MN-CAL-02..."
                  onChange={(e) => setDocCodigo(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="doc-version" style={{ fontWeight: 'bold' }}>Versión:</Label>
                  <Input
                    id="doc-version"
                    value={docVersion}
                    type="number"
                    min="1"
                    onChange={(e) => setDocVersion(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="doc-process" style={{ fontWeight: 'bold' }}>Proceso Asociado:</Label>
                  <Dropdown
                    id="doc-process"
                    value={docProcesoId ? (processes.find(p => p.id === docProcesoId)?.nombre || 'General') : 'General'}
                    selectedOptions={[docProcesoId]}
                    onOptionSelect={(_, data) => setDocProcesoId(data.optionValue as string)}
                  >
                    <Option value="">General (Sin proceso específico)</Option>
                    {processes.map(p => {
                      // Check if the user is allowed to upload to this process (Admin/Dev or owner)
                      const userEmail = email.toLowerCase();
                      const isOwner = p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
                      const isAllowed = isDeveloper || isAdmin || isOwnerOfP_SGI_01 || isOwner;
                      const optText = `${p.nombre} (${p.codigo})${!isAllowed ? ' (No Permitido)' : ''}`;
                      return (
                        <Option key={p.id} value={p.id} disabled={!isAllowed} text={optText}>
                          {optText}
                        </Option>
                      );
                    })}
                  </Dropdown>
                </div>
              </div>

              {uploadError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                  <WarningRegular />
                  <Text>{uploadError}</Text>
                </div>
              )}
            </DialogContent>

            <DialogActions style={{ marginTop: '24px', borderTop: '1px solid #E8EAED', paddingTop: '16px' }}>
              <Button appearance="secondary" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleUploadSubmit} disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Cargar Documento'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={(_, data) => setIsEditOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>Editar Documento de Calidad</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <Text size={200} weight="semibold" style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
                Archivo: {docToEdit?.nombre}
              </Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="edit-doc-code" style={{ fontWeight: 'bold' }}>Código del Documento:</Label>
                <Input
                  id="edit-doc-code"
                  value={editCodigo}
                  placeholder="ej: PR-SGI-01, MN-CAL-02..."
                  onChange={(e) => setEditCodigo(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="edit-doc-version" style={{ fontWeight: 'bold' }}>Versión:</Label>
                  <Input
                    id="edit-doc-version"
                    value={editVersion}
                    type="number"
                    min="1"
                    onChange={(e) => setEditVersion(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Label htmlFor="edit-doc-process" style={{ fontWeight: 'bold' }}>Proceso Asociado:</Label>
                  <Dropdown
                    id="edit-doc-process"
                    value={editProcesoId ? (processes.find(p => p.id === editProcesoId)?.nombre || 'General') : 'General'}
                    selectedOptions={[editProcesoId]}
                    onOptionSelect={(_, data) => setEditProcesoId(data.optionValue as string)}
                  >
                    <Option value="">General (Sin proceso específico)</Option>
                    {processes.map(p => {
                      const userEmail = email.toLowerCase();
                      const isOwner = p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
                      const isAllowed = isDeveloper || isAdmin || isOwnerOfP_SGI_01 || isOwner;
                      const optText = `${p.nombre} (${p.codigo})${!isAllowed ? ' (No Permitido)' : ''}`;
                      return (
                        <Option key={p.id} value={p.id} disabled={!isAllowed} text={optText}>
                          {optText}
                        </Option>
                      );
                    })}
                  </Dropdown>
                </div>
              </div>

              {editError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '8px' }}>
                  <WarningRegular />
                  <Text>{editError}</Text>
                </div>
              )}
            </DialogContent>

            <DialogActions style={{ marginTop: '24px', borderTop: '1px solid #E8EAED', paddingTop: '16px' }}>
              <Button appearance="secondary" onClick={() => setIsEditOpen(false)} disabled={updating}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleEditSubmit} disabled={updating}>
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={(_, data) => setIsDeleteOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '440px', width: '90%' }}>
          <DialogBody>
            <DialogTitle>Eliminar Documento</DialogTitle>
            <DialogContent style={{ marginTop: '12px' }}>
              <Text>
                ¿Está seguro de que desea eliminar el documento <strong>{docToDelete?.nombre}</strong> ({docToDelete?.codigo})? Esta acción eliminará el archivo permanentemente de la biblioteca.
              </Text>
              {uploadError && (
                <div style={{ color: '#DC143C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '12px' }}>
                  <WarningRegular />
                  <Text>{uploadError}</Text>
                </div>
              )}
            </DialogContent>
            <DialogActions style={{ marginTop: '20px' }}>
              <Button appearance="secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleDeleteDocument} style={{ backgroundColor: '#DC143C', borderColor: '#DC143C' }} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
