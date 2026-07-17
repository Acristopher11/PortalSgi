# TEAMS.MD - Orquestador Multi-Agente SDD Pipeline
## SgiPortal - Spec-Driven Development Workflow

---

## 1. CORE TEAMS Y RESPONSABILIDADES

### 1.1 SPEC Team (Specification Driver)
**Misión:** Convertir requirements en specifications ejecutables

**Responsabilidades:**
- 📋 Analizar requirements del usuario
- 🎯 Traducir a acceptance criteria (AAA format)
- 📐 Generar Feature Spec en YAML
- 🔀 Orquestar handoff a Dev Team

**Artifacts:**
```yaml
# .agent/specs/feature-name.spec.yml
feature: "Feature Name"
acceptance_criteria:
  - given: "Contexto inicial"
	when: "Acción"
	then: "Resultado esperado"
dependencies:
  - other-feature
  - sharepoint-list
priority: "P0|P1|P2"
```

**Output Gate:**
- ✅ Spec existe y es válida YAML
- ✅ Todos los acceptance criteria son testables
- ✅ Dependencias resueltas
- ✅ Engram ha registrado el spec (`mem_save --type=spec ...`)

---

### 1.2 DEV Team (Implementation)
**Misión:** Implementar feature según spec

**Responsabilidades:**
- 💻 Crear rama (`git checkout -b feat/feature-name`)
- 🧪 TDD: tests primero (Vitest + RTL)
- 📝 Implementar componente/servicio
- 🔍 Type checking limpio (`npm run type:check`)
- 🧹 Linting limpio (`npm run lint`)
- ✅ Tests verdes
- 📦 Build exitoso (`npm run build`)

**Artefacts:**
```typescript
// src/components/FeatureName.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('FeatureName', () => {
  it('satisfies AC-001', () => {
	// Test que valida acceptance criteria
  });
});
```

**Output Gate:**
- ✅ Todos los tests pasan
- ✅ TypeScript clean
- ✅ ESLint clean
- ✅ Build exitoso
- ✅ +80% coverage mínimo

---

### 1.3 REVIEW Team (Quality Gate)
**Misión:** Validar que impl ↔ spec sin desvíos

**Responsabilidades:**
- 🔍 Verificar PR contra spec original
- 🧪 Ejecutar tests completos
- 📋 Checklist de aceptación
- 🔐 Security scan (no secrets, no credentials)
- 📚 Documentación OK
- 💬 Feedback constructivo

**Checklist Pre-Merge:**
```markdown
- [ ] PR title = feat|fix(scope): description (Conventional Commits)
- [ ] Description linkea a spec/issue
- [ ] Tests pasan (coverage >= 80%)
- [ ] Type checking limpio
- [ ] ESLint limpio
- [ ] No secrets/credentials
- [ ] Documentación actualizada
- [ ] Engram learning registrado
```

**Output Gate:**
- ✅ PR aprobado por 1+ reviewer
- ✅ Todos los checks pasan
- ✅ No merge conflicts
- ✅ SDD learning guardado en Engram

---

### 1.4 OPS Team (Deployment)
**Misión:** CI/CD, deployments, observability

**Responsabilidades:**
- 🤖 GitHub Actions pipeline
- 🐳 Build e image (si aplica)
- 🚀 Deploy a staging/prod
- 📊 Monitoreo y alerts
- 🔙 Rollback si falla

**Pipeline Stages:**
```yaml
# .github/workflows/sdd.yml
on: [push, pull_request]
jobs:
  build-test:
	- npm install
	- npm run type:check
	- npm run lint
	- npm run build
	- npm run test

  deploy-staging: # Solo en main
	- Deploy a staging
	- Smoke tests
	- Observability check
```

**Output Gate:**
- ✅ Todos los jobs pasan
- ✅ Build artifact creado
- ✅ Staging health check OK
- ✅ Alerts configurados

---

## 2. FLUJO DE TRABAJO (SDD Pipeline)

```
USER REQUEST
	↓
	├─→ SPEC Team
	│   ├─ Analizar requirement
	│   ├─ Generar acceptance criteria (AAA)
	│   ├─ Crear feature spec YAML
	│   ├─ Registrar en Engram
	│   └─→ DEV Team (gates OK)
	│
	├─→ DEV Team
	│   ├─ Checkout rama: git checkout -b feat/xxx
	│   ├─ TDD: escribir tests primero
	│   ├─ Implementar componente
	│   ├─ Type check, lint, build
	│   ├─ Commit convencional
	│   └─→ REVIEW Team (gates OK)
	│
	├─→ REVIEW Team
	│   ├─ Validar PR vs spec
	│   ├─ Ejecutar tests
	│   ├─ Security scan
	│   ├─ Checklist pre-merge
	│   ├─ Registrar learning en Engram
	│   └─→ OPS Team (gates OK, merge a main)
	│
	└─→ OPS Team
		├─ GitHub Actions pipeline
		├─ Build e tests en CI
		├─ Deploy a staging
		├─ Smoke tests
		└─ Ready para prod
```

---

## 3. HANDOFF PROTOCOL (Team ↔ Team)

### Handoff: SPEC → DEV

**SPEC emite:**
```markdown
# Feature: [Feature Name]
## Acceptance Criteria
- [ ] AC-001: Given X when Y then Z
- [ ] AC-002: Given A when B then C

## Spec File
`.agent/specs/[feature-name].spec.yml` (validated YAML)

## Dependencies
- Sharepoint list: SGI_MaestraProceso
- Component: Dashboard (already exists)

## Tech Stack
- React 19 + TypeScript
- State: Zustand (useKPIStore)
- UI: Fluent UI (@fluentui/react-components)

## Ownership
@dev-team → branch feat/[feature-name]
```

**DEV Confirms & Starts:**
```bash
# Handoff acknowledgment
git checkout -b feat/feature-name
git push --set-upstream origin feat/feature-name
# Begin TDD loop
```

---

### Handoff: DEV → REVIEW

**DEV creates PR:**
```markdown
# feat(scope): Short description

Fixes #{spec-issue-number}

## Changes
- Added FeatureComponent.tsx
- Added FeatureComponent.test.tsx
- Updated useKPIStore for new state

## Related Spec
- AC-001: ✅ Pass
- AC-002: ✅ Pass
- AC-003: ✅ Pass

## Checklist
- [x] Tests pass (npm run test)
- [x] Type check clean (npm run type:check)
- [x] Lint clean (npm run lint)
- [x] Build OK (npm run build)
- [x] Coverage >= 80%
- [x] Engram learning saved
```

**REVIEW:**
- Verifica todos los checks
- Comenta feedback
- Marca aprobado (`Approve`)

---

### Handoff: REVIEW → OPS

**REVIEW:**
```markdown
# ✅ Approved

Merge ready to main. CI/CD will deploy.

Engram learning saved:
- mem_save --title="Feature X impl" --type="learning" ...
```

**OPS (GitHub Actions):**
- Tests pasan automáticamente
- Build exitoso
- Deploy staging
- Merge a main triggea prod deploy

---

## 4. GATES Y VALIDACIONES (SDD Checkpoints)

### Gate 1: Spec Validation ✓
```bash
# SPEC Team valida YAML antes de entregar a DEV
yamllint .agent/specs/feature-name.spec.yml
# Si pasa → OK para dev
```

### Gate 2: TDD + Type + Lint ✓
```bash
# DEV Team DEBE pasar esto:
npm run test          # ✅ 100% of new code
npm run type:check    # ✅ No TS errors
npm run lint          # ✅ No eslint errors
npm run build         # ✅ Vite build success
```

### Gate 3: Conventional Commits ✓
```bash
# Verificar que commit sigue formato
# feat(scope): description
# Fix(scope): description
# Si no → PR bloqueado por CI
```

### Gate 4: Security & Secrets ✓
```bash
# REVIEW Team verifica:
# ❌ NO API keys en código
# ❌ NO passwords hardcoded
# ❌ NO .env en git
# ✅ Usar process.env.* o .env.local
```

### Gate 5: Engram Learning ✓
```bash
# Antes de merge, DEV o REVIEW ejecuta:
engram mem_save \
  --title="Feature X impl completed" \
  --type="learning" \
  --what="Implementamos Feature X con Zustand + RTL" \
  --why="Para agregar KPI tracking en dashboard" \
  --where="src/components/FeatureX.tsx, useKPIStore" \
  --learned="Zustand setState es inmutable; usar spread operator"
```

---

## 5. ROLES Y ROTACIÓN

```
┌─ SPEC Team ────────────────────┐
│ Role: Analyst + Architect       │
│ Duty: Spec generation & gates   │
│ Rotation: Bi-weekly             │
└─────────────────────────────────┘

┌─ DEV Team ─────────────────────┐
│ Role: Software Engineer         │
│ Duty: Implementation + TDD      │
│ Rotation: Feature-based         │
└─────────────────────────────────┘

┌─ REVIEW Team ──────────────────┐
│ Role: Senior + QA              │
│ Duty: Quality validation        │
│ Rotation: Per-PR                │
└─────────────────────────────────┘

┌─ OPS Team ──────────────────────┐
│ Role: DevOps + Infra            │
│ Duty: CI/CD + Deployment        │
│ Rotation: On-call basis         │
└─────────────────────────────────┘
```

---

## 6. TOOLS & AUTOMATION

### 6.1 Gentle-AI (spec generation)
```bash
# Generar spec desde requirement
gentle-ai generate-spec \
  --input="User wants KPI dashboard" \
  --output=".agent/specs/kpi-dashboard.spec.yml" \
  --format=yaml \
  --acceptance-criteria
```

### 6.2 Engram (persistent memory)
```bash
# Buscar learnings de features previas
engram search "state management" --limit=5

# Guardar nueva lección
engram mem_save --title="..." --type="learning" --what="..." --why="..." --where="..." --learned="..."
```

### 6.3 GitHub Actions (CI/CD)
```bash
# Automático en cada push/PR
- npm run type:check
- npm run lint
- npm run test
- npm run build
# Si falla alguno → PR bloqueado
```

### 6.4 VSCode Settings (local)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.enablePromptUseWorkspaceTypesForJsFiles": true,
  "[typescript]": {
	"editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 7. ANTI-PATTERNS & GUARDRAILS

### ❌ Anti-Patterns (Prohibido)
| Anti-Pattern | Why Bad | Solution |
|---|---|---|
| Skip spec, go straight to code | Impl diverges from requirement | Always SPEC first |
| No tests in DEV | Coverage gaps, bugs | TDD: tests first |
| Merge without review | Quality unknown | REVIEW gate mandatory |
| Skip Engram learning | Amnesia next session | mem_save every feature |
| Hardcode secrets | Security breach | Use .env.local only |
| Non-conventional commits | Release automation fails | Follow feat(scope): ... |

### ✅ Guardrails (Obligatorio)
| Guardrail | Action | Check |
|---|---|---|
| Spec validated | SPEC Team confirms YAML | `.agent/specs/` exist |
| Tests green | npm run test pasa | ✅ All tests pass |
| Type safe | npm run type:check clean | ✅ No TS errors |
| Linted | npm run lint clean | ✅ No ESLint errors |
| Build OK | npm run build succeeds | ✅ dist/ generated |
| Conventional commit | Commit message checked | ✅ feat\|fix(scope): ... |
| Security scanned | No secrets detected | ❌ No .env/.keys in git |
| Engram saved | Learning documented | ✅ engram search finds it |

---

## 8. EXAMPLE: Full SDD Cycle (Start to Merge)

### Requirement from User
```
"Agregar widget de KPI en tiempo real en el dashboard que muestre 
el progreso de los procesos críticos (rojo/amarillo/verde)."
```

### Step 1: SPEC Team Generates Feature Spec
```yaml
# .agent/specs/realtime-kpi-widget.spec.yml
feature: "Real-time KPI Widget"
description: "Dashboard widget showing process progress with status colors"

acceptance_criteria:
  - id: AC-001
	given: "User views Dashboard page"
	when: "Widget loads"
	then: "Shows current KPI value + status (green/yellow/red)"

  - id: AC-002
	given: "KPI value updates in SharePoint"
	when: "5 seconds pass (polling interval)"
	then: "Widget reflects new value without page reload"

  - id: AC-003
	given: "Multiple KPIs exist"
	when: "Dashboard renders"
	then: "Each KPI has separate widget in grid layout"

dependencies:
  - sharepoint-list: SGI_KPI
  - component: Dashboard (already exists)
  - store: useKPIStore

tech-stack:
  - framework: React 19
  - language: TypeScript
  - ui: Fluent UI
  - state: Zustand (useKPIStore)
  - testing: Vitest + React Testing Library
  - polling: setInterval (5s)

priority: P1
owner: dev-team
```

**SPEC Team Gate:** ✅ YAML valid, ACs testable, dependencies resolved

### Step 2: DEV Team Implements (TDD)

**Create tests first:**
```typescript
// src/components/KPIWidget.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { KPIWidget } from './KPIWidget';
import { useKPIStore } from '../store';

describe('KPIWidget', () => {
  it('AC-001: renders KPI value and status', () => {
	render(<KPIWidget kpiId="kpi-123" />);
	expect(screen.getByText('Process Health')).toBeInTheDocument();
	expect(screen.getByRole('status')).toHaveClass('status-green');
  });

  it('AC-002: updates value every 5 seconds', async () => {
	const { rerender } = render(<KPIWidget kpiId="kpi-123" />);
	expect(screen.getByText('85%')).toBeInTheDocument();

	vi.useFakeTimers();
	vi.advanceTimersByTime(5000);
	await waitFor(() => expect(screen.getByText('87%')).toBeInTheDocument());
	vi.useRealTimers();
  });

  it('AC-003: multiple widgets render in grid', () => {
	render(
	  <>
		<KPIWidget kpiId="kpi-1" />
		<KPIWidget kpiId="kpi-2" />
		<KPIWidget kpiId="kpi-3" />
	  </>
	);
	const widgets = screen.getAllByRole('article');
	expect(widgets).toHaveLength(3);
  });
});
```

**Implement component:**
```typescript
// src/components/KPIWidget.tsx
import { FC, useEffect, useState } from 'react';
import { Spinner } from '@fluentui/react-components';
import { useKPIStore } from '../store';

export const KPIWidget: FC<{ kpiId: string }> = ({ kpiId }) => {
  const { kpis, fetchKPIs } = useKPIStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
	setLoading(true);
	fetchKPIs().then(() => setLoading(false));

	const interval = setInterval(() => {
	  fetchKPIs();
	}, 5000); // polling every 5s

	return () => clearInterval(interval);
  }, [fetchKPIs]);

  const kpi = kpis.find((k) => k.id === kpiId);
  if (!kpi || loading) return <Spinner />;

  const statusClass = kpi.value >= 80 ? 'status-green' : kpi.value >= 50 ? 'status-yellow' : 'status-red';

  return (
	<article className={`kpi-widget ${statusClass}`}>
	  <h3>{kpi.name}</h3>
	  <div className="kpi-value">{kpi.value}%</div>
	  <span role="status" className={statusClass}>{statusClass.replace('status-', '')}</span>
	</article>
  );
};
```

**Run gates:**
```bash
npm run test                # ✅ All 3 ACs passing
npm run type:check          # ✅ No TS errors
npm run lint                # ✅ No ESLint errors
npm run build               # ✅ dist/ built
```

**Commit convencional:**
```bash
git add src/components/KPIWidget.tsx src/components/KPIWidget.test.tsx
git commit -m "feat(dashboard): add real-time KPI widget with 5s polling"
```

### Step 3: REVIEW Team Validates PR

```markdown
# ✅ Approved

## Checklist
- [x] PR title: feat(dashboard): add real-time KPI widget
- [x] ACs match spec exactly (AC-001, AC-002, AC-003)
- [x] Tests pass (100% coverage of new code)
- [x] TypeScript clean
- [x] ESLint clean
- [x] No secrets/credentials
- [x] Conventional commit

Engram learning saved:
mem_save --title="KPI Widget implementation" --type="learning" --what="Implemented real-time polling with setInterval + Zustand" --why="Required for dashboard KPI tracking" --where="src/components/KPIWidget.tsx" --learned="useEffect cleanup is critical for polling intervals; always clear on unmount"
```

### Step 4: OPS Team Deploys
```bash
# GitHub Actions triggered on merge to main
npm run type:check          # ✅
npm run lint                # ✅
npm run test                # ✅
npm run build               # ✅ dist/
Deploy to staging
Smoke tests
Deploy to production
✅ Live!
```

---

## 9. ESCALATION & TROUBLESHOOTING

### Issue: Tests failing
**Escalation:** DEV → REVIEW  
**Action:** Review test code, verify AC matches spec  
**Prevention:** TDD discipline

### Issue: TypeScript errors in PR
**Escalation:** DEV → REVIEW  
**Action:** Fix types, re-push  
**Prevention:** Run type:check before commit

### Issue: Merge conflicts
**Escalation:** DEV (self-resolve) + REVIEW (verify)  
**Action:** Rebase, resolve conflicts, force-push  
**Prevention:** Pull main frequently during dev

### Issue: Spec mismatch (impl doesn't match AC)
**Escalation:** REVIEW → SPEC  
**Action:** Spec Team clarifies AC, DEV updates impl  
**Prevention:** Early review of draft spec

---

## 10. QUICKLINKS

| Need | Command | Location |
|---|---|---|
| View all specs | `ls -la .agent/specs/` | `.agent/specs/` |
| Search learnings | `engram search "term"` | Engram DB |
| View commits | `git log --oneline | grep "feat\|fix"` | Git log |
| Run full validation | `npm run type:check && npm run lint && npm run test && npm run build` | npm scripts |
| Create new feature | `git checkout -b feat/my-feature` | Git workflow |
| Merge approval | Comment ✅ on PR | GitHub UI |

---

## 11. MAINTENANCE & ITERATION

**This document is living.** Update it as:
- New tools are added (e.g., new testing framework)
- Process improves (e.g., faster feedback loop)
- Team changes (e.g., new roles)

**Update process:**
1. Propose change in `.agent/` issue
2. Discuss with team
3. Merge to main with `chore(teams): ...` commit
4. Save learning in Engram

---

**Version:** 1.0  
**Last Updated:** 2026-06-01  
**SDD Framework:** Spec → Dev → Review → Ops → Prod  
**Mantenedor:** SgiPortal SDD Team  
