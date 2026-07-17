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
import { AddRegular, EditRegular, DeleteRegular, WarningRegular } from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { GlossaryTerm, Process } from '../types';

export const GlossaryManagement: React.FC = () => {
  const { getSharePointToken, isAdmin, isDeveloper, isProcessOwner, email } = useAuth();
  
  // Data States
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  // Form Fields
  const [termino, setTermino] = useState('');
  const [definicion, setDefinicion] = useState('');
  const [procesoId, setProcesoId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreateTerm = isAdmin || isDeveloper || isProcessOwner;

  const canModifyTerm = useCallback((term: GlossaryTerm) => {
    if (isDeveloper || isAdmin) return true;
    const userEmail = email.toLowerCase();
    const process = processes.find(p => 
      p.id === term.procesoId ||
      (term.procesoAsociado && (
        p.nombre.toLowerCase() === term.procesoAsociado.toLowerCase() ||
        p.codigo.toLowerCase() === term.procesoAsociado.toLowerCase()
      ))
    );
    if (!process || !process.responsableEmails) return false;
    return process.responsableEmails.map(e => e.toLowerCase()).includes(userEmail);
  }, [isDeveloper, isAdmin, email, processes]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      const termsData = await sharePointService.getGlossaryTerms(token);
      setTerms(termsData);

      const procsData = await sharePointService.getProcesses(token);
      setProcesses(procsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el glosario');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setSelectedTerm(null);
    setTermino('');
    setDefinicion('');
    setProcesoId('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setTermino(term.termino);
    setDefinicion(term.definicion);
    setProcesoId(term.procesoId || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openConfirmDelete = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setFormError(null);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termino.trim()) {
      setFormError('Debe ingresar el término.');
      return;
    }
    if (!definicion.trim()) {
      setFormError('Debe ingresar la definición del término.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getSharePointToken();
      const values = {
        termino: termino.trim(),
        definicion: definicion.trim(),
        procesoId: procesoId || undefined,
      };

      if (selectedTerm) {
        await sharePointService.updateGlossaryTerm(selectedTerm.id, values, token);
      } else {
        await sharePointService.createGlossaryTerm(values, token);
      }

      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      const msg = serializeError(err);
      const elementName = termino.trim() || (selectedTerm?.termino ?? 'nueva definición');
      setFormError(`Error al guardar "${elementName}": ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const token = await getSharePointToken();
      await sharePointService.deleteGlossaryTerm(selectedTerm.id, token);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al eliminar el término.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTerms = useMemo(() => {
    if (!searchTerm.trim()) return terms;
    const term = searchTerm.toLowerCase();
    return terms.filter(t =>
      t.termino.toLowerCase().includes(term) ||
      t.definicion.toLowerCase().includes(term) ||
      (t.procesoAsociado && t.procesoAsociado.toLowerCase().includes(term))
    );
  }, [terms, searchTerm]);

  const paginatedTerms = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredTerms.slice(start, start + 20);
  }, [filteredTerms, currentPage]);

  const totalPages = Math.ceil(filteredTerms.length / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
          Glosario SGI
        </Text>
        {canCreateTerm && (
          <Button icon={<AddRegular />} appearance="primary" onClick={openCreateDialog}>
            Nuevo Término
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--color-neutral-background2, #F3F4F6)', padding: '16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <Label htmlFor="search-glossary" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Buscar Término:</Label>
          <Input
            id="search-glossary"
            value={searchTerm}
            placeholder="Buscar término o definición..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error al cargar datos:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {loading ? (
        <Spinner label="Cargando términos del glosario..." />
      ) : (
        <Table aria-label="Tabla de Glosario">
          <TableHeader>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold', width: '25%' }}>Término</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '50%' }}>Definición</TableCell>
              <TableCell style={{ fontWeight: 'bold', width: '15%' }}>Proceso</TableCell>
              {canCreateTerm && <TableCell style={{ fontWeight: 'bold', width: '10%' }}>Acciones</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTerms.map((term: GlossaryTerm, index: number) => (
              <TableRow key={term.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                <TableCell style={{ fontWeight: 'semibold' }}>{term.termino}</TableCell>
                <TableCell>{term.definicion}</TableCell>
                <TableCell>{term.procesoAsociado || 'General'}</TableCell>
                {canCreateTerm && (
                  <TableCell>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canModifyTerm(term) && (
                        <>
                          <Button
                            icon={<EditRegular />}
                            appearance="subtle"
                            onClick={() => openEditDialog(term)}
                            title="Editar Término"
                          />
                          <Button
                            icon={<DeleteRegular />}
                            appearance="subtle"
                            style={{ color: '#DC143C' }}
                            onClick={() => openConfirmDelete(term)}
                            title="Eliminar Término"
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredTerms.length === 0 && (
              <TableRow>
                <TableCell colSpan={canCreateTerm ? 4 : 3} style={{ textAlign: 'center', padding: '24px' }}>
                  No se encontraron términos que coincidan con la búsqueda.
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

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={(_, data) => setIsFormOpen(data.open)}>
        <DialogSurface style={{ padding: '24px', borderRadius: '8px', maxWidth: '900px', width: '95%' }}>
          <DialogBody>
            <DialogTitle>{selectedTerm ? 'Editar Término' : 'Crear Nuevo Término'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="glossary-term" style={{ fontWeight: 'bold' }}>Término:</Label>
                <Input
                  id="glossary-term"
                  value={termino}
                  placeholder="ej: SIPOC, SGI, Hallazgo..."
                  onChange={(e) => setTermino(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="glossary-definition" style={{ fontWeight: 'bold' }}>Definición:</Label>
                <Input
                  id="glossary-definition"
                  value={definicion}
                  placeholder="Defina el término..."
                  onChange={(e) => setDefinicion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Label htmlFor="glossary-process" style={{ fontWeight: 'bold' }}>Proceso Asociado (Opcional):</Label>
                <Dropdown
                  id="glossary-process"
                  value={procesoId ? (() => {
                    const found = processes.find(p => p.id === procesoId);
                    return found ? `[${found.codigo}] - ${found.nombre}` : 'General';
                  })() : 'General'}
                  selectedOptions={[procesoId]}
                  onOptionSelect={(_, data) => setProcesoId(data.optionValue as string)}
                >
                  <Option value="">General</Option>
                  {processes.map(p => {
                    const userEmail = email.toLowerCase();
                    const isOwner = p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail);
                    const isAllowed = isDeveloper || isAdmin || isOwner;
                    const optText = `[${p.codigo}] - ${p.nombre}${!isAllowed ? ' (No Permitido)' : ''}`;
                    return (
                      <Option key={p.id} value={p.id} disabled={!isAllowed} text={optText}>
                        {optText}
                      </Option>
                    );
                  })}
                </Dropdown>
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
            <DialogTitle>Eliminar Término</DialogTitle>
            <DialogContent style={{ marginTop: '12px' }}>
              <Text>
                ¿Está seguro de que desea eliminar el término <strong>{selectedTerm?.termino}</strong>? Esta acción no se puede deshacer.
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
              <Button appearance="primary" onClick={handleDeleteTerm} style={{ backgroundColor: '#DC143C', borderColor: '#DC143C' }} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

