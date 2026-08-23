# Board de Specs — web-app

Escopo: só `web-app`. Os outros 3 projetos do monorepo (`backend_hirefy`, `applywise_app`,
`hirefy_lading`) não têm specs neste padrão ainda.

| # | Nome | Status | Log |
|---|---|---|---|
| 001 | Auth | 🚧 Backend completo (social incluso); falta expiração de token, confirmação de email, reset de senha e client IDs Google/Apple | [log.md](001-auth/log.md) |
| 002 | Currículos e otimização com IA | 🚧 UI mock construída; backend real (manual + parse-pdf) confirmado, ligação ainda não feita | [log.md](002-resume-optimization/log.md) |
| 003 | Identidade visual (paleta mobile + home landing + toggle de tema) | 🚧 Implementado (paleta não validada com o usuário/design) | [log.md](003-visual-identity/log.md) |
| 004 | Home pós-login (`/dashboard`) | 🚧 Parcial, testado ao vivo com conta real (cabeçalho + assinatura); sugestões bloqueadas pela spec 002 | [log.md](004-dashboard-home/log.md) |

## Legenda

- 📝 Em planejamento — spec escrita, implementação não iniciada
- 🚧 Em implementação / implementado sem fechar critérios de aceite
- ✅ Implementado e critérios de aceite fechados
