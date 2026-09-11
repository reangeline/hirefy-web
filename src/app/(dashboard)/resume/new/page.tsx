"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronRight, FileUp, PencilLine, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PdfImportUpload } from "@/components/resume/PdfImportUpload";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { Topbar } from "@/components/layout/Topbar";
import { emptyManualResumeRequest, type ManualResumeRequest } from "@/types/resume";

type Mode = "choose" | "manual" | "pdf-upload" | "pdf-review";

export default function NewResumePage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [parsedData, setParsedData] = useState<ManualResumeRequest | null>(null);

  function handleParsed(data: ManualResumeRequest) {
    setParsedData(data);
    setMode("pdf-review");
  }

  return (
    <>
      <Topbar title="Novo currículo" />
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Link href="/resume" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus currículos
      </Link>

      {mode === "choose" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <MethodCard
            icon={FileUp}
            title="Importar PDF"
            description="A IA extrai seus dados e calcula um score de ATS automaticamente."
            onClick={() => setMode("pdf-upload")}
          />
          <MethodCard
            icon={PencilLine}
            title="Preencher manualmente"
            description="Digite seus dados diretamente no formulário."
            onClick={() => setMode("manual")}
          />
        </div>
      )}

      {mode === "pdf-upload" && <PdfImportUpload onParsed={handleParsed} />}

      {mode === "manual" && <ResumeForm mode="create" initialData={emptyManualResumeRequest()} />}

      {mode === "pdf-review" && parsedData && (
        <>
          {parsedData.ats_score != null && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Score de ATS do PDF importado</p>
                  <Badge variant={parsedData.ats_score >= 70 ? "default" : "secondary"}>
                    {Math.round(parsedData.ats_score)}%
                  </Badge>
                </div>
                {parsedData.ats_improvements && parsedData.ats_improvements.length > 0 && (
                  <ul className="space-y-1.5">
                    {parsedData.ats_improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  Revise os campos abaixo — nada foi salvo ainda.
                </p>
              </CardContent>
            </Card>
          )}
          <ResumeForm mode="create" initialData={parsedData} />
        </>
      )}
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
  icon: typeof FileUp;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer text-left">
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
