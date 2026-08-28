# Log — Spec 007: Billing com Stripe (Free + Premium)

**Data:** 2026-08-28

## O que foi implementado

### `backend_hirefy` (Go)
- `pkg/config/config.go`, `cmd/api/main.go`: novos campos/env vars
  `STRIPE_PRICE_PREMIUM_MONTHLY` e `WEB_APP_BASE_URL` (default `http://localhost:3000`).
  `cmd/worker/main.go` **não** foi tocado — não constrói `PaymentGateway`/`SubscriptionService`
  (desvio do plano original, que assumia que precisaria mudar também).
- `payment_gateway_impl.go`: `NewPaymentGateway` guarda `webAppBaseURL`; `CreateCheckoutSession`
  usa `{base}/dashboard?checkout=success|cancelled` em vez do domínio antigo hardcoded. Novo
  método `GetSubscriptionPriceID` (busca o price real de uma subscription direto no Stripe).
- `subscription_service.go` / `subscription_service_impl.go`: `CreateCheckoutRequest` não tem
  mais `PriceID` — o servidor sempre usa `premiumPriceID` (recebido no construtor). Removido
  `getPriceIDForPlan`.
- `subscription_handler.go`: `CreateCheckout` não lê mais body nenhum.
- `payment_service.go` / `payment_service_impl.go`: removido o método morto
  `CreateCheckoutSession` (nenhum handler chamava) e seu `getPriceIDForPlan` duplicado.
  `handleCheckoutCompleted` reescrito duas vezes nesta spec (ver "Divergências" abaixo).
- `webhook_handler.go`: removido o branch que aceitava requisição sem `Stripe-Signature`.
- `scripts/create-hirefy-premium-price.sh` (novo, substitui `setup-stripe-products.sh` e
  `create-stripe-products.sh`, ambos deletados): cria "Hirefy Premium" a US$19,99/mês via API
  do Stripe. Precisou de 3 correções depois de testado ao vivo pelo usuário: `curl -s` sem
  `-S` escondia erros de rede (script morria em silêncio), faltava `--connect-timeout`/
  `--max-time` (podia travar sem nunca falhar), e o `grep` de extração do ID não aceitava
  espaço depois do `:` no JSON do Stripe (`"id": "prod_..."` vs `"id":"prod_..."`).
- `scripts/create-stripe-webhook.sh` (novo): cria o webhook endpoint no Stripe (test mode)
  apontando pro API Gateway de dev, e escreve o signing secret direto em
  `terraform/environments/dev/secrets.tfvars` — nunca imprime o valor no terminal.
- `scripts/update-stripe-secret-key.sh` (novo): atualiza `stripe_secret_key` em
  `secrets.tfvars` sem nunca imprimir o valor — usado pra corrigir uma key antiga/revogada
  que já estava salva no arquivo antes desta spec.
- `terraform/environments/dev/variables.tf` + `main.tf`: variáveis `stripe_free_price_id` e
  `stripe_pro_price_id` (resquício do plano Free+Pro abandonado, não usadas pelo código desde
  as mudanças acima) substituídas por `stripe_price_premium_monthly`; nova
  `web_app_base_url`.
- `terraform/modules/cognito/main.tf`: removido `data "aws_ses_email_identity"` morto (nada
  o referenciava) que bloqueava **qualquer** `terraform apply` no ambiente — o comentário no
  próprio arquivo já dizia que devia ter sido removido quando a verificação SES migrou de
  email pra domínio. A policy de envio de email do Cognito (`aws_ses_identity_policy`) também
  foi corrigida pra usar o domínio verificado (`hirefy.careers`) em vez do endereço específico
  (`contact@hirefy.careers`, nunca verificado como identidade própria) — sem essa correção o
  `apply` falhava com "Invalid identity. Must be a verified email address or domain."

### `web-app` (Next.js)
- `src/app/api/subscription/checkout/route.ts` (novo): proxy `POST /subscription/checkout`,
  sem repassar body, CSRF via `requireSameOrigin`.
- `src/app/api/subscription/route.ts`: adicionado `DELETE` (cancela assinatura).
- `src/components/dashboard/SubscriptionCard.tsx`: "Fazer upgrade" chama o checkout e
  redireciona pra URL do Stripe; usuário Premium ativo vê "Cancelar assinatura" no lugar.
  Rótulo do plano mostrado usa o estado efetivo (`isPremium`), não o campo `plan` cru — ver
  "Achado" abaixo.
- `src/components/dashboard/CheckoutStatusBanner.tsx` (novo): mostra mensagem de
  sucesso/cancelamento ao voltar do Checkout (`?checkout=success|cancelled`).
- `src/app/(dashboard)/dashboard/page.tsx`: inclui o banner acima.

## Achados / divergências não previstas na spec original

1. **Bug real de duplicação de assinatura** (achado durante o teste ao vivo, não estava nos
   achados originais da spec): `handleCheckoutCompleted` criava uma **nova linha** de
   subscription no DynamoDB em vez de atualizar a que o usuário já tinha (toda conta ganha
   uma linha Free no signup). Como `GetByUserID` faz `Query` com `Limit: 1` sem ordenação
   explícita (a ordem vem da chave `SK`, não da data), o dashboard podia continuar mostrando
   "Free" mesmo com o Premium já ativo no Stripe e uma segunda linha "premium" já gravada —
   foi exatamente o que aconteceu no primeiro teste. Corrigido: `handleCheckoutCompleted`
   agora busca a subscription existente do usuário (`GetByUserID`) e atualiza os campos nela,
   em vez de criar uma linha nova. A linha duplicada criada durante o teste foi apagada
   manualmente do DynamoDB de dev.
2. **UI mostrava "Premium" com controles de Free depois de cancelar**: o backend mantém
   `plan: "premium"` mesmo depois do cancelamento (é histórico — só `status` vira
   `"canceled"`), o que é correto no modelo de dados, mas a `SubscriptionCard` usava
   `PLAN_LABELS[sub.plan]` direto, mostrando "Premium" junto com o botão "Fazer upgrade" e a
   contagem de créditos. Corrigido pra mostrar o rótulo baseado no estado efetivo
   (`isPremium`), não no campo `plan` cru.
3. **`STRIPE_SECRET_KEY` já salva em `secrets.tfvars` (de antes desta spec) estava
   inválida/revogada** — só foi descoberto pelos logs do CloudWatch depois do primeiro teste
   de checkout falhar com "failed to create checkout session" (mensagem genérica do handler).
   O erro real (`401 Invalid API Key provided`) só apareceu no CloudWatch, não na resposta
   HTTP pro cliente.
4. **`firebase_project_id` de dev (`applywise-35cc7`) ainda aponta pro projeto Firebase
   antigo**, excluído e recriado como `hirefy-eb833` em trabalho anterior desta mesma sessão
   (fora do escopo desta spec) — registrado, não corrigido. Provavelmente quebra push
   notification do backend em dev.
5. **Bloqueio de infraestrutura pré-existente, não relacionado ao Stripe**: `terraform apply`
   no ambiente de dev falhava **sempre** (mesmo sem nenhuma mudança desta spec) por causa do
   `data "aws_ses_email_identity"` morto no módulo Cognito (achado #5 do log geral). Corrigido
   porque bloqueava qualquer deploy, backend incluso.

## Decisões tomadas durante a execução não explícitas na spec original
- Web-app não precisou de nenhuma variável de ambiente nova — o price ID vive só no backend
  (o cliente nunca escolhe/vê o price ID).
- Optou-se por rodar o teste ao vivo contra o ambiente de **dev na AWS** (Lambda real via
  Terraform), não localmente — o usuário nunca roda o backend localmente por ser Lambda.
  Isso trouxe à tona os achados de infraestrutura (itens 3 e 5 acima) que não apareceriam
  num teste 100% local.
- Scripts de segredo (`create-stripe-webhook.sh`, `update-stripe-secret-key.sh`) escrevem o
  valor sensível direto no arquivo via `sed`, nunca imprimindo no terminal — mesmo padrão de
  segurança usado no restante da sessão (secret nunca passa pelo assistente).

## Não testado end-to-end (documentado, não bloqueante)
- Chamada real de otimização de currículo/coach de IA com plano Premium ativo, confirmando
  que não desconta crédito — confirmado por leitura de código (lógica já existia e não foi
  alterada nesta spec), não recriado ao vivo pra evitar custo de chamada real à OpenAI.
- Publicação do web-app (segue rodando local durante o teste) — decisão explícita do usuário,
  não é bloqueio pra esta spec.
