# Guía de Pruebas Funcionales — SgiPortal

Este documento describe los casos de prueba detallados (guión de pruebas) para verificar y validar las funcionalidades críticas del portal del SGI antes de cada liberación o migración de entorno.

---

## 1. Configuración del Entorno de Pruebas

Para ejecutar las pruebas funcionales, puedes alternar los archivos de configuración:

* **Modo Simulación Local (Recomendado para pruebas rápidas de interfaz):**
  * `.env.local` con `VITE_BYPASS_LOGIN=true` y `VITE_USE_MOCK_DATA=true`.
  * Esto cargará registros ficticios de KPIs, Riesgos, Procesos y permitirá alternar roles en tiempo real desde el encabezado del portal.
* **Modo Conectado / Producción (Validación final):**
  * `.env.production` con `VITE_BYPASS_LOGIN=false` y `VITE_USE_MOCK_DATA=false`.
  * Requiere una cuenta activa de Office 365 (`@jac.gob.do`) para iniciar sesión con MSAL y leer/escribir datos reales de SharePoint Online.

---

## 2. Casos de Prueba (Guión Paso a Paso)

### Caso 1: Inicio de Sesión y Simulación de Roles (Bypass Local)
* **Precondición:** Ejecutar en modo desarrollo con `VITE_BYPASS_LOGIN=true`.
* **Pasos:**
  1. Abre el navegador e ingresa a [http://localhost:3000](http://localhost:3000).
  2. Verifica que la aplicación se cargue directamente sin solicitar usuario ni contraseña corporativa.
  3. En la barra superior (Header), localiza el selector de rol simulado.
  4. Cambia el rol a **Usuario**. Verifica que el menú lateral oculte la pestaña de "Logs de Actividad" y "Gestión de Usuarios".
  5. Cambia el rol a **Admin**. Verifica que todas las opciones del menú lateral vuelvan a estar visibles.
* **Resultado Esperado:** El portal responde dinámicamente según el rol simulado en la barra superior.

### Caso 2: Ciclo Completo de Aprobaciones Secuenciales (Flujo de Calidad e Intermedio)
* **Precondición:** El usuario tiene rol de **Usuario** (o simulado como tal) y pertenece a un área (por ejemplo, "Sección de Desarrollo") con una jerarquía de aprobación configurada.
* **Pasos:**
  1. Dirígete a la pestaña **Matriz de Riesgos** y haz clic en **Nuevo Riesgo**.
  2. Completa el formulario de registro y haz clic en **Enviar a Aprobación**.
  3. Dirígete a la **Consola de Aprobaciones** y verifica que la solicitud aparezca con estado **Pendiente** y en el paso **Paso 1: Calidad**.
  4. Cambia tu rol de simulación a **DP** (Calidad/Dueño de Proceso).
  5. En la sección "Solicitudes por Aprobar", localiza la solicitud enviada.
  6. Haz clic en **Aprobar** agregando el comentario `"Validado por Calidad"`.
  7. Verifica que la solicitud ahora se muestre en estado **Pendiente** pero asignada al **Paso 2** (jefe del Departamento correspondiente) y que el aprobador asignado se resuelva dinámicamente de la jerarquía de área del solicitante.
  8. Cambia tu simulación al rol de dicho jefe e ingresa a la Consola de Aprobaciones.
  9. Haz clic en **Aprobar**.
* **Resultado Esperado:** Al recibir la última firma, la solicitud cambia su estado global a **Aprobado** y el riesgo se añade oficialmente a la colección principal de la Matriz de Riesgos.

### Caso 3: Intercepción y Envió de Notificaciones por Correo
* **Precondición:** Configurar e iniciar flujo de aprobación.
* **Pasos (Modo Bypass / Local):**
  1. Ejecuta una aprobación o rechazo en la Consola.
  2. Abre la consola de desarrollo del navegador (F12) o revisa el visor de alertas local.
  3. Comprueba que el correo se registre como `"Simulado/Interceptado"` y que muestre el remitente, destinatario, cuerpo del mensaje en HTML y el enlace profundo (deep link).
* **Pasos (Modo Producción):**
  1. Inicia sesión con credenciales reales en producción y realiza una solicitud.
  2. Verifica que el aprobador asignado reciba un correo electrónico real en su bandeja de Outlook.
  3. Haz clic en el botón de acción dentro del correo y valida que redirija de manera correcta al aprobador directo hacia la app de Power Apps en el registro exacto.
* **Resultado Esperado:** Los flujos envían alertas o simulan intercepciones de forma limpia según el modo de desarrollo/bypass activo sin romper la ejecución del portal.

### Caso 4: Evitar Error "400 Bad Request" al guardar Niveles Jerárquicos
* **Precondición:** Estar logueado como **Admin** o **DP**.
* **Pasos:**
  1. Dirígete a la sección de **Configuración de Áreas**.
  2. Crea una nueva área o edita una existente.
  3. En el campo desplegable de **Nivel**, selecciona `'Departamento'` o `'Sección'`.
  4. Haz clic en **Guardar**.
  5. Valida que el registro se guarde sin errores y que en SharePoint se persista el valor correcto en el campo `Nivel`.
* **Resultado Esperado:** No se producen fallas de esquema OData ni respuestas HTTP 400 ya que la propiedad de tipo Opción de la lista maestra en SharePoint está sincronizada con el modelo interno del frontend.

### Caso 5: Búsqueda del Directorio Institucional (PeoplePicker)
* **Precondición:** La aplicación tiene acceso a las conexiones del tenant (desarrollo local con PAC activo, o producción).
* **Pasos:**
  1. Edita un proceso existente o añade un nuevo KPI.
  2. En el campo de **Responsable**, comienza a escribir parte del nombre de un empleado real de la JAC (por ejemplo, `"Juan"`).
  3. Comprueba que aparezca un listado dinámico sugiriendo usuarios institucionales.
  4. Selecciona un usuario.
  5. Verifica que los campos de nombre y correo del responsable se rellenen automáticamente.
* **Resultado Esperado:** El portal consulta exitosamente el conector `Office365Users` y autocompleta los datos del responsable.
