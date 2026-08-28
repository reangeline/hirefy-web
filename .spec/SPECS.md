# Board de Specs — web-app

Escopo principal: `web-app`. A partir da spec 007, algumas specs também tocam outros projetos
do monorepo quando a feature exige (`backend_hirefy` na 007, `hirefy_lading` na 008) — nesses
casos a coluna "Nome" indica isso explicitamente. `applywise_app` continua sem specs neste
padrão.

| # | Nome | Status | Log |
|---|---|---|---|
| 001 | Auth | 🚧 Backend completo (social incluso); falta expiração de token, confirmação de email, reset de senha e client IDs Google/Apple | [log.md](001-auth/log.md) |
| 002 | Currículos e otimização com IA | ✅ Implementado e testado ao vivo (create/edit/delete/otimizar, import de PDF, caminho de falha por crédito insuficiente) | [log.md](002-resume-optimization/log.md) |
| 003 | Identidade visual (paleta mobile + home landing + toggle de tema) | ✅ Implementado e paleta validada (auditoria exata contra theme.dart, 3 tokens corrigidos) | [log.md](003-visual-identity/log.md) |
| 004 | Home pós-login (`/dashboard`) | 🚧 Parcial, testado ao vivo com conta real (cabeçalho + assinatura); sugestões bloqueadas pela spec 002 | [log.md](004-dashboard-home/log.md) |
| 005 | Pipeline de candidaturas (Kanban + Coach + Contatos + Analytics) | 🚧 Implementado e testado ao vivo; falta testar o caminho de sucesso da otimização integrada (créditos zerados) e o 403 do coach | [log.md](005-pipeline-candidaturas/log.md) |
| 006 | Refresh visual "SaaS" (Stripe/Vercel) — sidebar shell, densidade, tipografia mono pra dados | ✅ Implementado e testado ao vivo (light+dark, shell aplicado a toda a área logada) | [log.md](006-saas-visual-refresh/log.md) |
| 007 | Billing com Stripe (Free + Premium) — toca também `backend_hirefy` | ✅ Implementado e testado ao vivo em dev na AWS (upgrade → checkout → webhook → Premium → cancelar → Free); achado e corrigido bug de assinatura duplicada no DynamoDB | [log.md](007-stripe-billing/log.md) |
| 008 | Analytics de produto (GA4 + Mixpanel) + banner de cookies — toca também `hirefy_lading` | ✅ Implementado e testado ao vivo (banner, eventos principais confirmados via rede); métricas de negócio ficam no dashboard nativo do Stripe (sem código novo) | [log.md](008-analytics/log.md) |
| 009 | Absorve a `hirefy_lading` no web-app (Preços, FAQ, páginas legais) | ✅ Implementado e testado ao vivo; testimonials fabricados da landing antiga não foram portados (decisão do usuário); corte de domínio (`hirefy.careers`) é infraestrutura, fica como checklist pro usuário | [log.md](009-absorver-landing/log.md) |
| 010 | Prática de entrevista interativa — toca também `backend_hirefy` | ✅ Implementado e testado ao vivo em dev na AWS (pergunta → resposta → avaliação com STAR → próxima pergunta sem repetir tema); inspirado no módulo Interview do app pessoal `realtalk` do usuário | [log.md](010-interview-practice/log.md) |

## Legenda

- 📝 Em planejamento — spec escrita, implementação não iniciada
- 🚧 Em implementação / implementado sem fechar critérios de aceite
- ✅ Implementado e critérios de aceite fechados
