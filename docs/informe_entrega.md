# Informe Técnico de Entrega y Handover del Proyecto — SgiPortal

---

## 1. Identificación del Proyecto y Control del Documento

* **Nombre del Aplicativo:** Sistema de Gestión Integrado (SgiPortal)
* **Entidad Receptora:** Departamento de Tecnologías de la Información (DTI) — Junta de Aviación Civil (JAC)
* **Mantenedor / Desarrollador:** SgiPortal Team
* **Fecha de Entrega:** 8 de julio de 2026
* **Versión del Software:** 1.0.0 (Production Ready)
* **Estado:** Completado, Verificado y Compilado

---

## 2. Objetivo del Aplicativo

El **SgiPortal** es un portal web de última generación diseñado para digitalizar, integrar y automatizar el **Sistema de Gestión Integrado (SGI)** de la Junta de Aviación Civil (JAC). Su principal objetivo es centralizar la gestión de calidad, los riesgos operativos, la documentación oficial y los indicadores de rendimiento en un único ecosistema colaborativo seguro.

### Objetivos Específicos:
1. **Reemplazo Tecnológico:** Migrar la lógica y el almacenamiento de aplicaciones legacy de Power Apps e interacciones en papel a una aplicación web moderna (SPA) rápida, robusta y con diseño Fluent UI oficial de Microsoft.
2. **Automatización de Aprobaciones:** Implementar un motor de flujos jerárquicos secuenciales dinámicos que garantice que cualquier cambio de datos o carga de documentos sea verificado por Calidad y por la jerarquía correspondiente de la JAC antes de persistir en producción.
3. **Control y Trazabilidad:** Mantener una bitácora inmutable de logs de actividad que registre quién, cuándo y qué cambios se realizaron sobre los activos de calidad.

---

## 3. Resumen de la Arquitectura y Stack Tecnológico

El portal del SGI ha sido desarrollado siguiendo estándares modernos de desarrollo de software empresarial:
* **Frontend:** React 19 + TypeScript 6 + Vite para una experiencia de usuario rápida y estructurada.
* **Componentes Visuales:** Fluent UI React Components v9 (la biblioteca de componentes de Microsoft para Office 365).
* **Base de Datos / Persistencia:** SharePoint Online, utilizando la API REST para interactuar de forma relacional y estructurada con listas maestras.
* **Gestión de Identidades:** Microsoft Entra ID (Azure AD) para autenticación SSO a través de `@azure/msal-browser` y `@azure/msal-react`.
* **Directorio Activo:** Conexión con el servicio `Office365Users` de Microsoft 365 para la autocompletación y asignación de personal responsable en los formularios.

---

## 4. Módulos y Funcionalidades del Sistema

El portal se compone de 7 módulos principales integrados:

1. **Dashboard Consolidado:** Panel de inicio interactivo que provee métricas generales (KPIs en meta, riesgos de exposición alta, procesos activos) y gráficos dinámicos de distribución y tendencias.
2. **Módulo de KPIs y Mediciones:** Control de metas, responsables, periodicidad y tendencias históricas de los Indicadores Clave de Rendimiento por procesos. Permite el ingreso descentralizado de registros mensuales/trimestrales.
3. **Gestión Documental:** Biblioteca estructurada con carpetas jerárquicas vinculadas a macroprocesos, control de versiones del documento físico e historial de cambios con enlaces de descarga directa.
4. **Matriz de Riesgos:** Panel de mitigación interactivo de 3x3 (Probabilidad × Impacto) que calcula la exposición de riesgo y vincula los controles preventivos y planes de contingencia.
5. **Glosario del SGI:** Buscador y catálogo de la terminología de calidad y aviación de la institución.
6. **Consola de Aprobaciones:** Panel centralizado donde se revisan y firman las solicitudes pendientes. El sistema enruta las propuestas a Calidad y las escalas de Sección, División, Departamento y Dirección correspondientes.
7. **Bitácora de Logs y Diagnóstico:** Panel restringido para administradores que permite consultar la auditoría técnica y diagnosticar el estado del conector de Microsoft.

---

## 5. Inventario de Entregables (Lo que se entrega)

Se realiza la entrega formal de los siguientes componentes lógicos y documentales:

### A. Código Fuente Compilable y Limpio
Ubicado en la ruta de entrega: [C:\codeapps\SgiPortal_Clean](file:///C:/codeapps/SgiPortal_Clean)
* **Código Fuente React/TS:** Todo el código del portal libre de caches, historial de desarrollo local, ni carpetas ocultas relacionadas con el asistente de Inteligencia Artificial (`.agent/`, `.agents/`, `.gemini/`).
* **Paquete de Compilación (`dist/`):** El bundle minificado y empaquetado final listo para ser alojado o subido como recurso web en Power Platform.

### B. Scripts de Automatización del Entorno
* **[bootstrap.ps1](file:///c:/codeapps/SgiPortal/scripts/bootstrap.ps1):** Script de PowerShell que automatiza la configuración de dependencias, valida el tipado y compila el bundle de producción desde cero en cualquier máquina.
* **[limpiar-proyecto.ps1](file:///c:/codeapps/SgiPortal/scripts/limpiar-proyecto.ps1):** Script para que DTI pueda regenerar nuevas copias limpias de entrega en el futuro de manera automática.

### C. Suite de Documentación Oficial de Handover
Ubicada en la carpeta [docs/](file:///c:/codeapps/SgiPortal/docs/):
1. **[guia_configuracion.md](file:///c:/codeapps/SgiPortal/docs/guia_configuracion.md):** Manual técnico para levantar desarrollo local y migrar de tenant o sitio de SharePoint sin errores.
2. **[manual_usuario.md](file:///c:/codeapps/SgiPortal/docs/manual_usuario.md):** Guía funcional para usuarios finales y administradores de calidad.
3. **[pruebas_funcionales.md](file:///c:/codeapps/SgiPortal/docs/pruebas_funcionales.md):** Guión detallado de pruebas unitarias y de humo del sistema.
4. **[documentacion_codigo.md](file:///c:/codeapps/SgiPortal/docs/documentacion_codigo.md):** Explicación de la arquitectura interna, spClient y guías de modificación de páginas y componentes.
5. **[diccionario_datos.md](file:///c:/codeapps/SgiPortal/docs/diccionario_datos.md):** Mapeo de columnas físicas, tipos de datos y relaciones de las 11 listas maestras de SharePoint.
6. **[diagrama_proceso.md](file:///c:/codeapps/SgiPortal/docs/diagrama_proceso.md):** Diagrama en Mermaid que grafica la lógica del motor de flujos jerárquicos secuenciales.
7. **[registro_pruebas.md](file:///c:/codeapps/SgiPortal/docs/registro_pruebas.md):** Registro histórico de casos probados y soluciones a bugs identificados durante el desarrollo.

---

## 6. Firma y Conformidad de Entrega

El DTI asume la propiedad intelectual, mantenimiento correctivo y futuras actualizaciones del **SgiPortal** a partir de la firma de conformidad de este documento.

* **Entregado por:** SgiPortal Team (Mantenedor y Desarrollador)
* **Recibido y Aprobado por:** Departamento de Tecnologías de la Información (DTI) — JAC
