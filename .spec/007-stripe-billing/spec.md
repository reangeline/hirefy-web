# Spec 007: Billing com Stripe (Free + Premium)

## Objetivo
Vender o plano Premium via Stripe Checkout hospedado. Free continua com 3 créditos grátis
(já existe); Premium libera otimizações ilimitadas (o gate pra isso **já existe e já
funciona** no backend — só falta vender de verdade).

**Decisões de produto (confirmadas com o usuário):**
- 2 planos: Free e Premium — sem "Basic" (a constante `domain.PlanBasic` continua existindo
  no código, só não é vendida)
- Premium: **US$ 19,99/mês**, recorrente, benefício do dia 1 = otimizações ilimitadas
  (currículo + coach de IA de pipeline)
- "Auto-apply" (aplicar automaticamente em vagas) foi cogitado como benefício futuro do
  Premium, mas fica **fora de escopo** desta spec — é feature grande e distinta (envolve
  automação de submissão em sites de vaga, possíveis questões de ToS de job boards), merece
  spec própria depois

Esta spec toca **dois repositórios**: `backend_hirefy` (Go — correção de bugs reais que
impedem o Stripe de funcionar direito) e `web-app` (Next.js — UI de upgrade/cancelamento).
Nenhum código foi tocado ainda antes desta spec ser escrita — levantamento feito lendo os
dois repos.

## Achados no backend (levantamento, antes de qualquer correção)

O caminho real em produção é `SubscriptionHandler.CreateCheckout` →
`subscriptionServiceImpl.CreateCheckoutSession` → `PaymentGateway.CreateCheckoutSession`
(Stripe). Existe uma segunda interface (`PaymentService.CreateCheckoutSession`,
`payment_service_impl.go`) que **não é usada por nenhum handler** — confirmado via grep, é
código morto (só `PaymentService.HandleWebhook` é usado de verdade, pelo `WebhookHandler`).

1. **`POST /subscription/checkout` aceita `price_id` direto do corpo da requisição, sem
   validar contra nada** (`subscription_handler.go:CreateCheckout`) — repassa pro Stripe sem
   checar se é um preço que a Hirefy realmente vende. Com só 1 plano pago, a correção mais
   simples e mais segura é o backend **parar de aceitar price_id do cliente** — sempre usa o
   preço do Premium configurado no próprio servidor
2. **`getPriceIDForPlan` está duplicado** em `subscription_service_impl.go` (usado de
   verdade) e em `payment_service_impl.go` (código morto) — os dois retornam placeholders
   fixos (`"price_basic_monthly"`, `"price_premium_monthly"`), não IDs reais do Stripe, com
   TODO explícito pra vir de env var
3. **`getPlanFromPriceID` (`payment_service_impl.go`, usado dentro do processamento real do
   webhook) sempre retorna `PlanPremium`**, tem TODO admitindo isso. Com só 1 plano pago
   vendido de verdade, isso deixa de ser um bug — mas ainda vale validar que o `price_id` do
   evento bate com o Premium configurado, em vez de assumir cegamente
4. **URLs de sucesso/cancelamento do checkout hardcoded** pro domínio antigo
   (`https://app.applywise.com/success`, `.../pricing`) em `payment_gateway_impl.go` —
   precisa vir do domínio real do web-app, configurável (dev = `localhost:3000`)
5. **O webhook aceita requisição sem header `Stripe-Signature` e responde 200 sem processar
   nada** (`webhook_handler.go`, comentário "DEV mode") — resquício que não deveria existir;
   webhook sempre deve exigir e verificar assinatura
6. **Nenhum produto/preço real existe no Stripe ainda** — dois scripts de setup
   (`scripts/setup-stripe-products.sh`, `scripts/create-stripe-products.sh`) conflitantes
   entre si (Free+Pro $9.99 vs Basic $9.99+Premium $19.99), nenhum rodado, nenhum bate com a
   marca Hirefy atual ou com o preço decidido agora (US$19,99)
7. **Confirmado, não é bug**: o gate de "otimizações ilimitadas" pro Premium já existe e
   funciona hoje — `resume_optimizer_service_impl.go` e `pipeline_coach_service_impl.go` só
   descontam crédito `if subscription.Plan == domain.PlanFree`; qualquer plano pago já é
   ilimitado. Não precisa mexer nessa parte

## Plano de correção — backend (`backend_hirefy`)

### Config (`pkg/config/config.go`, `cmd/api/main.go`, `cmd/worker/main.go`)
Adicionar dois campos novos: `StripePricePremiumMonthly` (env `STRIPE_PRICE_PREMIUM_MONTHLY`)
e `WebAppBaseURL` (env `WEB_APP_BASE_URL`, default `http://localhost:3000` se vazio).

### `internal/adapters/outbound/payment/stripe/payment_gateway_impl.go`
`NewPaymentGateway(apiKey, webAppBaseURL string)` passa a receber e guardar a base URL.
`CreateCheckoutSession` monta `SuccessURL`/`CancelURL` a partir dela (ex:
`{base}/dashboard?checkout=success` / `{base}/dashboard?checkout=cancelled`) em vez dos
valores fixos do domínio antigo.

### `internal/core/ports/inbound/subscription_service.go`
Remover `PriceID` de `CreateCheckoutRequest` (deixa de ser algo que o cliente controla).

### `internal/application/service/subscription_service_impl.go`
`NewSubscriptionService(...)` passa a receber `premiumPriceID string` e guardar no struct.
`CreateCheckoutSession` usa esse valor direto, em vez do `getPriceIDForPlan` (removido).

### `internal/adapters/inbound/http/handler/subscription_handler.go`
`CreateCheckout` para de decodificar `price_id` do corpo — não precisa mais ler body
nenhum, só monta `CreateCheckoutRequest{UserID, Email}`.

### `internal/application/service/payment_service_impl.go`
Remover o método morto `CreateCheckoutSession` (não usado por nenhum handler) e seu
`getPriceIDForPlan` privado. `getPlanFromPriceID` (usado de verdade em
`handleCheckoutCompleted`) passa a comparar o `price_id` do evento contra o
`premiumPriceID` configurado (em vez de assumir Premium cegamente) — se não bater, loga e
não ativa a assinatura (defesa a mais, já que single-plan simplifica bastante mas não
justifica confiar cegamente no payload do webhook).

### `internal/adapters/inbound/http/handler/webhook_handler.go`
Remover o branch "sem assinatura, aceita mesmo assim" — toda requisição sem
`Stripe-Signature` válida é rejeitada.

### Criar o produto/preço reais no Stripe
Não vou pedir nem tocar na sua secret key. Vou escrever um script corrigido
(`scripts/create-hirefy-premium-price.sh`, substituindo os dois antigos conflitantes) que
você roda você mesmo via `!` no terminal (a chave fica só na sua máquina) — cria "Hirefy
Premium" a US$19,99/mês e imprime o `price_id` real, que aí eu uso pra configurar
`STRIPE_PRICE_PREMIUM_MONTHLY`.

## Plano de implementação — web-app (Next.js)

- `src/app/api/subscription/checkout/route.ts` (novo) — proxy `POST /subscription/checkout`,
  sem repassar nenhum body do cliente (o backend não aceita mais price_id de fora)
- `src/app/api/subscription/route.ts` — adicionar `DELETE` (proxy de cancelamento,
  endpoint já existe no backend)
- `SubscriptionCard.tsx` — botão "Fazer upgrade" (hoje sempre `disabled`) chama o checkout e
  redireciona (`window.location.href = checkout_url`, é navegação pra domínio externo do
  Stripe, não uma rota interna — não se aplica a regra de usar `router.push`); usuário
  Premium ativo vê botão "Cancelar assinatura" em vez de "Fazer upgrade"
- `dashboard/page.tsx` (ou um componente novo) — trata `?checkout=success` /
  `?checkout=cancelled` na URL de retorno com uma mensagem simples (toast ou banner),
  fazendo o `SubscriptionCard` refetch pra refletir o novo estado

## Fora de escopo
- Auto-apply (feature futura, spec própria)
- Plano Basic (constante existe, não é vendida)
- Upgrade/downgrade entre planos pagos (só existe 1 plano pago — não se aplica)
- Cobrança anual / múltiplas moedas
- Faturas/histórico de pagamento na UI (dá pra ver no Stripe Customer Portal depois, não
  nesta spec)

## Critérios de aceite
- [x] `POST /subscription/checkout` não aceita mais `price_id` do cliente
- [x] Checkout usa URLs de sucesso/cancelamento do domínio real (configurável via env)
- [x] Webhook rejeita requisição sem assinatura válida (testado com `curl` direto, sem
  header — recebeu 400)
- [x] Produto/preço reais criados no Stripe (test mode), `price_id` configurado via env
- [x] Testado ao vivo (Stripe test mode, cartão 4242...) no ambiente de dev deployado na AWS:
  clicar "Fazer upgrade" → checkout hospedado → pagamento de teste → webhook ativa Premium →
  dashboard reflete "Premium". Otimização ilimitada pro Premium **não foi testada
  end-to-end** (exigiria consumir a API de IA de verdade) — confirmada por leitura de código
  (achado #7 da spec), não recriado nem alterado nesta spec
- [x] Cancelar assinatura funciona (Stripe + local), volta pra Free
- [x] `tsc`/`lint`/`build` limpos no web-app; `go build`/`go vet` limpos no backend
