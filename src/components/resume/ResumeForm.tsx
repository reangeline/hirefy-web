"use client";

import { useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, GraduationCap, FolderGit2, Languages, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetchJson } from "@/lib/api/client";
import { emptyEducation, emptyExperience, emptyLanguage, emptyProject } from "@/types/resume";
import type { EducationEntry, ExperienceEntry, LanguageEntry, ManualResumeRequest, ProjectEntry } from "@/types/resume";

const LANGUAGE_LEVEL_OPTIONS = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"];
// Select.Root usa `items` só pra resolver o label no trigger fechado — aqui value === label,
// então o Record é {label: label} (mesma técnica de .spec/002-resume-optimization/spec.md,
// achado do bug de Select do passe de UI mock).
const LANGUAGE_LEVELS: Record<string, string> = Object.fromEntries(
  LANGUAGE_LEVEL_OPTIONS.map((level) => [level, level]),
);

interface ResumeFormProps {
  initialData: ManualResumeRequest;
  mode: "create" | "edit";
  resumeId?: string;
}

export function ResumeForm({ initialData, mode, resumeId }: ResumeFormProps) {
  const router = useRouter();
  const [data, setData] = useState<ManualResumeRequest>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === "create") {
        await apiFetchJson("/api/resumes/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await apiFetchJson(`/api/resumes/manual/${resumeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      router.push("/resume");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o currículo.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="nickname">Nome do currículo</Label>
        <Input
          id="nickname"
          name="nickname"
          required
          placeholder="Ex: Currículo — Backend"
          value={data.nickname}
          onChange={(e) => setData({ ...data, nickname: e.target.value })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                value={data.personal.full_name ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, full_name: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentRole">Cargo atual</Label>
              <Input
                id="currentRole"
                name="currentRole"
                value={data.personal.current_role ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, current_role: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personalEmail">Email</Label>
              <Input
                id="personalEmail"
                name="email"
                type="email"
                spellCheck={false}
                value={data.personal.email ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, email: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={data.personal.phone ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, phone: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={data.personal.city ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, city: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                name="state"
                value={data.personal.state ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, state: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                name="country"
                value={data.personal.country ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, country: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                name="linkedin"
                placeholder="linkedin.com/in/seu-perfil"
                value={data.personal.linkedin_url ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, linkedin_url: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Site pessoal</Label>
              <Input
                id="website"
                name="website"
                value={data.personal.website_url ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, website_url: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                name="github"
                value={data.personal.github_url ?? ""}
                onChange={(e) =>
                  setData({ ...data, personal: { ...data.personal, github_url: e.target.value } })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary">Resumo profissional</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={3}
              value={data.personal.summary ?? ""}
              onChange={(e) =>
                setData({ ...data, personal: { ...data.personal, summary: e.target.value } })
              }
            />
          </div>
        </CardContent>
      </Card>

      <RepeatableSection
        title="Experiências"
        icon={Briefcase}
        items={data.experiences}
        onChange={(experiences) => setData({ ...data, experiences })}
        createEmpty={emptyExperience}
        renderItem={(item, onChange) => <ExperienceFields item={item} onChange={onChange} />}
      />

      <RepeatableSection
        title="Formação"
        icon={GraduationCap}
        items={data.education}
        onChange={(education) => setData({ ...data, education })}
        createEmpty={emptyEducation}
        renderItem={(item, onChange) => <EducationFields item={item} onChange={onChange} />}
      />

      <RepeatableSection
        title="Projetos"
        icon={FolderGit2}
        items={data.projects}
        onChange={(projects) => setData({ ...data, projects })}
        createEmpty={emptyProject}
        renderItem={(item, onChange) => <ProjectFields item={item} onChange={onChange} />}
      />

      <RepeatableSection
        title="Idiomas"
        icon={Languages}
        items={data.languages}
        onChange={(languages) => setData({ ...data, languages })}
        createEmpty={emptyLanguage}
        renderItem={(item, onChange) => <LanguageFields item={item} onChange={onChange} />}
      />

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : mode === "create" ? "Criar currículo" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

interface RepeatableSectionProps<T extends { id: string }> {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: T[];
  onChange: (items: T[]) => void;
  createEmpty: () => T;
  renderItem: (item: T, onChange: (item: T) => void) => ReactNode;
}

function RepeatableSection<T extends { id: string }>({
  title,
  icon: Icon,
  items,
  onChange,
  createEmpty,
  renderItem,
}: RepeatableSectionProps<T>) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange([...items, createEmpty()])}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada adicionado ainda.</p>
        )}
        {items.map((item, index) => (
          <div key={item.id} className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {title} {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover ${title.toLowerCase()} ${index + 1}`}
                onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
            {renderItem(item, (updated) =>
              onChange(items.map((x) => (x.id === item.id ? updated : x))),
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExperienceFields({
  item,
  onChange,
}: {
  item: ExperienceEntry;
  onChange: (item: ExperienceEntry) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Empresa</Label>
        <Input value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Cargo</Label>
        <Input value={item.role} onChange={(e) => onChange({ ...item, role: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Início</Label>
        <Input
          type="month"
          value={item.start_date}
          onChange={(e) => onChange({ ...item, start_date: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Fim</Label>
        <Input
          type="month"
          disabled={item.is_current}
          value={item.end_date}
          onChange={(e) => onChange({ ...item, end_date: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={item.is_current}
          onChange={(e) => onChange({ ...item, is_current: e.target.checked, end_date: "" })}
          className="size-4 rounded border-input accent-primary"
        />
        Emprego atual
      </label>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Descrição</Label>
        <Textarea
          rows={3}
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </div>
    </div>
  );
}

function EducationFields({
  item,
  onChange,
}: {
  item: EducationEntry;
  onChange: (item: EducationEntry) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Instituição</Label>
        <Input
          value={item.institution}
          onChange={(e) => onChange({ ...item, institution: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Curso / grau</Label>
        <Input value={item.degree} onChange={(e) => onChange({ ...item, degree: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Início</Label>
        <Input
          type="month"
          value={item.start_date}
          onChange={(e) => onChange({ ...item, start_date: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Fim</Label>
        <Input
          type="month"
          disabled={item.is_current}
          value={item.end_date}
          onChange={(e) => onChange({ ...item, end_date: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={item.is_current}
          onChange={(e) => onChange({ ...item, is_current: e.target.checked, end_date: "" })}
          className="size-4 rounded border-input accent-primary"
        />
        Em andamento
      </label>
    </div>
  );
}

function ProjectFields({
  item,
  onChange,
}: {
  item: ProjectEntry;
  onChange: (item: ProjectEntry) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea
          rows={2}
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Link</Label>
        <Input value={item.url} onChange={(e) => onChange({ ...item, url: e.target.value })} />
      </div>
    </div>
  );
}

function LanguageFields({
  item,
  onChange,
}: {
  item: LanguageEntry;
  onChange: (item: LanguageEntry) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Idioma</Label>
        <Input
          value={item.language}
          onChange={(e) => onChange({ ...item, language: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Nível</Label>
        <Select
          items={LANGUAGE_LEVELS}
          value={item.proficiency}
          onValueChange={(proficiency) => onChange({ ...item, proficiency: proficiency as string })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_LEVEL_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
