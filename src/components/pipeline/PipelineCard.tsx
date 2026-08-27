"use client";

import Link from "next/link";
import { Ghost, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineJob, type PipelineJobStage } from "@/types/pipeline";

interface PipelineCardProps {
  job: PipelineJob;
  onStageChange: (jobId: string, stage: PipelineJobStage) => void;
}

export function PipelineCard({ job, onStageChange }: PipelineCardProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/pipeline/${job.id}`} className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold hover:underline">{job.company_name}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">{job.job_title}</p>
          </Link>
          {job.is_ghosted && (
            <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
              <Ghost className="size-3" aria-hidden="true" />
              Ghosted
            </Badge>
          )}
        </div>

        {job.location && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            {job.location}
          </p>
        )}

        {job.ats_score != null && (
          <Badge
            variant={job.ats_score >= 70 ? "default" : "secondary"}
            className="font-mono text-[10.5px] tabular-nums"
          >
            {job.ats_score}% ATS
          </Badge>
        )}

        <Select
          items={STAGE_LABELS}
          value={job.stage}
          onValueChange={(stage) => onStageChange(job.id, stage as PipelineJobStage)}
        >
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
