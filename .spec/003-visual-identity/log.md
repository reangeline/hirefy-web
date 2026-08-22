# Log — Spec 003: Identidade visual

**Data:** 2026-08-22

## O que foi implementado

- `src/app/globals.css` — tokens de cor (`:root`/`.dark`) trocados pra paleta teal/indigo do
  `applywise_app/lib/config/theme.dart`, `--radius` de `0.625rem` pra `0.75rem`, `--font-sans`
  apontando pra Inter (antes tinha uma referência circular quebrada, `--font-sans: var(--font-sans)`,
  resquício do `shadcn init`)
- `src/app/layout.tsx` — fonte trocada de Geist pra Inter; `lang="en"` → `lang="pt-BR"`
  (todo o conteúdo já é português)
- `src/app/page.tsx` + `src/components/marketing/*` — home reescrita como landing (Navbar,
  Hero, Problem, Features, HowItWorks, CTASection, MarketingFooter)

## Decisões tomadas durante a execução (não explícitas no pedido original)

1. **Mapeamento de 3 cores de marca pra 2 slots shadcn** (`primary`=teal, `accent`=indigo
   claro, `secondary` ficou neutro) — decisão registrada em detalhe no `spec.md`, pra não
   repetir o raciocínio se alguém questionar por que o purple/`accentColor` do mobile não
   apareceu em lugar nenhum (decidi não usá-lo — três cores de marca simultâneas na web
   ficaria poluído, o mobile também usa o purple muito pouco)
2. **Sem framer-motion** — a landing de referência (`hirefy_lading`) e o "modelo" citado
   (ramp.com) usam animação de formas bem diferentes (a landing é bem mais animada que o
   Ramp). Optei por não adicionar a dependência e ficar com um visual mais estático,
   mais alinhado ao Ramp (que é a referência de estilo pedida) do que à landing (que é só
   referência de conteúdo/seções)
3. **Ícone do LinkedIn não existe na versão do `lucide-react` instalada** (`^1.33.0`) — usei
   `Share2` no lugar pro card de "Gerador de perfil LinkedIn"
4. **Footer sem links fictícios** — a landing tem colunas inteiras de links `href="#"`
   (Blog, Careers, Press Kit, API Docs) que não levam a lugar nenhum. Não replicados.

## Addendum — toggle de tema (2026-08-22, mesmo dia, a pedido do usuário)

- Instalado `next-themes` (única dependência nova)
- `src/components/theme-provider.tsx` — wrapper client component do `ThemeProvider`
- `src/components/theme-toggle.tsx` — botão sol/lua; usa `useSyncExternalStore` (não
  `useEffect` + `setState`) pra evitar mismatch de hidratação sem violar a regra de lint
  `react-hooks/set-state-in-effect` (nova no eslint-config-next instalado, tratada como erro)
- `layout.tsx` — `suppressHydrationWarning` no `<html>` (esperado com `next-themes`, o script
  deles seta a classe antes da hidratação) + `ThemeProvider attribute="class" defaultTheme="system"`
- Adicionado no `MarketingNavbar` e no header do `/dashboard`

Testado ao vivo: tema seguiu o SO por padrão (estava em dark), toggle mudou pra light, reload
manteve light (persistido em localStorage pelo próprio `next-themes`).

## Validação

- `tsc --noEmit`, `npm run lint`, `npm run build` — todos limpos
- Verificação visual real via Chrome (Claude in Chrome): home completa (hero → stats →
  problema → recursos → CTA → footer) e tela de login com os botões sociais já estilizados
  com a nova paleta — conferido, bate com o teal do mobile

## Divergências / pendências

- Dark mode não foi verificado visualmente (só que o CSS compila) — falta testar com a
  classe `.dark` aplicada de verdade
- Paleta implementada direto do `theme.dart`, sem validação prévia com o usuário antes de
  construir — se não bater com a expectativa, é um ajuste de valores nos tokens do
  `globals.css`, não uma reestruturação
