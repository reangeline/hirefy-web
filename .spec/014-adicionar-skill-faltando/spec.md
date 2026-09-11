# Spec 014: Adicionar skill/requisito faltando direto no currículo

## Objetivo
Hoje a aba ATS Match (spec redesenhada recentemente) mostra quais palavras-chave e
requisitos da vaga o currículo não cobre, mas é só informativo — o usuário lê a lista e
precisa ir editar o currículo manualmente em outra tela pra aplicar qualquer coisa. Essa
spec fecha esse ciclo: cada item faltando ganha um botão "Adicionar ao currículo" que gera
uma sugestão de frase via IA, o usuário revisa/edita, e confirma — sem sair da tela.

Referência visual trazida pelo usuário: o editor de rich-text com diff inline da Jobscan
(texto todo editável, marcação verde/vermelha, popover de Aceitar/Rejeitar por trecho).
**Decisão explícita do usuário**: não replicar esse editor completo (custo de engenharia
muito maior — diff de rich-text do zero) — em vez disso, reusar o checklist que já existe,
com um botão de ação por item que abre um campo de texto editável inline.

## Decisões confirmadas com o usuário
- **Escopo do editor**: lista com botão "Adicionar" por item (não o editor de rich-text
  completo da referência).
- **Honestidade da sugestão**: a IA escreve uma frase pronta alegando a experiência/skill
  (ex: "Built services in Java"), mesmo que o currículo base não mostre isso — cabe ao
  usuário decidir se é verdade antes de confirmar. Diferente do padrão já usado em
  `SuggestApplyAnswer` (spec 011), que explicitamente instrui a IA a nunca inventar
  experiência — aqui é o oposto, por decisão direta do usuário. Isso precisa ficar comentado
  no código pra não parecer inconsistência/bug numa revisão futura.

## Investigação (antes de implementar)

- `OptimizedResultView` (recém redesenhado) já lista os gaps em dois lugares: checklist de
  `missingKeywords` (props opcionais vindas de `job.missing_keywords`) e
  `optimized.missing_requirements` — os dois viram alvo do botão "Adicionar".
- **Aplicar a sugestão no currículo já tem toda a infra pronta, sem endpoint novo**:
  `GET /resumes/{id}` (`resume_handler.go`, já proxied em `api/resumes/[id]/route.ts`) pra
  buscar o currículo atual, e `PUT /resumes/manual/{id}` (`UpdateManualResume`, já proxied em
  `api/resumes/manual/[id]/route.ts`) pra salvar — esse endpoint sobrescreve `ParsedData` por
  campo enviado, sem checar `Type` do currículo (funciona pra currículo manual OU importado
  de PDF, confirmado lendo `UpdateManualResume` no handler).
- **Só falta o endpoint de sugestão** — não existe hoje. Novo método na `AIService`
  (`SuggestResumeAddition`), seguindo o mesmo padrão de `SuggestApplyAnswer`
  (`ai_service_impl.go:878`): prompt pontual, `callOpenAI` com temperatura baixa, parse de
  JSON com fallback de `sanitizeJSON`.
- Rota nova segue o padrão de `router.go:101` (`GET /resumes/{resumeID}`) —
  `POST /resumes/{resumeID}/suggest-addition`.
- Sem crédito envolvido — resume stuff é grátis desde a spec 013.

## Requisitos

### Backend (`backend_hirefy`)
1. `outbound.AIService` ganha `SuggestResumeAddition(ctx, *ResumeAdditionInput) (*ResumeAdditionResult, error)`.
   Input: `Gap` (a palavra-chave ou requisito faltando), `JobTitle`, `CompanyName`,
   `JobDescription`, `ResumeData`. Output: `SuggestedText`.
2. Prompt em `ai_service_impl.go` (mirror de `SuggestApplyAnswer`, `sem` a instrução de
   "nunca inventar experiência" — comentário no código explicando o porquê da diferença,
   linkando essa spec): escreve UMA frase pronta, primeira pessoa, plausível de entrar no
   resumo profissional, mencionando a skill/requisito de forma natural.
3. Novo método `SuggestAddition` em `inbound.ResumeOptimizerService` (ou serviço equivalente
   já usado por `resume_optimizer_service_impl.go`) — busca o `Resume` (`resumeRepo.GetResume`,
   sem checar créditos/plano), sanitiza o input (mesmo padrão `security.SanitizeForPrompt`/
   `ValidateShortField` já usado em outros lugares), chama `aiService.SuggestResumeAddition`.
4. Handler + rota: `POST /resumes/{resumeID}/suggest-addition`, body
   `{gap, job_title, company_name, job_description}`, resposta `{suggested_text}`.

### Web-app (`web-app`)
5. Novo componente (ex: `AddGapToResumeRow.tsx`) usado nas duas listas de gap do
   `OptimizedResultView.tsx` (palavras-chave faltando e requisitos faltando). Estado por
   item: `idle` (botão "+ Adicionar ao currículo") → `loading` (chamando a IA) → `editing`
   (Textarea preenchida com a sugestão, editável, botões "Adicionar ao currículo"/"Cancelar")
   → `saving` → `done` (confirmação, sem navegar pra outra página).
6. Ao confirmar: busca o currículo atual (`GET /api/resumes/{resumeId}`), anexa o texto
   (editado ou não) ao `personal.summary` existente, faz `PUT /api/resumes/manual/{resumeId}`
   reenviando o objeto completo (contrato hoje é replace, não patch).
7. Só aparece quando há `resume_id`/`job_title`/`company_name`/`job_description` disponíveis
   — ou seja, só no contexto de uma vaga do Pipeline (`JobAtsMatchTab`, que já tem tudo isso
   via `job`), não na visão standalone de currículo otimizado.

## Fora de escopo
- Editor de rich-text com diff inline (decisão explícita do usuário).
- Deixar o usuário escolher ONDE no currículo a frase entra (sempre vai pro resumo
  profissional/`summary` na v1) — escolher seção (experiência específica, etc.) fica pra
  spec futura se fizer falta.
- Qualquer aviso/disclaimer na UI sobre "isso pode não ser verdade" — não foi pedido,
  decisão do usuário foi deixar a IA escrever a frase pronta sem fricção extra.

## Critérios de aceite
- [ ] Clicar "+ Adicionar ao currículo" numa palavra-chave faltando gera uma sugestão real
  da IA, editável antes de confirmar
- [ ] Confirmar a sugestão atualiza de verdade o `summary` do currículo (`GET /resumes/{id}`
  reflete a mudança depois)
- [ ] Mesmo fluxo funciona pra um item de "Requisitos faltando"
- [ ] Não aparece nenhum botão de adicionar na visão standalone de currículo otimizado (sem
  contexto de vaga do Pipeline)
- [ ] `go build`/`go vet` limpos no backend; `tsc`/`eslint` limpos no web-app
- [ ] Testado ao vivo em dev contra uma vaga real
