"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parsedPdfToFormData, type ManualResumeRequest, type ParsedPdfResult } from "@/types/resume";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — mesmo limite do backend (ParsePDFResume)

interface PdfImportUploadProps {
  onParsed: (data: ManualResumeRequest) => void;
  /** Chamado quando o upload de fato começa (antes da resposta) — só pra analytics do
   * funil (spec 020), opcional pra não forçar todo chamador a se importar com isso. */
  onUploadStart?: () => void;
}

// POST /resumes/parse-pdf é rota pública no backend (sem sessão) — chamamos o proxy direto
// via fetch, sem passar pelo apiFetchJson (que existe pra rotas autenticadas com refresh em
// 401, que não se aplica aqui). Ver .spec/002-resume-optimization/spec.md.
export function PdfImportUpload({ onParsed, onUploadStart }: PdfImportUploadProps) {
  const t = useTranslations("Resume");
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(selected: File | null) {
    setError(null);
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError(t("pdfImport.fileTooLarge"));
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/resumes/parse-pdf", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message ?? body.error ?? t("pdfImport.parseError"));
      }

      const result = body as ParsedPdfResult;
      onParsed(parsedPdfToFormData(result.parsed_data));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pdfImport.parseError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <FileUp className="size-6 text-primary" aria-hidden="true" />
        </div>

        <div>
          <p className="font-medium">{t("pdfImport.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pdfImport.description")}
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
          {file ? file.name : t("pdfImport.chooseFile")}
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
              {t("pdfImport.analyzing")}
            </>
          ) : (
            <>
              <Upload className="size-4" aria-hidden="true" />
              {t("pdfImport.analyze")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
