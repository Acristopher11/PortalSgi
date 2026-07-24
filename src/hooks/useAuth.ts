import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Process, KPI, Risk, SgiUsuario, Area } from '../types';
import { useProcessStore } from '../store';
import { getAllUsuarios } from '../repositories/usuarioRepository';
import { getAreaById } from '../repositories/areaRepository';

export type AppRole = 'SGI.Admin' | 'SGI.User';

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [sgiUsuario, setSgiUsuario] = useState<SgiUsuario | undefined>(undefined);
  const [userArea, setUserArea] = useState<Area | undefined>(undefined);
  const [loadingUser, setLoadingUser] = useState(true);
  const processes = useProcessStore((state) => state.processes);

  // 1. Listen for Supabase Auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userEmail = useMemo(() => {
    return (session?.user?.email ?? '').toLowerCase();
  }, [session]);

  const displayName = useMemo(() => {
    return session?.user?.user_metadata?.nombre || session?.user?.user_metadata?.name || session?.user?.email || '';
  }, [session]);

  const activeAccount = useMemo(() => {
    if (!session?.user) return null;
    return {
      username: userEmail,
      name: displayName,
    };
  }, [session, userEmail, displayName]);

  // 2. Fetch SGI User Profile from 'usuarios' table
  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!userEmail) {
        setSgiUsuario(undefined);
        setUserArea(undefined);
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        // Fetch users using the repository
        const users = await getAllUsuarios();
        const match = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

        if (active) {
          if (match) {
            setSgiUsuario(match);
            if (match.areaId) {
              const area = await getAreaById(match.areaId);
              if (active) setUserArea(area);
            } else {
              if (active) setUserArea(undefined);
            }
          } else {
            // Seeding default admin user: alejandro.cristopher@gmail.com
            if (userEmail === 'alejandro.cristopher@gmail.com') {
              const adminUser: SgiUsuario = {
                id: 'admin-auto',
                nombre: 'Alejandro Christopher',
                email: userEmail,
                rol: 'Admin',
                activo: true,
              };
              setSgiUsuario(adminUser);
            } else {
              setSgiUsuario(undefined);
            }
            setUserArea(undefined);
          }
        }
      } catch (e) {
        console.error('[useAuth] Error loading SgiUsuario profile', e);
      } finally {
        if (active) setLoadingUser(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [userEmail]);

  // Roles checking
  const isDeveloper = useMemo(() => userEmail === 'alejandro.cristopher@gmail.com', [userEmail]);
  const isAdmin = useMemo(() => sgiUsuario?.rol === 'Admin' || isDeveloper, [sgiUsuario, isDeveloper]);
  const isProcessOwner = useMemo(() => {
    return processes.some(p => p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail));
  }, [processes, userEmail]);
  const isEncargado = useMemo(() => sgiUsuario?.rol === 'Encargado', [sgiUsuario]);
  const isUser = true;

  const roles = useMemo<AppRole[]>(() => {
    const list: AppRole[] = ['SGI.User'];
    if (isAdmin) list.push('SGI.Admin');
    return list;
  }, [isAdmin]);

  const hasRole = useCallback(
    (role: AppRole) => roles.includes(role),
    [roles]
  );

  // Authentication actions
  const login = useCallback(async () => {
    // This is handled by redirecting to the /login page
    window.location.href = '/login';
    return Promise.resolve();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSgiUsuario(undefined);
    setUserArea(undefined);
    window.location.href = '/login';
  }, []);

  const getSharePointToken = useCallback(async (): Promise<string> => {
    // SharePoint token is no longer used, returning empty string for backwards compatibility
    return '';
  }, []);

  // Helpers for checking ownership/modification permissions (to preserve frontend checks)
  const canModifyProcess = useCallback((proc: Process) => {
    if (isDeveloper || isAdmin) return true;
    if (!proc.responsableEmails) return false;
    return proc.responsableEmails.map(e => e.toLowerCase()).includes(userEmail);
  }, [isDeveloper, isAdmin, userEmail]);

  const canModifyKPI = useCallback((kpi: KPI) => {
    if (isDeveloper || isAdmin) return true;
    if (!kpi.area) return false;
    const proc = processes.find(p => 
      p.nombre.toLowerCase() === kpi.area.toLowerCase() ||
      p.codigo.toLowerCase() === kpi.area.toLowerCase()
    );
    if (!proc) return false;
    return canModifyProcess(proc);
  }, [isDeveloper, isAdmin, processes, canModifyProcess]);

  const canModifyRisk = useCallback((risk: Risk) => {
    if (isDeveloper || isAdmin) return true;
    if (!risk.proceso_asociado) return false;
    const proc = processes.find(p => 
      p.nombre.toLowerCase() === risk.proceso_asociado.toLowerCase() ||
      p.codigo.toLowerCase() === risk.proceso_asociado.toLowerCase() ||
      p.id === risk.procesoId
    );
    if (!proc) return false;
    return canModifyProcess(proc);
  }, [isDeveloper, isAdmin, processes, canModifyProcess]);

  const canModifyGlossary = useCallback((term: { procesoId?: string }) => {
    if (isDeveloper || isAdmin) return true;
    if (!term.procesoId) return false;
    const proc = processes.find(p => p.id === term.procesoId);
    if (!proc) return false;
    return canModifyProcess(proc);
  }, [isDeveloper, isAdmin, processes, canModifyProcess]);

  const canModifyDocument = useCallback((doc: { procesoId?: string }) => {
    if (isDeveloper || isAdmin) return true;
    if (!doc.procesoId) return isAdmin; // docs without associated process: admin only
    const proc = processes.find(p => p.id === doc.procesoId);
    if (!proc) return false;
    return canModifyProcess(proc);
  }, [isDeveloper, isAdmin, processes, canModifyProcess]);

  const canModifySIPOC = useCallback((sipoc: { procesoId: string }) => {
    if (isDeveloper || isAdmin) return true;
    const proc = processes.find(p => p.id === sipoc.procesoId);
    if (!proc) return false;
    return canModifyProcess(proc);
  }, [isDeveloper, isAdmin, processes, canModifyProcess]);

  const ownedProcessIds = useMemo(() => {
    return processes
      .filter(p => p.responsableEmails?.map(e => e.toLowerCase()).includes(userEmail))
      .map(p => p.id);
  }, [processes, userEmail]);

  return {
    account: activeAccount,
    roles,
    isDeveloper,
    isAdmin,
    isProcessOwner,
    isEncargado,
    isUser,
    isAuthenticated: !!session?.user,
    hasRole,
    login,
    logout,
    getSharePointToken,
    displayName,
    email: userEmail,
    canModifyProcess,
    canModifyKPI,
    canModifyRisk,
    canModifyGlossary,
    canModifyDocument,
    canModifySIPOC,
    ownedProcessIds,
    sgiUsuario,
    userArea,
    loadingUser,
  };
}
