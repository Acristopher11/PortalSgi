# Plan de Transición, Entrega y Limpieza del Proyecto (Handover a DTI)

Este plan establece las acciones necesarias para preparar la entrega formal del portal del SGI al Departamento de Tecnologías de la Información (DTI) con el fin de asegurar su correcta administración, mantenimiento y despliegue tras tu partida.

---

## 1. Documentos de Entrega Planificados

Crearemos una carpeta `docs/` en la raíz del proyecto para alojar la documentación oficial de entrega:

1. **Manual de Usuario (`docs/manual_usuario.md`):**
   * Explicación de cada módulo funcional (Dashboard, Reporte de KPIs, Gestión de Documentos, Matriz de Riesgos, Glosario y Consola de Aprobaciones).
   * Guía para Administradores de Calidad: Configuración de flujos, asignación de responsables y jerarquías organizacionales.

2. **Guía de Pruebas Funcionales (`docs/pruebas_funcionales.md`):**
   * Guión de pruebas paso a paso para validar que todos los flujos de aprobación, inserción de datos, y simulación de correos funcionan correctamente antes de liberar el portal.

3. **Documentación Técnica del Código Fuente (`docs/documentacion_codigo.md`):**
   * **Arquitectura de Software:** Explicación del stack (React 19 + Vite + Fluent UI + SharePoint REST Layer).
   * **Flujos de Datos (Conexiones):** Explicación del cliente de SharePoint ([spClient.ts](file:///c:/codeapps/SgiPortal/src/lib/spClient.ts)) y de la capa de repositorios.
   * **Instrucciones para Modificaciones Comunes:**
     * Cómo agregar o modificar páginas (rutas y layouts).
     * Cómo modificar modales o formularios de diálogo (`Dialog` y `DialogSurface`).
     * Cómo editar la lógica del Motor de Aprobaciones (`approvalFlowEngine.ts`).

4. **Diccionario de Datos (`docs/diccionario_datos.md`):**
   * Estructura completa de las listas maestras de SharePoint Online que actúan como base de datos (columnas, tipos de datos: Texto, Choice, Lookup, Persona, y relaciones).

5. **Diagrama de Procesos del SGI (`docs/diagrama_proceso.md`):**
   * Diagrama de flujo detallado (utilizando sintaxis Mermaid) que explica visualmente el flujo de vida de una solicitud: desde la creación del borrador, paso por Calidad (Paso 1), paso por Encargado (Paso 2), hasta su aprobación final (guardado directo) o rechazo.

6. **Registro de Ejecución de Pruebas (`docs/registro_pruebas.md`):**
   * Historial y bitácora de los casos de prueba ya validados durante el desarrollo (por ejemplo: la solución al error 400 del nivel jerárquico, las pruebas de PeoplePicker, y la simulación de correos interceptados), demostrando que cada componente clave funciona de forma exitosa.

7. **Guía de Configuración, Migración y Despliegue (`docs/guia_configuracion.md`):**
   * Instrucciones detalladas para clonar y levantar el entorno de desarrollo local desde cero usando el script de bootstrap.
   * Explicación de los archivos de configuración clave (`power.config.json`, `.env.local`, `.env.production`).
   * Pasos específicos para realizar una migración segura de tenant o entorno de SharePoint, evitando errores de referencias, IDs y redireccionamientos.

8. **Informe Técnico de Entrega y Handover (`docs/informe_entrega.md`):**
   * Resumen formal de la entrega que detalla el objetivo del aplicativo, su arquitectura de software, el inventario completo de entregables y la firma de conformidad de DTI.

---

## 2. Script de Limpieza Automática de Metadatos de IA (`scripts/limpiar-proyecto.ps1`)

Crearemos un script de PowerShell en `scripts/limpiar-proyecto.ps1` que el usuario o DTI puede ejecutar localmente para realizar una copia limpia de todo el proyecto en una ruta destino sin dejar ningún archivo, carpeta o registro oculto relacionado con el asistente de Inteligencia Artificial (removiendo `.agent/`, `.agents/`, `.gemini/`, registros de depuración locales y opcionalmente el historial de Git si se desea iniciar uno nuevo).

---

## 3. Cronograma de Implementación de la Entrega

* **Fase 1: Redacción de Manuales y Documentos Técnicos**
  * Crear [manual_usuario.md](file:///c:/codeapps/SgiPortal/docs/manual_usuario.md)
  * Crear [pruebas_funcionales.md](file:///c:/codeapps/SgiPortal/docs/pruebas_funcionales.md)
  * Crear [documentacion_codigo.md](file:///c:/codeapps/SgiPortal/docs/documentacion_codigo.md)
  * Crear [guia_configuracion.md](file:///c:/codeapps/SgiPortal/docs/guia_configuracion.md)
  * Crear [informe_entrega.md](file:///c:/codeapps/SgiPortal/docs/informe_entrega.md)
* **Fase 2: Creación del Script de Limpieza**
  * Crear [limpiar-proyecto.ps1](file:///c:/codeapps/SgiPortal/scripts/limpiar-proyecto.ps1)
* **Fase 3: Verificación Técnica del Build y Compilación Final**
  * Validar el build para garantizar que no existan dependencias rotas tras la generación de documentación.
* **Fase 4: Ejecución de Limpieza y Entrega**
  * Instrucciones para copiar la carpeta final libre de IA y transferir a DTI.
