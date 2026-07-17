# Análisis Arquitectónico del Sistema: SgiPortal

**Fecha:** 9 de Junio de 2026
**Rol:** Arquitecto de Software Senior
**Proyecto:** Sistema de Gestión Integral (SGI) Portal

---

## 1. Visión General del Sistema

SgiPortal es una aplicación web SPA (Single Page Application) construida sobre **React 19** y **Vite**, utilizando **TypeScript** para el tipado estático seguro. La interfaz de usuario (UI) se basa fuertemente en el sistema de diseño corporativo de Microsoft a través de **@fluentui/react-components (v9)**. 

La persistencia y el origen de los datos están estrechamente acoplados al ecosistema de Microsoft 365, específicamente interactuando con listas de **SharePoint Online** (a través de servicios generados y modelos fuertemente tipados). El estado global se gestiona de forma ligera utilizando **Zustand**.

---

## 2. Estado Actual: ¿Qué está Completo?

*   **Infraestructura Base y Enrutamiento:** El andamiaje del proyecto con Vite y TypeScript está sólido. Las rutas básicas (Dashboard, Procesos, Riesgos, Reportes) están definidas en una estructura de carpetas lógica (`/pages`, `/components`).
*   **Sistema de Diseño:** La integración con Fluent UI v9 (`FluentProvider`, `makeStyles`) está operativa. El tema visual (colores Midnight Blue y Caribbean Red) está configurado en `customTheme.ts` y aplicado consistentemente en los componentes base.
*   **Integración de Datos (Capa de Lectura):** El servicio `sharePointService.ts` está funcionando como una capa de abstracción sobre las llamadas a la API generadas. Transforma correctamente los esquemas de OData (SharePoint) en modelos de dominio del frontend (ej. `KPI`, `Process`).
*   **Dashboard Principal:** Implementado con un alto grado de usabilidad. Incluye tarjetas de resumen, cálculo de estados (on_track, at_risk, off_track) y un sistema de filtrado robusto (Proceso, Trimestre, Año) gestionado eficientemente mediante `useMemo`.
*   **Gestión de Estado Simple:** `useKPIStore` (Zustand) mantiene los datos de los KPIs y maneja los estados de carga (`loading`, `error`), evitando el prop-drilling.

---

## 3. Brechas y Faltantes: ¿Qué está Incompleto?

*   **Módulo de Administración (Admin Panel):** Falta una interfaz dedicada para el CRUD completo de KPIs, Procesos y Riesgos. Actualmente el Dashboard de visualización está mezclado con conceptos de edición (aunque el botón temporal se eliminó recientemente, la arquitectura aún no prevé una separación clara de "Vista Consumidor" vs "Vista Administrador").
*   **Integración Real de Mediciones (SGI_Mediciones):** El cálculo actual de trimestres se hace de manera inferida/temporal en base a la fecha de modificación (`fecha_ultima_actualizacion`). Se debe implementar la conexión a la lista de SharePoint `SGI_Mediciones` para extraer el historial real de mediciones y sus comentarios.
*   **Módulos de Procesos y Riesgos (Mocked Data):** Según se observa en `sharePointService.ts`, los riesgos actualmente están *mockeados* (datos simulados). Falta conectar estos flujos a sus respectivas listas de SharePoint.
*   **Seguridad y Autenticación (MSAL):** Aunque las dependencias de `@azure/msal-browser` están en el `package.json` y existe un `authConfig.ts`, el sistema aún no protege las rutas de forma granular ni diferencia roles (Usuario vs Admin) a nivel de la interfaz.

---

## 4. Oportunidades de Mejora Arquitectónica (Deuda Técnica)

*   **Consistencia de Estilos (CSS vs CSS-in-JS):** El proyecto actualmente mezcla archivos CSS tradicionales (ej. `Dashboard.css`, `KPICard.css`) con el patrón oficial de Fluent UI v9 (`makeStyles`). **Recomendación:** Migrar gradualmente todo el estilado a `makeStyles` para aprovechar los tokens del tema y evitar colisiones de CSS global.
*   **Gestión de Estado Asíncrono:** Mientras que Zustand es excelente para estado de UI, manejar caché, invalidación, reintentos y estados de carga complejos para APIs REST/SharePoint se vuelve verboso. **Recomendación:** Introducir **TanStack Query (React Query)** para la gestión de datos remotos, dejando Zustand solo para estados globales de UI (ej. panel lateral abierto/cerrado, usuario logueado).
*   **Desacoplamiento de Servicios:** El archivo `sharePointService.ts` concentra toda la lógica de mapeo (KPIs, Procesos, Riesgos). Esto viola el principio de responsabilidad única (SRP) y crecerá incontrolablemente. **Recomendación:** Refactorizar en un patrón de Repositorio o Servicios de Dominio (ej. `kpiService.ts`, `processService.ts`).
*   **Pruebas Automatizadas (Testing):** No se detectan librerías de pruebas unitarias (`Vitest` / `Jest` + `React Testing Library`). Un sistema de gestión empresarial requiere cobertura al menos en la lógica de cálculo de métricas y transformaciones de datos.

---

## 5. Roadmap Sugerido (Siguientes Pasos)

1.  **Fase 1: Módulo de Administración (Corto Plazo)**
    *   Crear la ruta protegida `/admin`.
    *   Implementar formularios basados en Fluent UI para la creación/edición de KPIs.
    *   Implementar el formulario de carga de **Mediciones Trimestrales** conectado al modelo `SGI_MedicionesModel.ts`.
2.  **Fase 2: Conexión Real de Datos (Corto Plazo)**
    *   Reemplazar los riesgos simulados (*mocks*) con las llamadas a las listas reales de SharePoint.
    *   Refactorizar el `Dashboard.tsx` para que consuma las mediciones reales en lugar de inferir fechas.
3.  **Fase 3: Refactorización y Estabilización (Medio Plazo)**
    *   Dividir el monolito `sharePointService.ts`.
    *   Estandarizar estilos hacia `@fluentui/react-components` (`makeStyles`).
    *   Implementar Azure AD (MSAL) para control de acceso basado en roles (RBAC).
4.  **Fase 4: Testing (Continuo)**
    *   Configurar Vitest y escribir pruebas para los mappers y la lógica de cálculos.