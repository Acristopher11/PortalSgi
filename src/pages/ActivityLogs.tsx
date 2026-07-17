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
  Input,
  Label,
  Dropdown,
  Option,
  Badge,
} from '@fluentui/react-components';
import { HistoryRegular, SearchRegular, ArrowClockwiseRegular } from '@fluentui/react-icons';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../hooks/useAuth';
import type { ActivityLog } from '../types';

export const ActivityLogs: React.FC = () => {
  const { getSharePointToken } = useAuth();
  
  // Data States
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedElement]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getSharePointToken();
      const logsData = await sharePointService.getActivityLogs(token);
      setLogs(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la bitácora de actividad.');
    } finally {
      setLoading(false);
    }
  }, [getSharePointToken]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // List of distinct elements for filtering dropdown
  const elementTypes = ['Todos', 'KPI', 'Medición', 'Proceso', 'Riesgo', 'Glosario', 'Documento'];

  // Filter & Search application
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Element filter
      const matchesElement = selectedElement === 'Todos' || log.elemento === selectedElement;
      
      // 2. Search term filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        term === '' || 
        log.usuario.toLowerCase().includes(term) || 
        log.detalle.toLowerCase().includes(term) ||
        log.accion.toLowerCase().includes(term);

      return matchesElement && matchesSearch;
    });
  }, [logs, selectedElement, searchTerm]);

  // Style badge depending on action type
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('crear') || act.includes('subir')) {
      return (
        <Badge appearance="filled" color="success">
          {action}
        </Badge>
      );
    }
    if (act.includes('eliminar') || act.includes('borrar')) {
      return (
        <Badge appearance="filled" color="danger">
          {action}
        </Badge>
      );
    }
    // Modify / Update / Save
    return (
      <Badge appearance="filled" style={{ backgroundColor: '#0078D4', color: 'white' }}>
        {action}
      </Badge>
    );
  };

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * 20;
    return filteredLogs.slice(start, start + 20);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryRegular style={{ fontSize: '24px', color: 'var(--color-midnight-blue, #001F3F)' }} />
            <Text size={600} weight="bold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
              Bitácora de Cambios
            </Text>
          </div>
          <Text size={200} style={{ color: 'var(--color-text-secondary, #636F7D)' }}>
            Registro histórico de operaciones del Sistema de Gestión Integrado (ISO 9001:2015 7.5)
          </Text>
        </div>

        <Button icon={<ArrowClockwiseRegular />} onClick={loadLogs} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--color-neutral-background2, #F3F4F6)', padding: '16px', borderRadius: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 2, minWidth: '200px' }}>
          <Label htmlFor="search-logs" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Buscar en Bitácora:</Label>
          <Input
            id="search-logs"
            value={searchTerm}
            placeholder="Buscar por usuario o descripción..."
            contentBefore={<SearchRegular />}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
          <Label htmlFor="filter-element" style={{ fontWeight: 'semibold', fontSize: '12px' }}>Categoría de Elemento:</Label>
          <Dropdown
            id="filter-element"
            value={selectedElement}
            selectedOptions={[selectedElement]}
            onOptionSelect={(_, data) => setSelectedElement(data.optionValue as string)}
          >
            {elementTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FDE7E9', color: '#DC143C', borderRadius: '8px', border: '1px solid #FBC2C4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="bold">Error al cargar bitácora:</Text>
          <Text size={200}>{error}</Text>
        </div>
      )}

      {/* Table Section */}
      {loading ? (
        <Spinner label="Cargando registros de auditoría..." />
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
          <Table aria-label="Bitácora de Cambios SGI">
            <TableHeader>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold', width: '180px' }}>Fecha y Hora</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '220px' }}>Usuario</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Acción</TableCell>
                <TableCell style={{ fontWeight: 'bold', width: '120px' }}>Elemento</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Detalle del Cambio</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log: ActivityLog, index: number) => (
                <TableRow key={log.id} style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <TableCell style={{ color: '#555', fontSize: '13px' }}>
                    {new Date(log.fecha).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Text weight="semibold" style={{ color: 'var(--color-midnight-blue, #001F3F)' }}>
                      {log.usuario}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.accion)}
                  </TableCell>
                  <TableCell>
                    <Badge appearance="outline">
                      {log.elemento}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#334155' }}>
                    {log.detalle}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                    No se encontraron registros de cambios que coincidan con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
    </div>
  );
};
