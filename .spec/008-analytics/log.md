# Log — Spec 008: Analytics de produto (GA4 + Mixpanel) + banner de cookies

**Data:** 2026-08-28

## O que foi implementado

### `web-app`
- `src/lib/analytics.ts` (novo): consentimento (`localStorage["hfy_cookie_consent"]` +
  emissor de eventos pra `useSyncExternalStore` reagir a mudanças na própria aba — o evento
  nativo `storage` só dispara em outras abas), init do GA4 (`gtag.js`) + Mixpanel
  (`mixpanel-browser`, import dinâmico), `trackEvent`, `trackPageview`, `identify`,
  `setUserProperty`.
- `src/components/CookieConsentBanner.tsx` (novo): banner fixo no rodapé, aceitar/recusar,
  usa `useSyncExternalStore` (não `useEffect`+`setState` — evita o erro do lint
  `react-hooks/set-state-in-effect`, mesmo padrão do `ThemeToggle`).
- `src/components/AnalyticsPageview.tsx` (novo): pageview do GA a cada mudança de rota
  (`usePathname`+`useSearchParams` dentro de `Suspense`, mesmo padrão da `LoginPage`).
- Ambos renderizados em `src/app/layout.tsx`.
- Eventos instrumentados: `signup_completed` (`signup/confirm/page.tsx`), `login_completed`
  (`login/page.tsx`), `resume_created` (`ResumeForm.tsx`, só `mode === "create"`),
  `resume_optimize_started`/`resume_optimize_completed` (`OptimizeForm.tsx`),
  `pipeline_job_added` (`AddJobQuickForm.tsx` e `AddJobOptimizeWizard.tsx`, com propriedade
  `method`), `upgrade_button_clicked`/`subscription_cancelled` (`SubscriptionCard.tsx`),
  `checkout_completed`/`checkout_cancelled` (`CheckoutStatusBanner.tsx`). `identify()` em
  `WelcomeHeader.tsx`, `setUserProperty("subscription_tier", ...)` em `SubscriptionCard.tsx`.
- `.env.local` / `.env.local.example`: `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
  `NEXT_PUBLIC_MIXPANEL_TOKEN`.

### `hirefy_lading`
- `lib/analytics.ts` (novo, mesmo design do web-app, sem `trackPageview`/`identify` — a
  landing é uma página só, `send_page_view: true` no config do GA já cobre o pageview único).
- `components/CookieConsentBanner.tsx` (novo, Tailwind puro — esse repo não tem shadcn/ui).
- `landing_cta_clicked` (com propriedade `label`) nos 4 CTAs existentes (`Hero.tsx` ×2,
  `CTA.tsx`, `Navbar.tsx` ×2 — desktop e mobile). `pricing_viewed` reaproveitando o
  `isInView` que o `Pricing.tsx` já calculava com `framer-motion` (`once: true`) — não
  precisou de `IntersectionObserver` novo, como o plano original previa.
- `.env.local` / `.env.local.example` (novos — repo não tinha nenhum `.env*`).
- `.gitignore` corrigido: `.env*` sem exceção pro `.env.local.example` — repo nunca versionava
  o template. Alinhado com o padrão já usado no `web-app`.
- `npm install mixpanel-browser` nos dois repos.

## Testado ao vivo (Chrome, servidores de dev locais)
Confirmado via inspeção de rede (POST 200 nas chamadas do Mixpanel, GET 200 do `gtag/js`):
banner aparece e bloqueia toda chamada de analytics até decisão; recusar não dispara nada;
aceitar inicializa GA4+Mixpanel imediatamente. `landing_cta_clicked`, `pricing_viewed`
(scroll até a seção), `pipeline_job_added` (vaga real criada), `checkout_cancelled`
(fluxo real: Fazer upgrade → Stripe Checkout → botão voltar → redirect `?checkout=cancelled`),
`setUserProperty("subscription_tier", ...)`. Os demais eventos seguem o mesmo padrão de
código já testado (`trackEvent` numa única linha, sempre depois da chamada de API ter
sucesso) — não recriados ao vivo pra evitar gastar crédito de IA real ou criar mais
assinaturas de teste no Stripe.

## Achados / divergências não previstas no plano original
1. **Servidor de dev com env var desatualizada**: o servidor `npm run dev` do `web-app`
   já estava rodando de antes desta spec — Next.js só lê `.env.local` na inicialização, então
   as duas variáveis novas ficaram `undefined` até eu reiniciar o processo. Sintoma: aceitar o
   banner não disparava nenhuma chamada de rede, sem erro nenhum (o código tratava
   `GA_ID`/`MIXPANEL_TOKEN` ausentes como "não configurado", silenciosamente). Resolvido
   reiniciando o servidor — não é bug de código, é um lembrete: sempre reiniciar `next dev`
   depois de editar `.env.local`.
2. **`pricing_viewed` não precisou de `IntersectionObserver` novo** — `Pricing.tsx` já tinha
   `useInView` do `framer-motion` com `once: true` pras animações de entrada; só reaproveitei
   esse mesmo estado num `useEffect`, mais simples que o previsto no plano.
3. **Achado fora de escopo, não corrigido**: a seção de preços da `hirefy_lading` mostra
   `$9.99/mo` (Pro Monthly) e `$79.99/ano`, mas o preço real configurado no Stripe (spec 007)
   é `US$19,99/mês` — a landing ainda reflete uma estrutura de preços antiga/diferente da que
   foi implementada. Não mexi nisso (fora do escopo de analytics), só registrando.
4. **Limitação conhecida, documentada nos critérios de aceite**: `identify()`/
   `setUserProperty` só disparam quando o componente que busca os dados relevantes
   (`WelcomeHeader`, `SubscriptionCard`) monta e o consentimento já está aceito. Se o usuário
   aceita o banner *depois* desses componentes já terem montado e buscado dados, a
   identificação correspondente só acontece na próxima navegação/remontagem, não
   imediatamente. Não corrigido nesta spec (exigiria um listener de consentimento mais
   elaborado nesses componentes) — impacto baixo, a maioria decide o consentimento antes de
   qualquer dado relevante carregar.
5. **`hirefy_lading` nunca teve ESLint configurado** — `npm run lint` pede configuração
   interativa na primeira vez. Não configurei (fora de escopo, não é regressão desta spec) —
   validação ficou só em `tsc --noEmit` + `build` (que já roda type-check) pra esse repo.

## Fora de escopo (confirmado com o usuário)
Cookies de marketing (Facebook Pixel/Google Ads/LinkedIn Insight Tag — a política promete,
registrado como achado de compliance separado, não implementado). Dashboard interno de
métricas de negócio (usa o dashboard nativo do Stripe). Mudanças no `AnalyticsService` do
mobile.
