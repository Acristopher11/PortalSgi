# AGENT.MD - Dictador del Contexto y Stack Cognitivo
## SgiPortal - React 19 + Vite + TypeScript + Power Apps Code

---

## 1. COMPUERTA DE INICIO (HITL Inicial)

**PROHIBICIÓN ESTRICTA:** Antes de escribir cualquier código o generar estructuras de carpetas, **debes preguntarme qué stack vamos a utilizar** para esta tarea específica.

**Stacks disponibles en este proyecto:**
- ✅ React 19 + Vite + TypeScript 6 (stack principal de SgiPortal)
- ℹ️ Power Apps Code (migración desde legacy Power Apps)
- ℹ️ SharePoint REST API (integración de datos)

**ACCIÓN:** Espera mi confirmación explícita antes de continuar. No asumas nada.

---

## 2. STACK TECNOLÓGICO Y SKILLS REGISTRY (Carga bajo demanda)

**PROHIBICIÓN:** No cargues TODO el conocimiento en la memoria principal. Consulta **bajo demanda** los módulos de conocimiento independientes:

```
.agent/registry/react-vite.md
├── Convenciones de código (TypeScript, React Hooks)
├── Componentes Fluent UI (estilos, accesibilidad)
├── State Management (Zustand)
├── Testing (Vitest, React Testing Library)
├── Power Apps Code integration
└── Rutas y navegación (React Router v7)
```

**Cuando necesites reglas de React:** Lee SOLO `.agent/registry/react-vite.md`

---

## 3. CLÁUSULA DE AISLAMIENTO ABSOLUTO

**PROHIBICIÓN ESTRICTA:**
- ❌ NO leas/uses archivos de `gentle-ai`, `engram` o `agent-teams-lite` nativos
- ❌ NO uses skills automáticas de herramientas externas
- ❌ NO consultes configuraciones globales de `~/.config/gga/` o `~/.gemini/`

**ÚNICA FUENTE DE VERDAD AUTORIZADA:**
- ✅ `.agent/registry/react-vite.md` para reglas de negocio
- ✅ `.agent/teams.md` para orquestación SDD
- ✅ Este mismo archivo (`agent.md`) para meta-reglas

---

## 4. MEMORIA PERSISTENTE (ENGRAM)

**CONEXIÓN MCP REQUERIDA:**

Antes de proponer código y **al finalizar tareas**, debes:

1. Conectarte a Engram (servidor MCP en `~/.engram/engram.db`)
2. **Escribir aprendizajes:** `mem_save --title="<título>" --type="learning" --what="..." --why="..." --where="..." --learned="..."`
3. **Buscar contexto previo:** `engram search "tema-relevante" --limit=5` para evitar repetir errores

**Formato de aprendizaje persistente:**
```
mem_save \
  --title="Qué hicimos" \
  --type="decision|bug-prevented|architecture|learned" \
  --what="Descripción técnica" \
  --why="Por qué fue necesario" \
  --where="Archivos/componentes afectados" \
  --learned="Lección para futuras sesiones"
```

**CRÍTICO:** Sin esto, cada sesión comenzará con amnesia. Engram es tu única defensa.

---

## 5. PROHIBICIONES ESTRICTAS (GUARDRAILS)

### 5.1 SEGURIDAD
- ❌ **Nunca expongas credenciales, API keys o tokens en texto plano**
- ❌ No loguees datos sensibles en consola
- ❌ No commits secrets al repositorio
- ✅ Usa variables de entorno (`.env.local`, no en git)
- ✅ Todas las credenciales deben estar en Secrets de GitHub Actions

### 5.2 ARCHIVOS CORE
- ❌ **NO modifiques `package.json` sin autorización explícita**
- ❌ **NO alters `.env`, `.env.production` sin permiso**
- ❌ **NO cambies versiones de dependencias sin justificación**
- ✅ Si necesitas un cambio en deps, propón primero, espera aprobación, luego ejecuta

### 5.3 CARPETAS DEL ENTORNO
- ❌ **NO toques `node_modules/`, `.next/`, `dist/` o build outputs**
- ❌ **NO modifiques `~/.engram/`, `~/.config/` o carpetas globales**
- ✅ Los únicos directorios donde escribir código son `src/`, `tests/`, `.agent/`

---

## 6. TESTING, CI/CD, COMMITS Y PRs

### 6.1 CONVENCIÓN DE COMMITS (Obligatoria)

Todos los commits DEBEN usar **Conventional Commits** para que `Release Please` funcione:

```
<tipo>(<alcance>): <descripción>

<cuerpo (opcional)>

<pie de página (opcional)>
```

**Tipos válidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `chore`: Cambios en tooling, dependencias
- `refactor`: Refactorización sin cambiar funcionalidad
- `test`: Agregar o actualizar tests
- `perf`: Mejoras de performance
- `ci`: Cambios en CI/CD

**Ejemplos:**
```
feat(dashboard): agregar widget de KPIs en tiempo real
fix(auth): corregir validación de token expirado
docs(readme): actualizar instrucciones de instalación
chore(deps): actualizar @fluentui/react-components a v9.74
test(kpi): agregar cobertura para KPICard component
```

**PROHIBICIÓN:** Si el commit no sigue esta convención, CI lo rechazará y no podrá mergearse.

### 6.2 PRUEBAS OBLIGATORIAS

**Regla de Oro:** Todo código generado DEBE incluir tests.

- **React Components:** Vitest + React Testing Library (tests unitarios)
- **Custom Hooks:** Vitest (tests de lógica)
- **Servicios:** Vitest + mocking (tests de API calls)

**Estructura de test:**
```typescript
// src/components/KPICard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';

describe('KPICard', () => {
  it('renders with title and value', () => {
	render(<KPICard title="Revenue" value={1000} />);
	expect(screen.getByText('Revenue')).toBeInTheDocument();
  });
});
```

**Si no hay tests:** CI fallará, el PR quedará bloqueado.

### 6.3 LINTING Y TYPE CHECKING

- `npm run lint` - ESLint debe pasar sin errores
- `npm run type:check` - TypeScript debe estar limpio
- `npm run build` - Vite build debe compilar sin errores

**Todos estos comandos se ejecutan automáticamente en GitHub Actions.**

---

## 7. ORQUESTACIÓN Y FLUJO DE TRABAJO (PLAN MODE)

**REGLA FUNDAMENTAL:** Siempre actúa bajo **"Plan Mode"**.

### 7.1 Protocolo de Plan
1. **Análisis:** Lee el request del usuario
2. **Propuesta:** Genera un plan estructurado con fases claras
3. **Presentación:** Muestra el plan en el chat
4. **ESPERA:** Bloquea la ejecución hasta que el usuario escriba **"Aprobado"**
5. **Ejecución:** Implementa paso a paso
6. **Validación:** Verifica que cada paso cumple su objetivo
7. **Cierre:** Documenta aprendizajes en Engram

### 7.2 Estructura de Plan
```markdown
# Título descriptivo

## Understanding
Restate el request en 2-3 oraciones claras

## Assumptions
- Asunción 1
- Asunción 2

## Approach
Estrategia de implementación con referencias a archivos

## Key Files
- path/file.ext - por qué importa

## Risks & Open Questions
- Riesgo 1
- Pregunta sin responder

## Steps
1. Verb target — detalle atómico
2. Verb target — detalle atómico
```

### 7.3 Anti-Patrones (Prohibido)
- ❌ Ejecutar sin plan aprobado
- ❌ Cambiar múltiples archivos sin comunicar primero
- ❌ Asumir decisiones de arquitectura sin confirmar
- ❌ Generar código sin tests

---

## 8. DECISIONES ARQUITECTÓNICAS (Decision Log)

Antes de hacer cambios arquitectónicos, registra en `.agent/memory/decisions.md`:

```markdown
# ADR-001: Usar Zustand en lugar de Context API

## Decisión
Usar Zustand para state management global.

## Razones
1. Menor overhead de renders
2. Mejor performance con grandes estados
3. API más simple que Context

## Alternativas consideradas
- Redux (muy verbose)
- Context API (muchos renders)

## Consecuencias
- Menos boilerplate
- Learning curve mínimo (similar a Context)
- No es framework-agnostic (pero OK para React)

## Estado
✅ Implementado en useAuthStore, useKPIStore, etc.
```

---

## 9. NAVEGACIÓN DE ESTE AGENTE (Índice Rápido)

- **¿Necesito reglas de React?** → `.agent/registry/react-vite.md`
- **¿Cómo orquesto tareas?** → `.agent/teams.md`
- **¿Qué guardrails tengo?** → Sección 5 de este archivo
- **¿Cómo hago commits?** → Sección 6.1 (Conventional Commits)
- **¿Cómo manejo memoria?** → Sección 4 (ENGRAM)
- **¿Cómo propongo cambios?** → Sección 7 (Plan Mode)

---

## 10. CHECKLIST DE INICIALIZACIÓN (Por sesión)

Cada vez que empieces una sesión, verifica:

- [ ] Stack confirmado (React/Vite/TypeScript)
- [ ] `.agent/registry/react-vite.md` disponible
- [ ] `.agent/teams.md` disponible
- [ ] Engram accesible (`engram stats` funciona)
- [ ] Variables de entorno cargadas (`$env:PATH` incluye Go, Engram, etc.)
- [ ] `npm install` completado (node_modules frescos)
- [ ] Último commit fue convencional
- [ ] Build pasa (`npm run build` exitoso)

Si ALGUNO falla → Detente y pregunta antes de continuar.

---

## 11. SOPORTE Y ESCALADA

Si algo no está cubierto en este documento:

1. **Pregunta primero** - No asumas
2. **Consulta `.agent/registry/react-vite.md`** - Reglas específicas del stack
3. **Revisa `.agent/teams.md`** - Orquestación SDD
4. **Busca en Engram** - `engram search "tema"` para lecciones previas
5. **Escala al usuario** - Si no encuentras respuesta, pide guía

---

## 12. ÚLTIMA LÍNEA DE DEFENSA

**Si dudas, PREGUNTA.**

Este es un proyecto crítico (Sistema de Gestión Integrado de la Junta de Aviación Civil). Mejor hacer 10 preguntas que cometer 1 error en producción.

**Lema del proyecto:**
> "Una sesión de preguntas es mejor que una semana de debugging."

---

**Versión:** 1.0  
**Última actualización:** 2026-06-01  
**Stack:** React 19 + Vite + TypeScript 6 + Power Apps Code  
**Mantenedor:** SgiPortal Team  
