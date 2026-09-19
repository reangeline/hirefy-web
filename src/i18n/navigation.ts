import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Link/useRouter/redirect tipados que preservam o idioma atual ao navegar — usar no lugar de
// next/link e next/navigation em qualquer componente que precise trocar de rota (spec 021).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
