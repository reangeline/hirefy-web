# Log de implementação — Spec 001: Auth

**Data:** 2026-08-22

## O que foi implementado

- `src/types/api.ts` — DTOs de request/response espelhando o backend Go
- `src/lib/api/backend.ts` — chamadas server-side ao backend (`postBackend`,
  `authedGetBackend`), parser dual-case de tokens (`parseAuthTokens`), helper de erro
  (`backendErrorResponse`)
- `src/lib/auth/session.ts` — cookies de sessão (`access_token`, `id_token`,
  `refresh_token`), httpOnly/secure/sameSite=lax
- `src/lib/api/client.ts` — wrapper fetch client-side (`apiFetch`/`apiFetchJson`) com
  intercept de 401, refresh single-flight e retry da chamada original
- `src/proxy.ts` — protege `(dashboard)`, `resume`, `optimize`, `profile`, `billing`;
  redireciona pra `/login?redirect=<rota>` sem cookie de sessão
- Route Handlers em `src/app/api/auth/*`: `signup`, `login`, `confirm`, `resend-code`,
  `refresh`, `logout`, `forgot-password`, `confirm-forgot-password`
- `src/app/api/me/route.ts` — proxy de `GET /users/me`, usado só pra provar o loop de auth
  ponta a ponta (não faz parte do contrato da spec, é infraestrutura de teste)
- Telas: `/login`, `/signup`, `/signup/confirm`, `/forgot-password`,
  `/forgot-password/confirm`, `/dashboard` (com `LogoutButton` e `MeCard`)
- Refatoração das telas pra usar os componentes shadcn/ui (`Button`, `Input`, `Label`,
  `Card`) após o `shadcn init` ter sido rodado no projeto — commit único, sem versão
  intermediária em Tailwind puro no histórico
- Correções de acessibilidade (auditoria via skill `web-design-guidelines`): `name` em
  todo input, `spellCheck={false}` em email/código, `autoComplete="one-time-code"` nos
  campos de código, `aria-live="polite"` em toda mensagem de erro/info/loading, reticências
  tipográficas (`…`) nos estados de carregamento

## Decisões tomadas durante a execução (não explícitas na spec original)

1. **`src/proxy.ts`, não `src/middleware.ts`** — o Next.js 16.3.2 instalado no projeto
   renomeou a convenção de "Middleware" pra "Proxy" (mesma API, `export function proxy()`).
   A spec e o `web-app/CLAUDE.md` foram atualizados pra refletir isso.
2. **Signup pode logar automaticamente** — `auth_service_impl.go` tenta login logo após o
   signup e normalmente retorna tokens completos (antes da confirmação de email). O Route
   Handler `/api/auth/signup` trata os dois casos (com ou sem tokens na resposta).
3. **Login nunca distingue o motivo do erro** — `POST /auth/signin` sempre retorna
   `{"error":"invalid credentials"}` pra qualquer falha (confirmado ao vivo contra o backend
   de dev). O requisito original de "redirecionar pra `/signup/confirm` se usuário não
   confirmado" não é implementável hoje — documentado na spec, não implementado.
4. **`API_BASE_URL` sem prefixo `NEXT_PUBLIC_`** — o `.env.local.example` original usava
   `NEXT_PUBLIC_API_BASE_URL`, mas como o browser nunca fala com o backend Go diretamente
   (só via Route Handler), não faz sentido expor essa URL no bundle do client. Renomeado.
   Também removidas `COGNITO_USER_POOL_ID/CLIENT_ID/REGION` e `SESSION_COOKIE_SECRET` do
   `.env.local(.example)` — resquício da arquitetura pré-revisão 2 (Cognito direto), não
   usadas em nenhum lugar do código atual.
5. **`shadcn/ui` foi inicializado no meio da sessão** (fora do meu controle — o usuário
   rodou `npx shadcn init`). Refatorei as 6 telas + 2 componentes do dashboard pra usar os
   componentes gerados em vez de Tailwind puro, já que era o stack documentado no
   `web-app/CLAUDE.md` desde o início.

## Divergências entre planejado e executado

- **Não testado ponta a ponta com conta real.** Validei o plumbing contra o backend de dev
  ao vivo (login com credenciais inválidas → erro correto; `/dashboard` sem sessão →
  redirect; `/api/me` e `/api/auth/refresh` sem cookie → 401), mas não criei uma conta real
  no Cognito de dev pra não gerar efeito colateral (usuário real + email de verificação)
  sem combinar antes.
- **Segurança/qualidade:** as ferramentas citadas no processo (qodo-skills, StackHawk) não
  estão disponíveis neste ambiente. Rodei a skill `security-review` disponível localmente
  como substituto — ver resultado abaixo.

## Critérios de aceite (ver detalhamento em `spec.md`)

- [ ] Usuário consegue criar conta, confirmar por email e fazer login — implementado, não
  testado ponta a ponta
- [ ] Sessão persiste entre reloads — implementado, não testado ao vivo com sessão real
- [ ] Refresh automático em token expirado — implementado, não testável sem esperar TTL real
- [x] `/dashboard` sem sessão redireciona pra `/login` — testado ao vivo
- [ ] Logout limpa sessão — implementado, não testado ao vivo com sessão real
- [x] Parser dual-case de tokens — implementado; formato de erro confirmado ao vivo, formato
  de sucesso (tokens) ainda não
- [ ] Chamada com token expirado dispara refresh — implementado, não testável sem TTL real

**Spec não fechada** — falta o teste ponta a ponta com conta real (bloqueado por decisão do
usuário de não criar dados reais sem combinar antes) e os itens dependentes de expiração real
de token.
