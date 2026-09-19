"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { AlertCircle, Loader2, ScanSearch, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetchJson } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import type { LinkedInScan } from "@/types/linkedin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — mesmo limite do backend

interface LinkedInScanUploadProps {
  onScanned: (scan: LinkedInScan) => void;
}

// Upload do PDF exportado do próprio perfil do LinkedIn ("Salvar em PDF", recurso nativo do
// LinkedIn) — a IA audita o texto contra um checklist fixo. Mesmo padrão visual de
// PdfImportUpload.tsx, mas sem formulário de revisão depois (aqui é só relatório de leitura,
// spec 015).
export function LinkedInScanUpload({ onScanned }: LinkedInScanUploadProps) {
  const t = useTranslations("LinkedIn");
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(selected: File | null) {
    setError(null);
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError(t("scanUpload.fileTooLarge"));
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    trackEvent("linkedin_scan_started");

    try {
      const formData = new FormData();
      formData.set("file", file);

      const scan = await apiFetchJson<LinkedInScan>("/api/linkedin-scan", {
        method: "POST",
        body: formData,
      });
      trackEvent("linkedin_scan_completed");
      onScanned(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scanUpload.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <ScanSearch className="size-6 text-primary" aria-hidden="true" />
        </div>

        <div>
          <p className="font-medium">{t("scanUpload.heading")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {t.rich("scanUpload.instructions", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          {file ? file.name : t("scanUpload.chooseFile")}
        </Button>

        {error && (
          <p role="alert" aria-live="polite" className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <Button type="button" disabled={!file || uploading} onClick={handleUpload} className="gap-2">
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("scanUpload.analyzing")}
            </>
          ) : (
            <>
              <Upload className="size-4" aria-hidden="true" />
              {t("scanUpload.analyzeProfile")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
