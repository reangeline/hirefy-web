# Log — Spec 004: Home pós-login

**Data:** 2026-08-22

## Status

Só a spec foi escrita (`spec.md`). Nada implementado — `/dashboard` continua sendo o
placeholder da spec 001 (`LogoutButton` + `MeCard`).

## Levantamento feito antes de escrever a spec

- Lido `home_screen.dart` (mobile) — descobri que é só o shell da bottom nav (4 abas), não a
  tela em si
- Lido `home_dashboard.dart` (mobile, ~830 linhas) — a tela real da aba Home: cabeçalho,
  banner de verificação de email, card de assinatura/créditos, quick actions, sugestões de
  otimização agregadas
- Lido `subscription_provider.dart` e `subscription.dart` (model) — achado importante:
  `isPro` no mobile vem do **RevenueCat**, não do campo `plan` que o backend retorna direto.
  Documentado na spec como algo que a web não pode replicar (RevenueCat é proibido aqui) —
  a web precisa calcular `isPremium` a partir da resposta crua do backend
- Lido `subscription_service.dart` — confirma os endpoints `GET /subscription`,
  `GET /subscription/credits`, `POST /subscription/checkout`
- Confirmado no `router.go` do backend: **não existe rota de listagem de notificações** —
  só `POST /users/me/fcm-token`. O sino de notificações do mobile é puramente local/FCM,
  sem fonte de verdade no backend pra replicar na web

## Decisão de escopo

A tela real do mobile tem 5 blocos; dois deles (Quick Actions com links reais, e sugestões
de otimização com dados reais) dependem de specs que ainda não existem (002 — resumes/
otimização — e uma futura spec de billing). Decidi documentar a spec 004 já prevendo isso,
em vez de construir botões que levam a rotas inexistentes. O board de specs vai refletir a
dependência quando a implementação começar.

## Addendum — implementação parcial (2026-08-22, mesmo dia)

Implementado o que não depende de outra spec:
- `src/types/api.ts` — `MeResponse`, `SubscriptionResponse`
- `src/app/api/subscription/route.ts` — proxy `GET /subscription` (mesmo padrão do `/api/me`)
- `src/components/dashboard/WelcomeHeader.tsx` — nome + banner de verificação condicional
- `src/components/dashboard/EmailVerificationBanner.tsx`
- `src/components/dashboard/SubscriptionCard.tsx` — plano + créditos, `isPremium` calculado
  no client (ver achado no `spec.md`)
- Adicionado `shadcn` `Badge` (não existia no projeto ainda)
- Removido `MeCard.tsx` (spec 001, só prova de conceito) — substituído pelo `WelcomeHeader`

### Decisão: não chamar `GET /subscription/credits`
Ao ler o Go (`internal/core/domain/subscription.go`), vi que `credits` já é um campo direto
do `Subscription` e vem embutido em `GET /subscription`. Chamar o endpoint de créditos
seria uma segunda requisição redundante pra esta tela — fica reservado pra uma futura tela
de billing que precise do histórico de transações (`GetCreditHistory`, que só aquele
endpoint retorna).

### Validação
Build/lint/type-check limpos. Testado ao vivo (Chrome): `/dashboard` sem sessão redireciona
corretamente; com um cookie de sessão forjado (token inválido, sem refresh_token), os dois
cards renderizam o erro 401 sem quebrar a tela — prova que o tratamento de erro funciona.
**Não testei o caminho de sucesso** (dados reais de assinatura) — mesma limitação já
registrada na spec 001, não tenho uma conta de teste real no Cognito de dev.

Tentei simular a resposta via mock de `window.fetch` no browser, mas esbarrei numa limitação
prática: qualquer `navigate` real recarrega o documento e descarta o monkey-patch (só
sobrevive a navegações client-side via router, que eu não tinha como disparar sem um link
já presente na página). Não insisti além disso — não é um bloqueio real, só não consegui
um preview visual do estado "com dados".

## Próximos passos

Card de sugestões de otimização continua bloqueado pela spec 002. Ordem sugerida: fechar
spec 002 (currículos) antes de voltar aqui pra completar a home.
