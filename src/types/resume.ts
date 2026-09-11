// Tipos espelhando o contrato real do backend Go — confirmado em
// internal/adapters/inbound/http/handler/resume_handler.go,
// internal/core/domain/resume.go, internal/core/domain/optimization_job.go, e o prompt de
// IA em internal/adapters/outbound/ai/openai/ai_service_impl.go (ParseResumeFromText, que
// define o shape de personal/experiences/education/projects/languages).
// Ver .spec/002-resume-optimization/spec.md.

export interface PersonalInfo {
  full_name?: string;
  email?: string;
  phone?: string;
  current_role?: string;
  country?: string;
  state?: string;
  city?: string;
  linkedin_url?: string;
  website_url?: string;
  github_url?: string;
  summary?: string;
}

// `id` é só pra chave de lista/remoção no React — o backend ignora campos desconhecidos no
// body (confirmado: é assim que ele descarta offer_amount/channel em outros DTOs), então
// não precisamos filtrar antes de enviar.
export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
}

export interface ProjectEntry {
  id: string;
  name: string;
  url?: string;
  description: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

// Body de POST /resumes/manual e PUT /resumes/manual/{id} — plano, não aninhado.
export interface ManualResumeRequest {
  nickname: string;
  personal: PersonalInfo;
  experiences: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
  // Preenchidos quando o currículo veio de um import de PDF (POST /resumes/parse-pdf) — o
  // backend aceita esses campos opcionais em ManualResumeRequestDTO e preserva o score.
  ats_score?: number;
  ats_improvements?: string[];
}

// Campos crus que a IA devolve pra cada item de array — sem `id` (isso é só convenção do
// nosso form, o parse-pdf não sabe disso).
type RawExperience = Omit<ExperienceEntry, "id">;
type RawEducation = Omit<EducationEntry, "id">;
type RawProject = Omit<ProjectEntry, "id">;
type RawLanguage = Omit<LanguageEntry, "id">;

// Resposta de POST /resumes/parse-pdf — NÃO é persistida (id é temporário, não é um Resume
// de verdade). Ver ParsePDFResume em resume_optimizer_service_impl.go.
export interface ParsedPdfResult {
  id: string;
  type: "manual";
  created_at: string;
  parsed_data: {
    personal?: PersonalInfo;
    experiences?: RawExperience[];
    education?: RawEducation[];
    projects?: RawProject[];
    languages?: RawLanguage[];
    ats_score?: number;
    ats_improvements?: string[];
  };
}

export interface ParsedResumeData {
  nickname?: string;
  personal?: PersonalInfo;
  experiences?: ExperienceEntry[];
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  languages?: LanguageEntry[];
  ats_score?: number;
  ats_improvements?: string[];
}

// GET /resumes, GET /resumes/{id}, POST/PUT /resumes/manual — ver domain/resume.go (Resume)
export interface Resume {
  id: string;
  user_id: string;
  type: "manual" | "upload";
  original_content?: string;
  parsed_data: ParsedResumeData;
  created_at: string;
  updated_at: string;
}

export type OptimizationJobStatus = "queued" | "processing" | "completed" | "failed";

// GET /resumes/optimize/jobs/{jobID} — ver domain/optimization_job.go
export interface OptimizationJob {
  id: string;
  user_id: string;
  resume_id: string;
  job_description: string;
  status: OptimizationJobStatus;
  error?: string;
  optimized_resume_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryEstimate {
  found: boolean;
  currency?: string;
  min_salary?: number;
  max_salary?: number;
  midpoint?: number;
  period?: string;
  location?: string;
  seniority?: string;
  notes?: string;
  disclaimer?: string;
}

// GET /resumes/optimized, GET /resumes/optimized/{id} — ver domain/resume.go (OptimizedResume)
export interface OptimizedResume {
  id: string;
  user_id: string;
  resume_id: string;
  source_resume_id: string;
  job_description_id: string;
  optimized_content?: string;
  parsed_data?: ParsedResumeData;
  match_score: number;
  suggestions: string[];
  missing_requirements: string[];
  salary_estimate?: SalaryEstimate;
  created_at: string;
}

// ─── Helpers pra estado local do formulário ────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyExperience(): ExperienceEntry {
  return { id: uid("exp"), role: "", company: "", start_date: "", end_date: "", is_current: false, description: "" };
}

export function emptyEducation(): EducationEntry {
  return { id: uid("edu"), institution: "", degree: "", start_date: "", end_date: "", is_current: false };
}

export function emptyProject(): ProjectEntry {
  return { id: uid("proj"), name: "", url: "", description: "" };
}

export function emptyLanguage(): LanguageEntry {
  return { id: uid("lang"), language: "", proficiency: "Intermediário" };
}

export function emptyManualResumeRequest(): ManualResumeRequest {
  return {
    nickname: "",
    personal: {},
    experiences: [emptyExperience()],
    education: [emptyEducation()],
    projects: [],
    languages: [emptyLanguage()],
  };
}

/** Converte o `parsed_data` de um Resume real pro shape editável do formulário. */
export function resumeToFormData(resume: Resume): ManualResumeRequest {
  const d = resume.parsed_data;
  return {
    nickname: d.nickname ?? "",
    personal: d.personal ?? {},
    experiences: d.experiences?.length ? d.experiences : [emptyExperience()],
    education: d.education?.length ? d.education : [emptyEducation()],
    projects: d.projects ?? [],
    languages: d.languages?.length ? d.languages : [emptyLanguage()],
  };
}

/**
 * Converte o `parsed_data` de POST /resumes/parse-pdf (sem `id` nos itens, vem cru da IA)
 * pro shape editável do formulário — atribui um `id` local a cada item de array.
 */
export function parsedPdfToFormData(parsed: ParsedPdfResult["parsed_data"]): ManualResumeRequest {
  return {
    nickname: "",
    personal: parsed.personal ?? {},
    experiences: parsed.experiences?.length
      ? parsed.experiences.map((e) => ({ id: uid("exp"), ...e }))
      : [emptyExperience()],
    education: parsed.education?.length
      ? parsed.education.map((e) => ({ id: uid("edu"), ...e }))
      : [emptyEducation()],
    projects: parsed.projects?.map((p) => ({ id: uid("proj"), ...p })) ?? [],
    languages: parsed.languages?.length
      ? parsed.languages.map((l) => ({ id: uid("lang"), ...l }))
      : [emptyLanguage()],
    ats_score: parsed.ats_score,
    ats_improvements: parsed.ats_improvements,
  };
}
