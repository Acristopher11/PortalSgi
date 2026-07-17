/**
 * approvalFlowEngine.ts
 * Motor del flujo de aprobación jerárquica secuencial para el SGI Portal.
 *
 * Responsabilidades:
 *  - Detectar el aprobador de Calidad según el tipo de elemento y los procesos SGI-0X.
 *  - Construir la secuencia de pasos basada en la jerarquía Lookup del área del solicitante.
 *  - Avanzar al siguiente paso o marcar como aprobado/rechazado final.
 *  - Verificar si un usuario puede aprobar el paso actual.
 *  - Calcular el progreso porcentual del flujo.
 *
 * NO tiene dependencias de UI (React, componentes, etc.).
 * Solo depende de los tipos definidos en ../types/index.ts
 */

import type { ApprovalRequest, ApprovalStep, AreaJerarquia, Area, Process } from '../types';

// ---------------------------------------------------------------------------
// Constantes del flujo
// ---------------------------------------------------------------------------

/** Orden canónico de los niveles jerárquicos (del más bajo al más alto). */
const NIVEL_ORDER: Array<Area['nivel']> = [
  'Sección',
  'División',
  'Departamento',
  'Dirección',
];

/** Mapeo de nivel jerárquico → nombre de paso legible. */
const NIVEL_TO_PASO_NOMBRE: Record<string, string> = {
  'Sección':     'Sección',
  'División':    'División',
  'Departamento': 'Departamento',
  'Dirección':   'Dirección',
};

/**
 * Mapeo: tipoElemento → código del proceso SGI responsable de Calidad.
 * Proceso   → P-SGI-01 (Gestión Documental / SGI en general)
 * KPI       → P-SGI-02 (Planificación y Seguimiento)
 * Riesgo    → P-SGI-07 (Gestión de Riesgos)
 * Glosario  → P-SGI-01
 * Documento → P-SGI-01
 * SIPOC     → P-SGI-01
 * Medicion  → P-SGI-02
 */
const TIPO_ELEMENTO_A_PROCESO_CALIDAD: Record<string, string> = {
  'Proceso':   'P-SGI-01',
  'Glosario':  'P-SGI-01',
  'Documento': 'P-SGI-01',
  'SIPOC':     'P-SGI-01',
  'KPI':       'P-SGI-02',
  'Medicion':  'P-SGI-02',
  'Riesgo':    'P-SGI-07',
};

// ---------------------------------------------------------------------------
// Función 1: getCalidadAprobador
// ---------------------------------------------------------------------------

/**
 * Devuelve el/los emails del responsable de Calidad para el tipo de elemento dado.
 * Busca el proceso SGI correspondiente y retorna sus responsableEmails.
 *
 * @param tipoElemento - Tipo del elemento que se está aprobando
 * @param processes    - Lista completa de procesos cargados en el store
 * @returns Array de emails de los aprobadores de Calidad (vacío si no se encuentra)
 */
export function getCalidadAprobadores(
  tipoElemento: string,
  processes: Process[]
): string[] {
  const codigoProceso = TIPO_ELEMENTO_A_PROCESO_CALIDAD[tipoElemento];
  if (!codigoProceso) {
    console.warn(`[FlowEngine] Tipo de elemento desconocido: ${tipoElemento}. Usando P-SGI-01 como fallback.`);
    const fallback = processes.find(p => p.codigo === 'P-SGI-01');
    return fallback?.responsableEmails ?? [];
  }
  const proceso = processes.find(p => p.codigo === codigoProceso);
  if (!proceso) {
    console.warn(`[FlowEngine] No se encontró proceso ${codigoProceso} en el store.`);
    return [];
  }
  return proceso.responsableEmails ?? [];
}

// ---------------------------------------------------------------------------
// Función 2: resolveAreaJerarquia
// ---------------------------------------------------------------------------

/**
 * Construye la jerarquía de un área recorriendo la cadena de Dependencia (Lookup).
 * Para cada área en la cadena, identifica su nivel y el responsable (email).
 *
 * Algoritmo:
 *  1. Empieza desde el área del solicitante.
 *  2. Sube por dependenciaId hasta encontrar un área sin padre o de nivel Dirección.
 *  3. Acumula responsables por nivel (Sección, División, Departamento, Dirección).
 *
 * @param areaId   - ID del área del solicitante
 * @param allAreas - Lista completa de áreas desde areaRepository
 * @returns AreaJerarquia con emails agrupados por nivel
 */
export function resolveAreaJerarquia(
  areaId: string,
  allAreas: Area[]
): AreaJerarquia | null {
  const areaMap = new Map(allAreas.map(a => [a.id, a]));
  const startArea = areaMap.get(areaId);
  if (!startArea) {
    console.warn(`[FlowEngine] Área con ID ${areaId} no encontrada.`);
    return null;
  }

  const result: AreaJerarquia = {
    areaId: startArea.id,
    areaNombre: startArea.nombre,
  };

  // Recorrer la cadena hacia arriba (máximo 10 niveles para evitar ciclos)
  let current: Area | undefined = startArea;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current.id)) {
      console.warn(`[FlowEngine] Ciclo detectado en jerarquía de áreas en ID: ${current.id}`);
      break;
    }
    visited.add(current.id);

    const nivel = current.nivel?.trim();
    const email = current.responsableEmail;

    if (nivel && email) {
      switch (nivel) {
        case 'Sección':
          result.emailsSeccion = [...(result.emailsSeccion ?? []), email];
          break;
        case 'División':
          result.emailsDivision = [...(result.emailsDivision ?? []), email];
          break;
        case 'Departamento':
          result.emailsDepartamento = [...(result.emailsDepartamento ?? []), email];
          break;
        case 'Dirección':
          result.emailsDireccion = [...(result.emailsDireccion ?? []), email];
          break;
      }
    }

    // Subir al padre usando dependenciaId (Lookup)
    if (current.dependenciaId) {
      current = areaMap.get(current.dependenciaId);
    } else {
      break; // Llegamos a la raíz
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Función 3: buildFlowSteps
// ---------------------------------------------------------------------------

/**
 * Construye la secuencia ordenada de pasos de aprobación para una solicitud.
 *
 * Paso 1 siempre es Calidad (responsable del proceso SGI-0X).
 * Los pasos siguientes se derivan de la jerarquía del área del solicitante,
 * en orden ascendente: Sección → División → Departamento → Dirección.
 * Solo se incluyen los niveles que existen (tienen responsable con email).
 *
 * @param areaJerarquia - Jerarquía resuelta del área del solicitante
 * @param tipoElemento  - Tipo del elemento
 * @param processes     - Procesos del store (para encontrar aprobador de Calidad)
 * @returns Array ordenado de ApprovalStep con decisión inicial 'Pendiente'
 */
export function buildFlowSteps(
  areaJerarquia: AreaJerarquia,
  tipoElemento: string,
  processes: Process[]
): ApprovalStep[] {
  const steps: ApprovalStep[] = [];

  // Paso 1: Calidad
  const calidadEmails = getCalidadAprobadores(tipoElemento, processes);
  steps.push({
    paso: 1,
    nombrePaso: 'Calidad',
    aprobador: calidadEmails.join(';'), // Todos los responsables del proceso SGI
    decision: 'Pendiente',
  });

  // Pasos 2-5: jerarquía del área (en orden ascendente)
  let pasoNum = 2;
  for (const nivel of NIVEL_ORDER) {
    if (!nivel) continue;
    const emails = getNivelEmails(areaJerarquia, nivel);
    if (emails && emails.length > 0) {
      steps.push({
        paso: pasoNum,
        nombrePaso: NIVEL_TO_PASO_NOMBRE[nivel] ?? nivel,
        aprobador: emails[0], // Primer responsable del nivel
        decision: 'Pendiente',
      });
      pasoNum++;
    }
  }

  return steps;
}

/** Helper interno: obtiene emails de un nivel de jerarquía. */
function getNivelEmails(
  jerarquia: AreaJerarquia,
  nivel: string
): string[] | undefined {
  switch (nivel) {
    case 'Sección':     return jerarquia.emailsSeccion;
    case 'División':    return jerarquia.emailsDivision;
    case 'Departamento': return jerarquia.emailsDepartamento;
    case 'Dirección':   return jerarquia.emailsDireccion;
    default: return undefined;
  }
}

// ---------------------------------------------------------------------------
// Función 4: advanceFlow
// ---------------------------------------------------------------------------

/**
 * Procesa la decisión de un aprobador y avanza el flujo al siguiente paso,
 * o lo marca como aprobado/rechazado final.
 *
 * Reglas:
 *  - Si es Aprobado y hay más pasos → avanza pasoActual y actualiza aprobadorPasoActual.
 *  - Si es Aprobado y era el último paso → marca estado como 'Aprobado'.
 *  - Si es Rechazado → marca estado como 'Rechazado' (el solicitante puede corregir
 *    y reenviar, lo que reiniciará el flujo desde Calidad en una nueva versión).
 *
 * @param approval     - ApprovalRequest actual (inmutable, retorna nuevo objeto)
 * @param decision     - 'Aprobado' | 'Rechazado'
 * @param aprobadorEmail - Email del usuario que toma la decisión
 * @param comentario   - Comentario opcional
 * @returns Nuevo ApprovalRequest con el estado actualizado
 */
export function advanceFlow(
  approval: ApprovalRequest,
  decision: 'Aprobado' | 'Rechazado',
  aprobadorEmail: string,
  comentario?: string
): ApprovalRequest {
  const now = new Date().toISOString();
  const historial: ApprovalStep[] = approval.historialPasos
    ? [...approval.historialPasos]
    : [];
  const pasoActual = approval.pasoActual ?? 1;
  const totalPasos = approval.totalPasos ?? 1;

  // Actualizar el paso actual en el historial
  const pasoIdx = historial.findIndex(s => s.paso === pasoActual);
  if (pasoIdx !== -1) {
    historial[pasoIdx] = {
      ...historial[pasoIdx],
      decision,
      fecha: now,
      comentario: comentario ?? historial[pasoIdx].comentario,
    };
  }

  if (decision === 'Rechazado') {
    return {
      ...approval,
      estado: 'Rechazado',
      aprobador: aprobadorEmail,
      fechaAccion: new Date(),
      comentarios: comentario,
      historialPasos: historial,
    };
  }

  // Aprobado: avanzar al siguiente paso
  const nextPaso = pasoActual + 1;
  if (nextPaso > totalPasos) {
    // Era el último paso → aprobado final
    return {
      ...approval,
      estado: 'Aprobado',
      aprobador: aprobadorEmail,
      fechaAccion: new Date(),
      comentarios: comentario,
      pasoActual: totalPasos,
      historialPasos: historial,
    };
  }

  // Hay más pasos → avanzar
  const siguientePaso = historial.find(s => s.paso === nextPaso);
  return {
    ...approval,
    pasoActual: nextPaso,
    aprobadorPasoActual: siguientePaso?.aprobador ?? '',
    historialPasos: historial,
    comentarios: comentario ?? approval.comentarios,
  };
}

// ---------------------------------------------------------------------------
// Función 5: initializeFlow
// ---------------------------------------------------------------------------

/**
 * Inicializa un ApprovalRequest recién creado con los pasos del flujo calculados.
 * Debe llamarse al crear una nueva solicitud (antes de persistir en SharePoint).
 *
 * @param approval - ApprovalRequest sin datos de flujo
 * @param steps    - Pasos calculados con buildFlowSteps
 * @param areaSolicitanteId - ID del área del solicitante
 * @returns ApprovalRequest con pasoActual=1, totalPasos, aprobadorPasoActual e historial inicializado
 */
export function initializeFlow(
  approval: Omit<ApprovalRequest, 'id' | 'fechaSolicitud' | 'estado'>,
  steps: ApprovalStep[],
  areaSolicitanteId: string
): Omit<ApprovalRequest, 'id' | 'fechaSolicitud' | 'estado'> {
  return {
    ...approval,
    pasoActual: 1,
    totalPasos: steps.length,
    aprobadorPasoActual: steps[0]?.aprobador ?? '',
    historialPasos: steps,
    areaSolicitanteId,
    flujoVersion: (approval.flujoVersion ?? 0) + 1,
  };
}

// ---------------------------------------------------------------------------
// Función 6: resubmitFlow
// ---------------------------------------------------------------------------

/**
 * Prepara un flujo rechazado para ser reenviado por el solicitante.
 * SIEMPRE reinicia desde el Paso 1 (Calidad), independientemente del paso de rechazo.
 * Incrementa flujoVersion para rastreo de intentos.
 *
 * @param approval - ApprovalRequest rechazado
 * @param steps    - Nuevos pasos calculados (puede ser los mismos o actualizados)
 * @returns ApprovalRequest listo para reenvío
 */
export function resubmitFlow(
  approval: ApprovalRequest,
  steps: ApprovalStep[]
): ApprovalRequest {
  return {
    ...approval,
    estado: 'Pendiente',
    pasoActual: 1,
    totalPasos: steps.length,
    aprobadorPasoActual: steps[0]?.aprobador ?? '',
    historialPasos: steps, // historial limpio para el nuevo intento
    flujoVersion: (approval.flujoVersion ?? 1) + 1,
    aprobador: undefined,
    fechaAccion: undefined,
    comentarios: undefined,
  };
}

// ---------------------------------------------------------------------------
// Función 7: canUserApproveStep
// ---------------------------------------------------------------------------

/**
 * Verifica si el email del usuario puede aprobar el paso actual de una solicitud.
 *
 * Un usuario puede aprobar si:
 *  - La solicitud está Pendiente
 *  - El email coincide con el aprobadorPasoActual del paso en curso
 *
 * @param approval  - ApprovalRequest a evaluar
 * @param userEmail - Email del usuario actual
 * @returns true si el usuario puede aprobar/rechazar el paso actual
 */
export function canUserApproveStep(
  approval: ApprovalRequest,
  userEmail: string
): boolean {
  if (approval.estado !== 'Pendiente') return false;
  const email = userEmail.toLowerCase();

  // Si hay pasoActual definido, usar el aprobadorPasoActual del historial
  if (approval.pasoActual && approval.historialPasos) {
    const step = approval.historialPasos.find(s => s.paso === approval.pasoActual);
    if (step) {
      const list = step.aprobador.split(';').map(e => e.trim().toLowerCase());
      return list.includes(email);
    }
  }

  // Fallback: compatibilidad con solicitudes sin flujo jerárquico (campo legacy)
  if (approval.aprobadorPasoActual) {
    const list = approval.aprobadorPasoActual.split(';').map(e => e.trim().toLowerCase());
    return list.includes(email);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Función 8: getFlowProgress
// ---------------------------------------------------------------------------

/**
 * Calcula el porcentaje de completitud del flujo de aprobación.
 *
 * @param approval - ApprovalRequest
 * @returns Número entre 0 y 100
 */
export function getFlowProgress(approval: ApprovalRequest): number {
  if (approval.estado === 'Aprobado') return 100;
  if (approval.estado === 'Rechazado') return 0;

  const total = approval.totalPasos ?? 1;
  const actual = approval.pasoActual ?? 1;

  // Pasos completados = pasos anteriores al actual
  const completed = actual - 1;
  return Math.round((completed / total) * 100);
}

// ---------------------------------------------------------------------------
// Función 9: getFlowSummary (utilidad de display)
// ---------------------------------------------------------------------------

export interface FlowSummary {
  pasoActualLabel: string;
  aprobadorActual: string;
  progreso: number;
  esReenvio: boolean;
  numeroReenvio: number;
  pasos: ApprovalStep[];
}

/**
 * Retorna un resumen legible del estado del flujo para la UI.
 */
export function getFlowSummary(approval: ApprovalRequest): FlowSummary {
  const paso = approval.pasoActual ?? 1;
  const historial = approval.historialPasos ?? [];
  const stepActual = historial.find(s => s.paso === paso);

  return {
    pasoActualLabel: stepActual?.nombrePaso ?? 'Calidad',
    aprobadorActual: approval.aprobadorPasoActual ?? '',
    progreso: getFlowProgress(approval),
    esReenvio: (approval.flujoVersion ?? 1) > 1,
    numeroReenvio: approval.flujoVersion ?? 1,
    pasos: historial,
  };
}
