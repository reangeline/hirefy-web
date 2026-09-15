# Log — Spec 020: Redesign visual completo (DESIGN.md "Steep") — Fase 1

## Data
2026-09-15

## O que foi implementado (Fase 1 — fundação)
- `globals.css`: tokens remapeados (Ink Black/Paper White/Mist Gray + pêssego isolado),
  `.dark`/`@custom-variant dark` removidos, radius nomeados novos (`--radius-cards`,
  `--radius-buttons`, `--radius-inputs`, `--radius-images`), `--font-heading` repontado pra
  `--font-signifier` (Source Serif 4).
- `layout.tsx`: adiciona Source Serif 4 via `next/font/google`, remove `ThemeProvider` e
  `suppressHydrationWarning`.
- Dark mode removido por completo: `theme-provider.tsx`/`theme-toggle.tsx` apagados,
  `<ThemeToggle />` removido de `Topbar.tsx` e `MarketingNavbar.tsx`,
  `npm uninstall next-themes`.
- 11 primitivos de UI ajustados: `button.tsx` (pílula em todos os tamanhos, removidas
  classes `dark:` mortas), `card.tsx` (24px + `rounded-images` nas imagens internas),
  `tabs.tsx` (removido `shadow-sm` do tab ativo — regra "sem sombra em conteúdo"),
  `input.tsx`/`select.tsx`/`textarea.tsx` (16px), `badge.tsx` (pílula completa,
  `rounded-4xl` → `rounded-full`). `label.tsx`/`separator.tsx`/`collapsible.tsx`/
  `copy-button.tsx` não precisaram de mudança (sem radius/cor hardcoded).
- `Sidebar.tsx`: normalizado radius do nav link (era `rounded` sem token, 4px) pra
  `rounded-lg`.

## Decisões tomadas durante a execução (documentadas no spec.md)
- Pêssego (`--color-blush`) criado como token isolado, **não** cabeado em `--accent` —
  decisão deliberada pra não violar a própria regra do DESIGN.md ("no máximo 1 por
  página"). Sem consumidor ainda.
- `--border`/`--input` usam `#ececec` — valor citado literalmente no componente
  Input/Composer do próprio DESIGN.md, não estava na tabela de cores principal.
- Cor de status (`--destructive`/`--success`/`--warning`) mantida como estava — DESIGN.md
  não cobre isso, e cor semântica fica separada da marca por princípio.
- `Source Serif 4` no lugar de Signifier, `Inter` mantido no lugar de Sohne — ambos
  substitutos citados no próprio DESIGN.md, disponíveis no Google Fonts (único host de
  fonte externo liberado pro projeto).

## Divergências entre planejado e executado
Nenhuma de fundo. O plano já previa que a Fase 1 não cobriria as 68 telas inteiras — só a
fundação (tokens + primitivos + shell).

## Teste ao vivo (dev)
- **Login** (`/login`): card cinza-claro (Mist Gray), título "Entrar" em Source Serif 4,
  inputs e botão em pílula, botão preenchido preto sólido — confirma que o mapeamento de
  token + fonte + radius está propagando corretamente.
- **Home** (`/`): badge "Otimização de currículo com IA" em pílula completa, botões CTA em
  pílula preta, sem toggle de tema na navbar — confirma remoção do dark mode e herança dos
  primitivos corrigidos. Headline ainda em sans-bold (não serifa) porque `Hero.tsx` não usa
  `font-heading`/`CardTitle` — esperado, fica pra Fase 2 (reestruturação de conteúdo de
  marketing, fora do escopo desta spec).
- **Dashboard/Currículos/Pipeline/LinkedIn**: **não verificados ao vivo** — a sessão da
  conta de teste expirou durante a sessão e não há credencial salva (corretamente, por
  segurança). Pendente do usuário logar e conferir visualmente antes de considerar a Fase 1
  100% fechada.
- `tsc --noEmit`, `eslint`, `npm run build` — todos limpos.

## Pendências
- Confirmar visualmente a área logada (Dashboard, Currículos, Pipeline, LinkedIn) — pedir
  pro usuário conferir com a própria sessão.
- Fases 2-7 (marketing, auth, dashboard, currículo, pipeline, LinkedIn) — documentadas no
  plano aprovado, não implementadas nesta spec. Cada uma deve ser sua própria passada.
