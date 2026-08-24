# Spec 005: Pipeline de candidaturas (Kanban + Coach de IA + Contatos + Analytics)

## Objetivo
Trazer pro web-app a feature de pipeline de candidaturas que existe no app mobile: um board
estilo Kanban pra rastrear vagas por estágio, integrado ao fluxo de otimização de currículo
(spec 002), com coach de IA por estágio, registro de entrevistas/follow-ups, gestão de
contatos por vaga, e uma aba de analytics.

Depende de `.spec/001-auth/spec.md` (sessão) e se conecta profundamente com
`.spec/002-resume-optimization/spec.md` (o fluxo de adicionar vaga passa por otimizar um
currículo).

## Como foi levantado
Até 2026-08-22 essa feature não existia em nenhum lugar do código (nem mobile, nem backend)
— só na copy de marketing da landing page. Em 2026-08-23 o usuário fez push de um branch
antigo em ambos os repos (`applywise_app` e `backend_hirefy`) que traz a feature completa
dos dois lados. Esta spec foi escrita lendo o código real de ambos, não a copy de marketing.

Arquivos mobile revisados: `pipeline_provider.dart` (734 linhas), `pipeline_service.dart`
(contrato de API), `job_application.dart`/`contact.dart`/`pipeline_analytics.dart` (models),
`pipeline_section.dart` (board embutido na home), `job_detail_screen.dart` (1843 linhas, tela
de detalhe), `add_job_bottom_sheet.dart` (1523 linhas, wizard de adicionar vaga).

Arquivos backend revisados: `pipeline_handler.go` (704 linhas), `pipeline_job.go` (domínio),
`pipeline_analytics.go`, `pipeline_coach_service_impl.go`, `router.go`.

## Endpoints (backend, base `/api/v1`, todos autenticados)
```
GET    /pipeline                              — lista vagas do usuário
POST   /pipeline                              — cria vaga
GET    /pipeline/{jobId}                      — detalhe de uma vaga
PUT    /pipeline/{jobId}                      — atualiza vaga / move de estágio
DELETE /pipeline/{jobId}                      — remove vaga
POST   /pipeline/{jobId}/ghost                — marca como "ghosted" (flag, não estágio)
POST   /pipeline/{jobId}/interview             — registra entrevista
POST   /pipeline/{jobId}/followup              — registra follow-up
POST   /pipeline/{jobId}/coach                — gera conteúdo do coach de IA (consome crédito)
GET    /pipeline/analytics                    — métricas agregadas
GET    /pipeline/{jobId}/contacts             — lista contatos da vaga
POST   /pipeline/{jobId}/contacts             — adiciona contato
DELETE /pipeline/{jobId}/contacts/{contactId} — remove contato
```

### Shape de `PipelineJobResponse` (confirmado em `pipeline_handler.go`)
```
{
  id, user_id, company_name, job_title, location?, stage,
  resume_id?, optimized_resume_id?, ats_score?,
  matched_keywords?: string[], missing_keywords?: string[],
  job_description?, job_url?,
  is_ghosted: bool, is_archived: bool,
  interview_at?, interview_type?,
  timeline?: [{ id, type, label, detail?, created_at }],
  created_at, updated_at
}
```
Todo snake_case — **exceto** `/pipeline/{jobId}/contacts`, que usa `linkedinUrl` (camelCase),
e `/pipeline/analytics`, que é **100% camelCase** (`totalApplications`, `responseRate`, etc).
Três convenções de casing diferentes dentro do mesmo domínio — tratar endpoint por endpoint
no client, não assumir um padrão único (mesmo cuidado já registrado nas specs 001/002 pro
resto da API).

### ⚠️ Achado — só 5 estágios reais no backend, não 6
`pipeline_job.go` define `PipelineJobStage`: `wishlist | applied | interview | offer |
rejected`. `NormalizePipelineJobStage("accepted")` converte pra `offer` na hora de salvar —
**não existe um estágio "Accepted" persistido**.

O board mobile (`pipeline_section.dart`) mostra **6 colunas**, incluindo "Accepted" como
estágio próprio. Isso é um bug real do client mobile: mover um card pra "Accepted" salva
como `stage: "offer"` no backend, e no próximo fetch o card reaparece na coluna "Offer", não
"Accepted" — a UI mobile assume um estágio que o backend não persiste.

**Decisão pro web:** usar os 5 estágios reais do backend (`Wishlist, Applied, Interview,
Offer, Rejected`), sem replicar o "Accepted" separado do mobile. "Ghosted" também não é
estágio — é a flag `is_ghosted`, sinalizada visualmente no card sem mover ele de coluna.

### ⚠️ Achado — campos extras de contexto (offer/rejection) não têm onde ir no backend
O mobile, ao mover uma vaga pra "Offer", abre um diálogo opcional pra "detalhes da oferta"
(`_showOfferDialog`, texto livre tipo "€65,000 + equity") e presumivelmente algo parecido
pra motivo de rejeição, enviados via `extra` no `PUT /pipeline/{jobId}` (mobile:
`moveToStage(jobId, stage, extra: {...})`). **`updatePipelineJobRequest` no backend não tem
campo pra isso** (só os campos padrão do job — sem `offer_amount`/`rejection_feedback`).
Como o Go decodifica JSON em struct tipado, campos desconhecidos no body são
**silenciosamente ignorados**. Ou seja: o usuário mobile pode digitar o valor da oferta e ele
nunca é salvo — não é um bug introduzido por esta spec, é um problema pré-existente no
backend. **Pro web: não construir esse campo de detalhe** até o backend ganhar suporte, pra
não repetir a mesma promessa vazia pro usuário.

### ⚠️ Achado — coach de IA é client-gated E server-gated, e o mobile só trata parte dos erros
O mobile checa `subscriptionProvider.isPro` **antes** de chamar `/coach` (evita custo de API
se já sabe que não é Premium) e mostra um banner de upgrade. Só se essa checagem client-side
passar é que a chamada é feita. O backend, à parte, pode retornar:
- `402 Payment Required` (`ErrInsufficientCredits`)
- `403 Forbidden` (`ErrSubscriptionNotFound` / `ErrSubscriptionInactive`)
- `422` (`ErrForbidden` — "no coach action available for this stage", ex.: Wishlist)

O mobile só trata a string `"Forbidden"`/`"403"` no catch — **não trata 402 separadamente**,
então uma resposta de "sem créditos" (402) provavelmente cai no branch de erro genérico em
vez de mostrar o banner de upgrade certo. Pro web, tratar os três casos explicitamente desde
o início (403 → banner de upgrade, 402 → "sem créditos, comprar mais", 422 → esconder a aba
nesse estágio) em vez de herdar essa lacuna do mobile.

### ⚠️ Achado — "Paste job URL" (step 1 do wizard mobile) não parece ter suporte no backend
`add_job_bottom_sheet.dart` oferece 3 métodos pra adicionar vaga: colar URL (com promessa de
"extraímos tudo automaticamente do LinkedIn/Indeed/Greenhouse"), colar descrição em texto, ou
preencher manualmente. O único método de IA que encontrei no backend é
`ParseJobDescription(content string)` — recebe **texto**, não uma URL; não há nenhum serviço
de scraping/fetch de página no `ai_service.go`. Não confirmei se existe scraping em outro
lugar do backend (não procurei exaustivamente) — **pergunta em aberto**, mas o mais provável
é que "colar URL" também esteja quebrado ou dependa de algo que não localizei.

### ⚠️ Achado — Coach não é gated por plano/Premium no backend (2026-08-24, confirmado no código e ao vivo)
`pipeline_coach_service_impl.go` trata o coach de IA exatamente como a otimização de
currículo: consome 1 crédito do usuário free tier, sem checar `Plan`. `ErrSubscriptionInactive`
(403) só dispara se a assinatura tiver sido cancelada de verdade — não por falta de crédito
(free tier com 0 créditos continua "ativo" via `CurrentPeriodEnd` de 100 anos, ver
`Subscription.IsActive()`). O mobile checa `subscriptionProvider.isPro` **antes** de chamar
`/coach` e bloqueia quem não é Premium — mais restritivo que o backend exige. **Decisão pro
web: não replicar esse gate client-side.** O botão de coach fica sempre disponível (exceto no
estágio Wishlist, que é sempre 422 — esse caso escondemos a ação proativamente, já que é
determinístico), e os erros reais (402 sem crédito, 403 assinatura inativa) são tratados
depois de tentar, com mensagens distintas. **Testado ao vivo:** 402 real disparado com a conta
de teste zerada, mensagem específica exibida corretamente.

### ⚠️ Achado — wizard mobile nunca envia dados reais de `ats_score`/`matched_keywords` ao criar a vaga
`add_job_bottom_sheet.dart`: `atsScore: _isAiParsed ? _parsedAtsScore : 0`, onde
`_parsedAtsScore = 83` é uma constante fixa no código — não vem de nenhuma chamada real de
API. `matched_keywords`/`missing_keywords` nem são incluídos no payload de criação
(`JobApplication(...)` não tem esses campos). Confirmado: é um placeholder/bug do mobile
(provavelmente resquício de uma tela em desenvolvimento), não um contrato de produto — não há
razão pra replicar esse comportamento quebrado. **Decisão pro web: usar dados reais** —
`ats_score` = `match_score` do `OptimizedResume` retornado por
`GET /resumes/optimized/{id}` (arredondado), `missing_keywords` = `missing_requirements`.
`matched_keywords` fica de fora — o resultado de otimização (`OptimizationResult` em
`ai_service.go`) não tem um campo equivalente de "keywords que bateram", só
`missing_requirements`; o campo é opcional no DTO do backend (`omitempty`), então omitir é
seguro.

### ⚠️ Achado — "colar descrição" não extrai empresa/cargo automaticamente
Investigando o achado acima, também confirmei que `JobAnalysis` (retorno de
`ParseJobDescription`, `internal/core/ports/outbound/ai_service.go`) só tem
`RequiredSkills`/`Keywords`/`Experience` — nenhum campo de nome da empresa ou cargo. Não
existe, hoje, nenhum serviço no backend que extraia empresa/cargo de um texto de descrição de
vaga colado. Isso significa que o passo 4 do wizard mobile ("empresa/cargo extraídos,
editáveis") não tem uma fonte de dado real por trás — é outra promessa que a UI mobile faz
sem o backend sustentar. **Decisão pro web: empresa/cargo são sempre campos manuais**,
independente do método escolhido (rápido ou com otimização) — a descrição da vaga colada é
usada só como input pra IA de otimização (matching/score), nunca pra auto-preencher
empresa/cargo. Simplifica o wizard: não existe de fato um "passo de revisão de dados
extraídos" separado, viraria um formulário editável vazio.

### ⚠️ Achado — mobile permite pular a otimização ao adicionar vaga
`add_job_bottom_sheet.dart` tem `_submitWithoutOptimize()`, um caminho que cria a vaga sem
chamar `/resumes/optimize` nem gastar crédito — só com empresa/cargo/local/estágio. A spec
inicial (achados de 2026-08-23) só documentava o fluxo com otimização obrigatória. **Decisão
pro web (confirmada com o usuário): replicar os dois caminhos** — "Adicionar rápido" (sem IA,
sem crédito) e "Adicionar com otimização" (fluxo completo, gasta 1 crédito, entra com score
real).

## Fluxo: adicionar vaga
Dois caminhos, ambos testados ao vivo:

**Adicionar rápido** (`AddJobQuickForm`) — formulário único: empresa\*, cargo\*, localização
(opcional), estágio inicial (default Wishlist) → `POST /pipeline` direto, sem gastar crédito.

**Adicionar com otimização** (`AddJobOptimizeWizard`) — 3 passos:
1. Empresa\*/cargo\*/localização (sempre manuais — ver achado acima) + descrição da vaga\*
   (usada só pro matching de IA)
2. Selecionar currículo (`GET /resumes`)
3. Dispara `POST /resumes/optimize` (spec 002), mesmo polling de `GET
   /resumes/optimize/jobs/{jobID}`; ao completar, busca o `OptimizedResume` e cria a vaga via
   `POST /pipeline` com `ats_score`/`missing_keywords` reais (achado acima). Trata falha
   (crédito insuficiente) com a mesma UX já validada no `OptimizeForm` da spec 002

"Colar URL" e "pending job" ao sair no meio do fluxo continuam fora de escopo (ver achados).

## Requisitos

### Board (embutido na home, `/dashboard`)
- Seção "Meu pipeline" na home, com 2 abas: **Board** e **Analytics** (mesma posição
  relativa do mobile: depois do card de assinatura, antes de qualquer outra coisa)
- Board: 5 colunas roláveis horizontalmente (`Wishlist, Applied, Interview, Offer,
  Rejected`), cards de vaga com empresa/cargo/score
- Card marcado visualmente se `is_ghosted`
- Link/contador de vagas arquivadas, abrindo lista separada

### Detalhe da vaga (`/pipeline/[jobId]` ou modal)
3 abas, espelhando `job_detail_screen.dart`:
- **Coach**: conteúdo gerado por IA contextual ao estágio (`POST /pipeline/{jobId}/coach`),
  cacheado por vaga+estágio; ações de mudar de estágio (aplicar, marcar rejeitado, etc);
  gated por assinatura (ver achado acima)
- **ATS Match**: reaproveita a visualização de resultado otimizado já construída na spec
  002 (score, sugestões, keywords faltando) — mesmo currículo usado na vaga
- **Contatos**: CRUD de contatos da vaga (`GET/POST/DELETE /pipeline/{jobId}/contacts`)

### Adicionar vaga
- Fluxo integrado com otimização (ver seção acima) — reaproveita a tela de otimizar da
  spec 002, com um passo a mais de seleção/confirmação antes
- Método "colar descrição" e "preencher manualmente" no escopo; "colar URL" fora (achado
  acima)

### Analytics
- Aba dentro da seção de pipeline: total de candidaturas, taxa de resposta, score médio,
  entrevistas, ofertas, ghostings, candidaturas da semana, melhor currículo por taxa de
  resposta, distribuição por estágio, atividade semanal
- Vem pronto do backend (`GET /pipeline/analytics` já calcula tudo — `analytics.Compute`),
  não precisa de lógica de agregação no client

## Fora de escopo
- Estágio "Accepted" separado (achado acima — replicar só os 5 estágios reais)
- Campo de detalhe de oferta/motivo de rejeição (achado acima — backend não persiste)
- "Colar URL" como método de adicionar vaga (achado acima — suporte no backend incerto)
- Notificações/lembretes de entrevista (mobile usa notificação local do SO; sem
  equivalente direto na web sem push — spec própria se for pra valer a pena)
- Drag-and-drop entre colunas do Kanban — pode entrar na v1 como ação de menu/botão
  ("mover para...") em vez de arrastar, decisão de implementação, não é bloqueio de spec

## Perguntas em aberto
- [ ] Existe suporte real a "colar URL" (scraping) em algum lugar do backend que não
  encontrei? Confirmar antes de decidir se entra na spec
- [ ] Vale adicionar `offer_amount`/`rejection_feedback` no backend (`updatePipelineJobRequest`)
  já que o dado é claramente do domínio, só não está persistido? Decisão de produto/backend,
  não do web

## ⚠️ Achado — follow-up: mobile e backend não concordam no payload
`pipeline_service.dart` (`logFollowUp`) envia `{channel, message}` — mas
`logFollowUpRequest` no backend (`pipeline_handler.go`) só declara `Detail string`. `channel`
e `message` são descartados silenciosamente pelo decode do Go (mesmo mecanismo do achado de
offer/rejection acima). Ou seja, hoje o mobile registra um follow-up sem canal nem mensagem
de verdade salvos — só o timestamp/evento de timeline. **Pro web: seguir o contrato real do
backend** (`{detail}`), não o que o mobile tenta enviar.

## Critérios de aceite
- [x] Board mostra as vagas do usuário nas 5 colunas corretas, refletindo `GET /pipeline` —
  testado ao vivo (criar vaga, mudar de estágio via Select no card, refletido na coluna certa)
- [x] Usuário adiciona uma vaga passando pelo fluxo de otimização, e ela aparece na coluna
  certa depois — testado ao vivo com IA real (bloqueado por crédito insuficiente na conta de
  teste, mas o fluxo síncrono/erro foi validado ponta a ponta; o caminho de sucesso usa o
  mesmo polling já testado e confirmado na spec 002, não repetido aqui por já estar coberto)
- [x] Usuário adiciona uma vaga rápida, sem otimizar (achado novo, fora do critério original)
  — testado ao vivo, `POST /pipeline` direto sem gastar crédito
- [x] Detalhe da vaga abre com as 3 abas (Coach/ATS Match/Contatos) funcionais — testado ao
  vivo, incluindo estados vazios (ATS Match sem `optimized_resume_id`, Contatos sem contato
  nenhum)
- [x] Coach trata os casos de erro com mensagens distintas — **402 testado ao vivo** (mensagem
  de crédito insuficiente real); **422 tratado proativamente** (ação escondida no estágio
  Wishlist, já que é sempre 422 — não testado via resposta HTTP real, é determinístico);
  **403 implementado mas não testado ao vivo** (exigiria cancelar a assinatura de teste de
  propósito, não fiz isso)
- [x] Contatos: adicionar, listar e remover funcionando — testado ao vivo, ciclo completo
- [x] Aba Analytics mostra os dados reais de `GET /pipeline/analytics` — testado ao vivo,
  métricas refletindo a vaga de teste criada (incluindo `responseRate` zerado corretamente
  por causa do ghosting, confirmando a lógica real do backend)
- [x] Ghosting marca a vaga visualmente sem mudar ela de coluna — testado ao vivo, badge
  "Ghosted" no card e no board, vaga permaneceu na coluna "Entrevista"
- [x] Registrar entrevista e follow-up (não estava nos critérios originais, mas é parte do
  detalhe da vaga) — testado ao vivo; registrar entrevista move a vaga automaticamente pro
  estágio "Entrevista" (comportamento do backend, não do client)

## Status: implementado e testado ao vivo (2026-08-24)
`src/types/pipeline.ts` (novo), 9 Route Handlers em `src/app/api/pipeline/**`, `ApiError` em
`lib/api/client.ts` (expõe status HTTP pra tratar 402/403/422 do coach), board+analytics
embutidos no dashboard (`PipelineSection.tsx`), fluxo de adicionar vaga com os dois caminhos
(`AddJobQuickForm.tsx`, `AddJobOptimizeWizard.tsx`), detalhe da vaga com as 3 abas
(`JobCoachTab.tsx`, `JobAtsMatchTab.tsx`, `JobContactsTab.tsx`) e ações de estágio/ghost/
entrevista/follow-up (`JobActionsCard.tsx`), página de arquivadas. `src/proxy.ts` atualizado
pra proteger `/pipeline/*` (faltava, seria uma rota autenticada acessível sem sessão).

Testado ao vivo, na ordem: adicionar vaga rápida → mover de estágio no board → tentar Coach
(402 real, crédito zerado da spec 002) → ATS Match vazio (vaga sem otimização) → adicionar/
remover contato → registrar entrevista (moveu estágio automaticamente) → registrar follow-up
→ marcar ghosted (permaneceu na coluna) → Analytics refletindo os dados reais → criar
currículo de teste → tentar "Adicionar com otimização" (402 real de novo) → excluir vaga e
currículo de teste. `tsc --noEmit`, `npm run lint` e `npm run build` limpos durante todo o
processo.

Não testado ao vivo: caminho de sucesso completo da otimização integrada (bloqueado por
créditos zerados — mas o mecanismo de polling e criação da vaga com dado real já usa o mesmo
código testado na spec 002) e o 403 do coach (exigiria cancelar a assinatura de teste).

### Revisão de segurança (2026-08-24) — 1 achado corrigido
`contact.linkedinUrl` é texto livre (sem validação de schema em lugar nenhum da pilha) e era
renderizado direto como `href` de um link clicável. Sem checar o protocolo, um valor tipo
`javascript:alert(document.cookie)` salvo nesse campo virava um link que executa JS na origem
do app quando clicado — hoje é essencialmente self-XSS (contatos são dados escopados por
usuário, sem compartilhamento entre contas), mas é defesa em profundidade barata contra
qualquer feature futura de compartilhamento/exportação de contatos. Corrigido em
`JobContactsTab.tsx`: só renderiza como `<a>` se `new URL(value).protocol` for `http:` ou
`https:`; caso contrário, mostra como texto puro (não clicável). Testado ao vivo: URL real
renderiza como link normal, payload `javascript:alert(document.cookie)` renderiza como texto
cinza sem link.
