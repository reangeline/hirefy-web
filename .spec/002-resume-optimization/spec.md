# Spec 002: Currículos e otimização com IA (fluxo central do produto)

## Objetivo
Implementar o loop principal do Hirefy no web-app: usuário cria/importa um currículo,
dispara uma otimização com IA contra uma descrição de vaga, acompanha o processamento
assíncrono e vê o resultado otimizado (score de match, sugestões, requisitos faltando,
estimativa salarial). Replica o mesmo fluxo já existente no app mobile, mas adaptado pra web
onde não há push notification nativo (FCM) pra avisar quando o job termina.

Depende de `.spec/001-auth/spec.md` já implementada (sessão via cookie + `Authorization:
Bearer <access_token>` em toda chamada abaixo).

## ✅ Resolvido em 2026-08-23 — import de PDF agora existe, e resolve a pergunta do shape
O usuário fez push de um branch antigo do `backend_hirefy` que implementa
`POST /resumes/parse-pdf` de verdade (`resumeHandler.ParsePDFResume`, multipart, campo
`file`, até 10MB). Dois achados importantes:

1. **É rota pública, sem autenticação** (registrada antes do grupo com `AuthMiddleware` em
   `router.go`) — bate com a UX que a landing anuncia ("score de ATS grátis, sem criar
   conta"). O web pode oferecer isso até na home, antes do signup.
2. **A resposta não é persistida** — `ParsePDFResume` no service
   (`resume_optimizer_service_impl.go`) gera um `id` temporário e não grava nada no banco.
   É só um preview: o client recebe o currículo parseado + `ats_score` +
   `ats_improvements`, mostra pro usuário, e só se ele quiser salvar de verdade é que precisa
   chamar `POST /resumes/manual` separadamente com os mesmos dados.

**Isso também resolve a pergunta em aberto sobre o shape de `personal`/`experiences[]`/etc**
(ver seção "Requisitos" → "Criar/editar currículo manual"): o prompt da IA em
`ai_service_impl.go` (`ParseResumeFromText`) define o schema exato que `parse-pdf` retorna —
e como o próprio código comenta, é "shaped like a manual resume", ou seja, o mesmo shape que
`POST /resumes/manual` espera receber.

### Shape real de `parsed_data` (confirmado no prompt da IA, não é mais suposição)
```
personal: {
  full_name, email, phone, current_role, country, state, city,
  linkedin_url, website_url, github_url, summary   // todos string | null
}
experiences: [{ role, company, start_date, end_date, is_current, description }]
education: [{ institution, degree, start_date, end_date, is_current }]
projects: [{ name, url, description }]
languages: [{ language, proficiency }]
ats_score: number        // 0–100
ats_improvements: string[]
```
**Diverge do que a UI mock (spec 002, passe de UI de 2026-08-22) assumiu** —
`src/types/resume.ts` usa `fullName`/`link`/`name`+`level` em vez de
`full_name`/`url`/`language`+`proficiency`, e não tem `current_role`/`country`/`state`/`city`
separados (só um `location` genérico). **Precisa de refactor nos tipos e no formulário antes
de ligar na API de verdade** — não é só trocar a chamada, os campos do form também mudam.

## Endpoints consumidos (backend, base `/api/v1`, todos autenticados)
- `POST /resumes/manual` — body: `{ nickname?, personal, experiences[], education[],
  projects[], languages[] }` → cria currículo estruturado (`type: "manual"`)
- `PUT /resumes/manual/{resumeID}` — edita um currículo manual existente
- `GET /resumes` — lista currículos do usuário (originais, não otimizados)
- `GET /resumes/{resumeID}` — detalhe de um currículo
- `DELETE /resumes/{resumeID}` — remove currículo
- `POST /resumes/optimize` — body: `{ resume_id, job_description, target_company?,
  target_role? }` → **202 Accepted**, retorna o `OptimizationJob` recém-criado (status
  `queued`), não o resultado. Enfileira via SQS, processado pela worker Lambda
- `GET /resumes/optimize/jobs/{jobID}` — status do job: `{ id, status, error?,
  optimized_resume_id?, ... }` — `status` ∈ `queued | processing | completed | failed`
- `GET /resumes/optimized` — lista currículos já otimizados
- `GET /resumes/optimized/{optimizedID}` — detalhe do resultado otimizado (ver shape abaixo)
- `PUT /resumes/optimized/{optimizedID}` — edita um resultado otimizado
- `POST /resumes` — body: `{ content }` (string) → upload "cru" de currículo; **endpoint
  existe no backend mas não é usado pelo app mobile hoje** (nenhuma chamada encontrada em
  `resume_service.dart`) — não usar como base pro fluxo de PDF; formato de `content` não está
  claro (texto extraído? base64?) e não foi validado em produção

### Shape de `OptimizedResume` (retorno de `GET /resumes/optimized/{id}`)
```
{
  id, user_id, resume_id, source_resume_id, job_description_id,
  optimized_content, parsed_data,
  match_score: number,
  suggestions: string[],
  missing_requirements: string[],
  salary_estimate?: { found, currency?, min_salary?, max_salary?, midpoint?, period?,
                       location?, seniority?, notes?, disclaimer? },
  created_at
}
```

## Requisitos

### Listagem de currículos (`/resume` ou dentro de `/dashboard`)
- Lista os currículos do usuário (`GET /resumes`)
- Cada item com ação de otimizar, editar (se manual) ou excluir
- Estado vazio: CTA pra criar o primeiro currículo

### Criar/editar currículo manual (`/resume/new`, `/resume/[id]/edit`)
- Formulário estruturado: dados pessoais, experiências, formação, projetos, idiomas — campos
  exatos definidos na seção "Shape real de `parsed_data`" acima
- Salvar chama `POST /resumes/manual` (criação) ou `PUT /resumes/manual/{id}` (edição)

### Import de PDF (`/resume/new` — opção alternativa ao formulário manual)
- Upload de PDF → `POST /resumes/parse-pdf` (multipart, campo `file`, até 10MB) — **rota
  pública, não precisa de sessão**
- Mostra o resultado parseado (score de ATS + sugestões + dados extraídos) como preview —
  a chamada **não salva nada**, é só parsing
- Usuário revisa/edita os campos extraídos (reaproveitar o mesmo formulário de
  criar/editar manual, pré-preenchido) e só persiste de fato ao confirmar, via
  `POST /resumes/manual`
- Por ser rota pública, dá pra considerar oferecer essa prévia (score de ATS grátis) direto
  na home (`/`), antes do signup — igual a landing anuncia ("Try it before even creating an
  account"). Decisão de produto, não obrigatório pra fechar esta spec

### Otimizar currículo (`/resume/[id]/optimize` ou modal a partir da listagem)
- Formulário: descrição da vaga (obrigatório), empresa alvo e cargo alvo (opcionais)
- Submit chama `POST /resumes/optimize` e recebe o job em `queued` — **não é resultado
  pronto**, mesmo padrão assíncrono do backend/mobile
- **Decisão de arquitetura pra web (mobile usa FCM, browser não tem isso nativamente):**
  fazer polling em `GET /resumes/optimize/jobs/{jobID}` (ex.: TanStack Query com
  `refetchInterval`, parando quando `status` for `completed`/`failed`) — mesmo padrão que o
  próprio mobile já usa pro fluxo de LinkedIn (`pollLinkedInJob`, ~5s de intervalo, timeout
  em torno de 2min)
- Enquanto `queued`/`processing`: tela de progresso, sem bloquear navegação (usuário pode
  sair e voltar depois — o job continua no backend)
- `completed`: redireciona pro resultado (`optimized_resume_id` do job → `/resume/optimized/
  [id]`)
- `failed`: exibe `error` do job. Caso de erro mais comum a tratar de forma amigável: usuário
  sem créditos suficientes (checado pela worker, não pelo endpoint síncrono — o 202 sempre
  sucede, a falha por falta de crédito só aparece no polling)

### Resultado otimizado (`/resume/optimized/[id]`)
- Exibe `match_score`, `suggestions`, `missing_requirements`, `salary_estimate` (se
  `found: true`) e o conteúdo otimizado
- Permite editar (`PUT /resumes/optimized/{id}`)
- Lista de otimizados anteriores acessível separadamente (`GET /resumes/optimized`)

### Créditos/assinatura (leitura, não gestão)
- Antes de permitir otimizar, considerar checar `GET /subscription/credits` pra avisar o
  usuário proativamente se ele já está sem crédito — evita o ciclo de "esperar o polling só
  pra descobrir que faltou crédito". Gestão de assinatura/billing em si fica pra spec própria
  (fora de escopo aqui)

## Status de implementação (2026-08-22 — passe de UI, a pedido do usuário)
Construídas as telas com **dados mock**, sem ligação com o backend ainda — decisão explícita
do usuário ("começar pelo UI"), já que o formato exato de `personal`/`experiences[]`/etc não
está confirmado (pergunta em aberto abaixo) e não fazia sentido gastar esforço acertando o
contrato antes de validar o layout:
- `src/app/(dashboard)/resume/page.tsx` — listagem, com estado vazio
- `src/app/(dashboard)/resume/new/page.tsx` + `[id]/edit/page.tsx` — `ResumeForm`
  compartilhado, com seções repetíveis (experiências/formação/projetos/idiomas,
  adicionar/remover funcional via estado local)
- `src/app/(dashboard)/resume/[id]/optimize/page.tsx` — formulário + simulação do job
  assíncrono (queued → processing → completed, com temporizadores fixos no lugar do
  polling real em `GET /resumes/optimize/jobs/{jobID}`)
- `src/app/(dashboard)/resume/optimized/[id]/page.tsx` — resultado (score, sugestões,
  requisitos faltando, estimativa salarial)
- `src/types/resume.ts` + `src/lib/mock/resumes.ts` — tipos e dados fake; os tipos são uma
  **proposta**, não o contrato confirmado do backend

Nada disso chama `POST /resumes/manual`, `POST /resumes/optimize`, ou qualquer outro
endpoint real ainda — os botões "Criar currículo"/"Otimizar" resolvem com timeout local e
navegam com dado mock. Ligar em API de verdade é o próximo passo, depois de validar o
layout com o usuário.

Testado ao vivo (Chrome, com sessão real da spec 001): listagem, criar, editar (com
pré-preenchimento), simulação de otimização ponta a ponta até o resultado. Um bug real foi
encontrado e corrigido durante o teste: o `Select` de nível de idioma (Base UI) mostrava o
valor cru (`"intermediario"`) em vez do label (`"Intermediário"`) no estado fechado — corrigido
passando `items={LANGUAGE_LEVELS}` pro `Select.Root`, que resolve o label automaticamente.

## Fora de escopo
- Otimização para LinkedIn (`POST /resumes/linkedin/optimize`) — feature separada
  (carousel/formato próprio), spec própria futura
- Gestão de assinatura/billing/checkout Stripe (`/subscription`, `/subscription/checkout`) —
  spec própria futura
- Upload "cru" via `POST /resumes` (`{ content }`) — não usado pelo mobile, contrato incerto

## Perguntas em aberto
- [x] Confirmar com o backend se/quando `POST /resumes/parse-pdf` vai existir — resolvido
  em 2026-08-23, rota pública já existe
- [x] Formato exato de `personal`/`experiences[]`/`education[]`/`projects[]`/`languages[]` —
  resolvido em 2026-08-23, via o prompt da IA em `ai_service_impl.go` (ver shape acima).
  Ainda não confirmado se `POST /resumes/manual` (o endpoint de fato, diferente do
  `parse-pdf`) valida/espera exatamente esse mesmo shape ou é mais permissivo — o comentário
  no código sugere que sim ("shaped like a manual resume"), mas vale testar antes de fechar
- [ ] Tempo médio real de processamento do job (pra calibrar intervalo/timeout do polling —
  mobile usa 5s/24 tentativas pro LinkedIn, mas é fluxo diferente)
- [ ] Mensagem de erro exata que a worker grava em `job.error` quando falha por falta de
  crédito, pra poder tratar esse caso específico na UI (hoje só sabemos que a checagem
  acontece em `runOptimization`, não o texto retornado)

## Critérios de aceite
- [x] Usuário cria um currículo manual e ele aparece na listagem — **UI only**: funciona com
  dado mock, não persiste de verdade (sem `POST /resumes/manual`)
- [x] Usuário edita um currículo manual existente — **UI only**, mesma ressalva
- [x] Usuário dispara uma otimização e vê o job em estado de progresso (sem travar a UI) —
  **UI only**: simulado com `setTimeout`, não é `POST /resumes/optimize` real
- [ ] Polling detecta `completed` e leva o usuário pro resultado automaticamente — simulado
  (timeout fixo leva ao resultado), **polling real em `GET /resumes/optimize/jobs/{jobID}`
  ainda não implementado**
- [ ] Polling detecta `failed` e mostra o erro de forma amigável — não implementado (não
  simulei o caminho de falha ainda)
- [x] Resultado otimizado exibe score, sugestões, requisitos faltando e (quando houver)
  estimativa salarial — implementado e testado ao vivo, com dado mock
- [x] Usuário consegue excluir um currículo — **UI only**, remove só do estado local (sem
  `DELETE /resumes/{id}`)
- [ ] Usuário consegue importar um PDF, ver o preview (score + dados extraídos) e confirmar
  pra salvar — **não implementado ainda**, endpoint liberado em 2026-08-23, UI a construir

**Nenhum critério está de fato fechado** — todos os `[x]` acima são sobre o comportamento da
UI isolada, não sobre o fluxo real contra o backend. Ligar em API de verdade (endpoints já
mapeados na seção acima) é o próximo passo.
