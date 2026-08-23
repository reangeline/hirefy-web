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

## Addendum — passe de UI com dados mock (2026-08-22, mesmo dia, a pedido do usuário)

Usuário pediu explicitamente pra começar pela UI (telas completas, dados mock, sem se
prender ao contrato do backend ainda — decisão registrada porque o formato exato de
`personal`/`experiences[]`/etc é uma pergunta em aberto não resolvida).

Construído: listagem (`/resume`), criar/editar (`/resume/new`, `/resume/[id]/edit`) com
formulário completo (seções repetíveis via componente genérico `RepeatableSection<T>`),
otimizar (`/resume/[id]/optimize`) com simulação do job assíncrono, resultado
(`/resume/optimized/[id]`). Adicionado `shadcn` `Textarea`, `Select`, `Separator` (só
`Textarea` e `Select` acabaram usados).

**Bug real encontrado e corrigido durante teste ao vivo:** o `Select` (Base UI) mostrava o
value cru em vez do label mapeado no estado fechado do trigger — Base UI precisa do prop
`items` no `Select.Root` (ou `children` como função no `Select.Value`) pra resolver isso
sozinho; não é automático como em outras libs de select. Corrigido passando
`items={LANGUAGE_LEVELS}`.

Testado ao vivo no Chrome (reaproveitando a sessão real criada na spec 001/004): navegação
completa entre todas as telas, criar/adicionar itens repetíveis, simulação de otimização até
o resultado — tudo funcionando. **Nada está ligado no backend** — é puramente uma camada de
UI/estado local por cima de dados fake, documentado como tal na spec.

## Addendum — backend ganhou parse-pdf + shape real confirmado (2026-08-23)

Push de um branch antigo do `backend_hirefy` trouxe `POST /resumes/parse-pdf` de verdade
(rota pública, sem auth) e, ao ler `ai_service_impl.go` (prompt da IA), o shape exato de
`personal`/`experiences[]`/`education[]`/`projects[]`/`languages[]` — resolve as duas
maiores perguntas em aberto desta spec de uma vez. Detalhes completos no `spec.md`.

**Achado que gera trabalho:** o shape real (`full_name`, `current_role`, `country`/`state`/
`city` separados, `url` em vez de `link`, `language`/`proficiency` em vez de `name`/`level`)
diverge do que o passe de UI mock assumiu ontem. `src/types/resume.ts` e `ResumeForm.tsx`
vão precisar de ajuste antes de ligar na API — não documentei isso como bloqueio grave
porque é um refactor mecânico, não uma decisão de arquitetura nova.

## Próximos passos

Ligar as telas no backend de verdade: ajustar `types/resume.ts`/`ResumeForm.tsx` pro shape
real, trocar o form mock por `POST /resumes/manual`, implementar o polling real em
`GET /resumes/optimize/jobs/{jobID}`, e construir a tela de import de PDF (endpoint pronto,
UI ainda não existe).
