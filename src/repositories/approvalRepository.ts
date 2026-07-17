import { supabase } from '../lib/supabaseClient';
import type { ApprovalRequest, Process } from '../types';
import { getAllAreas } from './areaRepository';
import { getAllProcesses } from './processRepository';
import { getAllUsuarios } from './usuarioRepository';
import {
  resolveAreaJerarquia,
  buildFlowSteps,
  initializeFlow,
  advanceFlow,
  resubmitFlow,
  getCalidadAprobadores
} from '../services/approvalFlowEngine';

const DEFAULT_ORG_ID = '1';

function mapToApprovalRequest(row: any): ApprovalRequest {
  let historialPasos: any[] = [];
  if (row.historial_pasos) {
    try {
      historialPasos = typeof row.historial_pasos === 'string'
        ? JSON.parse(row.historial_pasos)
        : row.historial_pasos;
    } catch (e) {
      console.error('Error parsing historial_pasos JSON', e);
    }
  }

  let datosJson = '{}';
  if (row.datos_json) {
    try {
      datosJson = typeof row.datos_json === 'string'
        ? row.datos_json
        : JSON.stringify(row.datos_json);
    } catch (e) {
      console.error('Error stringifying datos_json JSON', e);
    }
  }

  let metadataArchivo = undefined;
  if (row.metadata_archivo) {
    try {
      metadataArchivo = typeof row.metadata_archivo === 'string'
        ? row.metadata_archivo
        : JSON.stringify(row.metadata_archivo);
    } catch (e) {
      console.error('Error stringifying metadata_archivo', e);
    }
  }

  return {
    id: String(row.id),
    titulo: row.titulo || '',
    tipoElemento: row.tipo_elemento || 'Riesgo',
    accion: row.accion || 'Crear',
    elementoId: row.elemento_id || undefined,
    datosJson,
    estado: row.estado || 'Pendiente',
    solicitante: row.solicitante || '',
    aprobador: row.aprobador || undefined,
    fechaSolicitud: new Date(row.created_at || Date.now()),
    fechaAccion: row.fecha_accion ? new Date(row.fecha_accion) : undefined,
    comentarios: row.comentarios || undefined,
    rutaArchivoTemp: row.ruta_archivo_temp || undefined,
    metadataArchivo,
    pasoActual: row.paso_actual !== undefined && row.paso_actual !== null ? Number(row.paso_actual) : undefined,
    totalPasos: row.total_pasos !== undefined && row.total_pasos !== null ? Number(row.total_pasos) : undefined,
    aprobadorPasoActual: row.aprobador_paso_actual || undefined,
    historialPasos,
    areaSolicitanteId: row.area_solicitante_id !== undefined && row.area_solicitante_id !== null ? String(row.area_solicitante_id) : undefined,
    flujoVersion: row.flujo_version !== undefined && row.flujo_version !== null ? Number(row.flujo_version) : undefined,
  };
}

export async function getAllApprovals(token?: string): Promise<ApprovalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('aprobaciones')
      .select('*')
      .eq('organizacion_id', DEFAULT_ORG_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approvals from Supabase:', error);
      return [];
    }

    return (data || []).map(mapToApprovalRequest);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return [];
  }
}

export async function createApproval(
  request: Omit<ApprovalRequest, 'id' | 'fechaSolicitud' | 'estado'>,
  token?: string
): Promise<ApprovalRequest> {
  let processes: Process[] = [];
  try {
    processes = await getAllProcesses(token);
  } catch (e) {
    console.warn('Error loading processes for flow creation', e);
  }

  const allAreas = await getAllAreas(token);

  let areaSolicitanteId = request.areaSolicitanteId;
  if (!areaSolicitanteId) {
    try {
      const users = await getAllUsuarios(token);
      const user = users.find(u => u.email.toLowerCase() === request.solicitante.toLowerCase());
      if (user && user.areaId) {
        areaSolicitanteId = user.areaId;
        console.log(`[ApprovalRepo] Solicitante '${request.solicitante}' mapeado al área ID '${areaSolicitanteId}' (${user.areaNombre})`);
      }
    } catch (e) {
      console.warn('[ApprovalRepo] No se pudo resolver el área del solicitante por email, usando fallback.', e);
    }
  }
  if (!areaSolicitanteId) {
    areaSolicitanteId = '2'; // Fallback a SGI
  }

  const areaJerarquia = resolveAreaJerarquia(areaSolicitanteId, allAreas);

  let steps: any[];
  if (areaJerarquia) {
    steps = buildFlowSteps(areaJerarquia, request.tipoElemento, processes);
  } else {
    const calidadEmails = getCalidadAprobadores(request.tipoElemento, processes);
    steps = [{
      paso: 1,
      nombrePaso: 'Calidad',
      aprobador: calidadEmails.join(';') || 'ana@acme.com',
      decision: 'Pendiente'
    }];
  }

  const initialized = initializeFlow(request, steps, areaSolicitanteId);

  let parsedDatosJson = {};
  try {
    parsedDatosJson = initialized.datosJson ? JSON.parse(initialized.datosJson) : {};
  } catch (e) {
    console.error('Error parsing datosJson in createApproval', e);
  }

  let parsedMetadataArchivo = {};
  try {
    parsedMetadataArchivo = initialized.metadataArchivo ? JSON.parse(initialized.metadataArchivo) : {};
  } catch (e) {
    console.error('Error parsing metadataArchivo in createApproval', e);
  }

  const payload = {
    titulo: initialized.titulo,
    tipo_elemento: initialized.tipoElemento,
    accion: initialized.accion,
    elemento_id: initialized.elementoId || null,
    datos_json: parsedDatosJson,
    estado: 'Pendiente' as const,
    solicitante: initialized.solicitante,
    ruta_archivo_temp: initialized.rutaArchivoTemp || null,
    metadata_archivo: parsedMetadataArchivo,
    paso_actual: initialized.pasoActual,
    total_pasos: initialized.totalPasos,
    aprobador_paso_actual: initialized.aprobadorPasoActual || null,
    historial_pasos: initialized.historialPasos,
    area_solicitante_id: initialized.areaSolicitanteId ? String(initialized.areaSolicitanteId) : null,
    flujo_version: initialized.flujoVersion || 1,
    organizacion_id: DEFAULT_ORG_ID,
  };

  const { data, error } = await supabase
    .from('aprobaciones')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[ApprovalRepo] Error inserting approval request:', error);
    throw error;
  }

  const created = mapToApprovalRequest(data);
  await sendApprovalEmailNotification(created);
  return created;
}

async function sendApprovalEmailNotification(request: ApprovalRequest): Promise<void> {
  const approvers = request.aprobadorPasoActual
    ? request.aprobadorPasoActual.split(';').map(e => e.trim()).filter(Boolean)
    : [];

  if (approvers.length === 0) {
    console.log('[ApprovalEmail] No approvers defined for request:', request.titulo);
    return;
  }

  const currentStep = request.historialPasos?.find(step => step.paso === request.pasoActual);
  const stepName = currentStep ? currentStep.nombrePaso : 'Aprobación';

  const portalUrl = window.location.origin;
  const approveLink = `${portalUrl}/aprobaciones?id=${request.id}&action=Aprobado`;
  const rejectLink = `${portalUrl}/aprobaciones?id=${request.id}&action=Rechazado`;

  const emailSubject = `[SGI] Aprobación Requerida: ${request.titulo}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background-color: #001F3F; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold;">Portal SGI - Sistema de Gestión Integrado</h2>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF; color: #334155; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0; font-weight: bold;">Estimado(a) Encargado(a),</p>
        <p>Se ha registrado una solicitud de aprobación en el **Sistema de Gestión Integrado (SGI)** que requiere su revisión y decisión:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #F8FAFC; border-radius: 6px; overflow: hidden;">
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #E2E8F0; width: 140px; color: #475569;">Título:</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">${request.titulo}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #E2E8F0; color: #475569;">Elemento:</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">${request.tipoElemento}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #E2E8F0; color: #475569;">Acción:</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">${request.accion}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #E2E8F0; color: #475569;">Solicitante:</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">${request.solicitante}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #475569;">Paso de Flujo:</td>
            <td style="padding: 12px; color: #1E293B;">${request.pasoActual} de ${request.totalPasos} (${stepName})</td>
          </tr>
        </table>
        
        <p style="margin-top: 24px; text-align: center; font-weight: bold; color: #0F172A; font-size: 15px;">¿Desea procesar esta solicitud directamente?</p>
        
        <div style="margin: 24px 0; text-align: center;">
          <a href="${approveLink}" style="display: inline-block; background-color: #107C10; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 16px; font-size: 14px;">Aprobar desde Correo</a>
          <a href="${rejectLink}" style="display: inline-block; background-color: #DC143C; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Rechazar desde Correo</a>
        </div>
        
        <p style="font-size: 11px; color: #64748B; margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          **Nota de seguridad**: Al hacer clic en los enlaces anteriores, se abrirá de forma segura el portal SGI y su decisión se guardará automáticamente en el sistema.
        </p>
      </div>
    </div>
  `;

  console.log(`[SIMULADOR CORREO] Destinatarios: ${approvers.join(', ')}`);
  console.log(`[SIMULADOR CORREO] Asunto: ${emailSubject}`);
  console.log(`[SIMULADOR CORREO] Enlace Aprobar: ${approveLink}`);
  console.log(`[SIMULADOR CORREO] Enlace Rechazar: ${rejectLink}`);

  if (typeof window !== 'undefined') {
    const event = new CustomEvent('sgi-dev-email', {
      detail: { to: approvers, subject: emailSubject, body: emailBody }
    });
    window.dispatchEvent(event);
  }
}

export async function updateApprovalStatus(
  id: string | number,
  status: 'Aprobado' | 'Rechazado',
  aprobador: string,
  comentarios?: string,
  token?: string
): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('aprobaciones')
    .select('*')
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID)
    .single();

  if (fetchError || !data) {
    throw new Error(`Solicitud de aprobación con ID ${id} no encontrada`);
  }

  const current = mapToApprovalRequest(data);
  const advanced = advanceFlow(current, status, aprobador, comentarios);

  const payload = {
    estado: advanced.estado,
    aprobador: advanced.aprobador || null,
    fecha_accion: advanced.fechaAccion ? advanced.fechaAccion.toISOString() : null,
    comentarios: advanced.comentarios || null,
    paso_actual: advanced.pasoActual,
    aprobador_paso_actual: advanced.aprobadorPasoActual || null,
    historial_pasos: advanced.historialPasos || [],
    flujo_version: advanced.flujoVersion || 1,
  };

  const { error: updateError } = await supabase
    .from('aprobaciones')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (updateError) {
    throw updateError;
  }

  if (advanced.estado === 'Pendiente') {
    await sendApprovalEmailNotification(advanced as ApprovalRequest);
  }
}

export async function resubmitApproval(
  id: string | number,
  token?: string
): Promise<ApprovalRequest> {
  const { data, error: fetchError } = await supabase
    .from('aprobaciones')
    .select('*')
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID)
    .single();

  if (fetchError || !data) {
    throw new Error(`Solicitud de aprobación con ID ${id} no encontrada`);
  }

  const current = mapToApprovalRequest(data);

  let processes: Process[] = [];
  try {
    processes = await getAllProcesses(token);
  } catch (e) {
    console.warn('Error loading processes for flow resubmission', e);
  }

  const allAreas = await getAllAreas(token);
  const areaSolicitanteId = current.areaSolicitanteId || '2';
  const areaJerarquia = resolveAreaJerarquia(areaSolicitanteId, allAreas);

  let steps: any[];
  if (areaJerarquia) {
    steps = buildFlowSteps(areaJerarquia, current.tipoElemento, processes);
  } else {
    const calidadEmails = getCalidadAprobadores(current.tipoElemento, processes);
    steps = [{
      paso: 1,
      nombrePaso: 'Calidad',
      aprobador: calidadEmails.join(';') || 'ana@acme.com',
      decision: 'Pendiente'
    }];
  }

  const resubmitted = resubmitFlow(current, steps);

  const payload = {
    estado: resubmitted.estado,
    aprobador: null,
    fecha_accion: null,
    comentarios: null,
    paso_actual: resubmitted.pasoActual,
    aprobador_paso_actual: resubmitted.aprobadorPasoActual || null,
    historial_pasos: resubmitted.historialPasos || [],
    flujo_version: resubmitted.flujoVersion,
  };

  const { error: updateError } = await supabase
    .from('aprobaciones')
    .update(payload)
    .eq('id', String(id))
    .eq('organizacion_id', DEFAULT_ORG_ID);

  if (updateError) {
    throw updateError;
  }

  return resubmitted;
}
