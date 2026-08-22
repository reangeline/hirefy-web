# Spec 004: Home pós-login (`/dashboard`)

## Objetivo
Substituir o placeholder de `/dashboard` (criado na spec 001 só pra provar que login + sessão
funcionavam) pela home de verdade: a primeira tela que o usuário vê depois de logar, espelhando
`home_dashboard.dart` do mobile — cabeçalho de boas-vindas, status da assinatura/créditos e
atalhos pras ações principais — já com a identidade visual da spec 003 (shadcn + paleta teal).

## Levantamento feito antes de escrever a spec
`applywise_app/lib/screens/home/home_dashboard.dart` (a tela real, não o
`home_screen.dart` que é só o shell da bottom nav) mostra, nesta ordem:
1. Cabeçalho: "Welcome back, {nome}" + sino de notificações com badge de não lidas
2. Banner de verificação de email (condicional, some se já verificado)
3. Card de assinatura: "Free Plan" ou "Premium Active", créditos disponíveis, botão
   "Upgrade to Premium" se for free
4. Quick Actions: comprar créditos (se free), otimização de LinkedIn, "como funciona"
5. Sugestões de otimização: agrega `suggestions` de todos os currículos já otimizados
   (`GET /resumes` + `GET /resumes/optimized` combinados) ou estado vazio

## Endpoints consumidos (backend, base `/api/v1`)
- `GET /users/me` — nome, `email_verified` (já usado pelo proxy `/api/me` da spec 001)
- `GET /subscription` — `{ plan: "free"|"premium", is_active, features, ... }`
- `GET /subscription/credits` — `{ credits: number }`
- `GET /resumes` + `GET /resumes/optimized` — necessários só pro card de sugestões (ver
  dependência de escopo abaixo)

### ⚠️ Achado — `isPro` no mobile não vem do backend
O mobile decide `isPro` consultando o **RevenueCat** (`_revenueCatService.getSubscriptionStatus()`),
não o campo `plan`/`is_active` que `GET /subscription` retorna diretamente. Isso é coerente com o
billing do mobile (App Store), mas **não se aplica à web** — `web-app/CLAUDE.md` já proíbe usar
RevenueCat aqui ("Billing web é 100% Stripe"). O web-app precisa derivar o status de assinatura
direto da resposta do backend: `plan === "premium" && is_active` (é literalmente o getter
`isPremium` que já existe no model Dart, só não é a fonte usada pelo provider mobile).

## Requisitos

### Cabeçalho
- "Bem-vindo(a), {nome}" a partir de `GET /users/me`
- **Sem sino de notificações** — ver "Fora de escopo"

### Banner de verificação de email
- Se `email_verified === false` (de `GET /users/me`): banner de aviso com CTA levando pra
  `/signup/confirm?email=<email>` (tela que já existe, spec 001)

### Card de assinatura e créditos
- "Plano Free" ou "Premium" a partir de `GET /subscription` (`plan`/`is_active`, calculado
  como `isPremium` acima — não RevenueCat)
- Créditos de `GET /subscription/credits`
- Botão "Fazer upgrade" se for free — **leva a uma tela de billing que ainda não existe**
  (ver Fora de escopo). Por ora, desabilitado ou levando a um placeholder "em breve"

### Atalhos (Quick Actions)
- "Otimizar currículo" — **depende da spec 002** (fluxo de otimização ainda não implementado)
- Demais atalhos do mobile (comprar créditos, otimização de LinkedIn) dependem de specs que
  não existem ainda (billing, LinkedIn) — não implementar botões que levam a lugar nenhum

### Sugestões de otimização
- **Bloqueado pela spec 002** — a lista vem de `GET /resumes` + `GET /resumes/optimized`,
  que são o próprio objeto da spec 002 (ainda não implementada). Nesta spec, entra só o
  estado vazio ("Nenhuma sugestão ainda — otimize um currículo pra começar")

## Fora de escopo
- Central de notificações (sino com badge) — o mobile não usa um endpoint REST pra isso, é
  puramente local (FCM + estado em memória via `NotificationProvider`). **O backend não tem
  nenhuma rota de listagem de notificações** (`router.go` só tem
  `POST /users/me/fcm-token`, que registra o token do dispositivo, nada de listar/ler
  notificações). Sem um endpoint de histórico, não dá pra replicar isso na web — precisaria
  de uma rota nova no backend antes de ter sentido implementar aqui
- Upgrade de assinatura / checkout Stripe — existe `POST /subscription/checkout` no backend,
  mas isso é uma spec própria (fluxo de billing web completo, com sucesso/cancelamento,
  página de preços, etc.), não cabe dentro da home
- Atalho de otimização de LinkedIn — depende de uma spec própria pro
  `POST /resumes/linkedin/optimize` (já citado como fora de escopo na spec 002)
- Card de sugestões com dados reais — depende da spec 002 (ver acima)

## Perguntas em aberto
- [ ] Vale a pena adicionar uma rota de notificações no backend (`GET /notifications`) pra
  viabilizar esse recurso na web também, ou fica mobile-only por design?
- [ ] O card de "Fazer upgrade" deve ficar desabilitado, escondido, ou levar a uma página
  "em breve" até a spec de billing existir?

## Critérios de aceite
- [ ] `/dashboard` mostra "Bem-vindo(a), {nome}" com o nome vindo de `GET /users/me`
- [ ] Banner de verificação de email aparece só quando `email_verified` é `false`
- [ ] Card de assinatura mostra Free/Premium e créditos corretos, calculados a partir de
  `GET /subscription` + `GET /subscription/credits` (sem RevenueCat)
- [ ] Estado vazio do card de sugestões aparece corretamente (sem dado real ainda)
- [ ] Nenhum link/botão leva a uma rota inexistente (nada de dead links pros recursos fora
  de escopo)
