# Log — Spec 018: Ideias de publicação no LinkedIn

## Data
2026-09-15

## O que foi implementado

**Backend (`backend_hirefy`)**
- `domain.LinkedInPostTopic{Title, Angle}` / `domain.LinkedInPostIdeas{ID, UserID, Topics,
  CreatedAt, UpdatedAt}` — novo domain model.
- `outbound.LinkedInPostIdeasRepository` + implementação DynamoDB (singleton por usuário,
  mesmo padrão de `LinkedInScanRepository`, com tags `dynamodbav` já corretas desde o
  início desta vez — lição aprendida do bug da spec 017).
- `outbound.AIService.GenerateLinkedInPostTopics` (currículo → 6-10 temas, prompt explícito
  sobre serem ângulos atemporais, nunca "notícia atual"/"tendência") e `.DraftLinkedInPost`
  (currículo + tema → post pronto, 800-1500 caracteres, gancho de abertura, pergunta de
  engajamento no fim, até 3 hashtags, nunca inventa conquista/projeto).
- `inbound.LinkedInPostService{GenerateTopics, GetLatestTopics, DraftPost}` — reusa
  `extractSkillsFromParsedData`/`extractExperiencesFromParsedData`/
  `extractEducationFromParsedData`/`convertToStringSlice` já existentes
  (`resume_optimizer_service_impl.go`) pra montar o `ResumeAnalysis`.
- `POST/GET /linkedin-post-topics`, `POST /linkedin-post-topics/draft` — autenticados, sem
  crédito.

**Web-app**
- `src/app/(dashboard)/linkedin/posts/page.tsx` — seletor de currículo, botão "Gerar temas"
  (síncrono, sem polling de job — geração mais curta que a otimização completa de perfil).
- `LinkedInPostTopics.tsx` — grid de cards por tema, botão "Gerar post" individual com
  estado de loading/erro por card, resultado inline com `CopyButton` e "Gerar outra versão".
  Rascunhos de post ficam só no estado local — não são persistidos.
- Sidebar: LinkedIn ganha terceiro sub-item "Ideias de publicação".

## Decisões tomadas durante a execução
Nenhuma divergência do plano. A decisão de fundo (temas gerados pela IA como ângulos
atemporais, não notícias reais — já que o backend não tem nenhuma integração de
busca/notícias) foi confirmada com o usuário via pergunta antes de planejar, documentada no
spec.md e refletida tanto no prompt quanto na copy da página.

## Teste ao vivo (dev, currículo de teste "Backend Go")
- "Gerar temas" produziu 9 temas reais e específicos, todos claramente ancorados em dados
  do currículo (Santander Bank, Clean Architecture/DDD, CI/CD com Jenkins/GitHub Actions,
  Kafka/Azure Event Hub, Databricks, Python/Spark, .NET, Devin/Claude Code, mentoria) — nada
  genérico, confirma que a IA está lendo o currículo de verdade.
- "Gerar post" no primeiro tema produziu um texto real: pergunta de abertura, três
  parágrafos ancorados em fatos do currículo (Santander, Go, DDD, Kafka), fechamento com
  pergunta de engajamento, 3 hashtags — dentro do padrão pedido no prompt.
- Botão "Copiar" testado — feedback "Copiado!" funcionou.
- Reabrir a página confirmou persistência: os mesmos 9 temas apareceram sem precisar gerar
  de novo. O rascunho do post NÃO persistiu (card voltou a mostrar "Gerar post") — 
  comportamento esperado, por decisão de escopo.
- `go build`/`go vet` limpos no backend; `tsc --noEmit`/`eslint` limpos no web-app.

## Pendências
Nenhuma.
