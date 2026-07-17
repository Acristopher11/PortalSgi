export interface Database {
  public: {
    Tables: {
      organizacion: { Row: any; Insert: any; Update: any; Relationships: any[] };
      areas: { Row: any; Insert: any; Update: any; Relationships: any[] };
      usuarios: { Row: any; Insert: any; Update: any; Relationships: any[] };
      objetivos: { Row: any; Insert: any; Update: any; Relationships: any[] };
      procesos: { Row: any; Insert: any; Update: any; Relationships: any[] };
      indicadores: { Row: any; Insert: any; Update: any; Relationships: any[] };
      mediciones: { Row: any; Insert: any; Update: any; Relationships: any[] };
      sipoc: { Row: any; Insert: any; Update: any; Relationships: any[] };
      actividades: { Row: any; Insert: any; Update: any; Relationships: any[] };
      riesgos: { Row: any; Insert: any; Update: any; Relationships: any[] };
      glosario: { Row: any; Insert: any; Update: any; Relationships: any[] };
      documentos: { Row: any; Insert: any; Update: any; Relationships: any[] };
      aprobaciones: { Row: any; Insert: any; Update: any; Relationships: any[] };
      bitacora: { Row: any; Insert: any; Update: any; Relationships: any[] };
      alertas: { Row: any; Insert: any; Update: any; Relationships: any[] };
      acciones_correctivas: { Row: any; Insert: any; Update: any; Relationships: any[] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
