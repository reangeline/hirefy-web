# Spec 003: Identidade visual (paleta do mobile + home estilo landing)

## Objetivo
Alinhar o visual do web-app ao resto do produto: mesma paleta de cores do app mobile
(`applywise_app`), e uma home page (`/`) no estilo de uma landing page real (referência de
layout: [ramp.com](https://ramp.com); referência de conteúdo/seções: `hirefy_lading`), em vez
da home genérica que existia antes. Pedido feito depois do usuário comparar as telas de auth
com o app mobile e notar que as cores não batiam e a home estava simples demais.

## Requisitos

### Paleta de cores
Extraída de `applywise_app/lib/config/theme.dart` (`AppTheme.lightTheme`/`darkTheme`) —
mesma paleta já usada no app mobile e na landing (`hirefy_lading/app/globals.css`):
- Primary: teal `#0D9488` (light) / `#14B8A6` (accent mais claro)
- Secondary: indigo `#6366F1` (usado como tom de `accent` nos tokens shadcn, não como botão
  secundário — ver decisão abaixo)
- Texto: `#111827` (primário) / `#6B7280` (secundário) — light mode
- Dark mode: bg `#0F1117`, card `#222535`, texto `#F9FAFB`/`#9CA3AF`, borda `#2D3144`
- Fonte: Inter (mesma do mobile e da landing) — trocado de Geist (boilerplate do
  `create-next-app`) pra Inter em `src/app/layout.tsx`
- `--radius` ajustado de `0.625rem` pra `0.75rem` — o token `--radius-lg` (usado nos botões
  shadcn) passa a bater com o `buttonRadius: 12` do mobile, e `--radius-xl` (cards) fica bem
  próximo do `cardRadius: 16` do mobile

Implementado em `src/app/globals.css` (tokens `:root`/`.dark`, mesma estrutura shadcn de
antes, só os valores mudaram) — nenhum componente shadcn precisou ser tocado, porque todos já
consomem os tokens semânticos (`--primary`, `--background`, etc).

**Decisão de mapeamento:** o mobile usa 3 cores de marca (primary teal, secondary indigo,
accent purple) de forma esparsa. Pra não gerar uma UI "carnaval" na web, mapeei: `primary` =
teal (cor de ação, igual ao mobile), `accent` = tom claro de indigo (hover/highlight sutil),
`secondary` = cinza neutro padrão do shadcn (mantido, não é uma cor de marca no mobile
também — lá `secondaryColor` quase não aparece na UI visível).

### Home page (`/`) estilo landing
Reescrita completa de `src/app/page.tsx`, agora composta de seções em
`src/components/marketing/`:
- `MarketingNavbar` — logo, links âncora (`#recursos`, `#como-funciona`), Entrar/Criar conta
- `Hero` — headline + subheadline + CTA + faixa de estatísticas (10.000+ candidatos, 3x mais
  entrevistas, 89% aprovação ATS — mesmos números da landing)
- `Problem` — 4 cards de problema (currículo rejeitado, formatação, currículo genérico, sem
  controle de candidaturas) + callout "98% das Fortune 500 usam ATS"
- `Features` — 3 categorias (Currículo & ATS, Pipeline de candidaturas, Analytics), copy
  baseada nos recursos reais do produto (`hirefy_lading/components/Features.tsx`: score de
  ATS, otimização por vaga, gerador de LinkedIn, Kanban, coach de IA, analytics)
- `HowItWorks` — 3 passos (upload → otimizar → acompanhar)
- `CTASection` — banner final de conversão
- `MarketingFooter` — footer escuro (`bg-foreground`), logo, copyright, links legais
  apontando pra `hirefy.careers` (o web-app não tem páginas próprias de privacidade/termos)

**Diferenças deliberadas em relação à `hirefy_lading` e a "copiar o Ramp":**
- Sem `framer-motion` — a landing usa animação pesada (blobs flutuantes, spring, parallax);
  optei por zero dependência nova e um visual mais estático/confiante, que é também mais
  parecido com o Ramp (que anima pouco) do que com a landing atual (que anima bastante)
- Não copiei a paleta do Ramp (preto/verde-limão) — só a estrutura/confiança do layout
  (tipografia grande e bold, grid limpo, seções alternando `bg-background`/`bg-muted`,
  números grandes como prova social, cards com borda fina em vez de sombra pesada). As cores
  continuam sendo as do Hirefy (teal/indigo)
- Copy traduzida e condensada pro português, consistente com o resto do web-app (todas as
  telas de auth já estão em pt-BR)
- Footer não replica todos os links fictícios da landing (Blog, Careers, Press Kit, API Docs
  não existem como páginas — eram links `href="#"` mortos na landing). Mantive só o que é
  real: home, legal (linkando pra `hirefy.careers`), contato

### Toggle de tema
- `next-themes` (`ThemeProvider` em `src/components/theme-provider.tsx`, envolvendo `children`
  em `layout.tsx` com `attribute="class"` — mesma convenção `.dark` que o `globals.css` já usa)
- `src/components/theme-toggle.tsx` — botão sol/lua (shadcn `Button` variant ghost), alterna
  entre light/dark explicitamente a partir do `resolvedTheme` atual
- `defaultTheme="system"`: sem escolha salva, segue o SO do usuário
- Escolha persiste em `localStorage` (comportamento padrão do `next-themes`)
- Presente no `MarketingNavbar` (home) e no header do `/dashboard`; não adicionado nas telas
  de auth (login/signup/etc) — telas transitórias, escolha pode ser feita a partir da home ou
  do dashboard

## Fora de escopo
- Testimonials, Pricing, FAQ (existem na `hirefy_lading` mas não fazem sentido na home do
  app — pricing/FAQ de produto pago é conversa pra quando o billing web existir)
- Restyle do `/dashboard` (área logada) além do toggle de tema — só a home pública e as telas
  de auth (que já usavam shadcn desde a spec 001) foram tocadas aqui

## Critérios de aceite
- [x] Cores do web-app (light) batem com `AppTheme.lightTheme` do mobile — validado
  visualmente via screenshot (teal `#0D9488` no botão primário, faixa de stats, etc)
- [x] Fonte trocada pra Inter, igual mobile/landing
- [x] Home page (`/`) tem estrutura de landing (nav, hero, problema, recursos, como
  funciona, CTA, footer) em vez da home genérica anterior
- [x] Build, lint e type-check passam limpos
- [x] Dark mode testado visualmente ao vivo (Chrome) — cores corretas, toggle alterna e
  persiste depois de recarregar a página
- [x] Toggle de tema funcional no navbar da home e no dashboard, detecta preferência do SO
  por padrão (`defaultTheme="system"`)
- [ ] Paleta não foi validada com o usuário/design antes de implementar (implementação
  direta a partir do `theme.dart`, sem mockup prévio) — pode precisar de ajuste fino depois
  de review visual
