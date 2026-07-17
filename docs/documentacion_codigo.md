# Documentación Técnica del Código Fuente — SgiPortal

Esta documentación describe la arquitectura técnica, los flujos de datos y las guías de modificación del código fuente del portal del SGI de la JAC.

---

## 1. Arquitectura de Software

El proyecto se basa en una SPA (Single Page Application) moderna construida sobre el siguiente stack:
* **Frontend:** React 19 + TypeScript 6 + Vite (compilador rápido y ligero).
* **Diseño UI:** Fluent UI React Components v9 (sistema oficial de diseño de Microsoft).
* **Gestión de Estado:** Zustand (para el estado global de autenticación, procesos, KPIs y aprobaciones).
* **Capa de Conexiones:** Power Apps Code (PAC CLI) que expone servicios simulados o proxies locales hacia SharePoint Online en el puerto 8080.

### Estructura de Directorios Clave
* `/src/components/`: Componentes reutilizables de UI (layout, tarjetas, diálogos).
* `/src/pages/`: Vistas completas del portal (Dashboard, Gestión de Riesgos, KPIs, etc.).
* `/src/repositories/`: Capa de traducción y persistencia de datos (mapea la respuesta OData de SharePoint al modelo tipado en TypeScript).
* `/src/services/`: Motores lógicos, incluyendo el enrutamiento del flujo de aprobaciones y llamadas REST genéricas.
* `/src/store/`: Stores globales de Zustand (ej. `useAuthStore`, `useProcessStore`).
* `/src/types/`: Interfaces y definiciones de TypeScript de las entidades del portal.

---

## 2. Flujo de Datos y Capa de Conexiones

### 2.1 El Cliente de SharePoint (`src/lib/spClient.ts`)
El archivo [spClient.ts](file:///c:/codeapps/SgiPortal/src/lib/spClient.ts) es la pieza central que unifica el tráfico hacia la API REST de SharePoint Online.

* **Modo Bypass Local:**
  Cuando no hay un token de Azure AD disponible (bypass activo en desarrollo), el cliente de SharePoint utiliza rutas relativas en lugar de absolutas (ej. `/teams/SGI/_api/web/...`). Esto permite que el proxy local de **PAC CLI** intercepte las peticiones y las autentique usando las cookies de sesión activa del navegador.
* **Modo Producción:**
  Cuando se suministra un token de MSAL (autenticación real), el cliente cambia a rutas absolutas (`import.meta.env.VITE_SP_SITE_URL`) y adjunta el header `Authorization: Bearer <token>`.
* **Manejo del Request Digest:**
  Para peticiones de escritura (POST/MERGE/DELETE), el cliente resuelve automáticamente el `X-RequestDigest` a través del endpoint `_api/contextinfo`.

### 2.2 La Capa de Repositorios (`src/repositories/`)
Mapea la nomenclatura física de SharePoint (ej. `sgi_Definici_x00f3_n`) con la de TypeScript (`definicion`). Esto aísla al frontend de nombres de columnas extrañas o modificadas de SharePoint.
* *Ejemplo:* Si necesitas añadir un campo a Procesos, debes agregarlo a la interfaz `Process` en `/src/types/index.ts`, capturarlo en el repositorio y mapearlo en la conversión de entrada/salida.

---

## 3. Instrucciones para Modificaciones Comunes

### 3.1 Cómo Agregar o Modificar Páginas (Rutas)
1. **Crear el Componente:** Crea la vista en `src/pages/MiNuevaPagina.tsx`.
2. **Registrar la Ruta:** Abre [App.tsx](file:///c:/codeapps/SgiPortal/src/App.tsx) y agrega la ruta al enrutador de React Router:
   ```tsx
   <Route path="/nueva-pagina" element={<MiNuevaPagina />} />
   ```
3. **Agregar al Menú:** Edita el componente del Sidebar o Navbar (en `/src/components/layout/`) para añadir el enlace a `/nueva-pagina` con su icono de Fluent UI correspondiente.

### 3.2 Cómo Modificar Diálogos y Modales (Fluent UI v9)
El portal implementa los modales con la sintaxis v9 de Fluent UI. Los componentes clave son:
```tsx
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@fluentui/react-components";

// Estructura sugerida:
<Dialog open={isOpen} onOpenChange={(e, data) => setIsOpen(data.open)}>
  <DialogSurface>
    <DialogBody>
      <DialogTitle>Título del Diálogo</DialogTitle>
      <DialogContent>
        {/* Contenido / Formulario */}
      </DialogContent>
      <DialogActions>
        <Button appearance="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
        <Button appearance="primary" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </DialogBody>
  </DialogSurface>
</Dialog>
```

### 3.3 Cómo Editar la Lógica del Flujo de Aprobaciones (`src/services/approvalFlowEngine.ts`)
El motor en [approvalFlowEngine.ts](file:///c:/codeapps/SgiPortal/src/services/approvalFlowEngine.ts) se encarga del cálculo secuencial del flujo de aprobación:
1. **Mapeo de Aprobador de Calidad:**
   * La constante `TIPO_ELEMENTO_A_PROCESO_CALIDAD` asocia cada entidad (ej. `KPI`, `Riesgo`) con el código del proceso responsable de calidad (`P-SGI-01`, `P-SGI-02`, `P-SGI-07`).
   * Si añades una nueva entidad (ej. `Socio`), debes agregarla a este objeto de mapeo para definir quién hace la revisión de Calidad inicial.
2. **Secuencia de Pasos Jerárquicos:**
   * La función `resolveAreaJerarquia` recorre recursivamente el campo lookup `Dependencia` del área del solicitante hasta llegar al nivel Dirección.
   * La función `buildSequentialSteps` crea un array de objetos `ApprovalStep` que define cada paso y el email del aprobador responsable (resuelto a partir de los encargados de las áreas recorridas).
3. **Proceso de Aprobación/Rechazo:**
   * La función `advanceStep` toma una solicitud activa y actualiza su estado. Si el paso actual es menor al total de pasos, calcula el correo del siguiente aprobador y incrementa `pasoActual`. Si se han completado todos los pasos, marca la solicitud como `Aprobado` global.
