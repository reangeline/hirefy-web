import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold">Hirefy</h1>
      <p className="max-w-md text-muted-foreground">
        Otimize seu currículo com IA para passar em ATS.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Entrar
        </Link>
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Criar conta
        </Link>
      </div>
    </div>
  );
}
