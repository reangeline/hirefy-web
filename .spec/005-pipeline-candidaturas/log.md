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

## Próximos passos

Spec escrita, aguardando decisão do usuário sobre quando implementar. Como o fluxo de
adicionar vaga depende do fluxo de otimização (spec 002), faz sentido a 002 estar mais
avançada (ligada ao backend de verdade) antes de começar a 005.
