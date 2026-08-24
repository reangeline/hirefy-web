# Log — Spec 005: Pipeline de candidaturas

**Data:** 2026-08-23

## Status

Só a spec foi escrita. Nada implementado ainda.

## Como a feature apareceu

Em 2026-08-22, ao montar a home do web-app (spec 003), usei a copy de marketing do
`hirefy_lading` como referência de conteúdo e ela mencionava "Kanban completo", "Coach de IA
por etapa", "Entrevistas e contatos", "Analytics". Busquei essa feature no `applywise_app` e
no `backend_hirefy` na época e não encontrei nada — nenhuma tela, model, provider ou rota
relacionada em nenhum dos dois repos. Reportei como copy aspiracional, sem feature real por
trás.

Em 2026-08-23 o usuário explicou: tinha feito push de um notebook antigo pro
`applywise_app` (e depois, quando pedi, também pro `backend_hirefy`) que já tinham essa
feature implementada. `git pull` nos dois repos trouxe tudo:
- `applywise_app`: 43 arquivos, 9552 inserções (models, providers, screens, widgets)
- `backend_hirefy`: 53 arquivos, 3677 inserções (handler, repositório, domínio, analytics,
  coach service)

## Levantamento feito antes de escrever a spec

Documentado em detalhe no `spec.md` (seção "Como foi levantado" + achados). Resumo dos
arquivos revisados:
- Mobile: `pipeline_provider.dart`, `pipeline_service.dart` (contrato de API — mais
  confiável que os models pra saber o que realmente é enviado pro backend), models
  (`job_application.dart`, `contact.dart`, `pipeline_analytics.dart`), `pipeline_section.dart`
  (board embutido na home), `job_detail_screen.dart`, `add_job_bottom_sheet.dart`
- Backend: `pipeline_handler.go` (DTOs reais, mais confiável que o client mobile pra saber o
  que o servidor realmente aceita/retorna), `pipeline_job.go`, `pipeline_analytics.go`,
  `pipeline_coach_service_impl.go`, `router.go`

## Achados que mudam a implementação (detalhados no spec.md)

1. Backend só tem 5 estágios reais (`wishlist/applied/interview/offer/rejected`) — mobile
   mostra 6 (inclui "Accepted" separado), que é um bug do client mobile: mover pra
   "Accepted" persiste como "offer" e o card volta pra coluna errada no próximo fetch
2. Casing inconsistente dentro do próprio domínio pipeline: jobs majoritariamente
   snake_case, contatos usam `linkedinUrl` (camelCase), analytics é 100% camelCase
3. Campos de contexto extra (valor da oferta, motivo de rejeição) que o mobile tenta
   enviar não têm campo correspondente no DTO do backend — descartados silenciosamente
4. Follow-up: mobile envia `{channel, message}`, backend só aceita `{detail}` — mesmo
   problema de campos descartados
5. Coach de IA: mobile só trata erro 403 explicitamente; backend também pode retornar 402
   (sem créditos) e 422 (sem coach nesse estágio) — mobile não distingue esses casos
6. "Colar URL" como método de adicionar vaga não parece ter suporte de scraping no backend
   (só achei `ParseJobDescription(text)`, que recebe texto, não URL) — não é conclusivo,
   fica como pergunta em aberto

## Addendum — implementação (2026-08-24)

Spec 002 já estava fechada, então a implementação começou direto. Passei por Plan Mode antes
de tocar em código (arquivo de plano com o achado novo + decisões confirmadas via
`AskUserQuestion` com o usuário antes de codar).

### Achados novos, confirmados lendo o código de novo antes de implementar
1. **Coach não é gated por Premium no backend** — trata como otimização normal (consome
   crédito free tier, sem checar plano). Decisão: não replicar o gate client-side do mobile.
2. **Wizard mobile usa `atsScore` hardcoded (83) e nunca envia `matched_keywords`** — bug/
   placeholder do mobile, não contrato de produto. Decisão (confirmada com o usuário): usar
   `match_score` real da otimização, `missing_requirements` como `missing_keywords`,
   `matched_keywords` fica de fora (sem fonte real).
3. **"Colar descrição" não extrai empresa/cargo** — `JobAnalysis` (retorno de
   `ParseJobDescription`) não tem esses campos. Empresa/cargo viraram sempre campos manuais no
   wizard, independente do método.
4. **Mobile permite pular a otimização** (`_submitWithoutOptimize`) — decisão (confirmada):
   replicar os dois caminhos ("Adicionar rápido" e "Adicionar com otimização").

Todos documentados em detalhe no `spec.md`.

### O que foi construído
- `src/types/pipeline.ts` — tipos espelhando `pipeline_handler.go`/`pipeline_analytics.go`,
  documentando o casing misto (job snake_case, contacts com `linkedinUrl`, analytics 100%
  camelCase)
- `ApiError` (extends `Error`, com `status`) adicionado em `lib/api/client.ts` —
  retrocompatível, necessário pro Coach distinguir 402/403/422
- 9 Route Handlers em `src/app/api/pipeline/**`, mesmo padrão de proxy das specs anteriores
- `npx shadcn add tabs` — primeiro uso de Tabs no projeto
- `PipelineSection.tsx` (board + analytics, abas), embutida no dashboard — precisou alargar o
  container do dashboard (`max-w-2xl` → `max-w-6xl`) pra caber as 5 colunas, mantendo o resto
  do conteúdo do dashboard num sub-container de `max-w-2xl`
- `AddJobQuickForm.tsx` e `AddJobOptimizeWizard.tsx` — os dois caminhos de adicionar vaga
- `JobCoachTab.tsx`, `JobAtsMatchTab.tsx` (reaproveita `OptimizedResultView` da spec 002 sem
  modificação), `JobContactsTab.tsx`, `JobActionsCard.tsx` (estágio/ghost/entrevista/follow-up)
- Página de vagas arquivadas (`/pipeline/archived`)
- **`src/proxy.ts` — bug real encontrado e corrigido durante a implementação**: `/pipeline`
  não estava na lista de prefixos protegidos, então as páginas ficariam acessíveis sem sessão
  (a chamada à API falharia com 401 já que o Route Handler exige `access_token`, mas a página
  em si renderizaria sem redirecionar pro login, diferente do padrão do resto do dashboard)

### Bugs de teste ao vivo encontrados durante a interação (não de código)
Ao testar `<input type="datetime-local">` no formulário de registrar entrevista via
automação de browser, digitar tudo de uma vez (`"09/15/2026 10:00AM"`) confundiu os segmentos
do campo (formato é dia/mês/ano, não mês/dia/ano, e escrever direto sobrescreve errado) — não
é um bug do app, é uma particularidade de como o Chrome renderiza esse tipo de input; resolvido
clicando em cada segmento e digitando em partes. Documentado aqui só porque não é óbvio.

### Teste ao vivo (conta real, reangeline+test@hotmail.com, créditos zerados desde a spec 002)
Sequência completa sem nenhum ajuste de código durante o teste (exceto o fix do `proxy.ts`,
encontrado e corrigido antes de testar ao vivo):
1. `POST /pipeline` (rápido) → apareceu no board na coluna certa
2. `PUT /pipeline/{id}` (mudar estágio via Select no card) → refletiu na coluna certa
3. Coach → 402 real (crédito zerado), mensagem específica exibida
4. ATS Match → estado vazio correto (vaga sem otimização)
5. Contatos → adicionar, listar, remover — ciclo completo funcionando
6. Registrar entrevista → moveu o estágio pra "Entrevista" automaticamente (comportamento do
   backend)
7. Registrar follow-up → salvou sem erro
8. Marcar ghosted → badge "Ghosted" no board, permaneceu na mesma coluna
9. Analytics → métricas reais (inclusive `responseRate: 0%` correto por causa do ghosting —
   confirma que a lógica de exclusão de vaga ghosted do cálculo de resposta, já vista no
   código, funciona de verdade)
10. Criado um currículo de teste, tentei "Adicionar com otimização" → 402 real de novo (a
    checagem de crédito acontece antes de qualquer chamada de IA, então falhou rápido)
11. "Tentar de novo" voltou pro passo de seleção de currículo com o estado preservado
12. Excluída a vaga e o currículo de teste ao final

`tsc --noEmit`, `npm run lint`, `npm run build` limpos.

### Não testado ao vivo
- Caminho de sucesso completo de "Adicionar com otimização" (bloqueado por créditos zerados
  — mas usa o mesmo mecanismo de polling já confirmado ao vivo na spec 002)
- 403 do Coach (exigiria cancelar a assinatura de teste de propósito)
- Vagas arquivadas (nenhuma vaga chegou a ser arquivada durante o teste)

## Próximos passos

Testar o caminho de sucesso da otimização integrada quando a conta de teste tiver créditos de
novo (ex.: depois de testar upgrade/billing). Considerar se vale usar
`offer_amount`/`rejection_feedback` no backend (pergunta em aberto já registrada no spec.md).
