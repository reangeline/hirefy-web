# Spec 012: Prática de entrevista focada nos gaps reais da vaga

## Objetivo
A visão de produto até aqui resolvia "conseguir a entrevista" (ATS + pipeline + auto-apply).
O usuário pediu explicitamente o próximo passo: ajudar a **passar** na entrevista, não só
chegar nela. Diferencial competitivo identificado numa conversa de brainstorm: nenhuma
ferramenta de prep de entrevista (Pramp, Big Interview, etc.) cruza o treino com o gap real
que a própria IA já calculou pra aquela vaga específica — a prática de entrevista (spec 010)
e o score de ATS (spec 002) hoje vivem lado a lado, mas não se conversam de propósito. Esta
spec conecta os dois: a prática de entrevista passa a **priorizar** perguntas que sondam
exatamente as lacunas que o currículo do usuário tem pra aquela vaga, em vez de perguntas
comportamentais genéricas.

## Investigação (antes de implementar)

- **`MissingKeywords`/`MatchedKeywords` já são persistidos no próprio `PipelineJob`**
  (`internal/core/domain/pipeline_job.go:83-84`, DynamoDB via `pipeline_repository_impl.go`).
  Ou seja, qualquer vaga que já passou por "Preparar candidatura" (extensão) ou pela
  otimização de currículo no web-app já tem esse dado disponível sem consulta extra.
- **`MissingRequirements`** (o gap mais rico, em frase — ex: "Direct experience with
  Bare-metal provisioning" — não só uma palavra-chave suelta) só existe em
  `OptimizedResume` (`internal/core/domain/resume.go:37`), **não** está no `PipelineJob`.
  `interviewPracticeServiceImpl.resumeDataFor` (linhas 44-57) já busca o currículo vinculado
  pra outros fins, mas hoje só usa `ParsedData` — não pega `MissingRequirements`.
- **`GenerateInterviewQuestion` já recebe `MissingKeywords`/`PastGaps`**
  (`InterviewQuestionInput`, `ai_service.go:102-112`) e o prompt
  (`ai_service_impl.go:736,747`) já interpola isso — mas como contexto passivo entre outros
  sinais (currículo, perguntas anteriores), não como instrução de prioridade. Ou seja: **o
  encanamento já existe de ponta a ponta**, só falta (a) trazer `MissingRequirements` pra
  dentro do fluxo e (b) mudar o prompt de "aqui está uma lista de contexto" pra "priorize
  sondar exatamente essas lacunas".
- **`pipeline_coach_service`** (Coach tab) também já recebe `MatchedKeywords`/
  `MissingKeywords`/`AtsScore` por estágio, mas é uma feature separada (dicas gerais por
  estágio do pipeline, não perguntas de prática) — fora do escopo desta spec, não muda.

Conclusão: não precisa de endpoint novo nem de mudança de contrato externo. É uma mudança
concentrada em `interview_practice_service_impl.go` (buscar `MissingRequirements` junto) +
`ai_service_impl.go` (prompt) + um ajuste de transparência na UI (`JobInterviewTab.tsx`).

## Requisitos

1. `interviewPracticeServiceImpl.resumeDataFor` (ou equivalente) passa a também buscar
   `MissingRequirements` do `OptimizedResume` vinculado ao `PipelineJob` (via
   `job.OptimizedResumeID`), junto com o `MissingKeywords` que já vem do próprio job.
2. `InterviewQuestionInput` ganha os dois sinais combinados (ou reusa os campos existentes
   preenchendo com os dois), e o prompt em `GenerateInterviewQuestion` muda de listar como
   contexto pra uma instrução explícita: priorizar gerar a próxima pergunta sondando um gap
   real ainda não coberto pelas perguntas anteriores da sessão (usa `PastGaps` já existente
   pra não repetir).
3. Se a vaga não tem `MissingKeywords`/`MissingRequirements` calculados (nunca passou por
   otimização/preparação) — cai no comportamento genérico atual, sem quebrar nem exigir que
   o usuário faça isso antes.
4. `JobInterviewTab.tsx`: transparência simples — indicar visualmente quando a sessão está
   "focada nos gaps da vaga" vs. modo genérico, sem precisar listar cada gap individualmente
   (evita a UI virar uma lista de "seus defeitos").

## Fora de escopo
- Mudar `EvaluateInterviewAnswer` ou o histórico de perguntas — só a geração da próxima
  pergunta muda.
- Endpoint novo — reusa `POST .../interview-practice/question` existente.
- Ideias adjacentes discutidas no brainstorm (prep de negociação de oferta, debrief
  pós-entrevista real) — ficam como possíveis specs futuras, não decididas ainda.
- Mudar o Coach do Pipeline (`pipeline_coach_service`) — feature separada, não tocada aqui.

## Critérios de aceite
- [x] Numa vaga real com `missing_keywords`/gaps calculados, a pergunta gerada sonda um dos
  gaps reais — testado ao vivo em dev (MAVI, Full Stack Engineer, 43% ATS, currículo
  backend-focused): pergunta gerada foi "Tell me about a time when you had to learn and
  apply a new frontend technology... especially when your background was primarily
  backend-focused" — sonda de propósito o gap backend-vs-fullstack real da vaga, não uma
  pergunta comportamental genérica
- [x] Perguntas sucessivas na mesma sessão não repetem literalmente o mesmo gap — testado
  gerando uma segunda pergunta na mesma vaga: veio sobre "colaborar com devs frontend /
  bridging backend-frontend", um ângulo diferente da primeira (aprender sozinho vs.
  colaborar em equipe) dentro da mesma área de gap. Mecanismo é inferência da IA a partir do
  texto das perguntas anteriores (não há rastreio estruturado de "pergunta X = gap Y") —
  funciona, mas é soft por design, documentado como limitação conhecida
- [x] Vaga sem otimização prévia continua gerando pergunta genérica normalmente, sem erro —
  testado ao vivo em dev (Plato, Full Stack Software Engineer, movida temporariamente de
  Wishlist pra Aplicado só pra habilitar a aba, sem `missing_keywords`): gerou uma pergunta
  comportamental genérica bem-formada ("balance front-end and back-end development"), sem
  aviso de "modo focado" na UI e sem erro. Vaga devolvida pro estágio Wishlist original
  depois do teste
- [x] UI sinaliza quando a sessão está no modo "focado nos gaps da vaga" — testado ao vivo,
  aviso "Essa prática vai focar nos gaps reais que a IA já encontrou nessa vaga." aparece
  corretamente antes de gerar a primeira pergunta
- [x] Testado ao vivo com uma vaga real que já tem gaps de ATS calculados (dev) — MAVI, ver
  acima. Deploy em dev confirmado via `gh run watch` (backend) + redeploy Vercel (web-app)
