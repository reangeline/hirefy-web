# Log — Spec 015: Aba exclusiva de LinkedIn (LinkedIn Scan Report)

## Data
2026-09-12

## O que foi implementado

**Backend (`backend_hirefy`)**
- `domain.LinkedInScan`/`LinkedInScanSection`/`LinkedInScanCheck` — novo domain model.
- `outbound.LinkedInScanRepository` + implementação DynamoDB (`Upsert`/`GetByUserID`),
  singleton por usuário (`PK=USER#<id>`, `SK=LINKEDINSCAN` fixo — sem histórico).
- `outbound.AIService.ScanLinkedInProfile` — audita o texto extraído do PDF contra um
  checklist fixo de 12 itens em 5 seções (Informações básicas, Alto impacto, Experiência
  profissional, Skills, Formação), enumerado explicitamente no prompt pra manter o formato
  estável. Gera também `predicted_skills` e `tips`.
- `inbound.LinkedInScanService` (serviço dedicado, mesmo padrão de `ApplyAssistService`) —
  `ScanProfile` (extrai texto via `extractTextFromPDF` já existente, chama a IA, persiste) e
  `GetLatestScan`. Sem crédito, só autenticado.
- `POST /linkedin-scan` (multipart) e `GET /linkedin-scan`, DI em `cmd/api/main.go`.

**Web-app**
- Nova entrada "LinkedIn" na sidebar (ícone `ScanSearch` — `Linkedin` não existe mais nessa
  versão do lucide-react, brand icons foram removidos do pacote).
- `authedPostMultipartBackend` novo em `lib/api/backend.ts`.
- `src/app/(dashboard)/linkedin/page.tsx` — vazio → `LinkedInScanUpload`; com scan →
  `LinkedInScanReport` (reusa `CircularScore`, checklist por seção, chips de skills
  sugeridas, dicas numeradas, botão "Novo scan").
- Proxy `src/app/api/linkedin-scan/route.ts` (POST multipart + GET, autenticados).

## Decisões tomadas durante a execução (não explícitas na spec original)
- Ícone da nav/upload: a spec previa o ícone `Linkedin` do lucide-react, mas essa versão do
  pacote não exporta mais ícones de marca — trocado por `ScanSearch` (combina com "Scan
  Report").
- Checklist final (12 itens, 5 seções) foi decidido durante o planejamento e já estava
  documentado na spec antes de implementar — sem desvio aqui.

## Divergências entre planejado e executado
Nenhuma de fundo. O plano previa "promover `extractTextFromPDF` pra um helper compartilhado"
caso fosse privado demais pra reusar — na prática já é uma função de pacote (não-método)
dentro do pacote `service`, então o novo `linkedin_scan_service_impl.go` chamou direto sem
precisar mover nada.

## Teste ao vivo (dev)
Sem acesso a uma conta real do LinkedIn nesta sessão, o teste usou dois PDFs sintéticos mas
realistas (gerados via `cupsfilter` a partir de texto no formato de export do LinkedIn),
deliberadamente com gaps conhecidos pra verificar que o checklist reage de verdade ao
conteúdo (não é mockado):

- **PDF 1** (perfil incompleto: sem seção de skills, um cargo sem descrição nem datas,
  headline genérica "Product Manager"): resultado real da IA — **58% (7/12)**. Corretamente
  marcou headline genérica como falha, "Lista de skills" e "Quantidade de skills" como
  falha (com explicação "não há lista de skills no perfil"), e "Associate Product Manager
  não possui datas indicadas". Sugeriu 5 skills relevantes pro cargo e 3 dicas específicas
  (melhorar a headline, adicionar descrição+datas no último cargo, adicionar skills).
- **PDF 2** (mesmo perfil corrigido: headline mais específica, todos os cargos com
  descrição+datas+métricas, seção de skills com 8 itens): resultado real da IA — **100%
  (12/12)**, gauge mudou pra verde. Confirma que o score reage de verdade à melhora.
- Reabrir a aba sem novo upload (`GET /linkedin-scan`) mostrou o scan salvo corretamente.
- "Novo scan" com o PDF 2 substituiu o scan do PDF 1 (score foi de 58% pra 100%, sem
  duplicar nem acumular seções) — confirma o `Upsert` singleton-por-usuário.
- Confirmado visualmente que nenhum item do checklist menciona foto ou capa de perfil.
- `go build`/`go vet` limpos no backend; `tsc --noEmit`/`eslint` limpos no web-app.

## Pendências
- Teste com um PDF real exportado de uma conta de LinkedIn de verdade ainda não foi feito
  (só sintético-realista) — vale confirmar em algum momento que o formato de texto que o
  `ledongthuc/pdf` extrai de um PDF real do LinkedIn bate com o que foi testado aqui, já que
  o layout exato de fontes/colunas do export oficial pode diferir do gerado via
  `cupsfilter`. Registrado como acompanhamento, não bloqueia o fechamento da spec.
