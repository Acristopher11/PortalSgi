-- ============================================================
-- RLS — Row Level Security Policies
-- ============================================================
-- Lógica migrada desde useAuth.ts (isAdmin, canModifyProcess, etc.)
-- Cada tabla tiene policies basadas en el rol del usuario en `usuarios`

-- Helper function: obtiene el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE auth_uid = auth.uid() AND activo = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: obtiene la organizacion_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS BIGINT AS $$
  SELECT organizacion_id FROM usuarios WHERE auth_uid = auth.uid() AND activo = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: obtiene el email del usuario actual
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT AS $$
  SELECT email FROM usuarios WHERE auth_uid = auth.uid() AND activo = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: ¿es admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM usuarios
    WHERE auth_uid = auth.uid() AND activo = true AND rol = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: ¿es dueño de un proceso?
CREATE OR REPLACE FUNCTION is_process_owner(p_proceso_id BIGINT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM procesos p, usuarios u
    WHERE p.id = p_proceso_id
      AND u.auth_uid = auth.uid()
      AND u.activo = true
      AND u.email = ANY(p.responsable_emails)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: ¿es dueño de un indicador (KPI)?
CREATE OR REPLACE FUNCTION is_kpi_process_owner(p_indicador_id BIGINT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM indicadores k, procesos p, usuarios u
    WHERE k.id = p_indicador_id
      AND k.proceso_id = p.id
      AND u.auth_uid = auth.uid()
      AND u.activo = true
      AND u.email = ANY(p.responsable_emails)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Policies para cada tabla
-- ============================================================

-- 0. ORGANIZACION
ALTER TABLE organizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_select ON organizacion FOR SELECT USING (
  id = get_user_org_id()
);
CREATE POLICY org_write ON organizacion FOR ALL USING (
  is_admin()
);

-- 1. AREAS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY areas_select ON areas FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY areas_write ON areas FOR ALL USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 2. USUARIOS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuarios_select ON usuarios FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY usuarios_insert ON usuarios FOR INSERT WITH CHECK (
  is_admin()
);
CREATE POLICY usuarios_update ON usuarios FOR UPDATE USING (
  is_admin() OR auth_uid = auth.uid()
);
CREATE POLICY usuarios_delete ON usuarios FOR DELETE USING (
  is_admin()
);

-- 3. OBJETIVOS
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY objetivos_select ON objetivos FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY objetivos_write ON objetivos FOR ALL USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 4. PROCESOS
ALTER TABLE procesos ENABLE ROW LEVEL SECURITY;
CREATE POLICY procesos_select ON procesos FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY procesos_insert ON procesos FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id() AND (is_admin() OR get_user_rol() = 'DP')
);
CREATE POLICY procesos_update ON procesos FOR UPDATE USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR get_user_email() = ANY(responsable_emails))
);
CREATE POLICY procesos_delete ON procesos FOR DELETE USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 5. INDICADORES (KPIs)
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY indicadores_select ON indicadores FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY indicadores_insert ON indicadores FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);
CREATE POLICY indicadores_update ON indicadores FOR UPDATE USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);
CREATE POLICY indicadores_delete ON indicadores FOR DELETE USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 6. MEDICIONES
ALTER TABLE mediciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY mediciones_select ON mediciones FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY mediciones_insert ON mediciones FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_kpi_process_owner(indicador_id))
);
CREATE POLICY mediciones_update ON mediciones FOR UPDATE USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_kpi_process_owner(indicador_id))
);
CREATE POLICY mediciones_delete ON mediciones FOR DELETE USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_kpi_process_owner(indicador_id))
);

-- 7. SIPOC
ALTER TABLE sipoc ENABLE ROW LEVEL SECURITY;
CREATE POLICY sipoc_select ON sipoc FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY sipoc_write ON sipoc FOR ALL USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);

-- 8. ACTIVIDADES DE PROCESO
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY actividades_select ON actividades FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY actividades_write ON actividades FOR ALL USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);

-- 9. RIESGOS
ALTER TABLE riesgos ENABLE ROW LEVEL SECURITY;
CREATE POLICY riesgos_select ON riesgos FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY riesgos_insert ON riesgos FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);
CREATE POLICY riesgos_update ON riesgos FOR UPDATE USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);
CREATE POLICY riesgos_delete ON riesgos FOR DELETE USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 10. GLOSARIO
ALTER TABLE glosario ENABLE ROW LEVEL SECURITY;
CREATE POLICY glosario_select ON glosario FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY glosario_write ON glosario FOR ALL USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);

-- 11. DOCUMENTOS
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY documentos_select ON documentos FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY documentos_write ON documentos FOR ALL USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);

-- 12. APROBACIONES
ALTER TABLE aprobaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY aprobaciones_select ON aprobaciones FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY aprobaciones_insert ON aprobaciones FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id()
);
CREATE POLICY aprobaciones_update ON aprobaciones FOR UPDATE USING (
  organizacion_id = get_user_org_id()
  -- Cualquiera puede responder si es el aprobador_paso_actual asignado o el aprobador final o es admin
  -- (se verifica que el email esté en el campo aprobador_paso_actual)
  AND (
    is_admin() 
    OR get_user_email() = solicitante 
    OR get_user_email() = aprobador 
    OR get_user_email() = ANY(string_to_array(aprobador_paso_actual, ';'))
  )
);
CREATE POLICY aprobaciones_delete ON aprobaciones FOR DELETE USING (
  organizacion_id = get_user_org_id() AND is_admin()
);

-- 13. BITÁCORA
ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;
CREATE POLICY bitacora_select ON bitacora FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY bitacora_insert ON bitacora FOR INSERT WITH CHECK (
  organizacion_id = get_user_org_id()
);

-- 14. ALERTAS
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY alertas_select ON alertas FOR SELECT USING (
  organizacion_id = get_user_org_id() AND usuario = get_user_email()
);
CREATE POLICY alertas_write ON alertas FOR ALL USING (
  organizacion_id = get_user_org_id()
);

-- 15. ACCIONES CORRECTIVAS
ALTER TABLE acciones_correctivas ENABLE ROW LEVEL SECURITY;
CREATE POLICY acciones_correctivas_select ON acciones_correctivas FOR SELECT USING (
  organizacion_id = get_user_org_id()
);
CREATE POLICY acciones_correctivas_write ON acciones_correctivas FOR ALL USING (
  organizacion_id = get_user_org_id()
  AND (is_admin() OR is_process_owner(proceso_id))
);

-- ============================================================
-- STORAGE BUCKET POLICIES
-- ============================================================
-- Las políticas de storage operan con roles de postgres y metadata
CREATE POLICY storage_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documentos'
);
CREATE POLICY storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documentos'
);
CREATE POLICY storage_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documentos'
);
