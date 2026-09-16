"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Direction = "left" | "right" | "up" | "scale";

interface ConvergeOnScrollProps {
  children: ReactNode;
  className?: string;
  /** De que lado o conteúdo "nasce" antes de convergir pro lugar. */
  direction?: Direction;
  /** Distância inicial, em px (ignorado em direction="scale"). */
  distance?: number;
}

const DEFAULT_DISTANCE: Record<Direction, number> = {
  left: 90,
  right: 90,
  up: 50,
  scale: 0,
};

/** Ao contrário do `Reveal` (dispara uma vez via IntersectionObserver), este componente
 * acompanha a posição do elemento a cada scroll (rAF + getBoundingClientRect) — o conteúdo
 * nasce afastado do centro (esquerda/direita/baixo/menor) e converge suavemente conforme a
 * rolagem aproxima o elemento do centro da tela, e volta a se afastar se o usuário rolar pra
 * cima de novo. Desliga sob `prefers-reduced-motion` (mostra a posição final direto). */
export function ConvergeOnScroll({
  children,
  className,
  direction = "up",
  distance,
}: ConvergeOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const travel = distance ?? DEFAULT_DISTANCE[direction];

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

    function update() {
      rafId = 0;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh;
      const end = vh / 2 - rect.height / 2;
      const span = start - end;
      const next = span > 0 ? (start - rect.top) / span : 1;
      setProgress(Math.max(0, Math.min(1, next)));
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
  }, [reducedMotion]);

  const p = reducedMotion ? 1 : progress;
  const rest = 1 - p;
  const opacity = 0.15 + p * 0.85;
  const transform =
    direction === "left"
      ? `translateX(${-rest * travel}px)`
      : direction === "right"
        ? `translateX(${rest * travel}px)`
        : direction === "up"
          ? `translateY(${rest * travel}px)`
          : `scale(${0.82 + p * 0.18})`;

  return (
    <div ref={ref} className={className} style={{ opacity, transform }}>
      {children}
    </div>
  );
}
