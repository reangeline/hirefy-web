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
| 009 | Absorve a `hirefy_lading` no web-app (Preços, FAQ, páginas legais) | ✅ Implementado, testado ao vivo e checklist de infra fechado: domínio `hirefy.careers` cortado pra `web-app` na Vercel (sem downtime de DNS) e o projeto antigo `hirefy-lading` removido da Vercel (repositório GitHub preservado); testimonials fabricados da landing antiga não foram portados (decisão do usuário) | [log.md](009-absorver-landing/log.md) |
| 010 | Prática de entrevista interativa — toca também `backend_hirefy` | ✅ Implementado e testado ao vivo em dev na AWS (pergunta → resposta → avaliação com STAR → próxima pergunta sem repetir tema); inspirado no módulo Interview do app pessoal `realtalk` do usuário | [log.md](010-interview-practice/log.md) |
| 011 | Auto-apply assistido no LinkedIn (extensão de navegador) — novo projeto (`browser_extension/`), toca também `backend_hirefy` | 🚧 Testado ao vivo com login real: "Preparar candidatura" roda ponta a ponta (scraping → IA → score de ATS real); a "fila aprovada" da lista de busca virou o Wishlist real do Pipeline (backend), sincronizado com o Dashboard do web-app e com botão "Abrir vaga original" pra voltar ao LinkedIn — testado ponta a ponta. Falta testar: sugestão de resposta via IA numa pergunta de triagem real, gate Premium com conta Free, e o registro no Pipeline depois do envio | [spec.md](011-auto-apply-linkedin/spec.md) |

## Legenda

- 📝 Em planejamento — spec escrita, implementação não iniciada
- 🚧 Em implementação / implementado sem fechar critérios de aceite
- ✅ Implementado e critérios de aceite fechados
