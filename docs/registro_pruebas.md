# Registro de Pruebas y Validación Técnica — SgiPortal

Este documento registra el historial de casos de prueba ejecutados durante el desarrollo del portal del SGI de la JAC, incluyendo la resolución de problemas técnicos críticos detectados durante la integración con SharePoint.

---

## 1. Bitácora de Pruebas Ejecutadas

| ID de Prueba | Caso de Prueba | Tipo de Prueba | Estado | Notas de Validación |
| :--- | :--- | :--- | :--- | :--- |
| `TC-001` | Inicio de Sesión MSAL (Azure AD) | Seguridad / Integración | 🟢 Exitoso | Valida la redirección SPA en producción y obtención del token. |
| `TC-002` | Selector de Roles (Bypass Local) | Interfaz / Funcional | 🟢 Exitoso | Modificación dinámica de vistas al cambiar de rol en la barra superior. |
| `TC-003` | Consultas de SharePoint REST (GET) | Conectividad | 🟢 Exitoso | Retorno e hidratación correcta del store Zustand. |
| `TC-004` | Carga de Directorio (PeoplePicker) | Integración | 🟢 Exitoso | Consulta del conector `Office365Users` de forma asíncrona. |
| `TC-005` | Guardado de Niveles de Áreas | Persistencia | 🟢 Exitoso | Corrección del error 400 Bad Request en la opción `Nivel`. |
| `TC-006` | Intercepción de Correos en Local | Comunicaciones | 🟢 Exitoso | Captura y visualización en consola del HTML del correo de alerta. |
| `TC-007` | Flujo de Aprobación Jerárquica | Lógica de Negocio | 🟢 Exitoso | Escalación de pasos (Calidad -> Sección -> Departamento -> Dirección). |

---

## 2. Historial de Corrección de Errores Críticos (Bug Fixes)

### Error 1: Error `400 Bad Request` al actualizar o guardar Áreas Organizacionales
* **Síntoma:** Al intentar registrar o editar una nueva área en `SGI_Areas` seleccionando un nivel jerárquico (p. ej. `Departamento`), la API REST de SharePoint Online rechazaba la petición devolviendo un error HTTP 400.
* **Causa:** El campo `Nivel` en la lista de SharePoint está configurado como de tipo **Opción (Choice)** con valores predefinidos en español con acento (`Sección`, `División`, `Dirección`). El front-end enviaba nombres planos u opciones no válidas que rompían la validación estricta de OData de SharePoint.
* **Solución:** Se homologó el enumerado interno en TypeScript ([index.ts](file:///c:/codeapps/SgiPortal/src/types/index.ts)) con los valores exactos requeridos por la lista de SharePoint. Además, se actualizó la lógica en la capa del repositorio `areaRepository.ts` para sanitizar las propiedades antes de enviarlas al cliente REST, asegurando la persistencia limpia y sin errores 400.

### Error 2: Caída del servicio de correos en Entorno de Desarrollo Local
* **Síntoma:** Durante el desarrollo local, al iniciar un flujo de aprobación, la aplicación intentaba disparar una alerta de correo mediante el servicio `spSendEmail` llamando al endpoint `/_api/SP.Utilities.Utility.SendEmail`. La llamada fallaba con un error `404 Not Found` o `500 Internal Error`.
* **Causa:** El proxy de desarrollo de la CLI de Power Platform (`pac code run`) no implementa ni emula endpoints auxiliares de SharePoint como el motor de correos institucionales, lanzando excepciones de red que congelaban la interfaz de usuario.
* **Solución:** Se implementó un interceptor inteligente dentro de la función de envío de correos en `sharePointService.ts`. Si la aplicación detecta que está en modo bypass/desarrollo local (`VITE_BYPASS_LOGIN=true`), desvía la llamada de red e imprime los detalles de la notificación (destinatario, asunto, cuerpo HTML) directamente en la consola del navegador y en un cuadro de diálogo del visor de alertas local. En producción, el interceptor se desactiva y el correo se envía de manera real.

### Error 3: Búsquedas de Directorio Lentas o Fallidas con `siteusers`
* **Síntoma:** La búsqueda de responsables arrojaba fallos intermitentes al consultar los usuarios de SharePoint.
* **Causa:** El endpoint REST `_api/web/siteusers` no está mapeado en la configuración de la conexión del proxy de Power Apps (`power.config.json`), causando bloqueos en local.
* **Solución:** Se migró la búsqueda de usuarios para utilizar el conector oficial de Office 365 Users (`Office365UsersService` / `office365users` en `power.config.json`), garantizando búsquedas rápidas tanto en desarrollo local como en el reproductor de Power Apps en producción.
