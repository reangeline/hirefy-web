"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  /** Deslocamento vertical máximo, em px, quando o elemento está no topo/fundo da tela. */
  strength?: number;
}

/** Desloca o conteúdo levemente conforme ele passa pelo centro da viewport — profundidade
 * sutil que dá sensação de movimento contínuo ao rolar, sem framework de scroll (só
 * `getBoundingClientRect` + rAF). Desliga sob `prefers-reduced-motion`. */
export function ParallaxCard({ children, className, strength = 24 }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    function update() {
      rafId = 0;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elCenter = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (elCenter - viewportCenter) / viewportCenter));
      setOffset(progress * strength);
    }

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, strength]);

  return (
    <div ref={ref} className={className} style={{ transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
}
