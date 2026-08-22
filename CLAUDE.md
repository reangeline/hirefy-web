# Hirefy Web App — Contexto do Projeto

## O que é
Front-end web funcional do Hirefy (otimização de currículo com IA para ATS). Espelha as
funcionalidades do app mobile (Flutter/iOS), consumindo o **mesmo backend Go**. Projeto
separado da landing page (`hirefy.com` = landing Next.js existente; este projeto = `app.hirefy.com`).

## Stack
- **Framework:** Next.js 15 (App Router, `src/` dir)
- **Linguagem:** TypeScript (strict mode)
- **Estilo:** Tailwind CSS + shadcn/ui
- **Data fetching:** Server Components para carga inicial · TanStack Query (React Query) para
  interações client-side (mutations, refetch, cache otimista)
- **Auth:** nunca fala com Cognito diretamente. Login/signup/refresh chamam os endpoints REST
  do backend Go (`/api/v1/auth/*`), igual o app mobile — sem SDK de Cognito no front. Telas de
  login/signup próprias.
- **Pagamento:** Stripe Checkout (hospedado) — só relevante quando o billing web for ativado
- **Deploy:** Vercel

## Backend (não modificar por aqui — é repo separado)
- Go, rodando atrás de AWS API Gateway
- DynamoDB single-table design (PK/SK + GSI) — **acesso sempre via backend**, nunca direto do front
- Auth: JWT emitido pelo Cognito, validado pelo backend via Authorizer do API Gateway
- Base URL da API: `NEXT_PUBLIC_API_BASE_URL` (ver `.env.local`)

## Auth — como funciona aqui
- **Nunca falamos com o Cognito diretamente.** Login/signup/refresh chamam os endpoints REST
  do próprio backend Go (`/api/v1/auth/*`), exatamente como o app mobile faz — sem SDK de
  Cognito no front. Ver `.spec/001-auth/spec.md` para o contrato completo
- Chamadas de auth passam por Route Handlers (`/api/auth/login`, `/refresh`, `/logout`),
  nunca direto do client
- Tokens (access, id, refresh) ficam em **cookies httpOnly, secure, sameSite=lax** —
  setados pelo Route Handler, nunca acessíveis via JS no browser
- Header nas chamadas autenticadas: `Authorization: Bearer <access_token>` (nunca id_token)
- Refresh é **manual** (não existe SDK fazendo isso) — o wrapper `lib/api/client.ts`
  intercepta 401, chama `/api/auth/refresh` com single-flight lock (evita refresh duplicado
  em chamadas concorrentes), reenvia a chamada original. Replica o mesmo padrão já usado no
  mobile (`_tokenRefresher` do `ApiService`)
- **Atenção:** o backend retorna chaves de token ora em PascalCase, ora em snake_case — o
  parser de resposta de auth trata os dois formatos defensivamente
- Proxy (`src/proxy.ts` — renomeado de "Middleware" a partir do Next.js 16, mesma API)
  protege rotas de `(dashboard)` redirecionando para `/login` se não houver sessão válida

## Estrutura de pastas
```
src/
  app/
    (auth)/
      login/
      signup/
    (dashboard)/
      dashboard/
      resume/[id]/
      optimize/
      profile/
      billing/
    api/                 # Route Handlers (auth BFF, webhooks Stripe se necessário)
  components/
    ui/                  # shadcn/ui — não editar manualmente, usar `npx shadcn add`
    resume/
    dashboard/
  lib/
    api/
      client.ts          # wrapper fetch tipado com auth
      resume.ts           # funções de chamada por domínio (ex: getResumes, optimizeResume)
    auth/
      session.ts           # leitura/escrita de cookies de sessão
    hooks/
  types/
    api.ts                # tipos espelhando os DTOs do backend Go
.spec/                    # specs por feature (spec-driven development — ver abaixo)
```

## Convenções de código
- Server Components por padrão. Só usar `"use client"` quando precisar de interatividade,
  hooks de estado ou TanStack Query
- Nunca chamar o backend Go direto do client — sempre via Route Handler ou Server Component,
  exceto para endpoints que já retornam dados não sensíveis e o TanStack Query precisa
  revalidar no client (nesse caso, o Route Handler funciona como proxy)
- Nomes de arquivo de componente: `PascalCase.tsx`. Hooks: `useCamelCase.ts`
- Tipos de API ficam em `types/api.ts`, espelhando exatamente os DTOs do backend — se o
  backend mudar um contrato, esse arquivo é o primeiro a atualizar
- Sem `any` — se o tipo do backend for incerto, marcar com `// TODO: confirmar shape` e usar
  `unknown` com narrowing

## Spec-Driven Development
Antes de implementar qualquer feature nova, criar a spec em `.spec/NNN-nome-da-feature/spec.md`
seguindo o padrão:
```
## Objetivo
## Requisitos
## Fora de escopo
## Critérios de aceite
```
Implementação só começa depois da spec revisada. Ao pedir implementação, referenciar o
arquivo da spec explicitamente no prompt.

## O que NÃO fazer
- Não usar RevenueCat aqui — é exclusivo do mobile. Billing web é 100% Stripe
- Não guardar token em `localStorage` ou `sessionStorage`
- Não duplicar lógica de negócio do backend Go no front — front só orquestra chamadas e exibe
- Não misturar este repo com o da landing page
