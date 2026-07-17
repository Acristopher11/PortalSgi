# ADR-002: Usar Office365Users en lugar de _api/web/siteusers para búsquedas de Directorio

## Decisión
Usar el servicio de conexión `Office365UsersService` para realizar las búsquedas de usuarios del directorio activo de la institución.

## Razones
1. **Enrutamiento del Proxy y Power Apps**: El endpoint REST de SharePoint `_api/web/siteusers` no está registrado como origen de datos en `power.config.json`, lo que causa que falle en el proxy local de PAC y en el reproductor de Power Apps.
2. **Conector Oficial**: `Office365Users` es una conexión registrada y enrutada de forma segura tanto para el entorno de desarrollo como para el reproductor en producción.
3. **Mapeo Sencillo**: Retorna un conjunto de usuarios con nombre y correo electrónico institucional de forma nativa.

## Alternativas consideradas
- Registrar el endpoint `siteusers` en `power.config.json` (complejo y no estándar).
- Usar un bypass local continuo (incompatible con producción).

## Consecuencias
- Las búsquedas en la pestaña de administración funcionan de forma integrada en producción.
- Dependencia del conector de Office 365 Users en el entorno del cliente.

## Estado
✅ Implementado y desplegado a producción.
