-- ============================================================
-- DEMO DATA — Empresa genérica "Acme Corp" (SaaS)
-- 5 Procesos con 3 KPIs, 3 Riesgos, 3 Términos y 3 Actividades cada uno
-- ============================================================

-- Organización demo
INSERT INTO organizacion (id, nombre, color_primario, color_secundario, config)
VALUES (1, 'Acme Corp', '#1E3A5F', '#2ECC71', '{"modulos": ["procesos", "indicadores", "riesgos", "documentos", "aprobaciones", "acciones_correctivas"]}');

-- Áreas (jerarquía: Dirección → Departamento → División → Sección)
INSERT INTO areas (id, nombre, codigo, responsable, responsable_email, nivel, dependencia_id, organizacion_id) VALUES
(1, 'Dirección General',    'DIR-001', 'Carlos Méndez',   'carlos@acme.com',    'Direccion',    NULL, 1),
(2, 'Departamento de Calidad', 'DEP-CAL', 'Ana Torres',   'ana@acme.com',       'Departamento', 1,   1),
(3, 'Departamento de Operaciones', 'DEP-OPS', 'Luis Pérez', 'luis@acme.com',    'Departamento', 1,   1),
(4, 'División de Mejora Continua', 'DIV-MC',  'María Rojas', 'maria@acme.com',  'Division',     2,   1),
(5, 'Sección de Auditoría',  'SEC-AUD', 'Pedro Jiménez', 'pedro@acme.com',     'Seccion',      2,   1);

-- Usuarios demo (auth_uid se linkeará dinámicamente)
INSERT INTO usuarios (id, nombre, email, rol, area_id, organizacion_id, activo) VALUES
(1, 'Alejandro Christopher', 'alejandro.cristopher@gmail.com', 'Admin', NULL, 1, true),
(2, 'Ana Torres',            'ana@acme.com',                    'DP',    2,    1, true),
(3, 'Luis Pérez',            'luis@acme.com',                   'DP',    3,    1, true),
(4, 'María Rojas',           'maria@acme.com',                  'Encargado', 4, 1, true),
(5, 'Pedro Jiménez',         'pedro@acme.com',                  'Usuario',   5, 1, true);

-- Objetivos
INSERT INTO objetivos (id, codigo, nombre, descripcion, meta, estado, organizacion_id) VALUES
(1, 'OBJ-001', 'Reducir no conformidades',       'Reducir hallazgos de auditoría en un 30%',           30, 'en_curso', 1),
(2, 'OBJ-002', 'Mejorar satisfacción del cliente', 'Alcanzar 90% de satisfacción en encuestas',        90, 'en_curso', 1),
(3, 'OBJ-003', 'Optimizar tiempos de proceso',    'Reducir tiempos de ciclo en procesos críticos',      20, 'planificado', 1);

-- 5 Procesos del SGI (Genéricos, sin Gestión Documental)
INSERT INTO procesos (id, nombre, codigo, descripcion, responsable, responsable_emails, area, estado, tipo_proceso, organizacion_id) VALUES
(1, 'Gestión de Calidad',     'P-CAL-01', 'Planificación, aseguramiento y control de la calidad organizacional', 'Ana Torres',  ARRAY['ana@acme.com'],             'Calidad',     'activo', 'Estratégico', 1),
(2, 'Gestión de Operaciones', 'P-OPS-01', 'Planificación y prestación de servicios al cliente final',             'Luis Pérez', ARRAY['luis@acme.com'],            'Operaciones', 'activo', 'Clave',       1),
(3, 'Mejora Continua',        'P-MC-01',  'Metodologías de análisis y optimización de flujos de trabajo',         'María Rojas', ARRAY['maria@acme.com'],          'Calidad',     'activo', 'Soporte',     1),
(4, 'Gestión de Riesgos',     'P-RIE-01', 'Administración y mitigación de amenazas y oportunidades',              'Luis Pérez', ARRAY['luis@acme.com', 'ana@acme.com'], 'Operaciones', 'activo', 'Estratégico', 1),
(5, 'Tecnología e Innovación','P-TIC-01', 'Infraestructura, soporte técnico y desarrollo de software',            'Alejandro C.', ARRAY['alejandro.cristopher@gmail.com'], 'Tecnología', 'activo', 'Soporte',  1);

-- Indicadores (KPIs) — 3 por proceso
INSERT INTO indicadores (id, nombre, descripcion, meta, resultado_actual, unidad, proceso_id, periodicidad, organizacion_id) VALUES
-- P-CAL-01
(1, 'Eficacia de Auditorías', 'Porcentaje de auditorías conformes ejecutadas', 100, 92, '%', 1, 'Mensual', 1),
(2, 'Cierre de Hallazgos', 'Porcentaje de no conformidades cerradas a tiempo', 90, 85, '%', 1, 'Mensual', 1),
(3, 'Satisfacción de Calidad', 'Puntaje de satisfacción de la auditoría interna', 95, 90, '%', 1, 'Trimestral', 1),
-- P-OPS-01
(4, 'Eficiencia Operativa', 'Relación output/input en operaciones diarias', 95, 88, '%', 2, 'Mensual', 1),
(5, 'Cumplimiento de SLA', 'Porcentaje de entregables completados a tiempo', 92, 90, '%', 2, 'Mensual', 1),
(6, 'Errores en Órdenes', 'Tasa de errores de procesamiento y carga', 1, 1.5, '%', 2, 'Mensual', 1),
-- P-MC-01
(7, 'Implementación de Ideas', 'Porcentaje de ideas de mejora ejecutadas', 80, 75, '%', 3, 'Trimestral', 1),
(8, 'Retorno de Inversión', 'Porcentaje de ahorro financiero por mejoras', 15, 12, '%', 3, 'Semestral', 1),
(9, 'Participación del Staff', 'Porcentaje del personal proponiendo mejoras', 50, 42, '%', 3, 'Mensual', 1),
-- P-RIE-01
(10, 'Controles Efectivos', 'Riesgos críticos mitigados con controles validados', 100, 90, '%', 4, 'Trimestral', 1),
(11, 'Riesgos Residuales', 'Exposición promedio de riesgos residuales', 2, 2.5, 'score', 4, 'Trimestral', 1),
(12, 'Actualización de Matriz', 'Porcentaje de avance en revisión de riesgos', 95, 100, '%', 4, 'Mensual', 1),
-- P-TIC-01
(13, 'Uptime de Plataformas', 'Porcentaje de disponibilidad de servidores', 99.9, 99.8, '%', 5, 'Mensual', 1),
(14, 'Resolución de Tickets', 'Casos críticos resueltos dentro del SLA de TI', 90, 87, '%', 5, 'Mensual', 1),
(15, 'Respaldos Exitosos', 'Porcentaje de copias de seguridad correctas', 100, 100, '%', 5, 'Diario', 1);

-- Mediciones
INSERT INTO mediciones (indicador_id, valor, mes, anio, trimestre, autor, organizacion_id) VALUES
(1, 92, 'julio', 2025, 'Q3-2025', 'ana@acme.com', 1),
(4, 88, 'julio', 2025, 'Q3-2025', 'luis@acme.com', 1),
(7, 75, 'julio', 2025, 'Q3-2025', 'maria@acme.com', 1),
(10, 90, 'julio', 2025, 'Q3-2025', 'luis@acme.com', 1),
(13, 99.8, 'julio', 2025, 'Q3-2025', 'alejandro.cristopher@gmail.com', 1);

-- Riesgos — 3 por proceso
INSERT INTO riesgos (id, nombre, descripcion, probabilidad, impacto, responsable, proceso_id, proceso_asociado, estado, tipo_riesgo, nivel_riesgo, origen, consecuencia, control, organizacion_id) VALUES
-- P-CAL-01
(1, 'Desviación de Norma ISO', 'Incumplimiento de cláusulas esenciales de ISO 9001', 1, 3, 'Ana Torres', 1, 'P-CAL-01', 'Activo', 'Cumplimiento', 'Alto', 'Falta de auditorías de control', 'Pérdida de certificación internacional', 'Auditorías internas mensuales', 1),
(2, 'Retraso de Acciones', 'No conformidades abiertas que vencen sin resolverse', 2, 2, 'Ana Torres', 1, 'P-CAL-01', 'Activo', 'Operativo', 'Moderado', 'Bajo seguimiento del responsable', 'Vencimiento de plazos comprometidos', 'Alertas y notificaciones semanales', 1),
(3, 'Falta de Inducción SGI', 'Personal de reciente ingreso desconoce el mapa de procesos', 2, 2, 'María Rojas', 1, 'P-CAL-01', 'Activo', 'Operativo', 'Moderado', 'Ausencia de taller inicial de calidad', 'Fallas operativas en entregables', 'Inducción SGI obligatoria al ingresar', 1),
-- P-OPS-01
(4, 'Caída de Sistema Operativo', 'Fallo del servidor de operaciones principal', 1, 3, 'Luis Pérez', 2, 'P-OPS-01', 'Activo', 'Tecnológico', 'Alto', 'Sobrecarga de hardware', 'Detención de despachos e incidencias', 'Plan de contingencia y failover', 1),
(5, 'Cuello de Botella', 'Retraso en entregas por límite de capacidad', 2, 2, 'Luis Pérez', 2, 'P-OPS-01', 'Activo', 'Operativo', 'Moderado', 'Pico de órdenes no planificado', 'Insatisfacción de clientes finales', 'Balanceo de cargas y horas extras', 1),
(6, 'Error de Captura', 'Registro de datos erróneos de órdenes manuales', 2, 2, 'Luis Pérez', 2, 'P-OPS-01', 'Activo', 'Operativo', 'Moderado', 'Ingreso manual veloz', 'Reprocesos y reclamos de facturas', 'Doble validación o automatización', 1),
-- P-MC-01
(7, 'Resistencia al Cambio', 'Colaboradores no adoptan nuevas prácticas', 2, 2, 'María Rojas', 3, 'P-MC-01', 'Activo', 'Operativo', 'Moderado', 'Falta de comunicación de beneficios', 'Retrasos en adopción de herramientas', 'Taller de gestión del cambio', 1),
(8, 'Presupuesto Insuficiente', 'Falta de fondos para implementar ideas viables', 1, 3, 'María Rojas', 3, 'P-MC-01', 'Activo', 'Estratégico', 'Alto', 'Falta de previsión presupuestaria', 'Cancelación de proyectos rentables', 'Reserva anual para proyectos de mejora', 1),
(9, 'Abandono de Planes', 'Mejoras ejecutadas que pierden seguimiento', 2, 2, 'María Rojas', 3, 'P-MC-01', 'Activo', 'Operativo', 'Moderado', 'Falta de dueño de control asignado', 'Regresión al estado ineficiente previo', 'Auditoría interna post-cierre', 1),
-- P-RIE-01
(10, 'Riesgo Crítico No Visto', 'Nuevas amenazas del mercado no identificadas', 1, 3, 'Luis Pérez', 4, 'P-RIE-01', 'Activo', 'Estratégico', 'Alto', 'Falta de análisis de entorno regular', 'Materialización de daños de alto costo', 'Revisión trimestral de riesgos', 1),
(11, 'Matriz Desactualizada', 'Cambios operacionales no reflejados en riesgos', 2, 2, 'Luis Pérez', 4, 'P-RIE-01', 'Activo', 'Cumplimiento', 'Moderado', 'Baja periodicidad de actualización', 'Controles ineficaces ante nuevos procesos', 'Revisión mensual de registros', 1),
(12, 'Severidad Mal Evaluada', 'Asignar menor impacto a un riesgo catastrófico', 1, 3, 'Luis Pérez', 4, 'P-RIE-01', 'Activo', 'Estratégico', 'Alto', 'Evaluación unipersonal sin comité', 'Respuestas de mitigación insuficientes', 'Evaluación colegiada por comité', 1),
-- P-TIC-01
(13, 'Ataque Informático', 'Acceso no autorizado o fuga de datos sensibles', 1, 3, 'Alejandro C.', 5, 'P-TIC-01', 'Activo', 'Seguridad', 'Alto', 'Vulnerabilidad en puerto externo', 'Pérdida de integridad y multas', 'Escaneo de vulnerabilidades mensual', 1),
(14, 'Falla de Disco Duro', 'Pérdida de registros por daño físico de hardware', 1, 3, 'Alejandro C.', 5, 'P-TIC-01', 'Activo', 'Tecnológico', 'Alto', 'Ciclo de vida expirado del servidor', 'Interrupción prolongada del servicio', 'Respaldo automático en la nube diario', 1),
(15, 'Lentitud de Query', 'Degradación de performance de la base de datos', 2, 2, 'Alejandro C.', 5, 'P-TIC-01', 'Activo', 'Tecnológico', 'Moderado', 'Falta de índices correctos en tablas', 'Retraso en renderizado de pantallas', 'Monitoreo de queries e indexación', 1);

-- Glosario — 3 por proceso
INSERT INTO glosario (id, termino, definicion, proceso_id, organizacion_id) VALUES
-- P-CAL-01
(1, 'No Conformidad', 'Incumplimiento de un requisito de la norma ISO 9001 o interno.', 1, 1),
(2, 'Auditoría Interna', 'Proceso sistemático e independiente para verificar el cumplimiento.', 1, 1),
(3, 'Calidad SGI', 'Grado en el que el SGI cumple con los objetivos institucionales.', 1, 1),
-- P-OPS-01
(4, 'SLA', 'Acuerdo de nivel de servicio que define la calidad de la entrega.', 2, 1),
(5, 'Cuello de Botella', 'Paso de la operación que limita la velocidad de producción.', 2, 1),
(6, 'Eficiencia de Flujo', 'Porcentaje de tiempo activo que agrega valor en la cadena.', 2, 1),
-- P-MC-01
(7, 'Kaizen', 'Metodología japonesa de mejora continua paso a paso.', 3, 1),
(8, 'Ciclo PDCA', 'Planificar, Hacer, Verificar y Actuar para optimizar procesos.', 3, 1),
(9, 'Lluvia de Ideas', 'Técnica grupal para recolectar propuestas de solución.', 3, 1),
-- P-RIE-01
(10, 'Matriz de Riesgo', 'Cuadrante visual para clasificar probabilidad e impacto.', 4, 1),
(11, 'Riesgo Residual', 'Nivel de amenaza que queda tras aplicar los controles de mitigación.', 4, 1),
(12, 'Plan de Mitigación', 'Plan de acción para reducir severidad o probabilidad.', 4, 1),
-- P-TIC-01
(13, 'Backup Diario', 'Copia de seguridad incremental realizada cada 24 horas.', 5, 1),
(14, 'Failover Automático', 'Mecanismo de respaldo que activa un servidor secundario ante fallas.', 5, 1),
(15, 'Indexación de BD', 'Estructura de datos que acelera la búsqueda en tablas.', 5, 1);

-- SIPOC
INSERT INTO sipoc (id, proceso_id, actividad, proveedores, insumos, productos, cliente, organizacion_id) VALUES
(1, 1, 'Auditoría interna anual', 'Auditor Interno', 'Checklist ISO 9001', 'Informe de Auditoría', 'Dirección General', 1),
(2, 2, 'Procesamiento de órdenes', 'Ventas', 'Solicitud del cliente', 'Servicio entregado', 'Cliente Final', 1),
(3, 3, 'Evaluación de proyectos', 'Colaboradores', 'Banco de ideas', 'Plan de implementación', 'Dirección General', 1),
(4, 4, 'Monitoreo de controles', 'Responsable de área', 'Mapa de calor', 'Plan de mitigación actualizado', 'Dueños de procesos', 1),
(5, 5, 'Mantenimiento del servidor', 'Proveedor Cloud', 'Monitoreo de recursos', 'Logs de estabilidad', 'Toda la organización', 1);

-- Actividades de Procesos
INSERT INTO actividades (id, proceso_id, actividad, descripcion, entrada, salida, responsable, organizacion_id) VALUES
-- P-CAL-01
(1, 1, 'Plan de Auditoría', 'Planificar fechas y auditores calificados', 'Calendario anual', 'Plan aprobado', 'Ana Torres', 1),
(2, 1, 'Ejecución de Campo', 'Entrevistas y revisión de evidencias físicas', 'Plan aprobado', 'Informe preliminar', 'Ana Torres', 1),
(3, 1, 'Seguimiento de Hallazgos', 'Revisar la efectividad del plan de acción', 'Informe preliminar', 'Cierre formal de hallazgos', 'Ana Torres', 1),
-- P-OPS-01
(4, 2, 'Carga de Solicitud', 'Ingresar orden en sistema administrativo', 'Orden firmada', 'Orden en sistema', 'Luis Pérez', 1),
(5, 2, 'Ejecución y Entrega', 'Proporcionar el servicio contratado', 'Orden en sistema', 'Servicio entregado', 'Luis Pérez', 1),
(6, 2, 'Encuesta de Satisfacción', 'Llamar al cliente tras la entrega', 'Servicio entregado', 'Calificación registrada', 'Luis Pérez', 1),
-- P-MC-01
(7, 3, 'Buzón de Ideas', 'Recibir aportes de colaboradores', 'Formulario web', 'Idea en banco', 'María Rojas', 1),
(8, 3, 'Evaluación Costo/Beneficio', 'Reunión semanal del comité de mejora', 'Idea en banco', 'Idea aprobada', 'María Rojas', 1),
(9, 3, 'Cierre de Proyecto', 'Medir el impacto de la mejora tras 3 meses', 'Idea aprobada', 'Reporte de impacto', 'María Rojas', 1),
-- P-RIE-01
(10, 4, 'Taller de Riesgos', 'Identificar nuevas amenazas con dueños de área', 'Contexto operativo', 'Riesgos listados', 'Luis Pérez', 1),
(11, 4, 'Matriz de Evaluación', 'Calcular probabilidad e impacto del riesgo', 'Riesgos listados', 'Mapa de calor', 'Luis Pérez', 1),
(12, 4, 'Seguimiento de Controles', 'Auditar que los planes se estén ejecutando', 'Mapa de calor', 'Informe de cumplimiento', 'Luis Pérez', 1),
-- P-TIC-01
(13, 5, 'Actualización de Parches', 'Instalar updates de seguridad en servidores', 'Reporte de vulnerabilidad', 'Sistemas parchados', 'Alejandro C.', 1),
(14, 5, 'Verificación de Backups', 'Prueba mensual de restauración de bases de datos', 'Backup diario', 'Restauración probada', 'Alejandro C.', 1),
(15, 5, 'Optimización de Consultas', 'Revisar tiempos de respuesta de base de datos', 'Query log lento', 'Índices aplicados', 'Alejandro C.', 1);

-- Acciones correctivas (2 básicas iniciales de prueba)
INSERT INTO acciones_correctivas (id, nombre, proceso_id, origen, hallazgo, acciones, responsable, estado, organizacion_id) VALUES
(1, 'AC-2025-001', 1, 'Auditoría interna',  'Desactualización del mapa de procesos', 'Actualizar el mapa y capacitar al equipo', 'Ana Torres',  'Abierta', 1),
(2, 'AC-2025-002', 2, 'Reclamo de cliente', 'Tiempo de entrega excede el acuerdo de nivel de servicio', 'Reorganizar turnos operativos', 'Luis Pérez',  'En Curso', 1);

-- Reset sequences
SELECT setval('organizacion_id_seq', (SELECT MAX(id) FROM organizacion));
SELECT setval('areas_id_seq', (SELECT MAX(id) FROM areas));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('objetivos_id_seq', (SELECT MAX(id) FROM objetivos));
SELECT setval('procesos_id_seq', (SELECT MAX(id) FROM procesos));
SELECT setval('indicadores_id_seq', (SELECT MAX(id) FROM indicadores));
SELECT setval('riesgos_id_seq', (SELECT MAX(id) FROM riesgos));
SELECT setval('glosario_id_seq', (SELECT MAX(id) FROM glosario));
SELECT setval('acciones_correctivas_id_seq', (SELECT MAX(id) FROM acciones_correctivas));
SELECT setval('sipoc_id_seq', (SELECT MAX(id) FROM sipoc));
SELECT setval('actividades_id_seq', (SELECT MAX(id) FROM actividades));
