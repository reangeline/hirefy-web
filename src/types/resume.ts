// Tipos do domínio de currículos. Espelham o que a spec 002 levantou do backend
// (internal/core/domain/resume.go), com uma ressalva importante: o shape de `parsed_data`
// pro currículo manual (personal/experiences/education/projects/languages) NÃO está
// confirmado no backend — ele aceita `map[string]interface{}` genérico. Os campos abaixo são
// um formato razoável pra construir a UI; podem precisar de ajuste quando ligarmos na API
// de verdade. Ver .spec/002-resume-optimization/spec.md ("Perguntas em aberto").

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  summary?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export type LanguageLevel = "basico" | "intermediario" | "avancado" | "fluente" | "nativo";

export interface LanguageEntry {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface ResumeFormData {
  nickname: string;
  personal: PersonalInfo;
  experiences: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
}

// Ver internal/core/domain/resume.go (Resume)
export interface Resume {
  id: string;
  nickname: string;
  type: "manual" | "upload";
  updatedAt: string;
}

// Ver internal/core/domain/resume.go (OptimizedResume)
export interface SalaryEstimate {
  found: boolean;
  currency?: string;
  minSalary?: number;
  maxSalary?: number;
  period?: string;
  location?: string;
}

export interface OptimizedResume {
  id: string;
  resumeId: string;
  sourceResumeName: string;
  jobDescription: string;
  targetCompany?: string;
  targetRole?: string;
  matchScore: number;
  suggestions: string[];
  missingRequirements: string[];
  salaryEstimate?: SalaryEstimate;
  createdAt: string;
}

export type OptimizationJobStatus = "queued" | "processing" | "completed" | "failed";
