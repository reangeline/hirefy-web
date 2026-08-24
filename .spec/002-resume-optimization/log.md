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

## Addendum — ligado no backend real, testado ao vivo de ponta a ponta (2026-08-23)

Reescrito `types/resume.ts` pro shape real (`full_name`, `current_role`,
`country`/`state`/`city` separados, `url` em vez de `link`, `language`/`proficiency` em vez
de `name`/`level` — tudo confirmado em `resume_handler.go` + o prompt de IA). Removido
`src/lib/mock/resumes.ts`. Criados 8 Route Handlers novos em `src/app/api/resumes/**`,
seguindo o mesmo padrão de proxy das specs anteriores (CSRF nas rotas que mudam estado,
`getAccessToken()` + 401 se não tiver sessão). Reescritas as 5 telas e o `ResumeForm`/
`OptimizeForm`/`OptimizedResultView` pra consumir a API de verdade via `apiFetchJson`.

Ajuste no `Select.Root` de nível de idioma: trocado o array `LANGUAGE_LEVELS` por um
`Record<string,string>` (`{label: label}`), porque `items` do Base UI Select não aceita
array de strings — só `Record<string, ReactNode>` ou `{label, value}[]`.

### Teste ao vivo (conta real, reangeline+test@hotmail.com)
Sequência completa, sem nenhum ajuste de código durante o teste:
1. `POST /resumes/manual` — criou "Curriculo Teste Backend", apareceu na listagem com data
   real formatada
2. `GET /resumes/{id}` — tela de editar pré-preencheu certinho (nome, cargo atual)
3. `POST /resumes/optimize` — 202 real, job em `queued`
4. Polling em `GET /resumes/optimize/jobs/{jobID}` (4s de intervalo) — foi de `queued` →
   `processing` → `completed` em ~15s, redirecionou sozinho pro resultado
5. Resultado com dado de IA de verdade: score 21% (currículo de teste quase vazio, faz
   sentido), 9 sugestões (a IA misturou "missing requirement" dentro do texto das
   sugestões, não é um bug meu — é como o modelo respondeu), 5 badges de requisito faltando.
   Sem estimativa salarial (`salary_estimate.found` deve ter vindo `false`) — card ficou
   oculto corretamente
6. `DELETE /resumes/{id}` — removeu de verdade, lista voltou ao estado vazio

## Addendum — import de PDF implementado e testado ao vivo (2026-08-23)

Construído o fluxo completo: `postMultipartBackend()` (nova, em `backend.ts` — `callBackend`
força `Content-Type: application/json`, incompatível com multipart), Route Handler
`/api/resumes/parse-pdf` (proxy da rota pública, com CSRF mesmo sem exigir sessão),
`PdfImportUpload.tsx` (upload + chamada direta, sem `apiFetchJson`), `ParsedPdfResult` +
`parsedPdfToFormData()` em `types/resume.ts`, e `resume/new/page.tsx` reescrita com máquina
de estado (`choose | manual | pdf-upload | pdf-review`) oferecendo import de PDF como
alternativa ao formulário manual.

**Bug real encontrado ao testar com um PDF de verdade:** campos de data (Início/Fim de
experiência e formação) usavam `<Input type="month">`, que só aceita `YYYY-MM` e mostra em
branco pra qualquer outro formato — mas a IA extrai datas em texto livre ("Janeiro 2022").
Corrigido trocando pra `<Input type="text">` com placeholder de exemplo, em ambos
`ExperienceFields` e `EducationFields` (`ResumeForm.tsx`).

Gerei um PDF de teste real localmente (`textutil` + `cupsfilter`, currículo fabricado de
"Ana Teste") e testei ao vivo no Chrome: upload → `POST /resumes/parse-pdf` real → IA
extraiu tudo certo (score 74%, 5 sugestões de ATS, dados pessoais, 2 experiências, 1
formação, 2 idiomas) → datas aparecendo corretamente após o fix → revisão no form →
`POST /resumes/manual` → currículo salvo e visível na listagem → excluído em seguida (dado
de teste).

**Achado menor, não corrigido:** proficiência de idioma extraída às vezes sem acento
(`"Avancado"`) não bate com a chave do `Select` (`"Avançado"`), fica sem seleção visual no
dropdown — baixa prioridade, não afeta o salvamento do valor.

## Addendum — caminho de falha (crédito insuficiente) testado ao vivo (2026-08-23)

Zerei os créditos da conta de teste de propósito (2 otimizações reais bem-sucedidas
consumindo os créditos restantes) e disparei uma terceira. Confirmado: `POST
/resumes/optimize` aceita normalmente (202) mesmo sem crédito — a checagem só acontece
dentro do processamento assíncrono do job, então falha rápido no polling (antes de qualquer
chamada de IA, sem desperdiçar custo). A tela mostrou a mensagem amigável específica ("Você
não tem créditos suficientes...") em vez de erro genérico, confirmando que o tratamento de
`INSUFFICIENT_CREDITS_ERROR` no `OptimizeForm` funciona contra o erro real.

**Achado novo:** a UI não avisa nem bloqueia proativamente antes de deixar o usuário tentar
otimizar já sem créditos — o botão fica habilitado normalmente, só falha depois do polling.
Já estava registrado na spec como melhoria não obrigatória ("considerar checar `GET
/subscription/credits` antes"), continua não implementado — não é bloqueio, mas fica como
próximo passo de UX se quiser evitar o ciclo de espera desnecessário.

Com isso, todos os critérios de aceite da spec 002 estão fechados.

## Próximos passos

Considerar oferecer o preview de PDF (score de ATS grátis) direto na home, antes do signup,
como a landing anuncia — decisão de produto, registrada na spec mas não obrigatória.
Considerar avisar proativamente sobre créditos zerados antes de deixar o usuário tentar
otimizar (acima).
