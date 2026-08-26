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

## Addendum — validação da paleta com auditoria exata (2026-08-25)

A pedido do usuário ("revisar a paleta com o design"), tentei primeiro rodar o mobile ao vivo
pra comparação lado a lado. Dois caminhos, dois bloqueios pré-existentes não relacionados:

1. `flutter run -d chrome` — crasha na inicialização com `DartError: Unsupported operation:
   DefaultFirebaseOptions have not been configured for web`. `firebase_options.dart` não tem
   caso `web` no `switch`/`if` de `currentPlatform`
2. `flutter run` no iOS Simulator (via `flutter emulators --launch apple_ios_simulator`) —
   falha no build do Xcode: `Target Integrity: The package product 'home-widget' requires
   minimum platform version 14.0 for the iOS platform, but this target supports 13.0`

Não toquei em nenhum dos dois (mudança de config do app mobile, fora de escopo daqui).
Também não há screenshots reais do app em lugar nenhum do monorepo (procurei em
`applywise_app` e `hirefy_lading` — só assets de ícone/launch e artefatos de build de
pacotes de terceiros).

Pivotei pra uma auditoria matemática: escrevi um script Python com a fórmula padrão OKLCH↔sRGB
(conversão em ambas as direções) e comparei cada token de `globals.css` contra o hex real do
`theme.dart`. A maioria dos 16 tokens comparados bate por 1-3 pontos de RGB — arredondamento
inevitável de quando os valores foram escolhidos "de olho" na spec original, sem impacto
visual real. Três tokens tinham erro real e visível: `--primary` (teal, a cor mais usada em
todo o app — `#278D88` em vez de `#0D9488`), `--success` (`#00AB78` em vez de `#10B981`), e
`--ring` do dark mode (`#37A69A` em vez de `#14B8A6`).

Corrigido calculando os valores OKLCH exatos via conversão inversa (sRGB→OKLab), confirmados
por round-trip antes de aplicar. Testado ao vivo no Chrome (light e dark mode): teal
visivelmente mais escuro/saturado, batendo com o valor real do mobile.
`tsc --noEmit`/`build` limpos.

Com isso, a única pendência da spec 003 (validação da paleta) está fechada.
