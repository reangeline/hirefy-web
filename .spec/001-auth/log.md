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

## Addendum — login social (2026-08-22, mesmo dia, a pedido do usuário)

Trazido de volta ao escopo depois do usuário apontar que faltavam as opções de Google/Apple
que existem no app mobile. Implementado:

- `src/types/global.d.ts` — tipos mínimos pros SDKs carregados via `<script>` (Google
  Identity Services, Sign in with Apple JS); nenhum dos dois tem pacote de tipos oficial
- `src/components/auth/GoogleSignInButton.tsx` — carrega o SDK via `next/script`, renderiza
  o botão oficial do Google (exigência deles pra garantir ID token real, não dá pra usar um
  botão totalmente customizado nesse fluxo)
- `src/components/auth/AppleSignInButton.tsx` — botão customizado (shadcn) que dispara
  `AppleID.auth.signIn()`
- `src/components/auth/SocialAuthButtons.tsx` — compõe os dois, submit compartilhado pra
  `POST /api/auth/social`, usado em `/login` e `/signup`
- `src/app/api/auth/social/route.ts` — Route Handler com a mesma proteção CSRF das outras
  rotas de auth
- `.env.local(.example)` — `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_APPLE_CLIENT_ID`,
  ambos vazios em dev (nenhum client ID real foi criado ainda)

**Não funciona de ponta a ponta** — dois bloqueios externos, nenhum resolvível só com
código: (1) `POST /auth/social` não existe no backend, (2) nenhum client ID real foi
configurado no Google Cloud Console / Apple Developer. Os botões aparecem desabilitados em
dev por falta de client ID; mesmo com client ID, o passo final (`/api/auth/social` →
backend) vai falhar até o backend implementar a rota.

## Revisão de segurança (skill `security-review`)

Encontrado 1 vuln real: nenhuma rota `POST /api/auth/*` checava a origem da requisição.
Um site malicioso podia disparar `POST /api/auth/login` com `Content-Type: text/plain`
(evita CORS preflight) usando credenciais do próprio atacante — o browser da vítima
aceitava o `Set-Cookie` normalmente (`SameSite=Lax` só restringe envio em requisições
futuras, não impede o `Set-Cookie` de uma resposta cross-site), logando a vítima sem
saber na conta do atacante. Corrigido: `src/lib/auth/csrf.ts` (`requireSameOrigin`),
aplicado nas 8 rotas de auth — valida `Sec-Fetch-Site` (não forjável por JS) com
fallback pra `Origin` em browsers antigos. Testado ao vivo (cross-site → 403,
same-origin → segue normal).

## Addendum — teste ao vivo com conta real (2026-08-22, mesmo dia)

Usuário autorizou explicitamente a criação de uma conta de teste real. Criada
`reangeline+test@hotmail.com` pela UI de verdade (não curl): signup → sessão automática
(nome "Ana Teste" retornado, tokens em snake_case puro) → dashboard com dados reais → logout
→ login manual com as mesmas credenciais → dashboard de novo. Tudo funcionou de primeira,
sem nenhum ajuste de código necessário. Email não foi confirmado (sem acesso à caixa de
entrada pra pegar o código).

## Critérios de aceite (ver detalhamento em `spec.md`)

- [x] Usuário consegue criar conta e fazer login — testado ao vivo com conta real
- [x] Sessão persiste entre reloads — testado ao vivo
- [ ] Refresh automático em token expirado — implementado, ainda não testável sem esperar
  TTL real
- [x] `/dashboard` sem sessão redireciona pra `/login` — testado ao vivo
- [x] Logout limpa sessão — testado ao vivo
- [x] Parser dual-case de tokens — confirmado ao vivo nos dois sentidos (erro e sucesso);
  backend só emite snake_case hoje
- [ ] Chamada com token expirado dispara refresh — implementado, ainda não testável sem TTL
  real

**Spec quase fechada** — falta só o teste de expiração real de token (precisa esperar o TTL
do access token ou provocar isso de outra forma), confirmação de email por código, e reset
de senha.
