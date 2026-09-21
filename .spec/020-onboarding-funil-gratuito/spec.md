# Spec 020 — Funil de onboarding gratuito

## Objetivo

Redesenhar o onboarding pra melhorar o funil de vendas: o Score de ATS é o "atrativo" e deve
ficar visível/experimentável sem fricção (grátis, com limite de uso), enquanto o resto
(coach, prática de entrevista, analytics do pipeline) é pago. Duas mudanças concretas:

1. Limitar otimizações de currículo/LinkedIn a 3 por usuário no plano Free (hoje é
   ilimitado na prática, apesar do backend já ter um sistema de créditos pronto pra isso).
2. Permitir ver o score de ATS **antes** de criar conta, com ponte suave pra dentro do app
   depois do cadastro (sem re-upload).

## Requisitos

### Backend (`backend_hirefy`)
- `resumeOptimizerServiceImpl` (currículo e LinkedIn) deduz 1 crédito do
  `domain.Subscription` do usuário (via `UseCredit()`) a cada otimização bem-sucedida,
  **só pra `PlanFree`** — mesmo padrão já usado em `pipeline_coach_service_impl.go` e
  `interview_practice_service_impl.go` (pool de créditos compartilhado, não um contador
  dedicado).
- Registrar `domain.CreditTransaction` a cada dedução (mesmo padrão dos outros dois
  serviços), pra manter o histórico consistente.

### Frontend (`web-app`)
- Nova página pública `/pontuacao` — upload de PDF sem exigir login, reaproveitando
  `PdfImportUpload.tsx` e o endpoint já público `POST /api/resumes/parse-pdf`. Mostra score +
  melhorias sugeridas, teaser das features pagas trancadas, e CTA de criar conta.
- Dados do scan pré-cadastro (`ManualResumeRequest`, já inclui `ats_score`/
  `ats_improvements`) ficam em `sessionStorage` até o cadastro terminar, e então alimentam
  `resume/new` direto na tela de revisão — sem pedir pra subir o PDF de novo.
- Copy do plano Free em `Pricing.tsx` atualizada pra refletir o limite real (3 otimizações),
  não mais "ilimitadas".
- Tela de limite atingido (quando as 3 créditos acabam) explica o que acabou e reforça o que
  o Premium libera, com CTA de upgrade — não só uma mensagem de erro genérica.
- Eventos de analytics em cada etapa do funil novo (`free_score_upload_started`,
  `free_score_viewed`, `free_score_signup_clicked`, `signup_completed` com
  `source: "free_score"`, `credit_limit_reached`, reuso de `upgrade_button_clicked`) via
  `src/lib/analytics.ts` (spec 008) já existente.

## Fora de escopo
- Trocar o modelo de créditos "vitalício, sem reset" por um contador mensal recorrente.
- Segmentação de onboarding por intenção do usuário (fase futura).
- Qualquer mudança em Coach de IA / Prática de entrevista além de continuarem compartilhando
  o mesmo pool de créditos que já compartilham hoje.
- Redesenho visual da tela `/pontuacao` além do necessário pra reaproveitar os componentes
  já existentes (`CircularScore`, `PdfImportUpload`) — sem nova arte/animação dedicada.

## Critérios de aceite
- [ ] Conta de teste Free consegue rodar exatamente 3 otimizações de currículo/LinkedIn; a
      4ª é bloqueada com a nova tela de limite, não com erro genérico. **Pendente** — a única
      conta de teste disponível nesta sessão é Premium (não afetada pelo limite); ver log.md.
- [x] `/pontuacao` funciona sem sessão ativa (testar em aba anônima/sem cookie): upload de
      PDF real → score + melhorias aparecem na tela. Confirmado ao vivo em 2026-09-20 com um
      PDF sintético (texto gerado programaticamente, não um export real de currículo, já que
      nenhum arquivo real estava disponível na sessão) — mas passou pelo pipeline de verdade
      (upload → `POST /resumes/parse-pdf` real → IA real): score calculado (56%), sugestões
      específicas e corretas pro conteúdo enviado ("Missing email address", "No location
      information", etc. — o PDF de teste realmente não tinha esses campos). Ver log.md.
- [ ] Criar conta a partir de `/pontuacao` leva direto pra `resume/new` com os dados do PDF
      já preenchidos, sem pedir upload de novo. **Parcial** — confirmado em 2026-09-20 até a
      borda do que dá pra testar sem credenciais: clicar "Criar conta grátis" salva o scan
      completo em `sessionStorage` (`hfy_pending_scan`) e redireciona pra
      `/signup?redirect=%2Fresume%2Fnew%3Ffrom%3Dscore` corretamente. A perna final (submeter
      o cadastro → cair em `resume/new` com os dados já preenchidos) não foi testada — exige
      digitar email/senha, ação que o Claude não executa por regra de segurança (nunca entra
      credenciais em formulários, nem pra criar conta). Precisa de um humano pra fechar.
- [x] Fluxo de signup normal (sem passar por `/pontuacao`) continua funcionando sem mudança
      de comportamento. Confirmado ao vivo (screenshot + console sem erros).
- [ ] Eventos de analytics disparam nos pontos certos do funil (conferir no console/GA/
      Mixpanel). **Pendente** — causa raiz identificada em 2026-09-20: `NEXT_PUBLIC_GA_
      MEASUREMENT_ID` e `NEXT_PUBLIC_MIXPANEL_TOKEN` só estão configuradas no ambiente
      **Production** do Vercel (`vercel env ls`), não em Preview/Development — então
      `initAnalyticsIfConsented()` roda mas `window.gtag`/Mixpanel nunca inicializam no
      preview de `develop`, mesmo com consentimento de cookie aceito. `trackEvent(...)` não
      quebra (chamadas viram no-op), mas não há como verificar o disparo real fora de
      produção. Só testável depois de promover pra `main`.
- [x] `go build/vet/test` (backend) e `tsc`/`eslint`/`build` (frontend) limpos.
