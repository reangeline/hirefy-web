"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Topbar } from "@/components/layout/Topbar";
import { LinkedInPostTopics } from "@/components/linkedin/LinkedInPostTopics";
import { ApiError, apiFetchJson } from "@/lib/api/client";
import type { Resume } from "@/types/resume";
import type { LinkedInPostIdeas } from "@/types/linkedin";

export default function LinkedInPostsPage() {
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [ideas, setIdeas] = useState<LinkedInPostIdeas | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetchJson<Resume[]>("/api/resumes"),
      apiFetchJson<LinkedInPostIdeas>("/api/linkedin-post-topics").catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
    ])
      .then(([resumeList, savedIdeas]) => {
        setResumes(resumeList);
        if (resumeList.length > 0) setSelectedResumeId(resumeList[0].id);
        setIdeas(savedIdeas);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selectedResumeId) return;
    setError(null);
    setGenerating(true);

    try {
      const newIdeas = await apiFetchJson<LinkedInPostIdeas>("/api/linkedin-post-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: selectedResumeId }),
      });
      setIdeas(newIdeas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar os temas.");
    } finally {
      setGenerating(false);
    }
  }

  const resumeOptions = Object.fromEntries(
    (resumes ?? []).map((r) => [r.id, r.parsed_data.nickname || "Currículo sem nome"]),
  );

  return (
    <>
      <Topbar title="LinkedIn" />
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">Ideias de publicação</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A IA sugere temas e ângulos relevantes pro seu perfil, com base no seu currículo —
            não são notícias do dia, são assuntos que fazem sentido você escrever sobre. Escolha
            um que despertar interesse e gere um post pronto pra copiar.
          </p>
        </div>

        {loading && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && resumes && resumes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">Você ainda não tem um currículo salvo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie um currículo primeiro pra gerar temas a partir dele.
                </p>
              </div>
              <Link href="/resume/new">
                <Button type="button">Criar currículo</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!loading && !error && resumes && resumes.length > 0 && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-1.5">
                <Label>Currículo base</Label>
                <Select items={resumeOptions} value={selectedResumeId} onValueChange={(v) => setSelectedResumeId(v ?? "")}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.parsed_data.nickname || "Currículo sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="button" disabled={generating || !selectedResumeId} onClick={handleGenerate} className="gap-2">
                <Sparkles className="size-4" aria-hidden="true" />
                {generating ? "Gerando…" : ideas ? "Gerar novos temas" : "Gerar temas"}
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
              <p aria-live="polite" className="text-sm text-muted-foreground">
                A IA está montando os temas…
              </p>
            </CardContent>
          </Card>
        )}

        {!generating && ideas && ideas.topics.length > 0 && selectedResumeId && (
          <LinkedInPostTopics topics={ideas.topics} resumeId={selectedResumeId} />
        )}
      </div>
    </>
  );
}
