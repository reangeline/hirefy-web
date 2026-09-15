# Spec 018: Ideias de publicação no LinkedIn

## Objetivo
Nova área de LinkedIn: levantamento de temas relevantes pro perfil do usuário, pra ele se
manter informado sobre ângulos que combinam com sua área e, dos que despertarem interesse,
gerar um post pronto pra publicar.

## Decisão confirmada com o usuário
Backend não tem integração de busca/notícias (confirmado via grep — zero referência em todo
o `backend_hirefy`). Temas realmente atuais exigiriam infraestrutura nova. Decisão: a IA
sugere **temas/ângulos relevantes** pro perfil (baseado em stack/senioridade), não notícias
do dia — copy da UI deixa isso explícito.

## Investigação
- Reusa o padrão de conversão currículo→IA já usado em `ProcessLinkedInOptimizationJob`
  (`resume_optimizer_service_impl.go:498-511`): `extractSkillsFromParsedData`,
  `extractExperiencesFromParsedData`, `extractEducationFromParsedData`,
  `convertToStringSlice` — helpers já existentes.
- Persistência: só a lista de temas é salva (singleton por usuário, mesmo padrão do
  `LinkedInScan` da spec 015). Posts rascunhados a partir de um tema não são persistidos —
  geram na hora, sem lista de histórico.

## Requisitos

### Backend
1. `domain.LinkedInPostTopic{Title, Angle}` e `domain.LinkedInPostIdeas{ID, UserID, Topics,
   CreatedAt, UpdatedAt}`.
2. `outbound.LinkedInPostIdeasRepository{Upsert, GetByUserID}` + implementação DynamoDB.
3. `outbound.AIService.GenerateLinkedInPostTopics` (currículo → 6-10 temas) e
   `.DraftLinkedInPost` (currículo + tema → post pronto, sem inventar experiência).
4. `inbound.LinkedInPostService{GenerateTopics, GetLatestTopics, DraftPost}`. Sem crédito.
5. Rotas autenticadas: `POST/GET /linkedin-post-topics`, `POST /linkedin-post-topics/draft`.

### Web-app
6. Tipos novos em `src/types/linkedin.ts`.
7. Proxies novos (mesmo padrão CSRF+sessão dos outros).
8. `src/app/(dashboard)/linkedin/posts/page.tsx` — seletor de currículo, gerar temas,
   listar.
9. `LinkedInPostTopics.tsx` — card por tema, botão "Gerar post" com resultado inline +
   `CopyButton`.
10. Sidebar: LinkedIn ganha sub-item "Ideias de publicação".

## Fora de escopo
- Integração de busca/notícias real.
- Publicar direto no LinkedIn via API.
- Histórico de posts rascunhados.
- Agendamento de publicações.

## Critérios de aceite
- [ ] Gerar temas reais (não fixos) a partir de um currículo de teste, relacionados à stack
  dele
- [ ] Gerar post pra um tema produz texto real, coerente com o currículo, sem inventar
  experiência
- [ ] Botão Copiar funciona no post gerado
- [ ] Reabrir a página sem gerar de novo mostra os mesmos temas salvos
- [ ] Sidebar mostra o novo sub-item
- [ ] `go build`/`go vet` limpos no backend; `tsc`/`eslint` limpos no web-app
- [ ] Testado ao vivo em dev
