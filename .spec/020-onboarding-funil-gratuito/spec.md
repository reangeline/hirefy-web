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
- [ ] `/pontuacao` funciona sem sessão ativa (testar em aba anônima/sem cookie): upload de
      PDF real → score + melhorias aparecem na tela. **Parcial** — página confirmada
      renderizando e acessível sem proteção do proxy; upload com PDF real não testado (sem
      arquivo de teste disponível nesta sessão).
- [ ] Criar conta a partir de `/pontuacao` leva direto pra `resume/new` com os dados do PDF
      já preenchidos, sem pedir upload de novo. **Pendente** — depende do item acima.
- [x] Fluxo de signup normal (sem passar por `/pontuacao`) continua funcionando sem mudança
      de comportamento. Confirmado ao vivo (screenshot + console sem erros).
- [ ] Eventos de analytics disparam nos pontos certos do funil (conferir no console/GA/
      Mixpanel). **Pendente** — só a instrumentação do código foi revisada.
- [x] `go build/vet/test` (backend) e `tsc`/`eslint`/`build` (frontend) limpos.
