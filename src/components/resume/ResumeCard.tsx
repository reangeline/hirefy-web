import Link from "next/link";
import { FileText, Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Resume } from "@/types/resume";

interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function ResumeCard({ resume, onDelete, deleting }: ResumeCardProps) {
  const title = resume.parsed_data.nickname || resume.parsed_data.personal?.full_name || "Currículo sem nome";
  const updatedAt = new Date(resume.updated_at).toLocaleDateString("pt-BR");

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10">
          <FileText className="size-4 text-primary" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{title}</p>
          <p className="font-mono text-[11px] text-muted-foreground">Atualizado em {updatedAt}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link href={`/resume/${resume.id}/optimize`} className="inline-flex">
            <Button type="button" variant="ghost" size="icon" aria-label="Otimizar currículo">
              <Sparkles className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href={`/resume/${resume.id}/edit`} className="inline-flex">
            <Button type="button" variant="ghost" size="icon" aria-label="Editar currículo">
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Excluir currículo"
            disabled={deleting}
            onClick={() => onDelete(resume.id)}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4 text-destructive" aria-hidden="true" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
