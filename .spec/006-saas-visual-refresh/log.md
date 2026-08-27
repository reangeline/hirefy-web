# Log — Spec 006: Refresh visual "SaaS"

**Data:** 2026-08-26

## Como surgiu

O usuário revisou o visual da spec 003 (herdado quase 1:1 do app mobile) e achou que a área
logada parecia demais um app de consumo portado pra web. Pediu uma direção mais "SaaS",
citando Stripe/Vercel como referência.

Antes de tocar em código, publiquei um mockup estático (Artifact) com a direção proposta —
sidebar shell, densidade maior, dados em monoespaçada — e o usuário aprovou ("ficou muito
bom") antes de qualquer implementação real.

## O que foi implementado

### Tokens (`src/app/globals.css`)
Reescrito `:root` e `.dark` com a paleta nova (neutros mais frios com leve viés de matiz,
não cinza puro; estados semânticos numa família de cor separada do teal da marca).
`--radius` caiu de `0.75rem` pra `0.375rem`. **Achado corrigido de passagem:** `--ring` no
modo claro ainda usava o valor pré-correção da spec 003 (`oklch(0.585 0.09 190)`, renderiza
~`#278D88`) — só o `--primary` e o `--ring` do dark tinham sido corrigidos naquela spec;
agora os dois modos usam o teal certo (`#0D9488`).

### Fonte (`src/app/layout.tsx`)
Adicionado IBM Plex Mono via `next/font/google`, mesmo padrão do Inter já existente.
`--font-mono` no `globals.css` trocado de `ui-monospace, monospace` pra apontar pra fonte
real.

### Shell novo (não existia)
`src/components/layout/Sidebar.tsx` e `Topbar.tsx` novos, `src/app/(dashboard)/layout.tsx`
novo (não existia nenhum layout compartilhado pra esse grupo de rotas — cada página montava
seu próprio wrapper solto). `SubscriptionCard` ganhou um prop `size="sm"` pra caber
compacto no rodapé da sidebar, reaproveitando a mesma lógica de fetch — sem duplicar
chamada de API.

Todas as 9 páginas da área logada (`dashboard`, `resume` + 4 subpáginas, `pipeline` + 2
subpáginas) migradas pro shell novo: removido o wrapper `mx-auto max-w-2xl px-4 py-12`
solto de cada uma, substituído por `<Topbar title="..."/>` + `<div className="p-6">`.
`ThemeToggle`/`LogoutButton`, que antes só existiam soltos no topo do `dashboard/page.tsx`,
agora vivem no `Topbar` (disponíveis em toda página da área logada, não só no dashboard).

**Decisão não estava no plano original, mas fez sentido no meio da implementação:**
removido o `SubscriptionCard` "grande" e o botão solto "Meus currículos" do conteúdo do
`dashboard/page.tsx` — ambos ficaram redundantes com a sidebar persistente (créditos já
aparecem no rodapé da sidebar, navegação pra currículos já existe no nav). Não é mudança de
fluxo/dado, só remoção de duplicação visual criada pela própria introdução do shell.

### Densidade dos componentes existentes
`PipelineCard`, `PipelineBoard`, `PipelineAnalyticsView`, `ResumeCard`: só ajuste de classes
Tailwind (padding menor, `size="sm"` nos `Card`, textos menores, `font-mono tabular-nums`
nos números) — confirmado antes de mexer que `Card`/`Button` do shadcn já são 100%
token-driven (`rounded-xl` deriva de `--radius`), então a redução do raio já se propagou
sozinha, sem precisar reescrever esses componentes de base.

### Auth e landing
**Nenhuma mudança de código precisou ser feita.** Testado ao vivo: login e a home já
herdam a paleta/raio/neutros novos automaticamente (são 100% tokens), sem parecer
inconsistente com o resto — confirma a expectativa do plano.

## Testado ao vivo

Chrome, conta de teste: dashboard (light + dark), criar uma vaga de teste real pra ver o
`PipelineCard`/board restilizados com dado de verdade (não só estado vazio), abrir o
detalhe da vaga, excluir a vaga de teste. Login e home em light mode. Build/lint/type-check
limpos o tempo todo.

## Não testado / pendências

- Não testado com currículos reais na lista (só o estado vazio) — baixo risco, é o mesmo
  `ResumeCard` só com classes ajustadas
- Analytics do pipeline com dados reais (só vi o estado vazio "adicione vagas") — mesma
  razão, baixo risco
