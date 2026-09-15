"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyButton({ text, label = "Copiar", className, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — falha silenciosa, sem crash
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={handleCopy}
      disabled={disabled}
      className={cn("gap-1.5", className)}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-success" aria-hidden="true" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  );
}
