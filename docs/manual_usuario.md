# Manual de Usuario del Portal SGI — Junta de Aviación Civil

Este manual proporciona una descripción detallada de los módulos funcionales del **Sistema de Gestión Integrado (SGI)** de la Junta de Aviación Civil (JAC) y una guía administrativa para la gestión de calidad.

---

## 1. Módulos Funcionales del Sistema

### 1.1 Dashboard (Panel Principal)
* **Objetivo:** Ofrece una vista consolidada en tiempo real de los principales indicadores y métricas del SGI.
* **Características:**
  * Tarjetas de resumen con la cantidad total de KPIs, el porcentaje de cumplimiento, la cantidad de procesos activos y los riesgos de exposición alta.
  * Gráficas interactivas que muestran la distribución de KPIs por estado (En Meta, En Riesgo, Fuera de Meta) y la distribución del calor de los riesgos.
  * Acceso directo a las vistas detalladas de cada módulo.

### 1.2 Módulo de KPIs e Indicadores
* **Objetivo:** Registro, visualización y control de los Indicadores Clave de Rendimiento (KPI) del SGI.
* **Características:**
  * **Reporte de KPIs:** Muestra una lista de todos los indicadores filtrados por área, responsable y estado. Cada fila detalla la meta versus el cumplimiento actual.
  * **Ingreso de Mediciones:** Permite a los dueños de indicadores registrar las mediciones mensuales o trimestrales correspondientes, adjuntando comentarios justificativos.
  * **Gráfico de Tendencias:** Al hacer clic en un KPI, se despliega una ventana emergente que muestra el histórico de mediciones del año en curso para evaluar su evolución (estable, ascendente o descendente).

### 1.3 Gestión Documental (Biblioteca Digital)
* **Objetivo:** Repositorio digital centralizado y controlado para los documentos del SGI.
* **Características:**
  * Navegación por carpetas organizadas por macroprocesos y áreas organizacionales.
  * Vista de tabla con columnas del código único del documento, la versión vigente, la fecha de publicación oficial y el enlace de descarga directa en SharePoint.
  * Capacidad de subir nuevos borradores o revisiones directamente a la lista de SharePoint a través de flujos de aprobación.

### 1.4 Matriz de Gestión de Riesgos
* **Objetivo:** Visualización y mitigación de los riesgos operativos y estratégicos de los procesos.
* **Características:**
  * **Matriz de Calor:** Un mapa interactivo de 3x3 (Probabilidad vs. Impacto) que clasifica los riesgos en niveles: Bajo (Verde), Moderado (Amarillo) y Alto (Rojo).
  * **Fichas de Riesgo:** Cada riesgo documenta su descripción, origen, consecuencia, controles preventivos instalados, plan de mitigación propuesto, fecha de implementación y responsables de ejecución.
  * Cálculo dinámico de la exposición de riesgo (Probabilidad × Impacto).

### 1.5 Glosario del SGI
* **Objetivo:** Definición estandarizada de acrónimos, términos técnicos y conceptos de aviación y calidad.
* **Características:**
  * Buscador rápido de términos por iniciales o concordancia de palabras.
  * Relación opcional de cada concepto con su respectivo proceso o manual del SGI asociado.

### 1.6 Consola de Aprobaciones
* **Objetivo:** Bandeja de entrada unificada para revisar y autorizar las propuestas de creación, modificación o eliminación de cualquier entidad del portal.
* **Características:**
  * Vista para solicitantes: Historial de solicitudes realizadas indicando en qué paso del flujo jerárquico se encuentra (ej. "Pendiente en División de Calidad").
  * Vista para aprobadores: Panel interactivo que muestra las solicitudes pendientes de su firma. Permite visualizar los cambios en formato JSON/tabla, ingresar comentarios de retroalimentación y hacer clic en **Aprobar** o **Rechazar**.

---

## 2. Guía para Administradores de Calidad (DTI y Calidad)

El portal automatiza el enrutamiento de flujos de aprobación y asigna responsabilidades basándose en la estructura jerárquica configurada en SharePoint. Como administrador, puedes gestionar esta jerarquía directamente a través de dos listas maestras:

### 2.1 Configuración de Áreas Organizacionales (`SGI_Areas`)
Esta lista determina la estructura de la JAC y el camino que sigue una solicitud de aprobación:
1. **Atributos Clave:**
   * `Title` (Nombre de la sección/departamento/división/dirección).
   * `CodigoArea` (Acrónimo único del área, por ejemplo: `DTI`, `DA`).
   * `Responsable` (Usuario asignado como jefe/líder de dicha área).
   * `Nivel` (Choice: 'Sección' | 'División' | 'Departamento' | 'Dirección' | 'Área').
   * `Dependencia` (Campo Lookup que apunta al área superior de la jerarquía).
2. **Cómo funciona el enrutamiento:**
   * Cuando un usuario de la "División de Desarrollo" crea una solicitud, el motor busca a qué área pertenece el usuario (`SGI_Usuarios`).
   * Si pertenece a una División, la aprobación viajará primero al responsable de la División. Al aprobarse, buscará el área de la cual depende (el "Departamento de TI") y enviará la aprobación a su encargado. Este proceso continuará de manera secuencial y ascendente hasta llegar a la Dirección correspondiente o al nivel superior configurado.

### 2.2 Gestión de Usuarios y Permisos (`SGI_Usuarios`)
Permite registrar a los usuarios autorizados a interactuar con el portal:
1. **Roles disponibles:**
   * **Admin (Administrador):** Acceso total al portal, bypass de controles de lectura, y visualización de la bitácora técnica de logs.
   * **DP (Dueño de Proceso / Calidad):** Encargados de la administración global del SGI. Tienen la facultad de aprobar solicitudes directas en el primer paso (Fase de Calidad) y reasignar responsables.
   * **Encargado:** Líderes de área que actúan como aprobadores en el flujo secuencial de sus respectivas jerarquías.
   * **Usuario:** Acceso general de lectura y envío de solicitudes de modificación de sus propios procesos/KPIs asignados.
2. **Procedimiento de Alta:**
   * Agregar una nueva fila en `SGI_Usuarios` ingresando el nombre completo, el correo institucional (`@jac.gob.do`), el Rol correspondiente, y asociar el ID del área a la que pertenece.
