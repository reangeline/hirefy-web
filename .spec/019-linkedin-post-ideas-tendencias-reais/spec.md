# Spec 019: Temas de publicação com tendências reais (busca na web)

> **Status: planejamento apenas, a pedido do usuário.** Nenhum código escrito. Documento pra
> decisão — tem pergunta em aberto que só o usuário pode responder antes de virar spec
> implementável.

## Objetivo
A spec 018 (Ideias de publicação) gera temas com a IA, mas sem acesso à web — são ângulos
atemporais baseados só no currículo, não notícia/tendência real. O usuário perguntou de onde
vêm os temas hoje e confirmou que não quer "genérico" — essa spec avalia o caminho pra trazer
tendência/notícia de verdade pro tema, e o que isso custa.

## Investigação

**O que existe hoje**: `callOpenAI` (`ai_service_impl.go:993+`) chama
`https://api.openai.com/v1/chat/completions` — API de chat comum, sem ferramenta de busca.
Confirmado de novo: nenhuma integração de busca/notícia em nenhum lugar do backend.

**Opção viável sem trocar de fornecedor**: a OpenAI (mesmo provedor já usado, mesma
`OPENAI_API_KEY` já configurada) oferece busca na web nativa via **Responses API**
(`POST /v1/responses`, endpoint diferente do que o backend usa hoje), com
`tools: [{"type": "web_search"}]` no corpo da requisição. O modelo decide sozinho se
precisa buscar, faz a busca, e a resposta vem com citação da fonte (URL) — dá pra mostrar
"segundo [fonte]" na UI, em vez de só afirmar que é tendência sem prova, mantendo a mesma
régua de honestidade já seguida no resto do produto.

**Custo real, confirmado na documentação oficial da OpenAI (não estimativa)**:
- **US$ 10 a cada 1.000 chamadas de busca**, mais
- **~8.000 tokens de entrada por chamada** (cobrados à taxa normal do modelo escolhido) —
  esse bloco de tokens é o conteúdo da página buscada que o modelo processa.

Ou seja: isso não é gratuito nem desprezível — cada clique em "gerar temas com tendência
real" teria um custo direto de infraestrutura, diferente de tudo que already existe no
LinkedIn hoje (scan, guia de preenchimento, temas atemporais), que só pagam o custo normal
de tokens de texto, sem taxa fixa por chamada.

## Duas perguntas que só o usuário pode responder antes de virar spec implementável

1. **Vale o custo extra?** Hoje currículo/LinkedIn são recursos grátis pra qualquer
   cadastrado (spec 013). Uma busca real custaria ~US$0,01+ por geração, em cima do que hoje
   não custa nada de taxa fixa. Três caminhos possíveis:
   - Deixa grátis mesmo assim (aceita o custo como parte do produto).
   - Vira exclusivo Premium (junto com entrevista/coach, que já são os recursos pagos).
   - Fica grátis mas limitado (ex: N gerações com busca real por mês por usuário).
2. **Convive com a versão atemporal (spec 018) ou substitui?** Recomendo manter as duas —
   "Gerar temas" (atual, grátis, sem busca) e "Gerar temas com tendência real" (novo, com
   busca, custo) como duas ações separadas na mesma tela, deixando claro pro usuário qual é
   qual antes de clicar.

## Arquitetura proposta (se aprovado)

### Backend
- Novo helper `callOpenAIResponses` (ou variante de `callOpenAI`) que chama
  `POST /v1/responses` em vez de `/v1/chat/completions` — shape de request/response
  diferente (usa `input` em vez de `messages`, resposta traz `output` com blocos de texto +
  anotações de citação de URL).
- `outbound.AIService` ganha `GenerateLinkedInPostTopicsWithSearch(ctx, *PostTopicsInput)
  (*PostTopicsResult, error)` — mesmo shape de saída da spec 018
  (`domain.LinkedInPostTopic{Title, Angle}`), mas `Angle` passa a poder citar a fonte real
  (ex: "Segundo [nome do site/artigo], ..."). Precisa de um campo novo pra guardar a URL
  citada — `domain.LinkedInPostTopic` ganharia `SourceURL string,omitempty`.
- Prompt teria que pedir buscas ligadas ao stack/senioridade do candidato (ex: "busque
  discussões/desenvolvimentos recentes relacionados a Go, Kubernetes, sistemas bancários..."
  — os mesmos termos já extraídos do currículo na spec 018) e exigir que cada tema cite a
  fonte real encontrada, nunca inventar uma citação.
- Rota nova ou parâmetro novo na rota existente (`POST /linkedin-post-topics?real=true` ou
  campo `use_web_search: true` no body) — a decidir dependendo da resposta da pergunta 2.
- Se a resposta da pergunta 1 for "Premium" ou "limitado", precisa de checagem de
  plano/contador — infraestrutura que já existe (`subscriptionRepo`,
  `creditTransactionRepo`) mas precisaria ser plugada aqui, hoje o LinkedIn não usa nenhuma
  das duas (spec 013 tirou o crédito de tudo que é currículo/LinkedIn).

### Web-app
- Na página `/linkedin/posts`, segundo botão "Gerar temas com tendência real" ao lado do
  atual — ou um toggle/switch antes de clicar.
- Cada card de tema, quando veio de busca real, mostra a fonte citada (link clicável, texto
  tipo "Baseado em: [nome da fonte]") — pra manter a mesma transparência que fizemos com "IA
  sugere, não é notícia" na spec 018, só que ao contrário: aqui **é** notícia real, e precisa
  provar isso mostrando de onde veio.
- Se virar recurso pago/limitado, precisa de UI de gate (mesmo padrão de
  `ErrPremiumRequired`/403 já usado no apply-assist, spec 011).

## Fora de escopo (mesmo se aprovado)
- Fontes automáticas/push (feed que atualiza sozinho) — continua sob demanda, clique do
  usuário, igual a spec 018.
- Provedor de busca terceiro (NewsAPI, Tavily, SerpAPI etc.) — só entraria em consideração
  se o `web_search` nativo da OpenAI se mostrar insuficiente (cobertura ruim, não citando
  fonte direito) depois de testado.
- Histórico de buscas anteriores.

## Verificação (quando for implementar)
- Testar que o tema gerado cita uma fonte real e verificável (não inventada).
- Confirmar o custo real observado bate com a estimativa (~US$0,01+ por geração) via billing
  da OpenAI, não só a documentação.
- Testar o caminho de gate (se pago/limitado): usuário sem acesso vê a UI de bloqueio
  correta, não erro genérico.
