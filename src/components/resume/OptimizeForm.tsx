"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OptimizationJobStatus } from "@/types/resume";

interface OptimizeFormProps {
  resumeName: string;
}

// UI da spec 002 com job simulado (queued → processing → completed), replicando o padrão
// assíncrono real do backend (POST /resumes/optimize devolve o job, não o resultado — ver
// .spec/002-resume-optimization/spec.md). Ainda sem polling de verdade em
// GET /resumes/optimize/jobs/{jobID}.
export function OptimizeForm({ resumeName }: OptimizeFormProps) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [status, setStatus] = useState<OptimizationJobStatus | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("queued");

    // TODO: ligar em POST /resumes/optimize (202 + job) e fazer polling de verdade em
    // GET /resumes/optimize/jobs/{jobID} até completed/failed — ver .spec/002-resume-optimization/spec.md.
    setTimeout(() => setStatus("processing"), 800);
    setTimeout(() => {
      setStatus("completed");
      setTimeout(() => router.push(`/resume/optimized/o1`), 600);
    }, 2400);
  }

  if (status) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          {status === "completed" ? (
            <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
          ) : (
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
          )}
          <div aria-live="polite">
            <p className="font-medium">
              {status === "queued" && "Na fila de processamento…"}
              {status === "processing" && "A IA está otimizando seu currículo…"}
              {status === "completed" && "Otimização concluída!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pode fechar esta tela — o resultado fica salvo em “Otimizados” quando terminar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Otimizando <span className="font-medium text-foreground">{resumeName}</span>
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">Descrição da vaga</Label>
        <Textarea
          id="jobDescription"
          name="jobDescription"
          required
          rows={8}
          placeholder="Cole aqui a descrição completa da vaga…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="targetCompany">Empresa (opcional)</Label>
          <Input
            id="targetCompany"
            name="targetCompany"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetRole">Cargo (opcional)</Label>
          <Input
            id="targetRole"
            name="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="gap-2">
          <Sparkles className="size-4" aria-hidden="true" />
          Otimizar currículo
        </Button>
      </div>
    </form>
  );
}
