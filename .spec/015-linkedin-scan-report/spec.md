# Spec 015: Aba exclusiva de LinkedIn (LinkedIn Scan Report)

## Objetivo
Nova aba "LinkedIn" no menu lateral, separada de Currículos/Pipeline: o usuário faz upload
do PDF exportado do próprio perfil do LinkedIn ("Salvar em PDF", recurso nativo do
LinkedIn), a IA audita esse conteúdo e devolve um relatório em formato de checklist —
inspirado no "LinkedIn Scan Report" do Jobscan (imagem de referência trazida pelo usuário):
score circular agregado, itens agrupados por seção, cada um marcado ✅ bem feito / ❌
precisa melhorar com explicação, mais uma seção de skills sugeridas e dicas gerais.

## Decisões confirmadas com o usuário
- **Fonte do perfil**: upload do PDF "Salvar em PDF" do LinkedIn — não formulário manual,
  não extensão de navegador lendo a página ao vivo.
- **Gerador de copy já existente** (`POST /resumes/linkedin/optimize`, que gera
  headline/about/skills sugeridos a partir do currículo salvo, sem UI ligada a ele hoje)
  fica **fora de escopo** — essa spec é só o scanner/checklist, feature conceitualmente
  diferente (audita o que já existe vs. gera conteúdo novo).

## Investigação (antes de implementar)
- `POST /resumes/linkedin/optimize` (`resume_handler.go:339-369`) já existe mas é um
  GERADOR de copy a partir do currículo, não um AUDITOR do perfil atual — resultado com
  `Headline`/`About`/`Experiences`/`Skills`/`Languages`/`Suggestions`/`ProfileStrengthScore`
  único, sem checklist item-a-item, e sem UI nenhuma consumindo — endpoint morto desde a
  spec 002, que já previa isso como "feature separada, spec própria futura". Fica intocado.
- Parser de PDF (`extractTextFromPDF`, `resume_optimizer_service_impl.go:961-984`, lib
  `github.com/ledongthuc/pdf`) extrai **só texto puro** — sem visão, a IA nunca vê imagens
  embutidas no PDF. **Por isso o checklist não inclui checagem de foto de perfil/capa** —
  seria inventar um dado que não conseguimos observar, mesmo princípio já aplicado no
  redesenho do ATS Match (nunca fabricar categoria sem lógica real por trás).
- Padrão de repositório singleton-por-usuário já existe em `SubscriptionRepository`
  (`GetByUserID`/`Create`/`Update`) — modelo pro novo `LinkedInScanRepository`.
- `POST /resumes/parse-pdf` (`resume_handler.go:374`) é o modelo de request multipart
  (`multipart/form-data`, campo `file`, limite 10MB) — mas é rota pública (sem sessão); a
  rota nova precisa de autenticação porque persiste por usuário.

## Checklist do relatório (seções e itens — todos deriváveis de texto)
- **Informações básicas**: nome completo presente; localização presente; headline presente.
- **Alto impacto**: tamanho/qualidade da headline; seção "Sobre" presente e com tamanho
  mínimo razoável.
- **Experiência profissional**: cada cargo tem descrição; descrições usam resultados
  quantificados/verbos de ação; datas presentes.
- **Skills**: lista de skills presente; quantidade razoável.
- **Skills sugeridas** (equivalente a "Predicted Skills" da referência): skills que fazem
  sentido pro cargo/senioridade identificados e não aparecem hoje — rotulado como sugestão
  da IA, não como algo "encontrado" no perfil.
- **Formação**: presente ou não.
- **Dicas gerais**: recomendações de texto livre da IA.

Score agregado = % de itens marcados como bem feito sobre o total de itens aplicáveis.

## Requisitos

### Backend (`backend_hirefy`)
1. `domain.LinkedInScan` novo (`internal/core/domain/linkedin_scan.go`): `ID`, `UserID`,
   `Score`, `Sections []LinkedInScanSection` (`Name`, `Items []LinkedInScanItem`
   `{Label, Passed, Explanation}`), `PredictedSkills []string`, `Tips []string`,
   `CreatedAt`, `UpdatedAt`.
2. `outbound.LinkedInScanRepository` novo — `Upsert`/`GetByUserID`, implementação DynamoDB
   em `internal/adapters/outbound/persistence/dynamodb/linkedin_scan_repository.go`.
3. `outbound.AIService` ganha `ScanLinkedInProfile(ctx, *LinkedInScanInput)
   (*LinkedInScanResult, error)`. Input: `ProfileText`, `TargetRole`. Output: `Score`,
   `Sections`, `PredictedSkills`, `Tips`.
4. Prompt em `ai_service_impl.go` define explicitamente as seções/checks esperados (formato
   estável), pede JSON estruturado, parse com fallback `sanitizeJSON`.
5. `inbound.LinkedInScanService` novo (serviço dedicado, mesmo padrão de
   `ApplyAssistService`/`InterviewPracticeService`) — `ScanProfile` (extrai texto do PDF,
   chama a IA, persiste, substitui scan anterior) e `GetLatestScan`. Sem checagem de
   crédito/plano, só autenticado.
6. Handler + rotas autenticadas: `POST /linkedin-scan` (multipart) e `GET /linkedin-scan`
   (404 se nunca escaneou).
7. DI em `cmd/api/main.go` (não precisa no worker — fluxo síncrono, sem fila).

### Web-app (`web-app`)
8. `authedPostMultipartBackend` novo em `lib/api/backend.ts` (mesmo padrão de
   `postMultipartBackend`, mas com header de autenticação).
9. Proxy novo `src/app/api/linkedin-scan/route.ts` (`POST`/`GET`, CSRF + sessão).
10. Tipo novo `src/types/linkedin.ts` espelhando o shape do backend.
11. Nova entrada "LinkedIn" na navegação lateral (mesmo nível de Dashboard/Currículos).
12. Nova página `src/app/(dashboard)/linkedin/page.tsx`: vazio → upload (reusa padrão visual
    de `PdfImportUpload.tsx`, chama a rota nova, sem formulário de revisão depois); com scan
    → `LinkedInScanReport.tsx` (reusa `CircularScore`, checklist por seção/item, chips de
    skills sugeridas, lista de dicas, botão "Novo scan").

## Fora de escopo
- Checagem de foto de perfil/capa (parser de PDF não processa imagem).
- Histórico de scans anteriores — guarda só o mais recente por usuário.
- Reusar/integrar o gerador de copy já existente — spec futura se fizer sentido.
- Upload via extensão de navegador ou formulário manual.
- Botão de "aplicar sugestão" — aqui é só relatório de leitura (diferente da spec 014).

## Critérios de aceite
- [x] Upload de um PDF exportado do LinkedIn gera um relatório com score e itens reais (não
  fixos/mockados), justificados pelo conteúdo real do texto extraído
- [x] Reabrir a aba sem novo upload mostra o último scan salvo
- [x] Fazer novo upload substitui o scan anterior
- [x] Nenhum item de checklist sobre foto/capa de perfil
- [x] `go build`/`go vet` limpos no backend; `tsc`/`eslint` limpos no web-app
- [x] Testado ao vivo em dev com um PDF de perfil real/realista
