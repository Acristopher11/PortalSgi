// User & Auth Types
export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

// KPI Types
export interface KPI {
  id: string;
  nombre: string;
  descripcion: string;
  meta: number;
  valor_actual: number | null;
  unidad: string;
  responsable: string;
  area: string;
  fecha_ultima_actualizacion: Date;
  estado: 'on_track' | 'at_risk' | 'off_track' | 'no_data';
  tendencia: 'up' | 'down' | 'stable';
  periodicidad?: string;
  mediciones?: KPIMeasurement[];
  responsableEmails?: string[];
  periodo_medido_trimestre?: string;
  periodo_medido_anio?: number;
  processId?: string;
}

export interface KPIMeasurement {
  id: string;
  kpi_id: string;
  valor: number | null;
  fecha: Date;
  comentarios?: string;
  mes?: string;
  anio?: number;
  trimestre?: string;
}

export interface QualityObjective {
  id: string;
  codigo: string;
  nombre: string;
  meta?: number;
}

export interface KPIReport {
  kpi: KPI;
  mediciones: KPIMeasurement[];
  promedio_trimestral: number;
  cumplimiento_meta: number;
}

// Process Types
export interface Process {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  alcance?: string;
  responsable: string;
  area: string;
  estado: 'activo' | 'inactivo' | 'en_revision';
  fecha_creacion: Date;
  procedimiento_asociado?: string;
  responsableEmails?: string[];
  tipoProceso?: string;
  objetivosIds?: number[];
}

export interface ProcessSIPOC {
  proceso_id: string;
  proveedores: string[];
  entradas: string[];
  proceso: string;
  salidas: string[];
  clientes: string[];
}

// Risk Types
export interface Risk {
  id: string;
  nombre: string;
  descripcion: string;
  probabilidad: 1 | 2 | 3; // 1: Baja, 2: Moderada, 3: Alta
  impacto: 1 | 2 | 3;      // 1: Bajo, 2: Moderado, 3: Alto
  responsable: string;
  proceso_asociado: string;
  procesoId?: string;
  estado: string;
  plan_mitigacion?: string;
  fecha_creacion: Date;
  tipo_riesgo?: string;
  nivel_riesgo?: string;
  exposicion_riesgo?: number;
  // Campos de Control y Exposición Reales
  vp?: number;
  vi?: number;
  vnr?: number;
  vpd?: number;
  vo?: number;
  ve?: number;
  vcc?: number;
  ver?: number;
  origen?: string;
  consecuencia?: string;
  control?: string;
  periodicidad?: string;
  oportunidad?: string;
  ejecucion?: string;
  clasificacion_control?: string;
  estado_riesgo?: string;
  compromiso?: string;
  fecha_implementacion?: Date;
  pa_asoc?: string;
  responsables?: string;
}

export interface RiskMatrix {
  risks: Risk[];
  calor: number; // Score general
}

// Objective Types
export interface Objective {
  id: string;
  nombre: string;
  descripcion: string;
  area: string;
  responsable: string;
  fecha_inicio: Date;
  fecha_cierre: Date;
  estado: 'planificado' | 'en_curso' | 'completado';
  indicadores: string[];
}

// Area Types
export interface Area {
  id: string;
  nombre: string;          // NombreArea (internal SP column: Title)
  codigo: string;          // CodigoArea
  responsable: string;     // Responsable/Title
  responsableEmail?: string; // Responsable/EMail
  nivel?: string;          // Nivel: 'Sección' | 'División' | 'Departamento' | 'Dirección' | 'Área'
  dependencia?: string;    // Dependencia/Title — nombre del área padre (Lookup)
  dependenciaId?: string;  // Dependencia/Id   — ID del área padre (Lookup)
}

// Paso individual dentro del historial de aprobación jerárquica
export interface ApprovalStep {
  paso: number;
  nombrePaso: string;  // 'Calidad' | 'Sección' | 'División' | 'Departamento' | 'Dirección'
  aprobador: string;   // Email del aprobador de este paso
  decision: 'Pendiente' | 'Aprobado' | 'Rechazado';
  fecha?: string;      // ISO string
  comentario?: string;
}

// Jerarquía resuelta del área del solicitante (construida por el motor del flujo)
export interface AreaJerarquia {
  areaId: string;
  areaNombre: string;
  emailsSeccion?: string[];      // undefined = ese nivel no existe para esta área
  emailsDivision?: string[];
  emailsDepartamento?: string[];
  emailsDireccion?: string[];
}

// Usuario gestionado en la lista SGI_Usuarios
export interface SgiUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'DP' | 'Encargado' | 'Usuario';
  roles?: string[];
  areaId?: string;   // Solo para rol Encargado
  areaNombre?: string;
  activo: boolean;
}

// UI Types
export interface DashboardMetrics {
  totalKPIs: number;
  kpisOnTrack: number;
  kpisAtRisk: number;
  kpisOffTrack: number;
  totalProcesses: number;
  activeRisks: number;
  riskScore: number;
}

export interface FilterOptions {
  area?: string;
  responsable?: string;
  estado?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Glossary Types
export interface GlossaryTerm {
  id: string;
  termino: string; // Title
  definicion: string; // sgi_Definici_x00f3_n
  procesoId?: string; // sgi_ProcesoLookupId
  procesoAsociado?: string; // sgi_ProcesoLookup/Value
}

// Document Library Types
export interface DocumentItem {
  id: string;
  nombre: string; // {Name} or Title
  codigo: string; // C_x00f3_digo
  version: number; // sgi_Version
  fechaPublicacion: Date; // sgi_FechaPublicacion
  procesoId?: string; // sgi_ProcesoAsocId
  procesoAsociado?: string; // sgi_ProcesoAsoc/Value
  tipoDocumento?: string; // Categoria/Value
  link: string; // {Link}
  fullPath: string; // {FullPath}
  esCarpeta: boolean; // {IsFolder}
}

// SIPOC Types
export interface SIPOCItem {
  id: string;
  actividad: string; // Title
  procesoId: string; // sgi_SipocProcesoLookupId
  proveedores: string; // sgi_Proveedores
  insumos: string; // sgi_Insumos
  productos: string; // sgi_Productos
  cliente: string; // sgi_Cliente
}

// Activity Types
export interface ProcessActivity {
  id: string;
  procesoId: string;
  entrada: string;
  actividad: string; // Title
  descripcion: string;
  salida: string;
  responsable: string; // sgi_ResponsableText
}

// Activity Log Types (Bitácora)
export interface ActivityLog {
  id: string;
  usuario: string;
  accion: string;
  elemento: string;
  detalle: string;
  fecha: Date;
}

// Corrective Action Types
export interface CorrectiveAction {
  id: string;
  nombre: string; // Title
  procesoId?: string;
  procesoAsociado?: string;
  origen: string;
  hallazgo: string;
  acciones: string;
  responsable: string;
  fechaCompromiso?: string; // ISO string
  fechaSeguimiento?: string; // ISO string
  fechaImplementacion?: string; // ISO string
  fechaVerificacion?: string; // ISO string
  estado: string;
  categorizacion?: string;
  norma?: string;
  requisitos?: string;
}

// Approval Flow Types
export interface ApprovalRequest {
  id: string;
  titulo: string;
  tipoElemento: 'Proceso' | 'KPI' | 'Riesgo' | 'Glosario' | 'Documento' | 'SIPOC' | 'Medicion';
  accion: 'Crear' | 'Modificar' | 'Eliminar' | 'Subir';
  elementoId?: string;
  datosJson: string;          // JSON serializado del payload de la acción
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  solicitante: string;        // Email del solicitante
  aprobador?: string;         // Email del aprobador final (legacy / compatibilidad)
  fechaSolicitud: Date;
  fechaAccion?: Date;
  comentarios?: string;
  rutaArchivoTemp?: string;   // Ruta del archivo temporal en SP
  metadataArchivo?: string;   // JSON con metadatos del archivo temporal
  // --- Campos del flujo jerárquico secuencial ---
  pasoActual?: number;        // sgi_PasoActual: índice del paso en curso (1-based)
  totalPasos?: number;        // sgi_TotalPasos: total de pasos calculados para este flujo
  aprobadorPasoActual?: string; // sgi_AprobadorPaso: email del aprobador del paso actual
  historialPasos?: ApprovalStep[]; // sgi_HistorialPasos: JSON stringificado en SP
  areaSolicitanteId?: string; // sgi_AreaSolicitanteId: ID del área del solicitante
  flujoVersion?: number;      // sgi_FlujoVersion: 1=primer intento, 2=tras rechazo, etc.
}

export interface NotificationAlert {
  id: string;
  usuario: string; // Email of the target recipient
  mensaje: string;
  leida: boolean;
  fecha: Date;
  link?: string;
}


