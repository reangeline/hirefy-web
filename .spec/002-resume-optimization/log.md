# Log — Spec 002: Currículos e otimização com IA

**Data:** 2026-08-22

## Status

Só a spec foi escrita (`spec.md`), nada implementado ainda. Este log existe pra registrar o
que foi levantado durante o planejamento, já que parte disso influencia decisões de
implementação futuras.

## Levantamento feito antes de escrever a spec

- Mapeados os endpoints reais em `router.go` do backend: `POST/GET /resumes`,
  `POST /resumes/manual`, `PUT /resumes/manual/{id}`, `POST /resumes/optimize`,
  `GET /resumes/optimize/jobs/{jobID}`, `GET /resumes/optimized`,
  `GET /resumes/optimized/{id}`, `PUT /resumes/optimized/{id}`, `DELETE /resumes/{id}`
- Confirmado o shape de `OptimizationJob` (`optimization_job.go`) e `OptimizedResume`
  (`resume.go`) direto no código Go, não por suposição
- Confirmado que `POST /resumes/optimize` é assíncrono (202 + job em `queued`), e que a
  checagem de crédito/assinatura só acontece dentro do worker (`runOptimization`), não no
  handler síncrono — então falta de crédito só aparece depois, via polling do job

## Achado que mudou o escopo da spec

`resume_pdf_upload_screen.dart` (mobile) chama `POST /api/v1/resumes/parse-pdf`, que **não
existe em nenhum lugar do backend** (busca completa no repo não encontrou a rota nem o
handler). Esse é provavelmente o fluxo mais usado no app nativo — import de PDF — e está
quebrado até lá. Por isso a spec 002 assume MVP só com currículo manual
(`POST /resumes/manual`) e marca o import de PDF como fora de escopo/condicional até
confirmar com o backend.

## Decisão de arquitetura registrada na spec (não existe no mobile)

Mobile usa FCM pra avisar quando o job de otimização termina; browser não tem isso
nativamente. A spec já define polling em `GET /resumes/optimize/jobs/{jobID}` como solução,
no mesmo padrão que o próprio mobile usa pro fluxo de LinkedIn (`pollLinkedInJob`).

## Próximos passos

Implementação não iniciada. Antes de começar, resolver a pergunta em aberto sobre
`parse-pdf` com o time de backend (ver `spec.md`).
