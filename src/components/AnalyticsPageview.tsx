"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalyticsIfConsented, trackPageview } from "@/lib/analytics";

export function AnalyticsPageview() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageviewInner />
    </Suspense>
  );
}

function AnalyticsPageviewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reinicializa em visitas de retorno com consentimento já salvo (initAnalyticsIfConsented
    // é idempotente — não faz nada se já rodou ou se não há consentimento).
    initAnalyticsIfConsented();
    const query = searchParams.toString();
    trackPageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
