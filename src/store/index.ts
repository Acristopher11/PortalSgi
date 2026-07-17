import { create } from 'zustand';
import type { User, KPI, Process, Risk } from '../types';

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

interface KPIStore {
  kpis: KPI[];
  selectedKPI: KPI | null;
  loading: boolean;
  error: string | null;
  setKPIs: (kpis: KPI[]) => void;
  setSelectedKPI: (kpi: KPI | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useKPIStore = create<KPIStore>((set) => ({
  kpis: [],
  selectedKPI: null,
  loading: false,
  error: null,
  setKPIs: (kpis) => set({ kpis }),
  setSelectedKPI: (kpi) => set({ selectedKPI: kpi }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

interface ProcessStore {
  processes: Process[];
  selectedProcess: Process | null;
  loading: boolean;
  error: string | null;
  setProcesses: (processes: Process[]) => void;
  setSelectedProcess: (process: Process | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProcessStore = create<ProcessStore>((set) => ({
  processes: [],
  selectedProcess: null,
  loading: false,
  error: null,
  setProcesses: (processes) => set({ processes }),
  setSelectedProcess: (process) => set({ selectedProcess: process }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

interface RiskStore {
  risks: Risk[];
  selectedRisk: Risk | null;
  loading: boolean;
  error: string | null;
  setRisks: (risks: Risk[]) => void;
  setSelectedRisk: (risk: Risk | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRiskStore = create<RiskStore>((set) => ({
  risks: [],
  selectedRisk: null,
  loading: false,
  error: null,
  setRisks: (risks) => set({ risks }),
  setSelectedRisk: (risk) => set({ selectedRisk: risk }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeMenu: string;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveMenu: (menu: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  activeMenu: 'dashboard',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
}));
