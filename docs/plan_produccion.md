# Plan de Despliegue y Lista de Chequeo para Producción — SgiPortal

Este documento detalla las configuraciones necesarias, las variables de entorno obligatorias y los pasos de infraestructura requeridos para publicar el portal de forma segura en el entorno productivo de la **Junta de Aviación Civil (JAC)**.

---

## 1. Ajustes Críticos de Configuración (`.env.production`)

Antes de realizar el build de producción, es obligatorio revisar los siguientes parámetros en [.env.production](file:///c:/codeapps/SgiPortal/.env.production):

```ini
# 1. Autenticación Microsoft Entra ID (Azure AD)
VITE_AZURE_CLIENT_ID=590fb207-aae7-4802-a22a-a44e64e195b5
VITE_AZURE_TENANT_ID=ab0f49e3-ba67-4d34-bc10-ff5832bae7ae

# 2. Direccionamiento SharePoint Online
VITE_SP_SITE_URL=https://juntaaviacioncivil.sharepoint.com/teams/SGI
VITE_SP_TENANT=juntaaviacioncivil
VITE_SHAREPOINT_URL=https://juntaaviacioncivil.sharepoint.com/teams/SGI/_api

# 3. SEGURIDAD: Desactivar Bypass de Login
VITE_BYPASS_LOGIN=false       # <-- ¡DEBE SER FALSE EN PRODUCCIÓN!
VITE_USE_MOCK_DATA=false

# 4. Direccionamiento de Enlace Profundo para Notificaciones
VITE_APP_URL=https://apps.powerapps.com/play/e/0c89f75f-4d9b-ea5a-9556-c6c60dc34902/app/
```

> [!WARNING]
> **Riesgo de Seguridad:** Si `VITE_BYPASS_LOGIN` se compila como `true` en el build de producción, cualquier persona podrá acceder al portal sin autenticación real de Office 365, y las notificaciones de correo se seguirán desviando como "Simuladas" en lugar de enviarse de verdad.

---

## 2. Registro de Aplicación en Microsoft Entra ID (Azure Portal)

Para que el inicio de sesión funcione correctamente desde el reproductor oficial de Power Apps o SharePoint Online, debes configurar las **Redirect URIs** en la App Registration (`590fb207-aae7-4802-a22a-a44e64e195b5`):

1. **Plataforma Single-Page Application (SPA):**
   * Añadir: `https://apps.powerapps.com` (Permite el inicio de sesión desde el Player).
   * Añadir: `https://juntaaviacioncivil.sharepoint.com` (Permite el inicio de sesión cuando se inserte en SharePoint como elemento web).
2. **Flujo Implícito (Implicit Grant):**
   * Asegurar que estén marcados los checks:
     * [x] **Access tokens** (fines de API)
     * [x] **ID tokens** (fines de perfil)

---

## 3. Listas Maestras en SharePoint Online (Producción)

El portal asume que en el sitio principal `https://juntaaviacioncivil.sharepoint.com/teams/SGI` existen las siguientes listas maestras con sus respectivos esquemas intactos:

* **Estructura Organizacional:** `SGI_Areas` (debe contener la columna de tipo Opción/Choice `Nivel`).
* **Roles y Permisos:** `SGI_Usuarios`.
* **Procesos:** `SGI_MaestraProceso`.
* **Indicadores:** `SGI_KPI` y `SGI_Mediciones`.
* **Alineación Estratégica:** `SGI_Objetivos`.
* **Operaciones de Flujo:** `SGI_Actividades`.
* **Glosario:** `SGI_Glosario`.
* **Matriz de Riesgos:** `MATRIZ DE GESTIÓN DE RIESGOS`.
* **Repositiorio Documental:** `Gestión Documental` (Biblioteca de documentos).

> [!IMPORTANT]
> **Permisos de Colaborador (Contribute):** Los usuarios finales del portal deben tener como mínimo permisos de **Edición** en estas listas de SharePoint para poder enviar nuevas solicitudes, agregar comentarios y registrar mediciones de KPIs.

---

## 4. Flujo de Empaquetado y Publicación (Paso a Paso)

Para realizar la entrega formal del código:

1. **Ejecutar Type Check y Compilación:**
   ```bash
   npm run type:check
   npm run build
   ```
2. **Empaquetamiento en la Solución Power Platform:**
   * El bundle optimizado se generará en la carpeta `dist/`.
   * Si estás utilizando una página personalizada o un control PCF (Power Apps Component Framework), copia los archivos de `dist/` a la ruta del recurso web de tu solución y ejecuta:
     ```bash
     pac solution build
     ```
3. **Importar y Publicar en el Centro de Administración de Power Apps:**
   * Importar la solución `.zip` generada en el entorno productivo de la JAC.
   * Publicar todas las personalizaciones.

---

## 5. Pruebas de Humo en Producción (Smoke Tests)

Una vez publicado, se recomienda validar los siguientes 3 puntos clave:
1. **Acceso Inicial:** Entrar con una cuenta corporativa `@jac.gob.do` y verificar que el flujo de MSAL no arroje errores de autenticación o Redirección.
2. **Ciclo de Aprobaciones con Correos Reales:** 
   * Crear una solicitud de prueba.
   * Verificar que el aprobador reciba el correo real en su buzón de Outlook.
   * Hacer clic en el botón del correo y validar que abra la aplicación directamente en la solicitud correspondiente.
3. **Persistencia del Nivel Jerárquico:** Crear o modificar un área y verificar en la lista de SharePoint Online que el campo `Nivel` se guarde de forma correcta sin el error `400 Bad Request`.
