# Spec 011: Auto-apply assistido via extensão de navegador (LinkedIn)

## Objetivo
Fechar o último pilar em aberto da visão de produto (auto-apply, apontado pelo próprio
usuário como o gap que faltava ao lado do coach de entrevista): ajudar o
usuário a se candidatar mais rápido, sem digitar tudo de novo em cada vaga do LinkedIn.
Referência trazida pelo usuário: a extensão de Chrome da LoopCV
(loopcv.pro/pt/linkedin-auto-apply), que roda no navegador do próprio usuário e preenche o
formulário de candidatura.

**Decisão de escopo já tomada com o usuário:**
- Plataforma: LinkedIn primeiro, mas a arquitetura não deve assumir que só existe LinkedIn —
  outras plataformas (Indeed, Gupy) ficam pra depois.
- Nível de automação: **humano confirma cada envio**. A extensão prepara tudo (preenche o
  formulário, sugere respostas) mas quem clica em "Enviar candidatura" é o usuário — reduz
  risco de banimento de conta e de aplicar em vaga errada sem querer.
- Monetização: **feature 100% Premium, sem consumo de crédito por uso** — assinante Premium
  usa à vontade (mesmo espírito do coach ilimitado), sem lógica de custo por candidatura pra
  desenhar/manter.

## Risco conhecido — trazido pra decisão do usuário, não é bloqueio silencioso
Automatizar o preenchimento/envio de candidaturas no LinkedIn viola os Termos de Uso deles
(proíbem "acesso automatizado"). É exatamente por isso que ferramentas como a LoopCV rodam
como extensão no navegador do próprio usuário (parece um humano clicando) em vez de bot no
servidor — mitiga mas não elimina o risco. Contas já foram banidas por esse tipo de uso.
Mitigação de design adotada: humano confirma cada envio (decisão acima) + esta spec evita
scraping em massa/fila automática de vagas na v1 (ver "Fora de escopo").

## Investigação cruzada (backend + mobile) — feita antes desta spec

### Backend (`backend_hirefy`) — muito mais reuso do que trabalho novo
- **`POST /resumes/optimize`** (assíncrono, `GET /resumes/optimize/jobs/{jobID}` faz polling)
  já recebe uma job description crua e devolve `ats_score`, `matched_keywords`,
  `missing_keywords`, sugestões — exatamente o que a extensão precisa depois de raspar o
  texto da vaga no LinkedIn. **Não precisa de endpoint novo pra isso.**
- **`POST /pipeline`** (`CreateJob`) já cria uma vaga no board com
  `company_name/job_title/job_description/job_url/resume_id/stage`. A extensão só precisa
  chamar isso com `stage=applied` depois que o usuário confirma o envio. **Não precisa de
  endpoint novo pra isso.**
- **`POST /auth/signin`** já devolve os tokens crus no corpo da resposta (não via cookie) —
  é assim que o app mobile já autentica. Uma extensão de navegador consegue usar o mesmo
  contrato direto, guardando os tokens em `chrome.storage.local` (equivalente ao que o
  mobile já faz). **Não precisa de endpoint nem fluxo de auth novo.**
- **O que É novo**: um método de IA pra sugerir resposta às perguntas de triagem custom do
  Easy Apply ("anos de experiência com X", "pretensão salarial", "autorizado a trabalhar
  em...") — não existe hoje. Mesmo padrão de `GenerateInterviewQuestion`/
  `EvaluateInterviewAnswer` (spec 010): prompt com dados do currículo + pergunta → resposta
  sugerida. Precisa de: novo método em `AIService`, novo endpoint (ex:
  `POST /pipeline/{jobId}/apply-assist/answer` ou similar), gate de assinatura Premium (sem
  consumo de crédito — decisão do usuário, ver seção anterior).

### Mobile (`applywise_app`)
Não existe nada equivalente — confirmado via busca no código, nenhuma menção a auto-apply,
extensão ou automação de candidatura. As únicas menções a "LinkedIn" no mobile são sobre
*otimizar o texto do perfil* (`linkedin_opt_select_screen.dart`), uma feature completamente
diferente (não preenche formulário nenhum). Não há comportamento mobile pra espelhar aqui —
esta é a primeira vez que esse pilar do produto ganha implementação em qualquer plataforma.

## Requisitos (v1)

1. **Novo projeto no monorepo**: extensão de navegador (Chrome, Manifest V3) — provavelmente
   `browser_extension/` na raiz, TypeScript, content script + popup de login.
2. **Login na extensão**: formulário simples (email/senha) chamando `POST /auth/signin`
   direto no backend; tokens guardados em `chrome.storage.local`; mesmo fluxo de refresh já
   usado no mobile (interceptar 401, chamar `/auth/refresh`, tentar de novo).
3. **Content script ativo em página de vaga do LinkedIn** (`linkedin.com/jobs/view/*` e o
   modal de Easy Apply): injeta um painel flutuante da Hirefy com:
   - Botão "Preparar candidatura": raspa o texto da vaga (título, empresa, descrição) da
     página, chama `POST /resumes/optimize` com o currículo escolhido pelo usuário, mostra
     o score de ATS e keywords faltando ali mesmo, sem sair do LinkedIn.
   - Preenchimento automático dos campos padrão do Easy Apply (nome, telefone, etc. — dados
     já existentes no currículo estruturado) — o usuário revisa antes de avançar.
   - Se houver perguntas de triagem custom: botão "Sugerir resposta com IA" por pergunta
     (novo endpoint, ver acima) — o usuário edita/aceita antes de preencher o campo.
4. **Nunca envia sozinha**: o clique final em "Enviar candidatura" continua sendo o botão
   nativo do LinkedIn, controlado pelo usuário.
5. **Depois do envio**: a extensão pergunta "Registrar essa candidatura no seu Pipeline?" —
   se sim, chama `POST /pipeline` com `stage=applied` e os dados já raspados/preenchidos.
6. Rate limiting defensivo simples do lado da extensão (ex: no máximo N "preparar
   candidatura" por hora) — mitigação de detecção, não precisa ser sofisticado na v1.

## Fora de escopo (v1)
- Busca/fila automática de vagas no LinkedIn (crawlear resultados de busca e aplicar em
  lote) — é o que a LoopCV promete de mais ambicioso, mas eleva muito o risco de ban e a
  complexidade (paginação, scraping em background, detecção mais agressiva do LinkedIn).
  Fica como fase 2 explícita, não decidida nesta spec.
- Outras plataformas (Indeed, Gupy, etc).
- Envio 100% autônomo sem confirmação humana.
- Firefox/Edge — só Chrome (Manifest V3) na v1.

## Perguntas em aberto
1. Precisa de uma tela de configurações na extensão (ex: escolher currículo padrão, opt-out
   de sugestão de IA) ou isso fica só no popup simples da v1?
2. O painel flutuante precisa ler a página em português E inglês (LinkedIn muda o DOM/labels
   por idioma) — vale confirmar se o público-alvo aplica majoritariamente em vagas em inglês
   (perfil do usuário: profissionais de TI mirando remoto) antes de decidir o esforço de
   parsing multi-idioma.

## Achado durante a implementação — mudança de escopo pedida pelo usuário
Depois do v1 (assiste uma vaga já aberta) funcionar ao vivo, o usuário pediu explicitamente
pra trazer pra esta spec o item que tinha ficado como "fase 2" em "Fora de escopo": triagem
da **lista** de resultados de busca do LinkedIn, não só da vaga aberta. Decisões tomadas com
o usuário nessa hora:
- Sem custo de IA na lista — filtro client-side por palavras-chave (currículo vs título da
  vaga), só pra pré-ordenar. Score de ATS de verdade (IA) continua só na vaga aberta.
- "Aprovar" só marca numa fila local (`chrome.storage.local`) de "quero aplicar" — não abre
  nem prepara nada sozinho; usuário ainda abre cada vaga aprovada individualmente depois.
- Fila aprovada visível em dois lugares (painel na página + popup da extensão), com botão
  "Abrir" (nova aba) — fechado depois que o usuário testou o v1 da fila e achou o fluxo
  incompleto sem um jeito de voltar nas vagas aprovadas.

Depois disso, o usuário pediu uma aba no web-app pra listar essas vagas, com referência à
LoopCV. A pesquisa mostrou que o fluxo real da LoopCV é painel-cêntrico com **envio 100%
automático** — diverge da decisão de segurança já tomada aqui (humano confirma o envio).
Decisão final com o usuário: manter humano-confirma-envio, e sincronizar a lista entre
extensão e web-app pelo backend. Em vez de criar uma tabela/endpoint novo, a "fila aprovada"
virou o estágio **Wishlist** que o Pipeline já tinha — "Aprovar" chama o `POST /pipeline`
real com `stage=wishlist`, e a "aba no web-app" é a própria coluna Wishlist do Dashboard
(zero rota nova). Adicionado botão "Abrir vaga original" no `JobActionsCard.tsx` do web-app
pra fechar o ciclo de volta pro LinkedIn.

Testado ao vivo de ponta a ponta em 2026-08-28: aprovar uma vaga real (CyberCoders, jobId
4451253302) na lista da extensão → apareceu instantaneamente na coluna Wishlist do
Dashboard real, sem reload manual além de revisitar a página → "Abrir vaga original" abriu
a aba certa (`linkedin.com/jobs/view/4451253302/`). Confirmado também que uma vaga
pré-existente na Wishlist sem `job_url` (criada manualmente antes desta spec) não quebra a
sincronização nem mostra o botão "Abrir" indevidamente.

## Critérios de aceite
- [x] Extensão instalável localmente (modo desenvolvedor) no Chrome
- [x] Login funciona e mantém sessão entre reinícios do navegador
- [x] Em uma vaga real do LinkedIn, "Preparar candidatura" mostra score de ATS e keywords
  faltando usando o currículo escolhido, sem sair da página — testado ao vivo (EasyPost,
  score 45% real, ~49s de processamento)
- [x] Campos padrão do Easy Apply são preenchidos automaticamente a partir do currículo —
  achado ao testar: o próprio LinkedIn já preenche email/telefone/currículo a partir do
  perfil da pessoa antes mesmo da extensão agir. Não precisou de código novo pra isso.
- [ ] Pergunta de triagem custom recebe sugestão de resposta via IA — não testado ainda
  (nenhuma vaga aberta durante os testes tinha pergunta de texto livre)
- [ ] Toda a feature (preparar candidatura + sugestão de resposta) só funciona pra assinante
  Premium, sem consumir crédito — gate implementado no backend, não testado com uma conta
  Free de verdade batendo o 403
- [ ] Depois do envio manual pelo usuário, a vaga aparece no Pipeline (`stage=applied`) sem
  precisar recadastrar nada — não testado (evitado de propósito pra não criar candidatura
  falsa na conta real durante os testes)
- [x] Triagem da lista de busca: vagas ordenadas por palavra-chave, aprovar/remover, fila
  visível no painel e no popup, "Abrir" leva direto pra vaga — testado ao vivo pelo usuário
- [x] Aprovar uma vaga na lista sincroniza com o Wishlist real do Pipeline (backend), aparece
  no Dashboard do web-app sem recadastro manual, e "Abrir vaga original" leva pra vaga certa
  no LinkedIn — testado ao vivo em 2026-08-28 (CyberCoders, jobId 4451253302)
- [x] Testado ao vivo contra o backend de dev, numa vaga real do LinkedIn (múltiplos testes:
  EasyPost pra otimização, CyberCoders pra sincronização com o Pipeline)
