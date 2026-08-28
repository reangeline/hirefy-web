"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PipelineCard } from "@/components/pipeline/PipelineCard";
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineJob, type PipelineJobStage } from "@/types/pipeline";

interface PipelineBoardProps {
  jobs: PipelineJob[];
  onStageChange: (jobId: string, stage: PipelineJobStage) => void;
}

export function PipelineBoard({ jobs, onStageChange }: PipelineBoardProps) {
  const visible = jobs.filter((j) => !j.is_archived);
  const [activeJob, setActiveJob] = useState<PipelineJob | null>(null);

  // distance: 8 evita que um clique simples no Select dentro do card (mudança de estágio
  // sem arrastar) seja interpretado como início de drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const job = visible.find((j) => j.id === event.active.id);
    setActiveJob(job ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const stage = event.over?.id as PipelineJobStage | undefined;
    if (stage && activeJob && stage !== activeJob.stage) {
      onStageChange(activeJob.id, stage);
    }
    setActiveJob(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage) => {
          const stageJobs = visible.filter((j) => j.stage === stage);
          return (
            <StageColumn key={stage} stage={stage} count={stageJobs.length}>
              {stageJobs.map((job) => (
                <PipelineCard key={job.id} job={job} onStageChange={onStageChange} />
              ))}
              {stageJobs.length === 0 && (
                <p className="rounded border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                  Nenhuma vaga
                </p>
              )}
            </StageColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeJob && <PipelineCard job={activeJob} onStageChange={onStageChange} />}
      </DragOverlay>
    </DndContext>
  );
}

function StageColumn({
  stage,
  count,
  children,
}: {
  stage: PipelineJobStage;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`w-56 shrink-0 space-y-2 rounded-lg p-1 transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[12px] font-semibold">{STAGE_LABELS[stage]}</p>
        <span className="font-mono text-[11px] text-muted-foreground">{count}</span>
      </div>
      <div className="min-h-16 space-y-2">{children}</div>
    </div>
  );
}
