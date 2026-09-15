"use client";

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import type { LinkedInPostTopic } from "@/types/linkedin";

interface DraftState {
  status: "idle" | "loading" | "done" | "error";
  text: string;
  error?: string;
}

interface LinkedInPostTopicsProps {
  topics: LinkedInPostTopic[];
  resumeId: string;
}

// Lista de temas sugeridos (spec 018) — cada card gera um rascunho de post sob demanda,
// mantido só no estado local (não persiste no backend).
export function LinkedInPostTopics({ topics, resumeId }: LinkedInPostTopicsProps) {
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});

  async function handleDraft(i: number, topic: LinkedInPostTopic) {
    setDrafts((prev) => ({ ...prev, [i]: { status: "loading", text: "" } }));

    try {
      const result = await apiFetchJson<{ post_text: string }>("/api/linkedin-post-topics/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId, title: topic.title, angle: topic.angle }),
      });
      trackEvent("linkedin_post_draft_generated");
      setDrafts((prev) => ({ ...prev, [i]: { status: "done", text: result.post_text } }));
    } catch (err) {
      setDrafts((prev) => ({
        ...prev,
        [i]: {
          status: "error",
          text: "",
          error: err instanceof Error ? err.message : "Não foi possível gerar o post.",
        },
      }));
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {topics.map((topic, i) => {
        const draft = drafts[i];
        return (
          <Card key={i}>
            <CardContent className="space-y-3 py-5">
              <div>
                <p className="font-medium">{topic.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{topic.angle}</p>
              </div>

              {(!draft || draft.status === "idle") && (
                <Button type="button" variant="outline" size="sm" onClick={() => handleDraft(i, topic)} className="gap-1.5">
                  <PenLine className="size-3.5" aria-hidden="true" />
                  Gerar post
                </Button>
              )}

              {draft?.status === "loading" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Escrevendo o post…
                </div>
              )}

              {draft?.status === "error" && (
                <div className="space-y-2">
                  <p role="alert" className="text-sm text-destructive">
                    {draft.error}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleDraft(i, topic)}>
                    Tentar de novo
                  </Button>
                </div>
              )}

              {draft?.status === "done" && (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <p className="whitespace-pre-line text-sm">{draft.text}</p>
                  <div className="flex gap-2">
                    <CopyButton text={draft.text} />
                    <Button type="button" variant="ghost" size="xs" onClick={() => handleDraft(i, topic)}>
                      Gerar outra versão
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
