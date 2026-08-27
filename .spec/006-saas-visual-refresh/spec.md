# Spec 006: Refresh visual — de "app" pra SaaS (estilo Stripe/Vercel)

## Objetivo
O usuário revisou o visual atual (herdado quase 1:1 da spec 003 — paleta e proporções do
`applywise_app`) e achou que a área logada parece demais um app mobile portado pra web: cards
soltos com sombra suave, raio de borda muito arredondado (12-16px), tudo centralizado,
densidade de informação baixa. Pediu uma direção mais "SaaS" — referência escolhida:
Stripe Dashboard / Vercel (técnico-elegante, denso, dark mode como cidadão de primeira
classe, dados em tipografia monoespaçada).

Mockup de referência aprovado pelo usuário: `https://claude.ai/code/artifact/db568622-5d49-40a7-973a-e30ec8874274`
(HTML estático, sem dados reais — serve de alvo visual, não de código a copiar literalmente).

## Escopo
- **Área logada inteira** (dashboard, currículos, pipeline) — prioridade, é onde a sensação
  de "app" mais aparece
- **Telas de auth** (login/signup/forgot-password) — mesma paleta/densidade nova, mas sem a
  sidebar (usuário ainda não está autenticado, não faz sentido)
- **Home/landing** (`/`) — ajuste de densidade/tipografia pra ficar coerente com o resto;
  não é uma reescrita do zero (já seguia referência Ramp desde a spec 003)

## Direção visual (tokens novos)

### Cor
Mantém o teal da marca (`#0D9488` light / `#14B8A6`~`#2DD4BF` dark) como único acento —
não é uma mudança de marca, é uma mudança de como e onde a cor aparece: reservada pra ação
primária, item de nav ativo, foco e links. Estados semânticos (sucesso/aviso/erro) ganham
famílias de matiz **separadas** do teal, pra não competir com o acento da marca:
- Sucesso: `#1A9A5C` light / `#3DDC84` dark
- Aviso: `#B7791F` light / `#E3A527` dark
- Erro: `#D5324B` light / `#F0576B` dark

Neutros mais frios e com viés discreto de matiz (não cinza puro):
- Light: bg `#FAF9F7`, surface `#FFFFFF`, surface-raised `#F4F3F0`, border `#E6E4DF`
- Dark: bg `#0A0C0F`, surface `#101317`, surface-raised `#171B20`, border `#23272D`

### Tipografia
Mantém **Inter** pra UI/headings (já é o padrão dos 3 produtos, não faz sentido trocar).
Adiciona **IBM Plex Mono** só pra dados: créditos, score de ATS, contadores, datas, qualquer
coluna de número — é o principal sinal visual de "ferramenta técnica" vs. "app de consumo".
Escala de tipo mais compacta que a atual (~13.5px base em vez do padrão mais generoso atual).

### Raio e bordas
`--radius` cai de `0.75rem` pra algo como `0.375rem` (6px) — cantos quase retos, não
arredondados. Sombra suave dá lugar a borda de 1px (hairline) como separador principal entre
elementos.

### Layout da área logada
Shell fixo: sidebar esquerda (~224px, logo + nav + card de plano/créditos fixado embaixo) +
barra superior (breadcrumb/título da página, busca, toggle de tema, avatar). Conteúdo
principal usa densidade maior — tiles de métrica compactos, board do pipeline com colunas
mais estreitas e cards menores, currículos como lista densa em vez de cards grandes
espaçados.

## Requisitos

### Tokens (`src/app/globals.css`)
- Reescrever `:root`/`.dark` com os valores acima (light e dark, os dois — não é dark-only)
- `--radius` reduzido
- Cores `--success`/`--warning`/`--destructive` recalculadas pras famílias novas
- Adicionar `--font-mono` real (`IBM Plex Mono`, carregado via `next/font/google` em
  `layout.tsx`, mesmo padrão do Inter atual)

### Shell da área logada (novo)
- `src/app/(dashboard)/layout.tsx` — não existe hoje (cada página monta seu próprio
  cabeçalho solto); criar layout compartilhado com `Sidebar` + `Topbar`
- `src/components/layout/Sidebar.tsx` — nav (Dashboard/Currículos/Pipeline), card de
  plano/créditos (reaproveita dado de `SubscriptionCard`, só muda a casca visual)
- `src/components/layout/Topbar.tsx` — título da página (ou breadcrumb simples), toggle de
  tema (`ThemeToggle` já existe, só reposiciona), avatar/logout
- Remover o cabeçalho solto duplicado que hoje existe dentro de `dashboard/page.tsx`
  (`ThemeToggle`+`LogoutButton` soltos no topo) — isso passa a viver no `Topbar`

### Páginas a migrar pro novo shell
`dashboard/page.tsx`, `resume/page.tsx` + subpáginas, `pipeline/*` — todas ganham o shell
automaticamente ao ficarem dentro do `layout.tsx` novo; o trabalho real é ajustar cada uma
pra não duplicar padding/largura que o shell já resolve, e restilizar componentes que usam
sombra/raio grande demais pro padrão novo (`PipelineCard`, `PipelineBoard`, `ResumeCard`,
`Card`/`Badge` do shadcn on ajustados via token, não precisam reescrita se só dependem de
`--radius`/`--border`)

### Auth (`(auth)/login`, `/signup`, `/forgot-password`)
Mesma paleta/densidade nova, layout continua centralizado (sem sidebar) — só ajuste visual,
não de fluxo.

### Landing (`/`)
Ajuste de densidade/raio/cor pra ficar coerente — não é reescrita de estrutura (seções
continuam as mesmas da spec 003).

## Fora de escopo
- Mudar a cor de marca (teal continua sendo o acento)
- Mudar fluxo/IA de qualquer tela (isso é só visual)
- Dark mode novo em telas que não tinham antes (todas já suportavam via `next-themes`)

## Critérios de aceite
- [x] `globals.css` com os tokens novos (light + dark), build/lint/type-check limpos
- [x] Shell (sidebar + topbar) implementado e aplicado a toda a área logada
- [x] Pipeline (board) e Currículos (lista) com densidade/raio/borda batendo com o mockup de
  referência
- [x] Auth com a paleta/densidade nova, sem sidebar — herdou os tokens automaticamente, sem
  precisar de nenhum ajuste manual de componente
- [x] Landing ajustada, sem quebrar a estrutura de seções existente — mesma situação: herdou
  os tokens (raio, cor, neutros) sem precisar reescrever nenhuma seção
- [x] Testado ao vivo (Chrome, conta de teste): navegação entre todas as páginas da área
  logada com o shell novo, light e dark mode — incluindo criar/ver/excluir uma vaga de teste
  pra validar o `PipelineCard` restilizado de verdade, não só telas vazias
