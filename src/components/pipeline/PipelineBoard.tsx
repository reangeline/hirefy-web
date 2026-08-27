"use client";

import { PipelineCard } from "@/components/pipeline/PipelineCard";
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineJob, type PipelineJobStage } from "@/types/pipeline";

interface PipelineBoardProps {
  jobs: PipelineJob[];
  onStageChange: (jobId: string, stage: PipelineJobStage) => void;
}

export function PipelineBoard({ jobs, onStageChange }: PipelineBoardProps) {
  const visible = jobs.filter((j) => !j.is_archived);

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2">
      {PIPELINE_STAGES.map((stage) => {
        const stageJobs = visible.filter((j) => j.stage === stage);
        return (
          <div key={stage} className="w-56 shrink-0 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[12px] font-semibold">{STAGE_LABELS[stage]}</p>
              <span className="font-mono text-[11px] text-muted-foreground">{stageJobs.length}</span>
            </div>
            <div className="space-y-2">
              {stageJobs.map((job) => (
                <PipelineCard key={job.id} job={job} onStageChange={onStageChange} />
              ))}
              {stageJobs.length === 0 && (
                <p className="rounded border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                  Nenhuma vaga
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
