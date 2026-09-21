# Spec 022 — Persistir conteúdo gerado por IA (evitar regeneração desnecessária)

## Objetivo

Economizar chamadas de IA (custo real em créditos/dinheiro): uma vez que algo foi gerado por
IA, deve ficar salvo e ser reaproveitado, não regenerado toda vez que a tela é reaberta. Pedido
do usuário citou dois exemplos: o Guia de Preenchimento do LinkedIn e "várias coisas feitas por
IA" numa vaga do pipeline.

Investigação (backend + frontend) mapeou o estado real de todo conteúdo gerado por IA no app —
a maioria já estava cacheada corretamente; só duas lacunas reais:

| Feature | Estado antes | Custo |
|---|---|---|
| Otimização de currículo | ✅ Já cacheado | 1 crédito |
| Guia de preenchimento LinkedIn | ✅ Persistido, mas sem forma de *achar* um guia antigo — só criar um novo | 1 crédito |
| **Coach de pipeline** | ❌ Nada salvo — cada visita/F5 cobrava de novo | 1 crédito por visita |
| Prática de entrevista | ✅ Já persistida (gerar pergunta é grátis de propósito) | 1 crédito só na avaliação |
| Temas de post LinkedIn | ✅ Já cacheado | grátis |
| **Rascunho de post LinkedIn** | ❌ Nunca persistia | grátis (sem freio) |
| Scan de perfil LinkedIn | ✅ Já cacheado | grátis |

## Requisitos

### Backend (`backend_hirefy`)
- Novo `domain.CoachSuggestion` + `CoachSuggestionRepository` (Dynamo, singleton por
  `PK=USER#<id>`, `SK=JOB#<jobID>#COACH#<stage>`, sem histórico — mesmo padrão de
  `LinkedInPostIdeasRepository`/`LinkedInScanRepository`).
- `pipeline_coach_service_impl.Coach()`: se `ForceRegenerate` for falso, tenta o cache
  primeiro; só chama IA/cobra crédito em cache miss ou regeneração forçada. Novo método
  `GetCachedCoach` (só leitura, 404 se nunca gerado). Novo `GET /pipeline/{jobId}/coach?stage=X`.
  `POST` ganha campo opcional `force`.
- `domain.LinkedInPostTopic` ganha campo `Draft`. `DraftPost` persiste o resultado de volta no
  tema correspondente (por índice, com checagem de sanidade pelo título) via o
  `LinkedInPostIdeasRepository` já existente — sem repositório novo, já que `GetLatestTopics`
  devolve a lista inteira com os rascunhos salvos de graça.

### Frontend (`web-app`)
- `JobCoachTab.tsx`: checa `GET .../coach?stage=X` no mount antes de mostrar a tela de
  "Gerar" — mostra o conteúdo salvo direto se existir. Botões "Regenerar"/"Tentar de novo"
  mandam `force: true` explicitamente.
- `LinkedInPostTopics.tsx`: inicializa o estado de cada tema a partir de `topic.draft` (se
  existir) em vez de sempre partir de "idle"; manda o índice do tema no POST de gerar/regenerar.
- `/linkedin/fill`: lista os guias já gerados (via `GET /api/resumes/optimized`, filtrando
  `parsed_data?.type === "linkedin"`) acima do formulário de gerar um novo.

## Fora de escopo

- Nenhuma mudança nas features já corretamente cacheadas (currículo, temas de post, scan,
  prática de entrevista).
- Invalidação automática do cache do Coach quando os dados da vaga mudam — fica até o usuário
  clicar "Regenerar" explicitamente, mesmo padrão "sem histórico" já usado em
  LinkedInPostIdeas/LinkedInScan.
- Histórico de múltiplas gerações de coach por estágio (só a mais recente fica salva).

## Critérios de aceite

- [x] Gerar coaching numa vaga → sair da aba → voltar (inclusive F5) → conteúdo salvo aparece
      sem gastar crédito de novo. Confirmado ao vivo (ver log.md): `GET
      /api/pipeline/{jobId}/coach?stage=X` retorna o conteúdo salvo; reload da página mostra o
      texto direto, sem tela de "Gerar".
- [x] Clicar "Regenerar" força uma geração nova (conteúdo muda) e sobrescreve o cache.
      Confirmado ao vivo: segunda geração com texto diferente da primeira, refletido também no
      GET de leitura.
- [x] Gerar rascunho de post LinkedIn pra um tema → sair/voltar (F5) → rascunho persiste;
      outros temas não afetados. Confirmado ao vivo.
- [x] Gerar um guia de LinkedIn → voltar pra `/linkedin/fill` → guia aparece numa lista de
      "Guias já gerados"; clicar nele abre o guia salvo. Confirmado ao vivo (conta de teste já
      tinha 3 guias de sessões anteriores, listados e navegáveis corretamente).
- [x] `go build/vet/test` (backend) e `tsc`/`eslint`/`npm run build` (frontend) limpos.
- [x] **Addendum**: Prática de entrevista e ATS Match não tinham o bug de regeneração
      original (confirmado por investigação de código, sem mudança necessária), mas a
      resposta do usuário e o histórico de entrevista completo — já persistidos no backend —
      não eram reexibidos na UI. Corrigido: `InterviewEvaluation` mostra `question.answer`;
      cards do histórico ficaram clicáveis e reabrem a resposta+avaliação completas.
      Confirmado ao vivo.
