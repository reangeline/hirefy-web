"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: "cyan" | "white";
  alpha: number;
}

const PARTICLE_COUNT = 90;

/** Campo de partículas flutuando devagar — implementação original e leve (canvas 2D puro,
 * sem lib), inspirada no espírito "orbe de dados bioluminescente" da referência trazida pelo
 * usuário, não uma cópia do efeito de nenhum site. Só aparece no tema escuro (a seção que
 * monta esse componente decide isso via CSS, `hidden dark:block`). Desliga a animação sob
 * `prefers-reduced-motion` — é decoração pura, nenhuma informação depende dela. */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let rafId = 0;

    function seedParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const isSignal = Math.random() < 0.12;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: isSignal ? 1.8 + Math.random() * 1.6 : 0.5 + Math.random() * 1.3,
          vx: (Math.random() - 0.5) * 0.14,
          vy: -0.06 - Math.random() * 0.16,
          hue: Math.random() < 0.75 ? "cyan" : "white",
          alpha: isSignal ? 0.5 + Math.random() * 0.4 : 0.12 + Math.random() * 0.3,
        };
      });
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle =
          p.hue === "cyan" ? `rgba(203, 255, 252, ${p.alpha})` : `rgba(255, 255, 255, ${p.alpha})`;
        ctx!.shadowColor = p.hue === "cyan" ? "rgba(203, 255, 252, 0.8)" : "rgba(255, 255, 255, 0.8)";
        ctx!.shadowBlur = p.r > 1.6 ? 6 : 0;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      draw(); // um frame estático — mostra o campo sem animar
    } else {
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="size-full" aria-hidden="true" />;
}
