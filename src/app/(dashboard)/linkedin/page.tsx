"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { LinkedInScanUpload } from "@/components/linkedin/LinkedInScanUpload";
import { LinkedInScanReport } from "@/components/linkedin/LinkedInScanReport";
import { ApiError, apiFetchJson } from "@/lib/api/client";
import type { LinkedInScan } from "@/types/linkedin";

export default function LinkedInScanPage() {
  const [scan, setScan] = useState<LinkedInScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);

  useEffect(() => {
    apiFetchJson<LinkedInScan>("/api/linkedin-scan")
      .then((s) => setScan(s))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setScan(null); // nunca escaneou — estado normal, não é erro
        } else {
          setError(err instanceof Error ? err.message : "Falha ao carregar o scan.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="LinkedIn" />
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">LinkedIn Scan Report</h1>
          <p className="text-sm text-muted-foreground">
            Audite seu perfil do LinkedIn contra boas práticas de recrutadores.
          </p>
        </div>

        {loading && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && (!scan || rescanning) && (
          <LinkedInScanUpload
            onScanned={(s) => {
              setScan(s);
              setRescanning(false);
            }}
          />
        )}

        {!loading && !error && scan && !rescanning && (
          <LinkedInScanReport scan={scan} onRescan={() => setRescanning(true)} />
        )}
      </div>
    </>
  );
}
