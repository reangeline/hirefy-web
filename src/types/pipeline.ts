// Tipos espelhando o contrato real do backend Go — confirmado em
// internal/adapters/inbound/http/handler/pipeline_handler.go,
// internal/analytics/pipeline_analytics.go, internal/core/domain/pipeline_job.go.
// Ver .spec/005-pipeline-candidaturas/spec.md.
//
// Atenção ao casing: vaga (PipelineJob) é majoritariamente snake_case, mas contatos usam
// `linkedinUrl` (camelCase), e analytics é 100% camelCase — três convenções dentro do mesmo
// domínio, tratadas endpoint por endpoint aqui (não é erro de digitação).

export type PipelineJobStage = "wishlist" | "applied" | "interview" | "offer" | "rejected";

export const PIPELINE_STAGES: PipelineJobStage[] = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export const STAGE_LABELS: Record<PipelineJobStage, string> = {
  wishlist: "Wishlist",
  applied: "Aplicado",
  interview: "Entrevista",
  offer: "Oferta",
  rejected: "Rejeitado",
};

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  detail?: string;
  created_at: string;
}

// GET /pipeline, GET /pipeline/{jobId}, POST /pipeline, PUT /pipeline/{jobId} — ver
// PipelineJobResponse em pipeline_handler.go
export interface PipelineJob {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  location?: string;
  stage: PipelineJobStage;
  resume_id?: string;
  optimized_resume_id?: string;
  ats_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  job_description?: string;
  job_url?: string;
  is_ghosted: boolean;
  is_archived: boolean;
  interview_at?: string;
  interview_type?: string;
  timeline?: TimelineEvent[];
  created_at: string;
  updated_at: string;
}

// Body de POST /pipeline
export interface CreatePipelineJobRequest {
  company_name: string;
  job_title: string;
  location?: string;
  stage?: PipelineJobStage;
  resume_id?: string;
  optimized_resume_id?: string;
  ats_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  job_description?: string;
  job_url?: string;
}

// Body de PUT /pipeline/{jobId} — todos os campos opcionais (patch parcial)
export interface UpdatePipelineJobRequest {
  company_name?: string;
  job_title?: string;
  location?: string;
  stage?: PipelineJobStage;
  resume_id?: string;
  optimized_resume_id?: string;
  ats_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  job_description?: string;
  job_url?: string;
  is_ghosted?: boolean;
  is_archived?: boolean;
}

// Body de POST /pipeline/{jobId}/interview — interview_type precisa ser um destes 4
export type InterviewType = "phone_screen" | "technical" | "hr" | "final_round";

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone_screen: "Triagem por telefone",
  technical: "Técnica",
  hr: "RH",
  final_round: "Etapa final",
};

export interface LogInterviewRequest {
  interview_at: string; // ISO 8601 / RFC3339
  interview_type: InterviewType;
  detail?: string;
}

// Body de POST /pipeline/{jobId}/followup — backend só aceita `detail` (mobile tenta enviar
// channel/message, mas o Go descarta campo desconhecido silenciosamente; seguimos o
// contrato real, não o que o mobile tenta enviar)
export interface LogFollowUpRequest {
  detail?: string;
}

// Body de POST /pipeline/{jobId}/coach
export type CoachTone = "default" | "formal" | "shorter";

export interface CoachRequest {
  stage: PipelineJobStage;
  job_title?: string;
  company_name?: string;
  location?: string;
  ats_score?: number;
  resume_version?: string;
  job_description?: string;
  job_url?: string;
  matched_keywords?: string[];
  missing_keywords?: string[];
  days_since_applied?: number;
  tone?: CoachTone;
}

// Resposta de POST /pipeline/{jobId}/coach — ver CoachJobResponse em
// pipeline_coach_service.go. Erros possíveis (não incluídos na resposta de sucesso):
// 402 (sem créditos), 403 (assinatura inativa/não encontrada), 422 (sem coach nesse estágio
// — sempre o caso pra "wishlist").
export interface CoachResponse {
  content: string;
  stage: string;
  type: "followup" | "interview_prep" | "offer_insights" | "feedback_request" | string;
}

// GET/POST /pipeline/{jobId}/contacts — único endpoint do domínio pipeline em camelCase
export interface Contact {
  id: string;
  name: string;
  role: string;
  linkedinUrl: string;
  email: string;
  notes: string;
}

export interface CreateContactRequest {
  name: string;
  role?: string;
  linkedinUrl?: string;
  email?: string;
  notes?: string;
}

// GET /pipeline/analytics — ver PipelineAnalytics em internal/analytics/pipeline_analytics.go.
// 100% camelCase, diferente do resto do domínio pipeline.
export interface ScoreRangeBucket {
  label: string;
  responseRate: number;
  count: number;
}

export interface BestResume {
  resumeId: string;
  resumeName: string;
  responseRate: number;
  applicationCount: number;
}

export interface StageCount {
  stage: string;
  count: number;
}

export interface WeeklyPoint {
  weekLabel: string;
  applicationCount: number;
  responseCount: number;
}

export interface PipelineAnalytics {
  totalApplications: number;
  responseRate: number;
  averageAtsScore: number;
  interviewCount: number;
  offerCount: number;
  ghostedCount: number;
  applicationsThisWeek: number;
  scoreRangeBuckets: ScoreRangeBucket[];
  bestResumeVersion: BestResume | null;
  stageDistribution: StageCount[];
  weeklyActivity: WeeklyPoint[];
  coachInsight: string;
}

// Prática de entrevista (spec 010) — GET/POST /pipeline/{jobId}/interview-practice[...].
// Ver InterviewQuestionDTO em internal/core/ports/inbound/interview_practice_service.go.
// Mesmos erros do Coach: 402 (sem créditos, só em SubmitAnswer — gerar pergunta é grátis),
// 403 (assinatura inativa/não encontrada), 422 (sem prática nesse estágio — "wishlist").
export type InterviewQuestionKind = "behavioral" | "technical" | "situational" | "screening";

export const INTERVIEW_KINDS: InterviewQuestionKind[] = [
  "behavioral",
  "technical",
  "situational",
  "screening",
];

export const INTERVIEW_KIND_LABELS: Record<InterviewQuestionKind, string> = {
  behavioral: "Comportamental",
  technical: "Técnica",
  situational: "Situacional",
  screening: "Triagem",
};

export interface InterviewQuestion {
  id: string;
  kind: InterviewQuestionKind;
  question: string;
  what_they_want?: string;
  method_hint?: string;
  answer?: string;
  content_score?: number;
  star_situation?: number;
  star_task?: number;
  star_action?: number;
  star_result?: number;
  strengths?: string[];
  gaps?: string[];
  model_answer?: string;
  follow_up?: string;
  created_at: string;
  answered: boolean;
}
