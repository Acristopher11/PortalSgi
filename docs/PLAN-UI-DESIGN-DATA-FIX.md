# SgiPortal UI Design Overhaul + Data Loading Fix
**Status:** Completed | **Date:** 2026-06-02 | **Priority:** P1

---

## 🎯 Understanding
El usuario requiere:
1. **Redesign UI** con paleta institucional (azul medianoche #001F3F + rojo caribe #DC143C), minimalista, profesional
2. **Pantalla completa** con mejor uso del espacio
3. **Diagnosticar y fijar carga de datos** de listas SharePoint configuradas
4. Tipografía moderna (Gotham/Artifex CF/Arial), alto contraste, jerarquía visual clara

---

## 📊 Assumptions
- SharePoint lists (8) están configuradas pero el servicio no obtiene datos
- Problema probable: autenticación, URL base incorrecta o headers faltantes
- Current theme (teamsLightTheme) no cumple con paleta requerida
- Layout necesita fullscreen optimization y mejor grid system
- Fluent UI está siendo usado pero tema no es personalizado

---

## 🎨 Design Palette

| Color | Hex Value | Usage | RGB |
|-------|-----------|-------|-----|
| Azul Medianoche | `#001F3F` | Navigation, Headers, Primary Buttons | rgb(0, 31, 63) |
| Rojo Caribe | `#DC143C` | Alerts, Critical Actions, Highlights | rgb(220, 20, 60) |
| Blanco | `#FFFFFF` | Card Backgrounds, Text on Midnight | rgb(255, 255, 255) |
| Gris Claro | `#F8F9FA` | Main Backgrounds, Spacing | rgb(248, 249, 250) |
| Gris Medio | `#E8EAED` | Borders, Dividers | rgb(232, 234, 237) |
| Gris Oscuro | `#2D3748` | Primary Text | rgb(45, 55, 72) |

---

## 📐 Typography Scale
- **H1:** 32px, Bold, #2D3748
- **H2:** 24px, Bold, #2D3748
- **H3:** 20px, Semi-Bold, #2D3748
- **Body:** 14px, Regular, #2D3748
- **Caption:** 12px, Regular, #636F7D

**Font Stack:** `Gotham, "Artifex CF", Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

---

## 🏗️ Approach

### Phase 1: Diagnosticar Carga de Datos
Revisar `sharePointService.ts` para identificar por qué falla:
- URL base de API SharePoint (`VITE_SHAREPOINT_URL`)
- Headers de autenticación (falta Bearer token?)
- Mapeo de campos de respuesta SharePoint
- Variables de entorno (.env.local)
- Interceptores de axios para auth

### Phase 2: Custom Theme Fluent UI
Crear sistema de colores coherente:
- Crear `src/theme/customTheme.ts` con colores institucionales
- Reemplazar `teamsLightTheme` en App.tsx
- Implementar custom tokens (spacing, shadows, radius)

### Phase 3: Global CSS Variables
Actualizar `App.css`:
- CSS custom properties (variables) para paleta
- Escala tipográfica (H1-H6, body, caption)
- Sombras sutiles y espaciado
- Reset de estilos base

### Phase 4: Layout Fullscreen
Optimizar Layout.tsx y Layout.css:
- Expandir a 100% viewport
- Sidebar colapsable (hamburger menu)
- Header minimalista (logo + user profile)
- Content area flexible sin restricciones
- Responsive design (mobile-first)

### Phase 5: Componentes Modernos
Actualizar componentes existentes:
- **Header.tsx:** Logo + navegación minimalista + user menu
- **Sidebar.tsx:** Menú ordenado con iconografía, colapsable
- **KPICard.tsx:** Tarjetas limpias con sombras sutiles
- **Dashboard.tsx:** Optimizado para nueva paleta

### Phase 6: Testing & Validation
- `npm run type:check` → TypeScript clean
- `npm run lint --fix` → ESLint clean
- `npm run build` → Vite build success
- Verificar datos cargando desde SharePoint

---

## 📁 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/App.tsx` | Router setup, theme provider | Modify |
| `src/App.css` | Global CSS + paleta | Modify |
| `src/theme/customTheme.ts` | Custom Fluent theme | Create |
| `src/components/layout/Layout.tsx` | Layout structure | Modify |
| `src/components/layout/Layout.css` | Fullscreen styles | Modify |
| `src/components/layout/Header.tsx` | Header component | Modify |
| `src/components/layout/Sidebar.tsx` | Sidebar component | Modify |
| `src/components/kpi/KPICard.tsx` | KPI card component | Modify |
| `src/services/sharePointService.ts` | Data fetching | Fix |
| `.env.local` | SharePoint config | Create |
| `src/pages/Dashboard.tsx` | Main dashboard | Review |

---

## ⚠️ Risks & Open Questions

1. **Autenticación SharePoint:** ¿Cómo obtener Bearer token?
   - ¿SSO (Single Sign-On) del navegador?
   - ¿PAC CLI para generar token?
   - ¿Credenciales en .env.local?

2. **Sidebar UX:** ¿Colapsable o fijo?
   - Propuesta: Colapsable en mobile (<768px), fijo en desktop

3. **Tipografía Gotham:** Licencia propietaria
   - Alternativa: Usar Arial + custom font-weight para lograr efecto similar

4. **Responsive Design:** ¿Mobile-first o desktop-first?
   - Propuesta: Desktop-first (app empresarial, uso principal en escritorio)

5. **Datos SharePoint:** ¿Campos mapeados correctamente?
   - Validar respuesta API vs tipos TypeScript

---

## 📋 Steps

### Step 1: Diagnosticar y fijar carga de datos
- Leer `sharePointService.ts` completo
- Identificar errores en URL/headers
- Crear `.env.local` con config SharePoint
- Fijar autenticación y mapeo de campos
- **Validation:** npm run type:check → clean

### Step 2: Crear custom theme Fluent UI
- Crear `src/theme/customTheme.ts`
- Definir colores, spacing, shadows, border radius
- Exportar como objeto de tema
- **Validation:** TypeScript compile

### Step 3: Actualizar App.css
- Definir CSS custom properties (--color-primary, etc.)
- Escala tipográfica H1-H6
- Reset de estilos base
- Font stack moderno
- **Validation:** Estilos aplicados correctamente

### Step 4: Refactorizar Layout
- Actualizar Layout.tsx para flexbox fullscreen
- Expandir Layout.css a 100% viewport
- Agregar sidebar toggle (hamburger)
- **Validation:** npm run lint → clean

### Step 5: Actualizar Header
- Logo en Header (izquierda)
- User profile menu (derecha)
- Minimalista, limpio
- Colores: Azul Medianoche (#001F3F)
- **Validation:** Visual inspection

### Step 6: Refactorizar Sidebar
- Colores: Azul Medianoche (#001F3F)
- Menu items con hover/active states
- Iconografía clara
- Logout button al final
- **Validation:** Visual inspection + interactions

### Step 7: Actualizar KPICard
- Tarjetas limpias con sombra sutil
- Bordes redondeados 8px
- Acento rojo caribe (#DC143C) para valores críticos
- Tipografía moderna (escala definida)
- **Validation:** Visual inspection

### Step 8: Revisar Dashboard
- Aplicar nueva paleta
- Grillas responsivas
- Datos cargando correctamente
- **Validation:** Data loading ✅

### Step 9: TypeScript + Lint + Build
- `npm run type:check` → clean
- `npm run lint --fix` → clean
- `npm run build` → success
- **Validation:** All checks pass ✅

### Step 10: Git Commit + Engram
- Commit: `feat(design): implement institutional UI overhaul with midnight blue + caribbean red`
- Push a main
- Engram mem_save: diseño, paleta, SharePoint fix

---

## 🎯 Expected Outcome

```
┌─────────────────────────────────────────────────────────┐
│  SgiPortal v2 - Professional, Modern, Institutional    │
├──────────┬──────────────────────────────────────────────┤
│ 🔵      │ [Logo] Dashboard  [Search]  [User ▼]        │
│ Sidebar │ ─────────────────────────────────────────────│
│ #001F3F │                                              │
│          │ Bienvenida, Usuario SGI                     │
│ Dashboard│                                              │
│ KPIs     │ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ Procesos │ │  Total  │ │ On Track│ │ At Risk │        │
│ Riesgos  │ │   KPIs  │ │   (87%) │ │  (10%) │        │
│          │ │   45    │ │    39   │ │    4   │        │
│ [Logout] │ └─────────┘ └─────────┘ └─────────┘        │
│          │                                              │
│          │ KPIs Grid (Cards limpios)                  │
│          │ ┌────────────────────┐ ┌─────────────────┐ │
│          │ │ KPI: Disponibilidad│ │ KPI: Eficiencia│ │
│          │ │ 92% ✓              │ │ 78% ⚠️          │ │
│          │ │ On Track           │ │ At Risk        │ │
│          │ └────────────────────┘ └─────────────────┘ │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘

✅ Paleta: Azul Medianoche #001F3F + Rojo Caribe #DC143C
✅ Tipografía: Arial (moderna, limpia, legible)
✅ Diseño: Minimalista, sobrio, profesional
✅ Pantalla: Fullscreen, buen uso del espacio
✅ Datos: Cargando desde SharePoint ✓
✅ Responsive: Mobile-friendly + Desktop-optimized
```

---

## 📚 Documentation References
- [Fluent UI Customization](https://react.fluentui.dev/?path=/docs/concepts-styling--page)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [SharePoint REST API](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/working-with-lists-and-list-items-with-rest)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## 🔄 Next Actions
- [x] **User approval:** "Aprobado" to proceed
- [x] Execute Step 1-10 following SDD pipeline
- [x] Commit with Conventional Commits
- [x] Push to main + GitHub Actions
- [x] Save learning to Engram

---

**Version:** 1.0  
**Author:** SDD Pipeline  
**Stakeholder:** SgiPortal Design Team  
**Status:** ✅ Completed
