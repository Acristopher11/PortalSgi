-- ============================================================
-- DEMO DATA — Empresa genérica "Acme Corp"
-- ============================================================

-- Organización demo
INSERT INTO organizacion (id, nombre, color_primario, color_secundario, config)
VALUES (1, 'Acme Corp', '#1E3A5F', '#2ECC71', '{"modulos": ["procesos", "indicadores", "riesgos", "documentos", "aprobaciones"]}');

-- Áreas (jerarquía: Dirección → Departamento → División → Sección)
INSERT INTO areas (id, nombre, codigo, responsable, responsable_email, nivel, dependencia_id, organizacion_id) VALUES
(1, 'Dirección General',    'DIR-001', 'Carlos Méndez',   'carlos@acme.com',    'Direccion',    NULL, 1),
(2, 'Departamento de Calidad', 'DEP-CAL', 'Ana Torres',   'ana@acme.com',       'Departamento', 1,   1),
(3, 'Departamento de Operaciones', 'DEP-OPS', 'Luis Pérez', 'luis@acme.com',    'Departamento', 1,   1),
(4, 'División de Mejora Continua', 'DIV-MC',  'María Rojas', 'maria@acme.com',  'Division',     2,   1),
(5, 'Sección de Auditoría',  'SEC-AUD', 'Pedro Jiménez', 'pedro@acme.com',     'Seccion',      2,   1);

-- Usuarios demo (auth_uid se linkeará dinámicamente cuando inicien sesión)
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

-- 5 Procesos genéricos
INSERT INTO procesos (id, nombre, codigo, descripcion, responsable, responsable_emails, area, estado, tipo_proceso, organizacion_id) VALUES
(1, 'Gestión de Calidad',     'P-CAL-01', 'Proceso de aseguramiento y control de calidad',             'Ana Torres',  ARRAY['ana@acme.com'],             'Calidad',      'activo', 'Estratégico',   1),
(2, 'Gestión de Operaciones', 'P-OPS-01', 'Proceso de planificación y ejecución de operaciones diarias', 'Luis Pérez', ARRAY['luis@acme.com'],            'Operaciones',  'activo', 'Clave',         1),
(3, 'Mejora Continua',        'P-MC-01',  'Proceso de identificación e implementación de mejoras',       'María Rojas', ARRAY['maria@acme.com'],          'Calidad',      'activo', 'Soporte',       1),
(4, 'Gestión Documental',     'P-DOC-01', 'Control y administración de documentos del sistema',          'Ana Torres',  ARRAY['ana@acme.com'],            'Calidad',      'activo', 'Soporte',       1),
(5, 'Gestión de Riesgos',     'P-RIE-01', 'Identificación, evaluación y tratamiento de riesgos',         'Luis Pérez', ARRAY['luis@acme.com', 'ana@acme.com'], 'Operaciones', 'activo', 'Estratégico', 1);

-- Indicadores (KPIs) — 2 por proceso
INSERT INTO indicadores (id, nombre, descripcion, meta, resultado_actual, unidad, proceso_id, periodicidad, organizacion_id) VALUES
(1,  'Tasa de conformidad',          'Porcentaje de productos/servicios conformes',      95,  92,  '%', 1, 'Mensual',     1),
(2,  'Índice de satisfacción',       'Resultado de encuestas de satisfacción',           90,  87,  '%', 1, 'Trimestral',  1),
(3,  'Eficiencia operativa',         'Relación output/input en operaciones',             85,  80,  '%', 2, 'Mensual',     1),
(4,  'Tiempo promedio de ciclo',     'Días promedio para completar un proceso',          5,   7,   'días', 2, 'Mensual',  1),
(5,  'Mejoras implementadas',        'Cantidad de mejoras ejecutadas vs planificadas',   80,  65,  '%', 3, 'Trimestral',  1),
(6,  'Ahorro por mejoras',           'Reducción de costos por mejoras implementadas',    15,  12,  '%', 3, 'Semestral',   1),
(7,  'Documentos actualizados',      'Porcentaje de documentos vigentes',                100, 85,  '%', 4, 'Trimestral',  1),
(8,  'Tiempo de aprobación',         'Días promedio para aprobar un documento',          3,   5,   'días', 4, 'Mensual',  1),
(9,  'Riesgos mitigados',            'Porcentaje de riesgos con plan ejecutado',         90,  75,  '%', 5, 'Trimestral',  1),
(10, 'Exposición residual promedio', 'Promedio de exposición al riesgo residual',        2,   3.2, 'score', 5, 'Trimestral', 1);

-- Mediciones (últimos trimestres del indicador 1 y 2)
INSERT INTO mediciones (indicador_id, valor, mes, anio, trimestre, autor, organizacion_id) VALUES
(1, 91, 'enero',   2025, 'Q1-2025', 'ana@acme.com', 1),
(1, 93, 'abril',   2025, 'Q2-2025', 'ana@acme.com', 1),
(1, 92, 'julio',   2025, 'Q3-2025', 'ana@acme.com', 1),
(2, 85, 'enero',   2025, 'Q1-2025', 'ana@acme.com', 1),
(2, 88, 'abril',   2025, 'Q2-2025', 'ana@acme.com', 1),
(2, 87, 'julio',   2025, 'Q3-2025', 'ana@acme.com', 1);

-- SIPOC (para Proceso 1 y 2)
INSERT INTO sipoc (proceso_id, actividad, proveedores, insumos, productos, cliente, organizacion_id) VALUES
(1, 'Auditoría interna',       'Departamento de Calidad',  'Plan de auditoría, checklist',     'Informe de auditoría',        'Dirección General',     1),
(1, 'Revisión por la dirección','Todos los departamentos',  'Informes de desempeño',            'Acta de revisión, acciones',  'Toda la organización',  1),
(2, 'Planificación de producción','Ventas, Logística',      'Pedidos, capacidad disponible',    'Plan de producción semanal',  'Planta de producción',  1),
(2, 'Control de procesos',      'Producción',               'Parámetros operativos',            'Registros de control',        'Calidad',               1);

-- Riesgos (5 riesgos variados)
INSERT INTO riesgos (nombre, descripcion, probabilidad, impacto, responsable, proceso_id, proceso_asociado, estado, tipo_riesgo, nivel_riesgo, origen, consecuencia, control, organizacion_id) VALUES
('Falla en equipos críticos',    'Avería inesperada de maquinaria principal',    2, 3, 'Luis Pérez',  2, 'P-OPS-01', 'Activo', 'Operativo',    'Alto',     'Desgaste de equipos',     'Paro de producción',          'Mantenimiento preventivo mensual',  1),
('Incumplimiento normativo',     'No cumplir requisitos regulatorios vigentes',  1, 3, 'Ana Torres',  1, 'P-CAL-01', 'Activo', 'Cumplimiento', 'Moderado', 'Cambios en regulación',   'Multas y sanciones',          'Monitoreo regulatorio trimestral',  1),
('Rotación de personal clave',   'Pérdida de conocimiento institucional',        2, 2, 'María Rojas', 3, 'P-MC-01',  'Activo', 'RRHH',         'Moderado', 'Condiciones laborales',   'Retrasos y reprocesos',       'Plan de sucesión y documentación',  1),
('Pérdida de documentos',        'Documentos críticos sin respaldo',             1, 2, 'Ana Torres',  4, 'P-DOC-01', 'Activo', 'Información',  'Bajo',     'Falta de backup',         'Reproceso de documentación',  'Backup automático diario',          1),
('Materialización de riesgos',   'Riesgos identificados sin plan de acción',     2, 3, 'Luis Pérez',  5, 'P-RIE-01', 'Activo', 'Estratégico',  'Alto',     'Falta de seguimiento',    'Impacto financiero y operativo', 'Revisión mensual de matriz',    1);

-- Glosario (10 términos)
INSERT INTO glosario (termino, definicion, proceso_id, organizacion_id) VALUES
('No conformidad',      'Incumplimiento de un requisito establecido',                                              1, 1),
('Acción correctiva',   'Acción tomada para eliminar la causa de una no conformidad detectada',                     1, 1),
('Indicador',           'Medida cuantitativa o cualitativa que permite evaluar el desempeño de un proceso',         1, 1),
('Proceso',             'Conjunto de actividades interrelacionadas que transforman entradas en salidas',            NULL, 1),
('SIPOC',               'Herramienta que identifica Proveedores, Entradas, Proceso, Salidas y Clientes',           NULL, 1),
('Riesgo',              'Efecto de la incertidumbre sobre los objetivos',                                           5, 1),
('Auditoría',           'Proceso sistemático e independiente para obtener evidencia y evaluarla objetivamente',     1, 1),
('Mejora continua',     'Actividad recurrente para mejorar el desempeño',                                           3, 1),
('Documento controlado','Documento cuya distribución, revisión y aprobación están gestionadas formalmente',          4, 1),
('Parte interesada',    'Persona u organización que puede afectar o verse afectada por las decisiones de la empresa', NULL, 1);

-- Acciones correctivas (2 demo)
INSERT INTO acciones_correctivas (nombre, proceso_id, origen, hallazgo, acciones, responsable, estado, organizacion_id) VALUES
('AC-2025-001', 1, 'Auditoría interna',  'Documentos de proceso P-OPS-01 desactualizados',        'Actualizar procedimientos y capacitar al equipo',         'Ana Torres',  'Abierta', 1),
('AC-2025-002', 2, 'Queja de cliente',    'Tiempo de entrega excede el compromiso en 2 días',      'Revisar planificación y ajustar capacidad de producción', 'Luis Pérez',  'En proceso', 1);

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
