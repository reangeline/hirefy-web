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

## Próximos passos

Implementação não iniciada. Ordem sugerida: fechar spec 002 primeiro (currículos), porque o
card de sugestões desta spec depende diretamente dela.
