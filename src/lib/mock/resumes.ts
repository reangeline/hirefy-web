// Dados fake pro pass de UI da spec 002 — sem ligação com o backend ainda.
// Ver .spec/002-resume-optimization/spec.md.
import type {
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  OptimizedResume,
  ProjectEntry,
  Resume,
  ResumeFormData,
} from "@/types/resume";

export const MOCK_RESUMES: Resume[] = [
  { id: "r1", nickname: "Currículo — Backend Go", type: "manual", updatedAt: "2026-08-10" },
  { id: "r2", nickname: "Currículo — Frontend React", type: "manual", updatedAt: "2026-08-15" },
];

export const MOCK_OPTIMIZED: OptimizedResume[] = [
  {
    id: "o1",
    resumeId: "r1",
    sourceResumeName: "Currículo — Backend Go",
    jobDescription: "Vaga de Engenheiro de Software Backend Sênior...",
    targetCompany: "Nubank",
    targetRole: "Engenheiro de Software Backend Sênior",
    matchScore: 78,
    suggestions: [
      "Adicione métricas de impacto nas experiências (ex: “reduziu latência em 40%”)",
      "Inclua a palavra-chave “Kubernetes”, citada 3 vezes na vaga",
      "Destaque experiência com sistemas distribuídos no resumo",
      "Mencione experiência com filas de mensagens (SQS/Kafka)",
    ],
    missingRequirements: ["Kubernetes", "gRPC", "Terraform"],
    salaryEstimate: {
      found: true,
      currency: "BRL",
      minSalary: 14000,
      maxSalary: 19000,
      period: "mês",
      location: "São Paulo, SP",
    },
    createdAt: "2026-08-18",
  },
];

export function getResumeById(id: string): Resume | undefined {
  return MOCK_RESUMES.find((r) => r.id === id);
}

export function getOptimizedById(id: string): OptimizedResume | undefined {
  return MOCK_OPTIMIZED.find((o) => o.id === id);
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyExperience(): ExperienceEntry {
  return {
    id: uid("exp"),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

export function emptyEducation(): EducationEntry {
  return { id: uid("edu"), institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" };
}

export function emptyProject(): ProjectEntry {
  return { id: uid("proj"), name: "", description: "", link: "" };
}

export function emptyLanguage(): LanguageEntry {
  return { id: uid("lang"), name: "", level: "intermediario" };
}

export function emptyResumeForm(): ResumeFormData {
  return {
    nickname: "",
    personal: { fullName: "", email: "", phone: "", location: "", linkedin: "", summary: "" },
    experiences: [emptyExperience()],
    education: [emptyEducation()],
    projects: [],
    languages: [emptyLanguage()],
  };
}

export function mockResumeFormFor(id: string): ResumeFormData {
  const resume = getResumeById(id);
  return {
    ...emptyResumeForm(),
    nickname: resume?.nickname ?? "",
    personal: {
      fullName: "Ana Silva",
      email: "ana.silva@example.com",
      phone: "(11) 91234-5678",
      location: "São Paulo, SP",
      linkedin: "linkedin.com/in/anasilva",
      summary: "Engenheira de software com 6 anos de experiência em backend Go e sistemas distribuídos.",
    },
    experiences: [
      {
        id: uid("exp"),
        company: "Empresa Anterior LTDA",
        role: "Engenheira de Software Sênior",
        startDate: "2022-01",
        endDate: "",
        current: true,
        description: "Liderou a migração do monolito pra arquitetura de microsserviços em Go.",
      },
    ],
    education: [
      {
        id: uid("edu"),
        institution: "Universidade de São Paulo",
        degree: "Bacharelado",
        fieldOfStudy: "Ciência da Computação",
        startDate: "2016-02",
        endDate: "2020-12",
      },
    ],
    languages: [
      { id: uid("lang"), name: "Português", level: "nativo" },
      { id: uid("lang"), name: "Inglês", level: "avancado" },
    ],
  };
}
