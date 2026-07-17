# REGISTRY: React 19 + Vite + TypeScript Conventions
## SgiPortal Technology Stack Reference

---

## 1. PROJECT STRUCTURE (Token-Efficient)

```
SgiPortal/
├── .agent/                          # Agent orchestration
│   ├── agent.md                     # Context dictator
│   ├── teams.md                     # SDD pipeline
│   ├── registry/                    # This file
│   └── memory/                      # Engram memory
├── src/
│   ├── components/                  # React components
│   │   ├── KPICard.tsx             # Reusable UI component
│   │   ├── KPICard.test.tsx        # Vitest + RTL tests
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx
│   │   └── ...
│   ├── pages/                       # Route pages
│   │   ├── DashboardPage.tsx
│   │   ├── KPIsPage.tsx
│   │   ├── ProcessesPage.tsx
│   │   └── RisksPage.tsx
│   ├── services/                    # API/business logic
│   │   ├── kpiService.ts           # KPI data fetching
│   │   ├── processService.ts
│   │   └── ...
│   ├── store/                       # Zustand state
│   │   └── index.ts                # All stores exported
│   ├── types/                       # TypeScript types
│   │   ├── index.ts
│   │   └── power-apps.d.ts         # Power Apps types
│   ├── hooks/                       # Custom React hooks
│   │   ├── useFetchKPIs.ts
│   │   └── ...
│   ├── utils/                       # Helpers
│   │   └── ...
│   ├── power-apps-migration/        # Legacy PA YAML
│   │   ├── App.pa.yaml
│   │   ├── Screens/
│   │   └── ...
│   ├── App.tsx                      # Main Router
│   ├── App.css                      # Global styles
│   ├── main.tsx                     # React.createRoot
│   └── vite-env.d.ts               # Vite types
├── tests/                           # Integration tests
│   └── ...
├── .github/workflows/               # CI/CD
│   └── sdd.yml                      # SDD pipeline
├── package.json                     # Node deps + scripts
├── tsconfig.json                    # TS config
├── vite.config.ts                   # Vite bundler config
├── eslintrc.cjs                     # Linting rules
├── .gitignore                       # Git ignore
└── README.md
```

---

## 2. NAMING CONVENTIONS

### 2.1 Files & Folders
| Type | Pattern | Example |
|---|---|---|
| React Component | `PascalCase.tsx` | `KPICard.tsx`, `Dashboard.tsx` |
| Test file | `{Component}.test.tsx` | `KPICard.test.tsx` |
| Service | `camelCase.ts` | `kpiService.ts`, `processService.ts` |
| Store/Hook | `camelCase.ts` | `useKPIStore.ts`, `useFetchKPIs.ts` |
| Type/Interface | `PascalCase.ts` | `types/index.ts` |
| Folder | `lowercase` or `PascalCase` (if component) | `src/components/`, `src/services/` |
| CSS Module | `Component.module.css` | `KPICard.module.css` |
| Constant | `UPPER_SNAKE_CASE` | `const API_BASE_URL = ...` |

### 2.2 Variables & Functions
```typescript
// Variables: camelCase
const userId = '123';
const isLoading = true;
const data: KPI[] = [];

// Functions: camelCase
function fetchKPIs() { }
const handleClick = () => { };
const calculateTotal = (items: KPI[]) => { };

// React components: PascalCase (functions)
function KPICard(props: KPICardProps) { }
const Dashboard = () => { };

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_POLLING_INTERVAL = 5000;
```

---

## 3. COMPONENT ARCHITECTURE (Fluent UI + Hooks)

### 3.1 Functional Components (Required)
```typescript
// ✅ CORRECT: Use React.FC or function declaration
import { FC } from 'react';
import { Button, Text } from '@fluentui/react-components';

interface KPICardProps {
  title: string;
  value: number;
  status: 'green' | 'yellow' | 'red';
}

export const KPICard: FC<KPICardProps> = ({ title, value, status }) => {
  return (
	<div className={`kpi-widget kpi-${status}`}>
	  <Text as="h3">{title}</Text>
	  <Text as="div" className="value">{value}%</Text>
	</div>
  );
};

// ✅ ALT: Direct function
export function Dashboard() {
  return <div>Dashboard</div>;
}

// ❌ WRONG: Class components
class KPICard extends React.Component { } // Don't use!
```

### 3.2 Hooks (useState, useEffect, custom)
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useKPIStore } from '../store';

export const KPIList = () => {
  const [filter, setFilter] = useState('all');
  const { kpis, fetchKPIs } = useKPIStore();

  // Fetch on mount + dependency
  useEffect(() => {
	fetchKPIs().catch(err => console.error('Failed to fetch KPIs', err));
  }, [fetchKPIs]);

  // Memoize expensive callback
  const handleFilterChange = useCallback((newFilter: string) => {
	setFilter(newFilter);
  }, []);

  return (
	<div>
	  {kpis.map(kpi => (
		<KPICard key={kpi.id} {...kpi} />
	  ))}
	</div>
  );
};
```

### 3.3 Props Typing (Always use interfaces)
```typescript
// ✅ CORRECT: Explicit interface
interface ButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const CustomButton: FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
}) => (
  <Button onClick={onClick} disabled={disabled} appearance={variant}>
	{label}
  </Button>
);

// ❌ WRONG: Implicit any
export const CustomButton = (props: any) => { };

// ❌ WRONG: No types
export const CustomButton = ({ label, onClick }) => { };
```

---

## 4. STATE MANAGEMENT (Zustand)

### 4.1 Store Pattern
```typescript
// src/store/index.ts
import { create } from 'zustand';
import type { KPI, User, Process, Risk } from '../types';

// ✅ Auth Store
interface AuthStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// ✅ KPI Store
interface KPIStore {
  kpis: KPI[];
  loading: boolean;
  error: string | null;
  fetchKPIs: () => Promise<void>;
  addKPI: (kpi: KPI) => void;
}

export const useKPIStore = create<KPIStore>((set) => ({
  kpis: [],
  loading: false,
  error: null,
  fetchKPIs: async () => {
	set({ loading: true });
	try {
	  const data = await kpiService.getAll();
	  set({ kpis: data, error: null });
	} catch (err) {
	  set({ error: (err as Error).message });
	} finally {
	  set({ loading: false });
	}
  },
  addKPI: (kpi) => set((state) => ({ kpis: [...state.kpis, kpi] })),
}));

// Similar for Process, Risk, UI stores...
export const useProcessStore = create<ProcessStore>(/* ... */);
export const useRiskStore = create<RiskStore>(/* ... */);
export const useUIStore = create<UIStore>(/* ... */);
```

### 4.2 Usage in Components
```typescript
import { useKPIStore } from '../store';

export const Dashboard = () => {
  const { kpis, loading, fetchKPIs } = useKPIStore();

  useEffect(() => {
	fetchKPIs();
  }, [fetchKPIs]);

  if (loading) return <Spinner />;

  return (
	<div>
	  {kpis.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
	</div>
  );
};
```

---

## 5. FLUENT UI COMPONENTS

### 5.1 Common Patterns
```typescript
import {
  Button,
  Card,
  Text,
  Input,
  Spinner,
  Badge,
  Flex,
  Table,
} from '@fluentui/react-components';

// ✅ Flex layout (replaces old Box)
<Flex gap="gap.medium">
  <Button appearance="primary">Primary</Button>
  <Button appearance="secondary">Secondary</Button>
</Flex>

// ✅ Card component
<Card>
  <div style={{ padding: '12px' }}>
	<Text as="h3">Title</Text>
	<Text>Content here</Text>
  </div>
</Card>

// ✅ Badge for status
<Badge appearance="filled" color="success">
  Active
</Badge>

// ✅ Table (complex)
<Table>
  <thead>
	<tr>
	  <th>Name</th>
	  <th>Value</th>
	</tr>
  </thead>
  <tbody>
	{data.map(row => (
	  <tr key={row.id}>
		<td>{row.name}</td>
		<td>{row.value}</td>
	  </tr>
	))}
  </tbody>
</Table>
```

### 5.2 Theming
```typescript
// src/App.tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

export function App() {
  return (
	<FluentProvider theme={webLightTheme}>
	  {/* App content */}
	</FluentProvider>
  );
}
```

---

## 6. ROUTING (React Router v7)

### 6.1 Router Setup
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { KPIsPage } from './pages/KPIsPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { RisksPage } from './pages/RisksPage';

export function App() {
  return (
	<BrowserRouter>
	  <Routes>
		<Route path="/" element={<Layout />}>
		  <Route path="dashboard" element={<DashboardPage />} />
		  <Route path="kpis" element={<KPIsPage />} />
		  <Route path="procesos" element={<ProcessesPage />} />
		  <Route path="riesgos" element={<RisksPage />} />
		</Route>
	  </Routes>
	</BrowserRouter>
  );
}
```

### 6.2 Nested Routes & Navigation
```typescript
import { useNavigate } from 'react-router-dom';

export const Navigation = () => {
  const navigate = useNavigate();

  return (
	<nav>
	  <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
	  <Button onClick={() => navigate('/kpis')}>KPIs</Button>
	  <Button onClick={() => navigate('/procesos')}>Procesos</Button>
	  <Button onClick={() => navigate('/riesgos')}>Riesgos</Button>
	</nav>
  );
};
```

---

## 7. TESTING (Vitest + React Testing Library)

### 7.1 Component Test Structure
```typescript
// src/components/KPICard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KPICard } from './KPICard';

describe('KPICard', () => {
  // Test AC-001
  it('renders with title and value', () => {
	render(<KPICard title="Revenue" value={1000} status="green" />);

	expect(screen.getByText('Revenue')).toBeInTheDocument();
	expect(screen.getByText('1000%')).toBeInTheDocument();
  });

  // Test AC-002
  it('applies correct status class', () => {
	const { container } = render(
	  <KPICard title="Health" value={50} status="yellow" />
	);

	expect(container.querySelector('.kpi-yellow')).toBeInTheDocument();
  });

  // Test interactions
  it('handles click events', async () => {
	const handleClick = vi.fn();
	render(
	  <KPICard
		title="Test"
		value={100}
		status="green"
		onClick={handleClick}
	  />
	);

	await userEvent.click(screen.getByRole('button'));
	expect(handleClick).toHaveBeenCalled();
  });
});
```

### 7.2 Hook Test Pattern
```typescript
// src/hooks/useFetchKPIs.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchKPIs } from './useFetchKPIs';
import * as kpiService from '../services/kpiService';

vi.mock('../services/kpiService');

describe('useFetchKPIs', () => {
  it('fetches KPIs on mount', async () => {
	const mockData = [{ id: '1', name: 'KPI1', value: 85 }];
	vi.mocked(kpiService.getAll).mockResolvedValue(mockData);

	const { result } = renderHook(() => useFetchKPIs());

	await waitFor(() => {
	  expect(result.current.data).toEqual(mockData);
	});
  });

  it('handles errors gracefully', async () => {
	const error = new Error('API Error');
	vi.mocked(kpiService.getAll).mockRejectedValue(error);

	const { result } = renderHook(() => useFetchKPIs());

	await waitFor(() => {
	  expect(result.current.error).toBe('API Error');
	});
  });
});
```

### 7.3 Service Test Pattern
```typescript
// src/services/kpiService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as kpiService from './kpiService';
import axios from 'axios';

vi.mock('axios');

describe('kpiService', () => {
  beforeEach(() => {
	vi.clearAllMocks();
  });

  it('fetches all KPIs', async () => {
	const mockData = [{ id: '1', name: 'Revenue' }];
	vi.mocked(axios.get).mockResolvedValue({ data: mockData });

	const result = await kpiService.getAll();

	expect(result).toEqual(mockData);
	expect(axios.get).toHaveBeenCalledWith('/api/kpis');
  });
});
```

---

## 8. TYPE SAFETY

### 8.1 Type Definitions File
```typescript
// src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'editor';
}

export interface KPI {
  id: string;
  name: string;
  value: number; // 0-100
  status: 'green' | 'yellow' | 'red';
  lastUpdated: Date;
  target: number;
}

export interface Process {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'paused' | 'completed';
  kpis: string[]; // KPI IDs
}

export interface Risk {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  impact: number; // 0-10
  mitigation: string;
}
```

### 8.2 Avoid `any`
```typescript
// ❌ WRONG
const data: any = fetchData();
data.name; // No autocomplete, no type safety

// ✅ CORRECT
interface ResponseData {
  name: string;
  value: number;
}

const data: ResponseData = await fetchData();
data.name; // Autocomplete works!
```

---

## 9. API INTEGRATION (SharePoint + Power Apps Code)

### 9.1 Service Pattern
```typescript
// src/services/kpiService.ts
import axios, { AxiosError } from 'axios';
import type { KPI } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
	'Content-Type': 'application/json',
  },
});

// Handle auth tokens
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
	config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const kpiService = {
  async getAll(): Promise<KPI[]> {
	const { data } = await client.get<KPI[]>('/kpis');
	return data;
  },

  async getById(id: string): Promise<KPI> {
	const { data } = await client.get<KPI>(`/kpis/${id}`);
	return data;
  },

  async create(kpi: Omit<KPI, 'id'>): Promise<KPI> {
	const { data } = await client.post<KPI>('/kpis', kpi);
	return data;
  },

  async update(id: string, kpi: Partial<KPI>): Promise<KPI> {
	const { data } = await client.put<KPI>(`/kpis/${id}`, kpi);
	return data;
  },

  async delete(id: string): Promise<void> {
	await client.delete(`/kpis/${id}`);
  },
};
```

### 9.2 Hook for API Integration
```typescript
// src/hooks/useFetchKPIs.ts
import { useState, useEffect } from 'react';
import { kpiService } from '../services/kpiService';
import type { KPI } from '../types';

export const useFetchKPIs = () => {
  const [data, setData] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
	const fetch = async () => {
	  setLoading(true);
	  try {
		const result = await kpiService.getAll();
		setData(result);
		setError(null);
	  } catch (err) {
		setError((err as Error).message);
	  } finally {
		setLoading(false);
	  }
	};

	fetch();
  }, []);

  return { data, loading, error };
};
```

---

## 10. STYLING (CSS + Fluent UI)

### 10.1 Global Styles
```css
/* src/App.css */
:root {
  --color-primary: #0078d4;
  --color-success: #107c10;
  --color-warning: #ffb900;
  --color-error: #d13438;
  --spacing-base: 12px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
	'Helvetica Neue', Arial, sans-serif;
  background: #fafafa;
  color: #333;
}
```

### 10.2 Component-Scoped Styles (CSS Modules)
```css
/* src/components/KPICard.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.statusGreen {
  border-left: 4px solid #107c10;
}

.statusYellow {
  border-left: 4px solid #ffb900;
}

.statusRed {
  border-left: 4px solid #d13438;
}
```

```typescript
// src/components/KPICard.tsx
import styles from './KPICard.module.css';

export const KPICard: FC<Props> = ({ status, ...rest }) => (
  <div className={`${styles.card} ${styles[`status${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`}>
	{/* content */}
  </div>
);
```

---

## 11. BUILD & DEPLOYMENT

### 11.1 Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
	port: 3000,
	open: true,
  },
  build: {
	outDir: 'dist',
	sourcemap: false, // true for dev, false for prod
	minify: 'terser',
  },
});
```

### 11.2 Scripts in package.json
```json
{
  "scripts": {
	"dev": "vite",
	"build": "tsc -b && vite build",
	"preview": "vite preview",
	"type:check": "tsc --noEmit",
	"lint": "eslint . --ext .ts,.tsx",
	"lint:fix": "eslint . --ext .ts,.tsx --fix",
	"test": "vitest",
	"test:ui": "vitest --ui",
	"coverage": "vitest --coverage"
  }
}
```

---

## 12. CI/CD INTEGRATION

### 12.1 GitHub Actions (SDD Pipeline)
```yaml
# .github/workflows/sdd.yml
name: SDD Pipeline

on: [push, pull_request]

jobs:
  build-test:
	runs-on: ubuntu-latest
	steps:
	  - uses: actions/checkout@v3
	  - uses: actions/setup-node@v3
		with:
		  node-version: '18'
	  - run: npm install
	  - run: npm run type:check
	  - run: npm run lint
	  - run: npm run test
	  - run: npm run build

  deploy:
	needs: build-test
	if: github.ref == 'refs/heads/main'
	runs-on: ubuntu-latest
	steps:
	  - uses: actions/checkout@v3
	  - run: npm install
	  - run: npm run build
	  - uses: actions/upload-artifact@v3
		with:
		  name: dist
		  path: dist/
```

---

## 13. QUICK REFERENCE

| Task | Command |
|---|---|
| Start dev server | `npm run dev` |
| Type check | `npm run type:check` |
| Lint code | `npm run lint` |
| Fix lint errors | `npm run lint:fix` |
| Run tests | `npm run test` |
| Build for prod | `npm run build` |
| Preview build | `npm run preview` |

---

**Version:** 1.0  
**Stack:** React 19 + Vite + TypeScript 6 + Fluent UI + Zustand  
**Last Updated:** 2026-06-01  
**Reference:** Use this doc when implementing features; keep token-efficient by reading on-demand.  
