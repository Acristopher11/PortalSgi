import { supabase } from '../lib/supabaseClient';
import * as processRepo from '../repositories/processRepository';
import * as kpiRepo from '../repositories/kpiRepository';
import * as riskRepo from '../repositories/riskRepository';
import * as documentRepo from '../repositories/documentRepository';
import * as objetivoRepo from '../repositories/objetivoRepository';
import * as areaRepo from '../repositories/areaRepository';
import * as measurementRepo from '../repositories/measurementRepository';
import * as sipocRepo from '../repositories/sipocRepository';
import * as glossaryRepo from '../repositories/glossaryRepository';
import * as activityRepo from '../repositories/activityRepository';
import * as activityLogRepo from '../repositories/activityLogRepository';
import * as alertRepo from '../repositories/alertRepository';
import * as approvalRepo from '../repositories/approvalRepository';
import * as usuarioRepo from '../repositories/usuarioRepository';
import * as correctiveActionRepo from '../repositories/correctiveActionRepository';

import type { Process, ProcessFormValues } from '../models/Process';
import type { KPI, KPIFormValues } from '../models/KPI';
import type { Risk, RiskFormValues } from '../models/Risk';
import type { Measurement, MeasurementFormValues } from '../models/Measurement';
import type { QualityObjective, GlossaryTerm, DocumentItem, SIPOCItem, ProcessActivity, ActivityLog, NotificationAlert, ApprovalRequest, SgiUsuario, Area, CorrectiveAction } from '../types';

class SharePointServiceFacade {
  private currentUserEmail: string = '';

  setCurrentUser(email: string, _name: string) {
    this.currentUserEmail = email;
  }

  // Processes
  async getProcesses(token?: string): Promise<Process[]> {
    return processRepo.getAllProcesses(token);
  }

  async getProcessById(id: string, token?: string): Promise<Process | undefined> {
    const list = await processRepo.getAllProcesses(token);
    return list.find(p => p.id === id);
  }

  async createProcess(values: any, token?: string): Promise<Process> {
    return processRepo.createProcessItem(values, token);
  }

  async updateProcess(id: string | number, values: any, token?: string): Promise<void> {
    return processRepo.updateProcessItem(id, values, token);
  }

  async updateProcessDirect(id: string | number, values: any, token?: string): Promise<void> {
    return this.updateProcess(id, values, token);
  }

  async deleteProcess(id: string | number, token?: string): Promise<void> {
    return processRepo.deleteProcessItem(id, token);
  }

  // KPIs
  async getKPIs(token?: string): Promise<KPI[]> {
    return kpiRepo.getAllKPIs(token);
  }

  async createKPI(values: any, token?: string): Promise<KPI> {
    return kpiRepo.createKPIItem(values, token);
  }

  async updateKPI(id: string | number, values: any, token?: string): Promise<void> {
    return kpiRepo.updateKPIItem(id, values, token);
  }

  async deleteKPI(id: string | number, token?: string): Promise<void> {
    return kpiRepo.deleteKPIItem(id, token);
  }

  calculateKPIStatus(actual: number, meta: number): 'on_track' | 'at_risk' | 'off_track' {
    if (!meta || meta === 0) return 'off_track';
    const cumplimiento = (actual / meta) * 100;
    if (cumplimiento >= 90) return 'on_track';
    if (cumplimiento >= 70) return 'at_risk';
    return 'off_track';
  }

  // Quality Objectives
  async getQualityObjectives(token?: string): Promise<QualityObjective[]> {
    return objetivoRepo.getAllObjetivos(token);
  }

  async createQualityObjective(values: Omit<QualityObjective, 'id'>, token?: string): Promise<QualityObjective> {
    return objetivoRepo.createObjetivoItem(values, token);
  }

  async updateQualityObjective(id: string | number, values: Partial<QualityObjective>, token?: string): Promise<void> {
    return objetivoRepo.updateObjetivoItem(id, values, token);
  }

  async deleteQualityObjective(id: string | number, token?: string): Promise<void> {
    return objetivoRepo.deleteObjetivoItem(id, token);
  }

  // Risks
  async getRisks(token?: string): Promise<Risk[]> {
    return riskRepo.getAllRisks(token);
  }

  async createRisk(values: any, token?: string): Promise<Risk> {
    return riskRepo.createRiskItem(values, token);
  }

  async updateRisk(id: string | number, values: any, token?: string): Promise<void> {
    return riskRepo.updateRiskItem(id, values, token);
  }

  async deleteRisk(id: string | number, token?: string): Promise<void> {
    return riskRepo.deleteRiskItem(id, token);
  }

  // Glossary
  async getGlossaryTerms(token?: string): Promise<GlossaryTerm[]> {
    return glossaryRepo.getAllGlossaryTerms(token);
  }

  async createGlossaryTerm(values: { termino: string; definicion: string; procesoId?: string }, token?: string): Promise<GlossaryTerm> {
    return glossaryRepo.createGlossaryTermItem(values, token);
  }

  async updateGlossaryTerm(id: string | number, values: { termino: string; definicion: string; procesoId?: string }, token?: string): Promise<void> {
    return glossaryRepo.updateGlossaryTermItem(id, values, token);
  }

  async deleteGlossaryTerm(id: string | number, token?: string): Promise<void> {
    return glossaryRepo.deleteGlossaryTermItem(id, token);
  }

  // Documents
  async getDocuments(token?: string): Promise<DocumentItem[]> {
    return documentRepo.getAllDocuments(token);
  }

  async createDocument(file: File, metadata: { codigo: string; version: number; procesoId?: string }, token?: string): Promise<DocumentItem> {
    return documentRepo.uploadDocumentItem(file, metadata, token);
  }

  async uploadDocument(file: File, metadata: { codigo: string; version: number; procesoId?: string }, token?: string): Promise<DocumentItem> {
    return this.createDocument(file, metadata, token);
  }

  async updateDocument(id: string | number, metadata: { codigo: string; version: number; procesoId?: string }, token?: string): Promise<void> {
    return documentRepo.updateDocumentItem(id, metadata, token);
  }

  async deleteDocument(id: string | number, token?: string): Promise<void> {
    return documentRepo.deleteDocumentItem(id, token);
  }

  // SIPOC
  async getSipocByProcess(processId: string, token?: string): Promise<SIPOCItem[]> {
    return sipocRepo.getSipocByProcessId(processId, token);
  }

  // Activities
  async getActivitiesByProcess(processId: string, token?: string): Promise<ProcessActivity[]> {
    return activityRepo.getActivitiesByProcessId(processId, token);
  }

  async createActivity(values: Omit<ProcessActivity, 'id'>, token?: string): Promise<ProcessActivity> {
    return activityRepo.createActivityItem(values, token);
  }

  async updateActivity(id: string | number, values: Partial<Omit<ProcessActivity, 'id' | 'procesoId'>>, token?: string): Promise<void> {
    return activityRepo.updateActivityItem(id, values, token);
  }

  async deleteActivity(id: string | number, token?: string): Promise<void> {
    return activityRepo.deleteActivityItem(id, token);
  }

  // Measurements
  async getMeasurements(token?: string, kpiId?: string, year?: number): Promise<Measurement[]> {
    return measurementRepo.getMeasurements(token, kpiId, year);
  }

  async createMeasurement(values: any, token?: string, _files?: any[]): Promise<number> {
    return measurementRepo.createMeasurementItem(values, token);
  }

  // Areas
  async getAreas(token?: string): Promise<Area[]> {
    return areaRepo.getAllAreas(token);
  }

  async updateArea(id: string, values: { nivel?: string; dependenciaId?: string; responsable?: string; responsableEmail?: string }, token?: string): Promise<void> {
    return areaRepo.updateArea(id, values, token);
  }

  // Users
  async getUsers(token?: string): Promise<SgiUsuario[]> {
    return usuarioRepo.getAllUsuarios(token);
  }

  async upsertUser(user: Omit<SgiUsuario, 'id' | 'areaNombre'> & { id?: string }, token?: string): Promise<SgiUsuario> {
    return usuarioRepo.upsertUsuario(user, token);
  }

  // Approvals
  async getApprovals(token?: string): Promise<ApprovalRequest[]> {
    return approvalRepo.getAllApprovals(token);
  }

  async getApprovalRequests(token?: string): Promise<ApprovalRequest[]> {
    return this.getApprovals(token);
  }

  async createApproval(request: Omit<ApprovalRequest, 'id' | 'fechaSolicitud' | 'estado'>, token?: string): Promise<ApprovalRequest> {
    return approvalRepo.createApproval(request, token);
  }

  async updateApprovalStatus(id: string | number, status: 'Aprobado' | 'Rechazado', aprobador: string, comentarios?: string, token?: string): Promise<void> {
    return approvalRepo.updateApprovalStatus(id, status, aprobador, comentarios, token);
  }

  async resolveApprovalRequest(id: string | number, status: 'Aprobado' | 'Rechazado', aprobador: string, comentarios?: string, token?: string): Promise<void> {
    return this.updateApprovalStatus(id, status, aprobador, comentarios, token);
  }

  async resubmitApproval(id: string | number, token?: string): Promise<ApprovalRequest> {
    return approvalRepo.resubmitApproval(id, token);
  }

  // Activity Logs
  async getActivityLogs(token?: string): Promise<ActivityLog[]> {
    return activityLogRepo.getAllLogs(token);
  }

  async createActivityLog(log: Omit<ActivityLog, 'id' | 'fecha'>, token?: string): Promise<ActivityLog> {
    return activityLogRepo.createLogItem(log, token);
  }

  // Alerts
  async getAlerts(token?: string): Promise<NotificationAlert[]> {
    return alertRepo.getUserAlerts(this.currentUserEmail, token);
  }

  async markAlertAsRead(id: string | number, token?: string): Promise<void> {
    return alertRepo.markAlertRead(id, token);
  }

  async markAllAlertsAsRead(token?: string): Promise<void> {
    return alertRepo.markAllAlertsRead(this.currentUserEmail, token);
  }

  async createAlert(alert: Omit<NotificationAlert, 'id' | 'fecha' | 'leida'>, token?: string): Promise<NotificationAlert> {
    return alertRepo.createAlert(alert, token);
  }

  // Corrective Actions
  async getCorrectiveActions(token?: string): Promise<CorrectiveAction[]> {
    return correctiveActionRepo.getAllCorrectiveActions(token);
  }

  async createCorrectiveAction(values: any, token?: string): Promise<CorrectiveAction> {
    return correctiveActionRepo.createCorrectiveActionItem(values, token);
  }

  async updateCorrectiveAction(id: string | number, values: any, token?: string): Promise<void> {
    return correctiveActionRepo.updateCorrectiveActionItem(id, values, token);
  }

  async deleteCorrectiveAction(id: string | number, token?: string): Promise<void> {
    return correctiveActionRepo.deleteCorrectiveActionItem(id, token);
  }

  // Quality Policy Statement (SaaS config)
  async getQualityPolicyStatement(): Promise<string> {
    const { data, error } = await supabase
      .from('organizacion')
      .select('config')
      .eq('id', '1')
      .single();

    if (error || !data) {
      return 'Nuestra organización está comprometida con los siguientes lineamientos y objetivos del Sistema de Gestión Integrado (SGI), asegurando el cumplimiento de los estándares internacionales de calidad y la mejora continua en todos nuestros procesos:';
    }

    const config = data.config as any;
    return config?.politica_calidad || 'Nuestra organización está comprometida con los siguientes lineamientos y objetivos del Sistema de Gestión Integrado (SGI), asegurando el cumplimiento de los estándares internacionales de calidad y la mejora continua en todos nuestros procesos:';
  }

  async updateQualityPolicyStatement(statement: string): Promise<void> {
    const { data } = await supabase
      .from('organizacion')
      .select('config')
      .eq('id', '1')
      .single();

    const currentConfig = (data?.config as any) || {};
    const newConfig = { ...currentConfig, politica_calidad: statement };

    const { error } = await supabase
      .from('organizacion')
      .update({ config: newConfig })
      .eq('id', '1');

    if (error) throw error;
  }

  // Helper Conversion
  mapMonthNameToMonthIndex(monthName?: string): number {
    if (!monthName) return 0;
    const clean = monthName.toLowerCase().trim();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const idx = months.indexOf(clean);
    return idx >= 0 ? idx : 0;
  }
}

export const sharePointService = new SharePointServiceFacade();
