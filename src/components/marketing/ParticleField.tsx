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

const PARTICLE_COUNT = 46;

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
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.12,
        hue: Math.random() < 0.75 ? "cyan" : "white",
        alpha: 0.15 + Math.random() * 0.35,
      }));
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
        ctx!.fill();
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
