# Diccionario de Datos del SGI — SharePoint Online

Este documento define la estructura de las listas de SharePoint Online que sirven como persistencia (base de datos) del **SgiPortal** de la JAC, detallando columnas, tipos de datos y relaciones.

---

## 1. Relaciones de Datos (Diagrama Conceptual)
Las listas están interconectadas principalmente a través de campos de tipo **Búsqueda (Lookup)** que apuntan al identificador o título de otra lista:
* `SGI_Usuarios` ──(Lookup)──> `SGI_Areas` (Área de pertenencia)
* `SGI_Areas` ──(Lookup)──> `SGI_Areas` (Dependencia jerárquica)
* `SGI_MaestraProceso` ──(Lookup)──> `SGI_Areas`
* `SGI_KPI`, `Gestión Documental`, `SGI_Glosario` ──(Lookup)──> `SGI_MaestraProceso`
* `SGI_Mediciones` ──(Lookup)──> `SGI_KPI`

---

## 2. Definición Detallada de Listas

### 2.1 Áreas Organizacionales (`SGI_Areas`)
Define la estructura del organigrama de la JAC y determina las rutas de aprobación.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre oficial del área. |
| `CodigoArea` | `codigo` | Texto | Acrónimo único (ej. `DTI`, `DA`). |
| `Responsable` | `responsable` | Persona | Encargado del área (de Azure AD). |
| `Nivel` | `nivel` | Choice (Opción) | Valores: `Sección`, `División`, `Departamento`, `Dirección`. |
| `Dependencia` | `dependencia` | Lookup | Apunta a `SGI_Areas` (Área de la cual depende). |

---

### 2.2 Usuarios del SGI (`SGI_Usuarios`)
Registra las cuentas autorizadas del portal y define su nivel de acceso.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre completo del usuario. |
| `sgi_Email` | `email` | Texto / Persona | Correo corporativo institucional. |
| `sgi_Rol` | `rol` | Choice (Opción) | Valores: `Admin`, `DP` (Calidad), `Encargado`, `Usuario`. |
| `sgi_AreaLookup` | `areaId` | Lookup | Vincula al usuario con su área en `SGI_Areas`. |
| `sgi_Activo` | `activo` | Sí/No (Booleano) | Define si el usuario puede acceder al portal. |

---

### 2.3 Catálogo de Procesos (`SGI_MaestraProceso`)
Almacena la información de los procesos del Sistema de Gestión de Calidad.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre del proceso. |
| `sgi_Codigo` | `codigo` | Texto | Código único (ej. `P-SGI-01`, `P-SGI-07`). |
| `sgi_Descripcion` | `descripcion` | Nota (Texto Largo) | Definición y alcance del proceso. |
| `sgi_Responsable` | `responsable` | Persona | Líder del proceso (dueño de proceso). |
| `sgi_Area` | `area` | Texto | Nombre del área asociada. |
| `sgi_Estado` | `estado` | Choice (Opción) | Valores: `activo`, `inactivo`, `en_revision`. |

---

### 2.4 Indicadores de Rendimiento (`SGI_KPI`)
Registra las metas y fichas de indicadores clave.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre del KPI. |
| `sgi_Descripcion` | `descripcion` | Texto | Qué mide y cómo se calcula. |
| `sgi_Meta` | `meta` | Número | Valor objetivo/meta a alcanzar. |
| `sgi_Unidad` | `unidad` | Texto | Unidad de medida (ej. `%`, `Días`, `Cantidad`). |
| `sgi_Responsable` | `responsable` | Persona | Encargado del seguimiento y reporte. |
| `sgi_Periodicidad` | `periodicidad` | Texto | Frecuencia de medición (ej. Mensual, Trimestral). |
| `sgi_ProcesoLookup` | `processId` | Lookup | Proceso asociado de `SGI_MaestraProceso`. |

---

### 2.5 Mediciones de KPIs (`SGI_Mediciones`)
Valores periódicos capturados para cada KPI.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `sgi_KpiLookup` | `kpi_id` | Lookup | KPI padre en `SGI_KPI`. |
| `sgi_Valor` | `valor` | Número | Valor registrado en el período. |
| `sgi_FechaMedicion` | `fecha` | Fecha y Hora | Fecha en que se realiza el registro. |
| `sgi_Comentarios` | `comentarios` | Texto | Justificación en caso de desvíos de meta. |
| `sgi_Mes` | `mes` | Texto | Mes de la medición (ej. Enero, Febrero). |
| `sgi_Anio` | `anio` | Número | Año fiscal de la medición (ej. 2026). |

---

### 2.6 Matriz de Gestión de Riesgos (`MATRIZ DE GESTIÓN DE RIESGOS`)
Riesgos identificados y planes de contingencia.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre resumido del riesgo. |
| `sgi_Descripcion` | `descripcion` | Texto | Descripción del evento adverso. |
| `sgi_Probabilidad` | `probabilidad` | Número | Valores: `1` (Baja), `2` (Moderada), `3` (Alta). |
| `sgi_Impacto` | `impacto` | Número | Valores: `1` (Bajo), `2` (Moderado), `3` (Alto). |
| `sgi_Responsable` | `responsable` | Persona | Dueño del riesgo encargado de mitigación. |
| `sgi_ProcesoAsoc` | `proceso_asociado`| Lookup | Proceso de `SGI_MaestraProceso` afectado. |
| `sgi_PlanMitigacion`| `plan_mitigacion` | Texto | Plan detallado para reducir el riesgo. |
| `vp`, `vi`, `vnr` | `vp`, `vi`, `vnr` | Número | Parámetros técnicos de control del riesgo. |

---

### 2.7 Biblioteca Documental (`Gestión Documental`)
Biblioteca de SharePoint para el control de versiones y almacenamiento de archivos PDF.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `nombre` | Texto | Nombre descriptivo del manual o procedimiento. |
| `C_x00f3_digo` | `codigo` | Texto | Código de calidad del documento (ej. `M-SGI-01`). |
| `sgi_Version` | `version` | Número | Correlativo de versión vigente (ej. `1`, `2`). |
| `sgi_FechaPublicacion`| `fechaPublicacion`| Fecha | Fecha de entrada en vigencia del documento. |
| `sgi_ProcesoAsoc` | `procesoId` | Lookup | Proceso asociado de `SGI_MaestraProceso`. |
| `Categoria` | `tipoDocumento` | Choice (Opción) | Valores: `Manual`, `Procedimiento`, `Formulario`. |

---

### 2.8 Consola de Flujos de Aprobación (`SGI_Aprobaciones`)
Almacena el estado y payloads de solicitudes que recorren el flujo jerárquico.

| Nombre Interno SP | Nombre en TS | Tipo de Dato | Descripción / Relación |
| :--- | :--- | :--- | :--- |
| `Title` | `titulo` | Texto | Descripción de la acción (ej. "Modificar Proceso P-SGI-01"). |
| `sgi_TipoElemento` | `tipoElemento` | Choice | Entidad: `Proceso`, `KPI`, `Riesgo`, `Glosario`, `Documento`. |
| `sgi_Accion` | `accion` | Choice | Acción: `Crear`, `Modificar`, `Eliminar`, `Subir`. |
| `sgi_DatosJson` | `datosJson` | Nota (Largo) | Payload serializado con los datos propuestos. |
| `sgi_Estado` | `estado` | Choice | Estado del flujo: `Pendiente`, `Aprobado`, `Rechazado`. |
| `sgi_Solicitante` | `solicitante` | Texto | Email de la cuenta que originó la solicitud. |
| `sgi_PasoActual` | `pasoActual` | Número | Índice del paso activo en curso (1-based). |
| `sgi_TotalPasos` | `totalPasos` | Número | Total de pasos calculados para la jerarquía. |
| `sgi_AprobadorPaso` | `aprobadorPasoActual`| Texto | Email del aprobador del paso actual. |
| `sgi_HistorialPasos`| `historialPasos`| Nota (Largo) | Array JSON de firmas del historial (`ApprovalStep[]`). |
