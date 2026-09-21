# Log — Spec 020: Funil de onboarding gratuito

**Data:** 2026-09-19

## O que foi implementado

**`backend_hirefy`:**
- `internal/application/service/resume_optimizer_service_impl.go` — `runOptimization`
  (otimizar currículo pra vaga) e `ProcessLinkedInOptimizationJob` (otimizar perfil LinkedIn)
  voltam a deduzir 1 crédito do plano Free por otimização bem-sucedida, via
  `subscription.UseCredit()` + `domain.NewCreditTransaction`. Mesmo pool de 3 créditos
  compartilhado com Coach de IA/Prática de entrevista (não um contador dedicado). Nenhuma
  mudança em `domain.Subscription` nem na injeção de dependências — os campos já existiam.
- `terraform`: nenhuma mudança (não fazia parte desta spec).

**`web-app`:**
- Nova página pública `/pontuacao` — upload de PDF sem sessão, score + melhorias na tela,
  teaser das features Premium trancadas, CTA de conta. Reaproveita `PdfImportUpload.tsx` e o
  endpoint `POST /api/resumes/parse-pdf`, que já eram públicos.
- Ponte pré-cadastro → pós-cadastro via `sessionStorage` (`hfy_pending_scan`) +
  `?redirect=` propagado por `/signup` → `/signup/confirm` → `/login` (login já suportava o
  parâmetro). `resume/new?from=score` consome o valor com `useSyncExternalStore` (evita
  `useEffect`+`setState`, que a regra `react-hooks/set-state-in-effect` rejeita).
- `CreditLimitReachedCard.tsx` (novo) — substitui o card de erro genérico nos **três** lugares
  que fazem polling do job de otimização (`OptimizeForm.tsx`, `linkedin/fill/page.tsx`,
  `pipeline/AddJobOptimizeWizard.tsx`) quando `job.error === "subscription is not active"`.
  Mostra o que o Premium libera + CTA de checkout.
- `Pricing.tsx` e `SubscriptionCard.tsx` — copy atualizada pra refletir o limite de 3 real.
- Eventos de analytics novos (`free_score_upload_started/viewed/signup_clicked`,
  `credit_limit_reached`, `signup_completed` com `source: "free_score"`) via
  `src/lib/analytics.ts` já existente.

## Decisões tomadas durante a execução que não estavam explícitas no pedido original

- **Achado que mudou o escopo real do trabalho**: `SPECS.md` já documentava a **spec 013**
  (11/09/2026) — uma decisão deliberada e testada ao vivo de tornar a otimização de
  currículo/LinkedIn **ilimitada** pra qualquer cadastrado, justamente pra Premium vender só
  entrevista+coach. Eu não tinha visto essa spec antes de investigar o pedido atual do
  usuário (a pergunta original do usuário citou "3 otimizações" sem mencionar que isso
  reverteria uma decisão anterior). Levantei o achado, **parei antes de seguir em frente** e
  perguntei explicitamente se reverter a spec 013 era mesmo a intenção — confirmado que sim.
  Isso significa que **spec 020 substitui/reverte a spec 013** (marcado no `SPECS.md`).
- **`AddJobOptimizeWizard.tsx` não estava no plano original** — só apareceu depois de ler o
  log da spec 013, que citava esse arquivo como um terceiro lugar (além de `OptimizeForm.tsx`)
  que a spec 013 já tinha alterado pro modelo ilimitado. Corrigido pra manter os três pontos
  de polling consistentes.
- **Modelo de crédito**: reusar o pool compartilhado de 3 créditos (não um contador dedicado
  só pra otimização) — decisão tomada com o usuário via pergunta direta, pra minimizar código
  novo já que o mecanismo (`UseCredit`/`ErrInsufficientCredits`) já existia pronto.
- **Score pré-cadastro incluído nesta rodada** (não adiado pra fase 2) — decisão tomada com o
  usuário via pergunta direta, depois de confirmar que o endpoint público
  (`POST /resumes/parse-pdf`) e o componente de upload já eram reaproveitáveis como estavam,
  reduzindo bastante o esforço real desse item.

## Divergência entre o planejado e o executado

- Nenhuma divergência de escopo funcional — o plano aprovado (Plan Mode) foi seguido à risca,
  incluindo o mecanismo exato de ponte via `sessionStorage`/`?redirect=`.
- Ajuste técnico durante a implementação: o plano original de `resume/new` previa
  `useEffect` lendo e limpando o `sessionStorage`; isso violava
  `react-hooks/set-state-in-effect` (confirmado rodando o lint). Resolvido com
  `useSyncExternalStore`, mesmo padrão já usado em `theme-toggle.tsx`/`use-reduced-motion.ts`
  — e, como efeito colateral, a chave do `sessionStorage` deixou de ser explicitamente
  limpa (fica até a aba fechar) pra evitar o valor "sumir" no meio da revisão por causa da
  checagem de consistência do próprio hook.

## Testado ao vivo

- `go build/vet/test` (backend) e `tsc`/`eslint`/`npm run build` (frontend) limpos nos dois
  repos, nesta sessão.
- CI verde nos dois repos (`develop`), deploy automático em dev confirmado com sucesso.
- `/pontuacao` conferida visualmente no navegador (preview de dev): renderiza, tema escuro
  aplicado, botão de upload funcional na tela.
- `/signup` conferida visualmente após o wrap em `Suspense` — sem regressão, sem erro no
  console.
- `/#pricing` conferida visualmente — copy do Free ("3 otimizações de currículo/LinkedIn com
  IA grátis") e do Premium ("Otimizações de currículo/LinkedIn com IA ilimitadas") corretas.
- **Não testado ao vivo, por falta de recursos nesta sessão**:
  - Upload de um PDF real em `/pontuacao` → score de verdade → fluxo completo até cair em
    `resume/new?from=score` já preenchido (não havia PDF de teste disponível no ambiente).
  - `CreditLimitReachedCard` aparecendo de verdade depois de esgotar os 3 créditos (a única
    conta de teste disponível nesta sessão está no plano Premium, que não é afetado pelo
    limite).
  - Eventos de analytics disparando de fato no GA4/Mixpanel (só a instrumentação do código foi
    revisada, não a rede/console ao vivo pra esses eventos específicos).

  Fica registrado como pendência explícita — ver `SPECS.md` — em vez de marcar a spec como
  fechada sem essa verificação.

## Addendum — 2026-09-20: verificação ao vivo retomada

Retomado a pedido do usuário numa sessão seguinte, ainda sem PDF real disponível — gerado um
PDF sintético válido (texto puro, sem libs de PDF instaladas no ambiente, escrito na mão
respeitando a sintaxe mínima de PDF 1.4) com um currículo fictício mas plausível, pra exercitar
o pipeline de verdade em vez de mockar.

- `/pontuacao` sem sessão: upload do PDF sintético → `POST /resumes/parse-pdf` real → IA real
  → score 56% + 5 sugestões específicas e coerentes com o conteúdo enviado (ex.: "Missing
  email address", já que o PDF de teste não tinha email). Card de CTA ("Crie sua conta grátis
  pra salvar e continuar") com a copy certa (3 otimizações grátis + lista de features
  Premium).
- Clicar "Criar conta grátis" → confirmado via `sessionStorage.getItem("hfy_pending_scan")`
  que os dados parseados (nome, cargo, experiências) foram salvos corretamente, e a URL virou
  `/signup?redirect=%2Fresume%2Fnew%3Ffrom%3Dscore` como esperado. `/signup` renderizou sem
  erro com esse parâmetro.
- **Não foi possível ir além disso**: submeter o formulário de cadastro exige digitar
  email/senha, e por regra de segurança o Claude nunca entra credenciais em formulário algum
  (nem pra criar conta de teste) — precisa de um humano pra completar essa última perna
  (`resume/new?from=score` já preenchido) e pra testar `CreditLimitReachedCard` depois de
  esgotar os 3 créditos.
- **Achado sobre analytics**: `vercel env ls` mostra `NEXT_PUBLIC_GA_MEASUREMENT_ID` e
  `NEXT_PUBLIC_MIXPANEL_TOKEN` configuradas só no ambiente Production — não em
  Preview/Development. Por isso os eventos do funil (`free_score_viewed`,
  `free_score_signup_clicked`, etc.) nunca vão inicializar `gtag`/Mixpanel testando no preview
  de `develop`, mesmo com o código correto e consentimento de cookie aceito. Isso não é um bug
  de código — só explica por que esse item ficou pendente antes e continua só testável depois
  de promover pra `main`/produção.
