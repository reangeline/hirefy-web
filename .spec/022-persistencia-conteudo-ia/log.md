# Log — Spec 022: Persistir conteúdo gerado por IA

**Data:** 2026-09-20 / 2026-09-21

## O que foi implementado

**`backend_hirefy`** (commit `91167bf` em `develop`):
- `internal/core/domain/coach_suggestion.go` (novo) — `CoachSuggestion{UserID, JobID, Stage,
  Content, Type, CreatedAt, UpdatedAt}` + `ErrCoachSuggestionNotFound` em `erros.go`.
- `internal/core/ports/outbound/coach_suggestion_repository.go` (novo) +
  `internal/adapters/outbound/persistence/dynamodb/coach_suggestion_repository_impl.go`
  (novo) — singleton por `PK=USER#<id>`, `SK=JOB#<jobID>#COACH#<stage>`, mesmo padrão de
  `LinkedInPostIdeasRepository`/`LinkedInScanRepository`.
- `pipeline_coach_service_impl.go`: `Coach()` checa o cache antes de gerar (a menos que
  `ForceRegenerate`); salva o resultado via `Upsert` depois de gerar. Novo método
  `GetCachedCoach` (só leitura).
- `pipeline_handler.go` + `router.go`: novo `GET /pipeline/{jobId}/coach?stage=X`; `POST`
  ganha campo opcional `force` no body.
- `cmd/api/main.go`: `coachSuggestionRepo` injetado nos dois pontos de instanciação de
  `NewPipelineCoachService` (init + runLocalServer).
- `domain.LinkedInPostTopic` ganha `Draft string`. `LinkedInPostTopicItem` (Dynamo) ganha
  `Draft` com `dynamodbav` tag, mapeado nos dois sentidos.
- `inbound.DraftPostRequest` ganha `TopicIndex int`. `linkedin_post_service_impl.DraftPost`
  persiste o resultado de volta no tema correspondente via `postIdeasRepo.Upsert` (falha
  silenciosa — loga, não bloqueia a resposta — se a persistência falhar).
- `linkedin_post_handler.go`: `draftPostRequestDTO` ganha `Index int`.

**`web-app`** (commits `0cb80fd` + `7567ec3` em `develop`):
- `src/app/api/pipeline/[jobId]/coach/route.ts` — novo `GET`, proxy pro endpoint novo do
  backend.
- `src/types/pipeline.ts` — `CoachRequest.force?: boolean`.
- `src/components/pipeline/JobCoachTab.tsx` — checa o cache no mount (`hasCheckedCache`
  state, setado só via callback `.finally()` pra não violar `react-hooks/set-state-in-effect`);
  mostra o conteúdo salvo direto se existir; `generateCoaching(force)` threading `force` pros
  botões "Gerar" (false) vs. "Regenerar"/"Tentar de novo" (true).
- `src/types/linkedin.ts` — `LinkedInPostTopic.draft?: string`.
- `src/app/api/linkedin-post-topics/draft/route.ts` — repassa `index` no body.
- `src/components/linkedin/LinkedInPostTopics.tsx` — inicializa `drafts` a partir de
  `topic.draft` (lazy initializer do `useState`); manda `index: i` no POST.
- `src/app/[locale]/(dashboard)/linkedin/fill/page.tsx` — busca `GET /api/resumes/optimized`
  no mount, filtra `parsed_data?.type === "linkedin"`, ordena por mais recente, renderiza
  seção "Guias já gerados" acima do formulário.
- Chaves de tradução novas em `pipeline.json` (`jobCoachTab.checkingSaved`) e
  `linkedin.json` (`fillPage.pastGuidesHeading`, `fillPage.unnamedGuide`) nos 3 locales
  (pt/en/es).

## Decisões tomadas durante a execução que não estavam explícitas na spec original

- **Rascunho de post reaproveita o repositório existente** em vez de um novo — como
  `GetLatestTopics` já devolve a lista inteira de temas, adicionar `Draft` ao struct existente
  faz o rascunho salvo chegar de graça no frontend, sem endpoint de leitura novo. Decisão
  técnica, não fazia sentido perguntar.
- **`react-hooks/set-state-in-effect`**: o primeiro rascunho de `JobCoachTab.tsx` chamava
  `setCheckingCache(true)` de forma síncrona no corpo do efeito (antes do fetch), o que o lint
  rejeita (mesma regra que já tinha aparecido antes, spec 003/020). Corrigido derivando o
  estado inicial (`hasCheckedCache`) a partir de `job.stage` no `useState`, e só setando via
  callback `.finally()` — mesmo padrão já usado em `JobInterviewTab.tsx` (nunca teve esse
  problema porque nunca setava um "loading" síncrono, só derivava de `history === null`).

## Divergência entre o planejado e o executado

Nenhuma divergência de escopo — o plano aprovado (Plan Mode) foi seguido à risca nas três
partes (Coach, Rascunho de post, Descoberta de guias).

## Testado ao vivo

Backend: `go build/vet/test` limpos; CI verde em `develop`; deploy automático em dev
confirmado via `gh run watch`.

Frontend: `tsc --noEmit`, `eslint src --quiet`, `npm run build` limpos; CI verde em `develop`;
preview do Vercel realiasado pra `hirefy-web-git-develop-...vercel.app`.

Verificação ao vivo com a conta de teste (Premium) na URL de preview de dev:

- **Coach de pipeline** (vaga "MAVI", estágio Aplicado): "Gerar coaching" → conteúdo aparece.
  `GET /api/pipeline/{jobId}/coach?stage=applied` retorna o mesmo conteúdo salvo. Reload
  completo da página (F5) mostra o texto direto, sem passar pela tela de "Gerar" — confirma o
  cache-hit funcionando de ponta a ponta no ambiente real. Clicar "Gerar de novo" produz um
  texto visivelmente diferente do anterior, e o GET de leitura reflete o texto novo — confirma
  que `force: true` ignora o cache e o `Upsert` sobrescreve corretamente.
  - Não foi possível usar o consumo de crédito como sinal de verificação: a única conta de
    teste disponível é Premium (créditos ficaram em 3 antes/depois, sem decrementar) —
    consistente com o comportamento esperado pro plano pago, mas não testa o caminho Free.
- **Rascunho de post LinkedIn**: gerar post pro tema 0 ("Applying Clean Architecture...") →
  reload completo da página → o rascunho aparece direto (mesmo texto), enquanto o tema 1
  (nunca gerado) continua mostrando o botão "Gerar post" normalmente — confirma que a
  persistência é por índice e não vaza entre temas.
- **Guias de LinkedIn já gerados**: `/linkedin/fill` já mostrava 3 guias de sessões
  anteriores (14/09/2026), listados com headline + data, ordenados corretamente. Clicar num
  deles abriu o guia salvo (`/linkedin/fill/{id}`) com o conteúdo completo — confirma que a
  lista de descoberta funciona com dados reais já existentes na conta, sem precisar gerar um
  guia novo pra provar o fluxo.

Nenhuma pendência aberta nesta spec — todos os critérios de aceite foram fechados com
verificação ao vivo.
