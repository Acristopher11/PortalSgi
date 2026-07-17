# SgiPortal - Sistema de Gestión Integrado
## Junta de Aviación Civil de la República Dominicana

**Stack:** React 19 + Vite + TypeScript 6 + Fluent UI + Power Apps Code  
**Workflow:** Spec-Driven Development (SDD) + Persistent Memory (Engram)  
**Last Updated:** 2026-06-01

---

## 📋 Quick Start

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- **Power Platform CLI (pac)** ([install](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction))
- *(Optional)* **Go 1.20+** for Engram compilation
- *(Optional)* **Scoop** for tool management

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/SgiPortal.git
cd SgiPortal

# 2. Run bootstrap script (all checks, installs, builds)
.\scripts\bootstrap.ps1

# 3. Start dev server
npm run dev

# 4. Visit http://localhost:3000
```

---

## 🛠️ Available Scripts

```bash
npm run dev                 # Start Vite dev server (port 3000)
npm run build               # Build for production (dist/)
npm run type:check          # TypeScript validation
npm run lint                # ESLint check
npm run test                # Run Vitest suite
npm run test:ui             # Vitest UI dashboard
```

---

## 🎯 Key Files

- **[.agent/agent.md](./.agent/agent.md)** - Context dictator (HITL, guardrails)
- **[.agent/teams.md](./.agent/teams.md)** - SDD pipeline orchestrator
- **[.agent/registry/react-vite.md](./.agent/registry/react-vite.md)** - React/Vite conventions
- **[scripts/bootstrap.ps1](./scripts/bootstrap.ps1)** - Development environment setup

---

## 🧠 Agent Stack

- **Engram** - Persistent memory (SQLite + FTS5)
- **Gentle-AI** - Spec generation & orchestration
- **Power Platform CLI** - PAC code & SharePoint integration

---

## 🔐 Security

- ❌ Never commit secrets
- ✅ Use `.env.local` for development
- ✅ GitHub Secrets for production
- ✅ Power Platform auth via `pac auth`

---

## 📊 SharePoint Lists

- SGI_MaestraProceso - Process master data
- SGI_SIPOC - Process decomposition
- SGI_KPI - Key Performance Indicators
- SGI_Glosario - Glossary
- SGI_Areas - Organizational areas
- SGI_Mediciones - Measurement data
- SGI_Objetivos - Strategic objectives
- Gestión Documental - Document management

---

**Last Updated:** 2026-06-01 | **Maintainer:** SgiPortal Team | **Status:** 🟢 Production Ready
