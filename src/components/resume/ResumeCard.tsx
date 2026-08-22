import Link from "next/link";
import { FileText, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Resume } from "@/types/resume";

interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
}

export function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-5 text-primary" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{resume.nickname}</p>
          <p className="text-sm text-muted-foreground">Atualizado em {resume.updatedAt}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
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
            onClick={() => onDelete(resume.id)}
          >
            <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
