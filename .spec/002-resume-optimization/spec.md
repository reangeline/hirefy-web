# Spec 002: Currículos e otimização com IA (fluxo central do produto)

## Objetivo
Implementar o loop principal do Hirefy no web-app: usuário cria/importa um currículo,
dispara uma otimização com IA contra uma descrição de vaga, acompanha o processamento
assíncrono e vê o resultado otimizado (score de match, sugestões, requisitos faltando,
estimativa salarial). Replica o mesmo fluxo já existente no app mobile, mas adaptado pra web
onde não há push notification nativo (FCM) pra avisar quando o job termina.

Depende de `.spec/001-auth/spec.md` já implementada (sessão via cookie + `Authorization:
Bearer <access_token>` em toda chamada abaixo).

## ⚠️ Achado importante — endpoint principal de import de PDF não existe no backend hoje
O app mobile tem uma tela de "Import PDF Resume" (`resume_pdf_upload_screen.dart`) que é,
pela UX, o caminho mais usado pra criar um currículo. Ela chama
`POST /api/v1/resumes/parse-pdf` (multipart, campo `file`) — **essa rota não está registrada
em `router.go`** e não existe em nenhum outro arquivo do backend (`grep` completo no repo não
encontrou `parse-pdf` nem handler `ParsePdf`). Ou seja, hoje esse fluxo provavelmente está
quebrado até no mobile, não é uma decisão consciente de escopo.

**Implicação pra essa spec:** não dá pra "replicar o mobile" nesse ponto porque o mobile não
tem um backend funcional pra copiar. Duas opções:
1. Web MVP entra só com currículo manual (`POST /resumes/manual`, endpoint real e testado) e
   o import de PDF fica pra quando o backend tiver a rota `parse-pdf` implementada
2. Confirmar com o backend antes de começar — se a rota for pra sair em breve, dá pra
   desenhar a tela de upload já esperando o contrato (multipart, campo `file`) mesmo sem
   poder testar contra um servidor real ainda

Assumindo opção 1 como default até confirmação — ver critério de aceite marcado como
condicional.

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
- Formulário estruturado: dados pessoais, experiências, formação, projetos, idiomas
  (mesmos campos aceitos por `ManualResumeRequestDTO` no backend)
- Salvar chama `POST /resumes/manual` (criação) ou `PUT /resumes/manual/{id}` (edição)

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

## Fora de escopo
- Import de PDF com parsing por IA (`parse-pdf`) — endpoint não existe no backend hoje (ver
  achado acima). Reavaliar quando o backend expuser a rota
- Otimização para LinkedIn (`POST /resumes/linkedin/optimize`) — feature separada
  (carousel/formato próprio), spec própria futura
- Gestão de assinatura/billing/checkout Stripe (`/subscription`, `/subscription/checkout`) —
  spec própria futura
- Upload "cru" via `POST /resumes` (`{ content }`) — não usado pelo mobile, contrato incerto

## Perguntas em aberto
- [ ] Confirmar com o backend se/quando `POST /resumes/parse-pdf` (multipart) vai existir —
  define se dá pra desenhar a tela de import de PDF nesta spec ou só na manual
- [ ] Formato exato de `personal`, `experiences[]`, `education[]`, `projects[]`,
  `languages[]` dentro de `ManualResumeRequestDTO` — backend aceita `map[string]interface{}`
  genérico; levantar o shape real usado pelo mobile (`resume_manual_form.dart`) antes de
  desenhar o formulário
- [ ] Tempo médio real de processamento do job (pra calibrar intervalo/timeout do polling —
  mobile usa 5s/24 tentativas pro LinkedIn, mas é fluxo diferente)
- [ ] Mensagem de erro exata que a worker grava em `job.error` quando falha por falta de
  crédito, pra poder tratar esse caso específico na UI (hoje só sabemos que a checagem
  acontece em `runOptimization`, não o texto retornado)

## Critérios de aceite
- [ ] Usuário cria um currículo manual e ele aparece na listagem
- [ ] Usuário edita um currículo manual existente
- [ ] Usuário dispara uma otimização e vê o job em estado de progresso (sem travar a UI)
- [ ] Polling detecta `completed` e leva o usuário pro resultado automaticamente
- [ ] Polling detecta `failed` e mostra o erro de forma amigável (com destaque pro caso de
  falta de crédito, se identificável)
- [ ] Resultado otimizado exibe score, sugestões, requisitos faltando e (quando houver)
  estimativa salarial
- [ ] Usuário consegue excluir um currículo
- [ ] (Condicional — depende da pergunta em aberto sobre `parse-pdf`) Se o backend expuser a
  rota antes da implementação, incluir também o fluxo de import de PDF
