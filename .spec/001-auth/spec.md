# Spec 001: Autenticação (via API do backend — não Cognito direto)

## ⚠️ Correção de arquitetura (revisão 2)
A versão original desta spec assumia integração direta com Cognito via SDK
(`amazon-cognito-identity-js`) rodando num Route Handler. Levantamento do código do backend
e do mobile mostrou que **nenhum client fala com o Cognito diretamente** — o app Flutter
consome os endpoints REST do próprio backend Go, que já faz todo o trabalho de proxy pro
Cognito (criação de usuário, assinatura gratuita, verificação de email customizada). O
web-app deve seguir o mesmo padrão. Isso simplifica a implementação: não precisamos de
nenhum SDK de Cognito no front, só chamadas HTTP pro backend.

## Objetivo
Implementar login, signup, confirmação de email, esqueci senha, sessão e refresh de token no
web-app, replicando o mesmo contrato e o mesmo comportamento já usados pelo app mobile contra
o backend Go.

## Endpoints consumidos (backend, base `/api/v1`)
- `POST /auth/signup` — body: `{ name?, email, password }` → cria usuário (Cognito +
  DynamoDB), assinatura free, dispara envio de código de confirmação por email (SES)
- `POST /auth/confirm` — body: `{ email, code }` → confirma o cadastro
- `POST /auth/resend-code` — body: `{ email }` → reenvia código de confirmação
- `POST /auth/signin` — body: `{ email, password }` → retorna tokens (ver formato abaixo)
- `POST /auth/refresh` — body: `{ refresh_token }` → retorna novos tokens
- `POST /auth/forgot-password` — body: `{ email }` → dispara código de reset por email
- `POST /auth/confirm-forgot-password` — body: `{ email, code, new_password }` → confirma o
  código e efetiva a troca de senha (endpoint separado do forgot-password; sem ele o fluxo de
  "esqueci senha" não completa)
- `POST /auth/social` — body: `{ provider: "google"|"apple", id_token, name? }` (mesmo
  contrato do mobile, `auth_service.dart: signInWithSocial`). **Trazido de volta ao escopo**
  a pedido do usuário (login social é como o app mobile autentica hoje), mas com uma
  ressalva importante: **essa rota não está registrada no router do backend**
  (confirmado de novo em 2026-08-22, `router.go` só expõe os 8 endpoints de email). O
  Route Handler (`/api/auth/social`) e a UI (botões Google/Apple) foram implementados do
  lado do web-app, prontos pra funcionar assim que o backend expuser a rota — até lá,
  qualquer tentativa de login social retorna erro (provavelmente 404) vindo do backend.

### Formato de resposta — atenção
O backend retorna as chaves de token de forma inconsistente: às vezes PascalCase
(`AccessToken`, `IDToken`, `RefreshToken`), às vezes snake_case (`access_token`, `id_token`,
`refresh_token`). O parser de resposta de auth no web-app precisa aceitar as duas formas,
igual o client mobile já faz defensivamente.

## Requisitos

### Signup
- Formulário: nome, email, senha
- Após signup bem-sucedido, redireciona pra tela de confirmação de código
- Tela de confirmação (`/signup/confirm`): input de código + opção de reenviar
- Erros tratados: email já existe, senha fraca (validação do Cognito), código inválido/expirado
- **Achado (confirmado no código do backend):** `auth_service_impl.go` tenta um login
  automático logo após o signup (`// Fazer login automático`) e normalmente retorna tokens
  completos na resposta do próprio `POST /auth/signup` — antes mesmo da confirmação de email.
  Só cai num fallback `{ message: "Account created! Please check your email and sign in." }`
  sem tokens se esse login automático falhar. O Route Handler (`/api/auth/signup`) trata os
  dois casos: se vierem tokens, já estabelece sessão (cookies) mesmo redirecionando pra tela
  de confirmação; se não vierem, segue sem sessão. O mobile (`auth_service.dart`) **não trata
  esse fallback** — lança exceção se não vier token, então lá o signup aparenta falhar mesmo
  quando a conta foi criada. Não é um problema desta spec, mas fica registrado

### Esqueci senha
- Tela (`/forgot-password`): input de email → chama `POST /auth/forgot-password`
- Tela de reset (`/forgot-password/confirm`): input de código + nova senha → chama
  `POST /auth/confirm-forgot-password`
- Erros tratados: código inválido/expirado, usuário não encontrado, senha fraca

### Login
- Formulário: email, senha
- Chamada ao backend feita via Route Handler (`/api/auth/login`) — nunca direto do client
- Sucesso: Route Handler seta cookies httpOnly com os tokens recebidos, redireciona pro
  `/dashboard`
- Erros tratados: credenciais inválidas, usuário não confirmado (redireciona pra
  `/signup/confirm`), rate limiting do backend/Cognito
- **Achado (confirmado ao vivo contra o backend de dev):** `POST /auth/signin` retorna
  **sempre** `{"error":"invalid credentials"}` com 401 pra qualquer falha — senha errada,
  usuário não confirmado, rate limit, o que for. O handler (`auth_handler.go`) descarta o
  erro real do Cognito e não distingue os casos. Ou seja, o requisito acima de "redirecionar
  pra `/signup/confirm` quando usuário não confirmado" **não é implementável hoje** com o
  contrato atual do backend — não há sinal pra diferenciar essa causa de uma senha errada
  comum. Implementado por ora só com a mensagem genérica de erro; se o backend passar a
  diferenciar os erros (ex.: `UserNotConfirmedException` como `error type`, igual já faz em
  `/auth/confirm`), revisitar esse requisito

### Login social (Google/Apple)
- Botões "Continuar com Google" e "Continuar com Apple" nas telas `/login` e `/signup`
  (mesmo componente `SocialAuthButtons`, já que Cognito social login cria a conta no
  primeiro acesso e loga nas seguintes — não existe uma distinção "signup social" separada)
- **Google:** via Google Identity Services (`google.accounts.id`), botão renderizado pelo
  próprio SDK (exigência do Google pra garantir o fluxo de ID token real). Precisa de
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (OAuth Client ID tipo "Web application" no Google Cloud
  Console, com a origem do site em "Authorized JavaScript origins")
- **Apple:** via Sign in with Apple JS (`AppleID.auth`), botão customizado (shadcn) que
  dispara `AppleID.auth.signIn()`. Precisa de `NEXT_PUBLIC_APPLE_CLIENT_ID` (Services ID no
  Apple Developer, com domínio e Return URL registrados) — **não funciona em localhost**,
  precisa de domínio HTTPS verificado
- Sem client ID configurado, o botão aparece desabilitado (não quebra a tela)
- Ambos enviam `POST /api/auth/social` → `{ provider, id_token, name? }` → proxy pro backend
  `POST /auth/social` (ver achado acima: **rota não existe no backend hoje**, então mesmo com
  os client IDs configurados, o login social não completa de ponta a ponta ainda)

### Sessão
- Cookies: `httpOnly`, `secure`, `sameSite=lax`, `path=/`
- Guardam `access_token`, `id_token`, `refresh_token` como vieram do backend (já são JWTs
  assinados pelo Cognito — não precisamos de camada extra de assinatura no cookie)
- Logout (`/api/auth/logout`): limpa os cookies (não há endpoint de logout no backend hoje —
  confirmar se precisa invalidar sessão no Cognito também, ou se é só client-side)

### Refresh — replicar o padrão do mobile
- Wrapper de API (`lib/api/client.ts`) intercepta respostas 401 do backend
- Dispara `POST /auth/refresh` com o `refresh_token` do cookie
- **Single-flight**: se várias chamadas derem 401 ao mesmo tempo, só uma chamada de refresh
  deve ser feita; as demais aguardam o resultado dela (mesmo padrão do `_tokenRefresher` do
  mobile)
- Sucesso: atualiza os cookies com os novos tokens, reenvia a chamada original
- Falha: limpa cookies, força logout, redireciona pra `/login`

### Rotas protegidas
- Proxy (`src/proxy.ts` — Next.js 16 renomeou "Middleware" para "Proxy", mesma API) intercepta
  rotas em `(dashboard)/*`
- Sem cookie de sessão válido → redirect pra `/login?redirect=<rota original>`

### Chamadas autenticadas ao backend
- Header: `Authorization: Bearer <access_token>` (nunca `id_token`)

## Fora de escopo
- MFA
- Widgets nativos / Share Extension (específicos do mobile, não se aplicam)

## Perguntas em aberto
- [x] Payload de `POST /auth/forgot-password` e `POST /auth/confirm-forgot-password`
  (confirmado em `auth_handler.go`: `{ email }` e `{ email, code, new_password }`)
- [ ] Existe endpoint de logout no backend, ou é puramente client-side (limpar cookies)? —
  não há rota `/auth/signout` ou `/auth/logout` registrada em `router.go` hoje, então
  provavelmente é client-side (só limpar cookies), mas confirmar com o backend antes de
  fechar essa decisão
- [ ] Tempo de expiração configurado no User Pool (access token / refresh token)
- [ ] Política de senha exata do Cognito (para validação client-side antecipada no form)
- [ ] Formato real das chaves de token contra o ambiente de dev — parcialmente testado ao vivo
  (`curl` contra `/api/auth/login` com credenciais inválidas): o formato de **erro** já bate
  com o previsto no código (`{"error":"invalid credentials"}`, snake_case/lowercase, sem
  PascalCase). O formato de **sucesso** (tokens de verdade) ainda não foi validado ao vivo —
  não criei uma conta de teste real no Cognito de dev pra não gerar efeito colateral (usuário
  real + email de verificação enviado) sem combinar antes. Parser dual-case mantido por
  segurança; confirmar contra um signin real assim que houver uma conta de teste disponível
- [ ] Quando o backend vai expor `POST /auth/social`? Bloqueia o fechamento do login social —
  UI e Route Handler estão prontos, mas não testáveis de ponta a ponta sem isso
- [ ] Credenciais reais de `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Google Cloud Console) e
  `NEXT_PUBLIC_APPLE_CLIENT_ID` (Apple Developer, Services ID + domínio verificado) — nenhum
  dos dois foi criado ainda, `.env.local` está com as variáveis vazias (botões desabilitados)

## Nota de segurança (informativa, não bloqueia esta spec)
O backend valida o JWT hoje com `ParseUnverified` (sem checar assinatura) — é uma dívida de
segurança do backend, registrada no `CLAUDE.md` raiz do monorepo. Não muda nada na
implementação do web-app, mas é bom ter ciência de que a garantia de segurança do token nas
rotas protegidas é, hoje, mais fraca do que o desenho usual de JWT + Cognito sugeriria.

## Status de implementação
Código implementado (Route Handlers, `lib/api/backend.ts`, `lib/auth/session.ts`,
`lib/api/client.ts`, `src/proxy.ts`, telas de login/signup/confirm/forgot-password). Build e
type-check passam limpos. Plumbing testado ao vivo contra o backend de dev (login com
credenciais inválidas, refresh/`/api/me` sem sessão, redirect do `/dashboard`) — todos com o
comportamento esperado. **Não testado ao vivo:** o caminho de sucesso completo (signup real →
confirmação por email → login → sessão) porque isso cria uma conta real no Cognito de dev e
dispara um email de verificação de verdade — não fiz isso sem combinar antes. Recomendo
rodar esse teste manual (ou com uma conta de teste dedicada) antes de considerar a spec
fechada.

## Critérios de aceite
- [ ] Usuário consegue criar conta, confirmar por email e fazer login — **implementado, não
  testado ponta a ponta** (ver Status de implementação)
- [ ] Sessão persiste entre reloads de página (cookie httpOnly funcionando) — implementado
  (cookies `httpOnly`/`secure`/`sameSite=lax`), não testado ao vivo
- [ ] Token expirado dispara refresh automático (com single-flight) sem derrubar o usuário —
  implementado (`lib/api/client.ts` + `/api/auth/refresh`), não é possível testar expiração
  real sem esperar o TTL do access token
- [x] Rota `/dashboard` sem sessão redireciona pra `/login` — testado ao vivo (307 →
  `/login?redirect=%2Fdashboard`)
- [ ] Logout limpa a sessão e bloqueia acesso a rotas protegidas — implementado
  (`/api/auth/logout` limpa os 3 cookies), não testado ao vivo com sessão real
- [x] Parser de resposta de auth funciona com ambos os formatos de chave (Pascal/snake_case)
  — implementado; formato de erro confirmado ao vivo, formato de sucesso (tokens) ainda não
- [ ] Chamada ao backend com token expirado dispara refresh e completa com sucesso —
  implementado (`/api/me` repassa 401, `apiFetchJson` refaz com refresh), não testado com
  expiração real
- [ ] Usuário consegue solicitar reset de senha, confirmar o código e logar com a nova senha
- [ ] Usuário consegue entrar via Google/Apple — **bloqueado**: UI e Route Handler
  implementados e testados (botões renderizam, chamada chega em `/api/auth/social`), mas o
  fluxo completo depende de (1) `POST /auth/social` existir no backend e (2) client IDs reais
  configurados no Google Cloud Console / Apple Developer — nenhum dos dois está pronto ainda
