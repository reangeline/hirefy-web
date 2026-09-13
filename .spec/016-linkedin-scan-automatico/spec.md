# Spec 016: Leitura automática do perfil do LinkedIn via extensão

> **Status: planejamento apenas.** Combinado com o usuário adiar a implementação pra uma
> sessão futura — essa spec documenta a investigação e as decisões já tomadas, pra não
> perder o contexto entre sessões. Nenhum código dessa spec foi escrito ainda.

## Objetivo
Hoje (spec 015) o "LinkedIn Scan Report" só funciona via upload manual do PDF exportado do
LinkedIn ("Salvar em PDF"). O usuário perguntou se dava pra automatizar: o usuário só acessa
o próprio perfil no LinkedIn e a `browser_extension` (já existe, faz auto-apply desde a spec
011) lê o conteúdo direto da página, sem precisar exportar/subir PDF nenhum.

**Ganho real sobre o PDF**: o parser de PDF (`extractTextFromPDF`) só lê texto puro, nunca
processa imagem — por isso o checklist da spec 015 não tem check de foto/capa de perfil. Lendo
a página ao vivo, dá pra checar presença de foto/capa de verdade, fechando essa lacuna
documentada como "fora de escopo" na spec 015.

## Decisão de segurança/ética (inegociável, não é decisão de produto)
A extensão só pode ler um perfil quando tiver certeza razoável de que é o perfil do **próprio
usuário logado** — nunca ler o perfil de terceiros. Sinal proposto: procurar um elemento que o
LinkedIn só mostra pro dono do perfil (ex: botão "Editar perfil"/pencil icon perto do
cabeçalho). Se esse sinal não for encontrado com confiança, a extensão simplesmente não
oferece a ação de escanear naquela página — nunca chuta.

## Investigação (já concluída)

**Extensão (`browser_extension/`)**
- `manifest.json:15` — content script hoje só roda em `https://www.linkedin.com/jobs/*`.
  Precisa de uma entrada nova de `matches` pra `https://www.linkedin.com/in/*`.
  `host_permissions` (`manifest.json:20-23`) já cobre `linkedin.com/*` de forma ampla e a URL
  do backend — não precisa de permissão nova aí.
- Scraping hoje (`src/content/scrapeJobPosting.ts`, `src/content/detectEasyApplyFields.ts`)
  evita classes CSS ofuscadas do LinkedIn, usa âncoras estáveis (`document.title`, ids
  previsíveis tipo `JobDetails_AboutTheJob_<id>`, `label[for]`/`aria-label`). O mesmo
  princípio vale pro scraper de perfil novo — não inventar seletor frágil de classe CSS.
- Sem `MutationObserver` — usa polling (`setInterval`) porque o LinkedIn é SPA
  (`src/content/index.tsx:108-111`). Mesma abordagem serviria pro scraper de perfil.
- **Auth**: token em `chrome.storage.local` (`background/index.ts:17,38-49`), login é tela
  própria da extensão (não lê cookie do web-app). `authedFetch()`
  (`background/index.ts:54-91`) monta `Authorization: Bearer <token>`, mas **força
  `Content-Type: application/json` incondicionalmente** — não dá pra mandar
  `multipart/form-data` sem alterar essa função. Nenhuma chamada existente na extensão hoje
  é multipart.
- **UI**: painel injetado via Shadow DOM (`#hirefy-apply-assist-root`,
  `src/content/index.tsx:47-66`), só monta quando o scraper acha conteúdo relevante — mesmo
  padrão serviria pro botão "Escanear meu perfil", condicionado ao sinal de "é meu perfil".
- Sem nenhuma anti-detecção/rate-limit hoje na extensão (grepado, não existe) — se vier a
  precisar, é achado a registrar na hora, não assumir de antemão.

**Backend (`backend_hirefy/`)**
- `POST /linkedin-scan` (spec 015) é multipart, espera um PDF. Pra não precisar ensinar a
  extensão a mandar `FormData` (mudaria `authedFetch`, usado por toda a extensão), o caminho
  mais simples é um endpoint **novo**, só JSON: `POST /linkedin-scan/text`.
- Reusa quase tudo que já existe: `inbound.LinkedInScanService.ScanProfile` hoje faz
  `extractTextFromPDF` → `aiService.ScanLinkedInProfile` → persiste. Só precisa de uma
  variante que pula a extração de PDF (já recebe o texto pronto) — extrair a lógica
  compartilhada (validar, chamar IA, persistir) pra uma função privada reusada pelos dois
  fluxos, em vez de duplicar.

## Requisitos (quando for implementar)

### Backend
1. `outbound.LinkedInScanInput` ganha dois campos opcionais: `HasProfilePhoto *bool`,
   `HasCoverPhoto *bool` (ponteiro pra distinguir "não sabemos" de "sabemos que não tem" —
   só vem preenchido quando a origem é a extensão).
2. `inbound.LinkedInScanService` ganha `ScanProfileFromText(ctx, req) (*domain.LinkedInScan,
   error)` — mesma lógica de `ScanProfile`, mas recebendo `ProfileText` já pronto em vez de
   `PDFBytes` (sem extração de PDF). Compartilhar a parte de validação/IA/persistência com
   `ScanProfile` via helper privado, não duplicar.
3. As duas checagens de foto/capa **não passam pela IA** — são fatos binários, calculados
   direto no Go a partir dos campos opcionais, e viram uma seção nova `"Apresentação visual"`
   só quando os campos vierem preenchidos (scans via PDF continuam com as 5 seções de hoje,
   sem essa seção — nunca fabricar o dado que não temos).
4. Rota nova `POST /linkedin-scan/text` (autenticada, JSON:
   `{profile_text, target_role?, has_profile_photo?, has_cover_photo?}`).

### Extensão
5. Novo content script matching `linkedin.com/in/*`, com detecção de "é o meu perfil" (ver
   decisão de segurança acima) antes de montar qualquer UI.
6. Scraper de perfil (`scrapeProfile.ts`, mesmo espírito de `scrapeJobPosting.ts`): nome,
   headline, localização, about, experiências, formação, skills, presença de foto/capa.
7. Painel injetado (mesmo padrão Shadow DOM) com botão "Escanear meu perfil" → monta o texto
   do perfil (mesmo formato que o PDF geraria) → `authedFetch('/linkedin-scan/text', {...})`
   → ao concluir, abre `app.hirefy.com/linkedin` numa nova aba (não duplicar a UI do
   relatório dentro da extensão — o web-app já tem `LinkedInScanReport`).

## Fora de escopo (quando for implementar)
- Ler perfil de terceiros, mesmo que o usuário peça — bloqueado pela decisão de segurança.
- Duplicar a UI do relatório dentro da extensão.
- Anti-detecção/rate-limiting — só entra se um problema real aparecer.
- Migrar o fluxo de PDF pra extensão ou vice-versa — os dois convivem, PDF continua sendo a
  opção pra quem não tem a extensão instalada.

## Critérios de aceite (quando for implementar)
- [ ] Content script só oferece o botão de scan quando confirma, via sinal de "dono do
  perfil", que é o próprio usuário
- [ ] Scan via extensão gera um relatório com a seção extra "Apresentação visual"
  (foto/capa), que não aparece nos scans feitos via PDF
- [ ] `POST /linkedin-scan/text` funciona ponta a ponta com um perfil real, testado ao vivo
- [ ] `go build`/`go vet` limpos no backend; extensão builda sem erros (`vite build`)
