-- ============================================================
-- SGI SaaS — Schema Principal
-- Sistema de Gestión Integrado — Genérico Multi-empresa
-- ============================================================

-- 0. Organización (branding / config del tenant)
CREATE TABLE organizacion (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#001F3F',
  color_secundario TEXT DEFAULT '#107C10',
  dominio TEXT,                    -- Para white-labeling futuro
  config JSONB DEFAULT '{}',       -- Configuración flexible
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Áreas (jerarquía self-referencing)
CREATE TABLE areas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  responsable TEXT,
  responsable_email TEXT,
  nivel TEXT CHECK (nivel IN ('Seccion', 'Division', 'Departamento', 'Direccion', 'Area')),
  dependencia_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(codigo, organizacion_id)
);

-- 2. Usuarios
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  auth_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Link a Supabase Auth
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'Usuario' CHECK (rol IN ('Admin', 'DP', 'Encargado', 'Usuario')),
  roles TEXT[] DEFAULT '{}',
  area_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, organizacion_id)
);

-- 3. Objetivos
CREATE TABLE objetivos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  area TEXT,
  responsable TEXT,
  fecha_inicio DATE,
  fecha_cierre DATE,
  estado TEXT DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_curso', 'completado')),
  meta NUMERIC,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Procesos
CREATE TABLE procesos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  alcance TEXT,
  responsable TEXT,
  responsable_emails TEXT[] DEFAULT '{}',
  area TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'en_revision')),
  tipo_proceso TEXT,
  procedimiento_asociado TEXT,
  objetivo_ids INTEGER[] DEFAULT '{}',
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(codigo, organizacion_id)
);

-- 5. Indicadores (KPIs)
CREATE TABLE indicadores (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  meta NUMERIC,
  resultado_actual NUMERIC,
  unidad TEXT DEFAULT '%',
  responsable TEXT,
  proceso_id BIGINT REFERENCES procesos(id) ON DELETE SET NULL,
  periodicidad TEXT DEFAULT 'Trimestral',
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Mediciones
CREATE TABLE mediciones (
  id BIGSERIAL PRIMARY KEY,
  indicador_id BIGINT NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  valor NUMERIC,
  fecha DATE,
  comentarios TEXT,
  mes TEXT,
  anio INTEGER,
  trimestre TEXT,
  autor TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. SIPOC
CREATE TABLE sipoc (
  id BIGSERIAL PRIMARY KEY,
  proceso_id BIGINT NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
  actividad TEXT NOT NULL,
  proveedores TEXT,
  insumos TEXT,
  productos TEXT,
  cliente TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Actividades de Proceso
CREATE TABLE actividades (
  id BIGSERIAL PRIMARY KEY,
  proceso_id BIGINT NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
  actividad TEXT NOT NULL,
  descripcion TEXT,
  entrada TEXT,
  salida TEXT,
  responsable TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Riesgos
CREATE TABLE riesgos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  probabilidad INTEGER CHECK (probabilidad BETWEEN 1 AND 3),
  impacto INTEGER CHECK (impacto BETWEEN 1 AND 3),
  responsable TEXT,
  proceso_id BIGINT REFERENCES procesos(id) ON DELETE SET NULL,
  proceso_asociado TEXT,
  estado TEXT DEFAULT 'Activo',
  plan_mitigacion TEXT,
  tipo_riesgo TEXT,
  nivel_riesgo TEXT,
  exposicion_riesgo NUMERIC,
  vp NUMERIC, vi NUMERIC, vnr NUMERIC, vpd NUMERIC,
  vo NUMERIC, ve NUMERIC, vcc NUMERIC, ver NUMERIC,
  origen TEXT, consecuencia TEXT, control TEXT,
  periodicidad TEXT, oportunidad TEXT, ejecucion TEXT,
  clasificacion_control TEXT, estado_riesgo TEXT,
  compromiso TEXT, fecha_implementacion DATE,
  plan_accion_asociado TEXT, responsables TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Glosario
CREATE TABLE glosario (
  id BIGSERIAL PRIMARY KEY,
  termino TEXT NOT NULL,
  definicion TEXT NOT NULL,
  proceso_id BIGINT REFERENCES procesos(id) ON DELETE SET NULL,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Documentos (metadata; archivos en Storage)
CREATE TABLE documentos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  version INTEGER DEFAULT 1,
  fecha_publicacion TIMESTAMPTZ DEFAULT now(),
  proceso_id BIGINT REFERENCES procesos(id) ON DELETE SET NULL,
  tipo_documento TEXT,
  storage_path TEXT,
  es_carpeta BOOLEAN DEFAULT false,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Aprobaciones
CREATE TABLE aprobaciones (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo_elemento TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('Crear', 'Modificar', 'Eliminar', 'Subir')),
  elemento_id TEXT,
  datos_json JSONB DEFAULT '{}',
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
  solicitante TEXT NOT NULL,
  aprobador TEXT,
  fecha_accion TIMESTAMPTZ,
  comentarios TEXT,
  ruta_archivo_temp TEXT,
  metadata_archivo JSONB,
  paso_actual INTEGER DEFAULT 1,
  total_pasos INTEGER DEFAULT 1,
  aprobador_paso_actual TEXT,
  historial_pasos JSONB DEFAULT '[]',
  area_solicitante_id BIGINT REFERENCES areas(id) ON DELETE SET NULL,
  flujo_version INTEGER DEFAULT 1,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Bitácora
CREATE TABLE bitacora (
  id BIGSERIAL PRIMARY KEY,
  usuario TEXT NOT NULL,
  accion TEXT NOT NULL,
  elemento TEXT,
  detalle TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Alertas
CREATE TABLE alertas (
  id BIGSERIAL PRIMARY KEY,
  usuario TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  link TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Acciones Correctivas
CREATE TABLE acciones_correctivas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  proceso_id BIGINT REFERENCES procesos(id) ON DELETE SET NULL,
  proceso_asociado TEXT,
  origen TEXT,
  hallazgo TEXT,
  acciones TEXT,
  responsable TEXT,
  fecha_compromiso DATE,
  fecha_seguimiento DATE,
  fecha_implementacion DATE,
  fecha_verificacion DATE,
  estado TEXT DEFAULT 'Abierta',
  categorizacion TEXT,
  norma TEXT,
  requisitos TEXT,
  organizacion_id BIGINT REFERENCES organizacion(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ======================
-- ÍNDICES
-- ======================
CREATE INDEX idx_areas_org ON areas(organizacion_id);
CREATE INDEX idx_areas_dep ON areas(dependencia_id);
CREATE INDEX idx_usuarios_auth ON usuarios(auth_uid);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_org ON usuarios(organizacion_id);
CREATE INDEX idx_procesos_org ON procesos(organizacion_id);
CREATE INDEX idx_indicadores_proceso ON indicadores(proceso_id);
CREATE INDEX idx_indicadores_org ON indicadores(organizacion_id);
CREATE INDEX idx_mediciones_indicador ON mediciones(indicador_id);
CREATE INDEX idx_riesgos_proceso ON riesgos(proceso_id);
CREATE INDEX idx_riesgos_org ON riesgos(organizacion_id);
CREATE INDEX idx_sipoc_proceso ON sipoc(proceso_id);
CREATE INDEX idx_documentos_proceso ON documentos(proceso_id);
CREATE INDEX idx_aprobaciones_estado ON aprobaciones(estado);
CREATE INDEX idx_aprobaciones_solicitante ON aprobaciones(solicitante);
CREATE INDEX idx_bitacora_fecha ON bitacora(created_at DESC);
CREATE INDEX idx_alertas_usuario ON alertas(usuario);
CREATE INDEX idx_glosario_proceso ON glosario(proceso_id);
CREATE INDEX idx_actividades_proceso ON actividades(proceso_id);
CREATE INDEX idx_correctivas_proceso ON acciones_correctivas(proceso_id);

-- ======================
-- TRIGGERS updated_at
-- ======================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizacion_upd BEFORE UPDATE ON organizacion FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_areas_upd BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usuarios_upd BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_procesos_upd BEFORE UPDATE ON procesos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_indicadores_upd BEFORE UPDATE ON indicadores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_riesgos_upd BEFORE UPDATE ON riesgos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documentos_upd BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_aprobaciones_upd BEFORE UPDATE ON aprobaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_correctivas_upd BEFORE UPDATE ON acciones_correctivas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
