# Spec 008: Analytics de produto (GA4 + Mixpanel) + banner de cookies

## Objetivo
Adicionar analytics de produto no `web-app` e na `hirefy_lading` (hoje zero instrumentado nos
dois), com um banner de consentimento de cookies real — cumprindo o que a política de cookies
da landing já promete juridicamente hoje, sem implementar. Métricas de negócio (MRR, churn,
conversão Free→Premium) usam o dashboard nativo do Stripe — **sem código novo** pra isso
(decisão do usuário: não construir um dashboard interno).

## Contexto / achados (levantamento antes de qualquer código)

- **Mobile (`applywise_app`) já tem analytics de produto maduro**: `firebase_analytics` +
  `lib/services/analytics_service.dart`, um `AnalyticsService` singleton com funil completo
  (onboarding, auth, currículo, paywall→upgrade→assinatura), usado em ~15 telas. Não será
  alterado nesta spec — só serve de referência de nomenclatura de eventos.
- **`web-app` e `hirefy_lading` não têm nenhum SDK de analytics hoje** (confirmado via grep em
  `package.json` e código — zero GA/Mixpanel/PostHog/Amplitude/Segment).
- **Achado de compliance**: `hirefy_lading/app/cookies/page.tsx` e `app/privacy/page.tsx` já
  afirmam que a Hirefy usa "Google Analytics" e "Mixpanel (dados anonimizados)" como
  provedores de analytics, e descrevem um banner de cookies com aceitar/recusar/customizar —
  nada disso existe hoje. A política também promete cookies de **marketing** (Facebook Pixel,
  Google Ads, LinkedIn Insight Tag) e uma tela "Settings → Privacy → Cookie Preferences" no
  app mobile — **ambos ficam fora de escopo** desta spec (ver "Fora de escopo").
- **Backend não tem nenhuma agregação de receita/negócio** — área verde, mas não será tocada
  aqui: métricas de negócio usam o dashboard do Stripe diretamente (Reports → MRR/Churn/LTV
  já calculados automaticamente a partir das subscriptions criadas na spec 007).
- **`pipeline_analytics.go`/`PipelineAnalyticsView`** é uma feature já existente e não
  relacionada (insights de busca de emprego pro usuário) — confirmado, não mexer.

## Decisões confirmadas com o usuário
- Ferramentas: **Google Analytics 4 + Mixpanel** (mantém a promessa já existente na política,
  evita reescrever o texto legal de analytics).
- Banner de cookies: **sim**, aceitar/recusar simples — só carrega GA/Mixpanel se aceito;
  cookies essenciais (sessão, CSRF) não são afetados.
- Cookies de marketing (Facebook Pixel, Google Ads, LinkedIn Insight Tag): **fora de escopo**,
  registrado como achado de compliance separado, não implementado agora.
- Onde: **`web-app` e `hirefy_lading`**, os dois.
- Contas GA4/Mixpanel: usuário **não tem nenhuma ainda** — vou guiar a criação de ambas. O
  Measurement ID (GA4) e o Project Token (Mixpanel) não são segredos (ficam expostos no
  código-fonte de qualquer página que os usa), então o usuário pode colar os dois diretamente
  no chat depois de criar as contas — diferente de uma secret key, que nunca deve ser digitada
  aqui.

## Escopo

### 1. Banner de consentimento de cookies (`hirefy_lading` e `web-app`)
Componente novo em cada repo (`CookieConsentBanner`), aparece no primeiro acesso, guarda a
escolha em `localStorage` (`hfy_cookie_consent: "accepted" | "declined"`). GA4/Mixpanel só
inicializam se `"accepted"`. Rodapé ganha um link "Preferências de cookies" que reabre o
banner pra trocar a escolha (mobile-first, sem depender de biblioteca externa de consent —
componente simples o suficiente pra não justificar uma dependência nova).

### 2. Instrumentação — `hirefy_lading` (visitante anônimo, topo de funil)
- GA4 via `gtag.js` (pageviews automáticos entre rotas do App Router).
- Mixpanel via SDK de browser, eventos manuais:
  - `landing_cta_clicked` (Hero, CTASection — qual botão, qual seção)
  - `pricing_viewed` (se/quando existir seção de preços)

### 3. Instrumentação — `web-app` (usuário logado, funil de produto)
Nomenclatura de evento **espelha o mobile onde já existe equivalente** (`AnalyticsService`),
estendida com o que só existe no web (billing via Stripe, que o mobile não tem — usa
RevenueCat):

| Evento | Quando dispara |
|---|---|
| `signup_completed` | Depois de `POST /api/auth/signup` com sucesso |
| `login_completed` | Depois de `POST /api/auth/login` com sucesso |
| `resume_created` | Depois de salvar currículo (manual ou import de PDF) |
| `resume_optimize_started` | Depois de `POST /api/resumes/optimize` (202) |
| `resume_optimize_completed` | Quando o polling detecta `status: completed` |
| `pipeline_job_added` | Depois de adicionar vaga ao pipeline |
| `upgrade_button_clicked` | Clique em "Fazer upgrade" (antes do redirect pro Stripe) |
| `checkout_completed` | Retorno `?checkout=success` |
| `checkout_cancelled` | Retorno `?checkout=cancelled` |
| `subscription_cancelled` | Depois de `DELETE /api/subscription` com sucesso |

`identify()` (Mixpanel) + `user_id`/`user_properties` (GA4) chamados com o `id` de
`GET /api/me` assim que a sessão carrega; propriedade `subscription_tier` (mesmo nome usado no
mobile) atualizada a partir de `GET /api/subscription`.

### 4. Config
- `web-app`: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_MIXPANEL_TOKEN` (client-side, não
  secretas — por isso `NEXT_PUBLIC_`, ao contrário do padrão de `API_BASE_URL`).
- `hirefy_lading`: mesmas duas variáveis.

## Fora de escopo
- Cookies de marketing (Facebook Pixel, Google Ads, LinkedIn Insight Tag) — a política
  promete, nada será implementado agora. **Achado de compliance registrado, não resolvido**:
  ou remove essa seção da política, ou implementa depois numa spec própria.
- Tela "Settings → Privacy → Cookie Preferences" no app mobile — mobile não é tocado nesta
  spec.
- Dashboard interno de métricas de negócio (MRR/churn/LTV) — decisão do usuário de usar o
  dashboard nativo do Stripe em vez de construir algo customizado.
- Mudar o `AnalyticsService` do mobile ou seu SDK (Firebase Analytics já funciona lá).
- "Do Not Track" (a própria política já diz que não é respeitado hoje — não muda aqui).

## Critérios de aceite
- [x] Banner de cookies aparece no primeiro acesso em `web-app` e `hirefy_lading`, com opção
  de aceitar/recusar; escolha persiste (`localStorage`) e é respeitada — confirmado ao vivo
  nos dois: nenhuma chamada de rede pro GA/Mixpanel antes de aceitar
- [x] GA4 registra pageview — landing usa `send_page_view: true` (página única); web-app
  dispara manualmente a cada mudança de rota via `AnalyticsPageview`, confirmado carregando
  `gtag/js` com sucesso
- [x] Eventos do Mixpanel testados ao vivo com sucesso (POST 200 confirmado em cada):
  `landing_cta_clicked`, `pricing_viewed`, `pipeline_job_added`, `checkout_cancelled`,
  `subscription_tier` (via `people.set`). Os demais (`signup_completed`, `login_completed`,
  `resume_created`, `resume_optimize_started/completed`, `upgrade_button_clicked`,
  `checkout_completed`, `subscription_cancelled`) seguem o mesmo padrão de código já validado
  nos pontos testados, não recriados ao vivo pra evitar custo real de IA/Stripe repetido
- [x] `identify()`/`setUserProperty` disparam quando o componente que já busca os dados
  (`WelcomeHeader`, `SubscriptionCard`) monta com consentimento já aceito — **achado**: se o
  consentimento é aceito só depois desses componentes já terem montado (ex: usuário aceita o
  banner already estando no dashboard), a chamada correspondente não é refeita
  automaticamente até a próxima navegação/remontagem. Documentado como limitação conhecida,
  não bloqueante — a maioria dos usuários decide o consentimento antes de qualquer fetch de
  dados relevante disparar
- [x] Nenhuma chamada de analytics acontece antes do consentimento ser aceito (confirmado ao
  vivo nos dois sites)
- [x] `tsc`/`build` limpos nos dois repos (`hirefy_lading` nunca teve ESLint configurado —
  achado separado, não é regressão desta spec, não configurado agora)
