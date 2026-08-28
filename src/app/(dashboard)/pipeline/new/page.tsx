"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronRight, PenLine, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AddJobQuickForm } from "@/components/pipeline/AddJobQuickForm";
import { AddJobOptimizeWizard } from "@/components/pipeline/AddJobOptimizeWizard";
import { Topbar } from "@/components/layout/Topbar";

type Mode = "choose" | "quick" | "optimize";

export default function NewPipelineJobPage() {
  const [mode, setMode] = useState<Mode>("choose");

  return (
    <>
      <Topbar title="Adicionar vaga" />
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Pipeline
        </Link>

        {mode === "choose" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <MethodCard
              icon={PenLine}
              title="Adicionar rápido"
              description="Só empresa, cargo e estágio. Sem gastar crédito."
              onClick={() => setMode("quick")}
            />
            <MethodCard
              icon={Sparkles}
              title="Adicionar com otimização"
              description="Otimiza seu currículo pra vaga com IA (gasta 1 crédito) e já entra com score de ATS."
              onClick={() => setMode("optimize")}
            />
          </div>
        )}

        {mode === "quick" && <AddJobQuickForm />}
        {mode === "optimize" && <AddJobOptimizeWizard />}
      </div>
    </>
  );
}

function MethodCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="h-full transition-colors hover:bg-accent">
        <CardContent className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    </button>
  );
}
