# Spec 020: Redesign visual completo (DESIGN.md "Steep")

## Objetivo
Substituir a identidade visual atual (teal/indigo, extraída do app mobile na spec 003) pela
referência trazida pelo usuário em `web-app/DESIGN.md` — paleta quase monocromática (Ink
Black sobre Paper White) com um único acento pêssego reservado, tipografia serifada pra
título + sans pro corpo, botões em pílula, cards com 24px de raio, sombra quase inexistente.

## Decisões confirmadas com o usuário
- **Escopo**: site inteiro, incluindo a área logada — diverge do app mobile (que continua
  teal/indigo; a decisão é só do web-app).
- **Modo escuro**: removido por completo. Vira modo claro único.
- **Execução em fases**: 68 arquivos ao todo tocam a UI — não dá pra fazer numa passada só
  com segurança. Essa spec cobre só a **Fase 1 — fundação** (tokens + primitivos de UI +
  shell + remoção do dark mode). Fases 2-7 (marketing, auth, dashboard, currículo, pipeline,
  LinkedIn) ficam documentadas como próximos passos.

## Mapeamento de tokens (DESIGN.md → nomes existentes)

Decisão de arquitetura: não colar o bloco `@theme` do Quick Start do DESIGN.md direto (usa
nomes novos como `--color-ink-black`) — em vez disso, remapear os **valores** pros **nomes
de token que os componentes shadcn-style já consomem** (`--primary`, `--card`, `--border`),
pra nenhum componente downstream precisar mudar por causa da paleta.

| Token existente | Valor antes (teal, spec 003/006) | Valor novo (Steep) | Papel |
|---|---|---|---|
| `--background` | quase-branco | `#ffffff` Paper White | Canvas |
| `--foreground` | escuro neutro | `#17191c` Ink Black | Texto primário |
| `--card` | quase-branco | `#f2f2f3` Mist Gray | Fundo padrão de card |
| `--primary` | `#0D9488` teal | `#17191c` Ink Black | Ação primária, links, estado ativo |
| `--muted` | cinza neutro | `#fafafb` Fog White | Fundo secundário |
| `--accent` | cinza neutro | continua neutro (`#fafafb`) | Hover genérico — **não** virou pêssego |
| `--border`/`--input` | cinza | `#ececec` | Hairline, valor citado no próprio DESIGN.md |
| `--ring` | teal | `#17191c` Ink Black | Anel de foco |
| `--destructive`/`--success`/`--warning` | vermelho/verde/âmbar | mantidos como estavam | DESIGN.md não cobre cor de status |

**Pêssego (`#fbe1d1`) fica isolado**: token novo `--color-blush` criado, mas
deliberadamente não cabeado em `--accent` nem em nenhum componente — o próprio DESIGN.md diz
"at most once per page, treat it as a rare accent, not a background". Cabear ele em
`--accent` (usado hoje genericamente em hover states) faria ele aparecer dezenas de vezes na
tela, quebrando a própria regra do sistema. Fica reservado pra um uso pontual futuro (Fase
2+, um card de destaque específico).

**Fontes**: Signifier e Sohne (do DESIGN.md) são pagas. Usados os substitutos que o próprio
documento cita e que existem no Google Fonts: **Source Serif 4** no lugar de Signifier
(headings, via `--font-heading`/`--font-signifier`), **Inter mantido** no lugar de Sohne
(corpo — o próprio DESIGN.md cita Inter como substituto válido). IBM Plex Mono continua pros
números (ATS score etc.) — fora do escopo do DESIGN.md.

**Radius**: tokens nomeados novos (`--radius-cards: 24px`, `--radius-buttons: 9999px`,
`--radius-inputs: 16px`, `--radius-images: 12px`) adicionados ao lado da escala que já
existia — Button/Card não derivavam radius de `--radius` sozinho, precisavam de override
direto.

## Requisitos (Fase 1)
1. `globals.css` — tokens remapeados (tabela acima), remove `.dark`/`@custom-variant dark`.
2. `layout.tsx` — adiciona Source Serif 4, remove `ThemeProvider`/`suppressHydrationWarning`.
3. Remove `theme-provider.tsx`/`theme-toggle.tsx`, `<ThemeToggle />` de `Topbar.tsx` e
   `MarketingNavbar.tsx`, `npm uninstall next-themes`.
4. 11 primitivos de UI: `button.tsx` (pílula em todos os tamanhos), `card.tsx` (24px, +
   `rounded-images` nas imagens internas), `tabs.tsx` (remove `shadow-sm` do tab ativo),
   `input.tsx`/`select.tsx`/`textarea.tsx` (16px), `badge.tsx` (pílula completa). Também
   removidas classes `dark:` mortas de todos os arquivos tocados.
5. `Sidebar.tsx` — normaliza radius do nav link (era `rounded` sem token, 4px) pra
   `rounded-lg`.

## Fora de escopo (Fase 1)
- Reestruturar layout/composição de qualquer página.
- Cor de status (sucesso/erro/aviso).
- Fonte de dado tabular (IBM Plex Mono).
- Qualquer uso do pêssego — token existe, sem consumidor ainda.
- Fases 2-7 (marketing, auth, dashboard, currículo, pipeline, LinkedIn) — documentadas no
  plano, não implementadas nesta spec.

## Critérios de aceite
- [x] `tsc`/`eslint`/`npm run build` limpos
- [x] Nenhum resquício de dark mode (toggle sumiu dos dois lugares, sem erro de hidratação)
- [x] Botões em pílula, cards com 24px, sem sombra em conteúdo — confirmado ao vivo
  (Login, Home)
- [x] Texto legível (contraste ok) no novo `--card` cinza-claro com `--foreground` preto
- [x] Pêssego não aparece em lugar nenhum ainda (só token, sem uso)
- [ ] Testado ao vivo em dev: **Login e Home confirmados** (card cinza, botões pílula,
  título em serifa, sem toggle de tema). **Dashboard/Currículos/Pipeline/LinkedIn ainda não
  verificados** — sessão de teste expirou e não há credencial salva; pendente do usuário
  conferir e confirmar
