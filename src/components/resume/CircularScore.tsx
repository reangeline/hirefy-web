function scoreColorClass(value: number): string {
  if (value >= 70) return "stroke-success";
  if (value >= 40) return "stroke-warning";
  return "stroke-destructive";
}

/** Anel de progresso circular pro score de match — usado na aba ATS Match (spec de
 * refinamento visual, inspirado num relatório de scanner de currículo de referência). */
export function CircularScore({ value, size = 128 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${scoreColorClass(pct)} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tabular-nums">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
