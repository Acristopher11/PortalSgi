# Guía de Configuración, Migración y Despliegue — SgiPortal

Esta guía está diseñada para que el próximo desarrollador pueda configurar, compilar, migrar y desplegar el **SgiPortal** en su máquina local o en nuevos entornos de **Microsoft Power Platform** de forma exitosa y libre de errores.

---

## 1. Configuración del Entorno de Desarrollo Local

El proyecto utiliza un flujo híbrido compuesto por **React 19 + Vite** para la interfaz web, y **Power Platform CLI (pac)** para simular y enrutar las conexiones con los servicios de SharePoint Online y Microsoft 365.

### Requisitos Previos Obligatorios
Antes de iniciar, asegúrate de tener instalado en tu máquina:
1. **Node.js** (versión 18 o superior) — [Descargar](https://nodejs.org)
2. **Git** — [Descargar](https://git-scm.com)
3. **Power Platform CLI (`pac`)** — [Instrucciones de Instalación](https://learn.microsoft.com/es-es/power-platform/developer/cli/introduction)
4. **PowerShell** (para ejecutar scripts de automatización)

### Inicialización Paso a Paso
1. **Clonar el Repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd SgiPortal
   ```
2. **Ejecutar el Script de Inicialización (Bootstrap):**
   Abre una consola de PowerShell como administrador en la raíz del proyecto y ejecuta:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\bootstrap.ps1
   ```
   *Este script verificará automáticamente todas las herramientas, instalará las dependencias de Node (`npm install`), validará la compilación de TypeScript y correrá el linter.*

3. **Iniciar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   *Detrás de escena, este comando ejecuta `start pac code run && vite`. Esto levantará el proxy local de conexiones de Power Apps en el puerto 8080 y la aplicación de Vite en [http://localhost:3000](http://localhost:3000).*

---

## 2. Estructura del Sistema de Configuraciones

El portal depende de dos archivos de configuración principales para enlazar datos y manejar credenciales:

### 2.1 Archivos de Entorno (`.env.local` y `.env.production`)

Ubicados en la raíz del proyecto, definen las variables del compilador Vite (prefijadas con `VITE_`):

| Variable | Descripción / Valor de Ejemplo |
| :--- | :--- |
| `VITE_AZURE_CLIENT_ID` | ID de la App Registration en Microsoft Entra ID (Azure AD). |
| `VITE_AZURE_TENANT_ID` | ID del Tenant de Office 365 de la JAC. |
| `VITE_SP_SITE_URL` | URL base del sitio de SharePoint Online (p. ej., `https://juntaaviacioncivil.sharepoint.com/teams/SGI`). |
| `VITE_SP_TENANT` | Subdominio del tenant (p. ej., `juntaaviacioncivil`). |
| `VITE_SHAREPOINT_URL` | URL de la API REST de SharePoint (p. ej., `https://juntaaviacioncivil.sharepoint.com/teams/SGI/_api`). |
| `VITE_BYPASS_LOGIN` | **CRÍTICO:** `true` en local para omitir MSAL y usar datos simulados; **`false` en producción**. |
| `VITE_USE_MOCK_DATA` | `true` para usar mocks locales de prueba; `false` para conectar a SharePoint. |
| `VITE_APP_URL` | Dirección de enlace profundo al reproductor de la app (deep-linking para notificaciones de correo). |

> [!WARNING]
> **Riesgo de Seguridad:** Nunca expongas credenciales en texto plano. Asegúrate de que `.env.local` y cualquier variable local estén incluidas en tu `.gitignore`.

### 2.2 Configuración del Contexto de Power Apps (`power.config.json`)

Este archivo mapea el contexto y los orígenes de datos locales para la conexión bajo el proxy de PAC CLI:
* **`appId` y `environmentId`:** Enlazan el portal al entorno y aplicación específica de Power Apps.
* **`connectionReferences`:** Registra las conexiones y mapea los nombres lógicos de las listas de SharePoint Online (por ejemplo, `sgi_kpi` mapea a la tabla física `SGI_KPI`).
* Si vas a consumir una lista nueva, debes declararla en la sección `dataSources` y `dataSets` de este archivo para que el proxy redirija las llamadas correctamente en desarrollo local.

---

## 3. Guía de Migración de Entorno (Evitando Errores)

Si necesitas clonar este portal o moverlo a un nuevo entorno de SharePoint o un nuevo Tenant de Office 365, realiza los siguientes pasos para evitar fallos de permisos o llamadas rechazadas:

### Paso 1: Configurar el Nuevo Sitio de SharePoint
1. Asegúrate de que todas las listas requeridas estén creadas en el sitio destino de SharePoint con el esquema de columnas idéntico (consulte el [diccionario_datos.md](file:///c:/codeapps/SgiPortal/docs/diccionario_datos.md)).
2. Los usuarios finales que utilicen el portal deben poseer permisos mínimos de **Colaborador (Contribute)** en este sitio para poder guardar registros y añadir adjuntos.

### Paso 2: Crear el Registro de Aplicación (Microsoft Entra ID)
1. Ve al **Portal de Azure** en el nuevo Tenant y registra una nueva aplicación (SPA - Single-Page Application).
2. Agrega las siguientes **Redirect URIs**:
   * `https://apps.powerapps.com` (Inicio de sesión desde reproductores oficiales y móviles).
   * `https://juntaaviacioncivil.sharepoint.com` (Para cuando se incruste dentro de SharePoint Online).
   * `http://localhost:3000` (Para desarrollo local si requieres pruebas de autenticación real).
3. En **Autenticación (Authentication)**, activa el Flujo Implícito marcando:
   * [x] **Access tokens**
   * [x] **ID tokens**
4. En **Permisos de API**, agrega permisos delegados de Microsoft Graph: `User.Read` y `User.ReadBasic.All`.

### Paso 3: Modificar las Configuraciones en el Proyecto
1. **Actualizar `power.config.json`:**
   * Cambia el valor de `environmentId` y `appId` por los del nuevo entorno.
   * En la clave del dataset (línea 30 del JSON), reemplaza la URL anterior por la del nuevo sitio de SharePoint (p. ej. `https://mi-nuevo-tenant.sharepoint.com/teams/MiSitio`).
2. **Actualizar `.env.production` (y `.env.local` si corresponde):**
   * Configura las nuevas URLs de SharePoint, Client ID y Tenant ID de Azure.
   * Asegúrate de actualizar `VITE_APP_URL` con el nuevo enlace profundo de la app del reproductor de Power Apps.
   * Asegura que `VITE_BYPASS_LOGIN=false` y `VITE_USE_MOCK_DATA=false`.

### Paso 4: Re-autenticar PAC CLI localmente
Si cambiaste de tenant o entorno, debes iniciar sesión de nuevo en la CLI para que el proxy local funcione:
```bash
pac auth create --environment <NUEVO_ENVIRONMENT_ID>
```

### Paso 5: Compilar y Empaquetar
Limpia versiones previas y compila el bundle de producción:
```bash
# Limpiar dependencias y caches
npm run lint
npx tsc -b
npm run build
```
*Esto generará el paquete final en la carpeta `dist/`, el cual contiene el archivo `index.html` y la carpeta `assets/` optimizados.*

---

## 4. Preguntas Frecuentes y Diagnóstico de Errores Comunes

### 1. Error `400 Bad Request` en consultas de SharePoint
* **Causa:** Generalmente ocurre cuando los nombres de las columnas o tipos de datos en la lista real de SharePoint no coinciden con las peticiones hechas por la capa de repositorios (`src/repositories/`).
* **Solución:** Revisa si la columna problemática requiere un formato específico (como campos de tipo Opción/Choice o Lookup que esperan estructuras JSON).

### 2. Error de Redirección (Redirect URI mismatch)
* **Causa:** El cliente de MSAL no tiene registrada la URL desde donde se está ejecutando la app en la App Registration de Azure.
* **Solución:** Comprueba que `https://apps.powerapps.com` y la URL del SharePoint del tenant estén dadas de alta en el portal de Azure en la sección SPA.

### 3. Las notificaciones por correo electrónico no se envían
* **Causa:** En local, si `VITE_BYPASS_LOGIN` está en `true`, el portal intercepta y simula el correo en consola para evitar fallos de conexión.
* **Solución:** Valida que en producción la variable esté compilada en `false` y que la conexión de SharePoint de los usuarios tenga permisos de envío.
