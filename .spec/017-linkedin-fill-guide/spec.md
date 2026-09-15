# Spec 017: Guia de preenchimento do perfil do LinkedIn

## Objetivo
Além do Scan Report (spec 015, que audita um perfil já existente), o usuário quer uma
ferramenta que gere o conteúdo pronto pra preencher cada campo do perfil do LinkedIn
(headline, sobre, experiências, skills) a partir do currículo já salvo no Hirefy — pra
copiar e colar manualmente.

## Investigação (antes de implementar)
- `POST /resumes/linkedin/optimize` (`resume_handler.go:345-369`) já existe, já funciona,
  nunca teve UI (dead endpoint desde a spec 002). Recebe `{resume_id}`, enfileira job
  assíncrono, worker processa via `ProcessLinkedInOptimizationJob`
  (`resume_optimizer_service_impl.go:478-557`), resultado salvo como `OptimizedResume` com
  `parsed_data.type = "linkedin"` (`headline`, `about`, `experiences[]`, `skills[]`,
  `languages[]`, `profile_strength_score`, `suggestions[]`).
- Prompt (`ai_service_impl.go:259-376`) já garante **nunca inventar** skill/certificação/
  empresa/experiência que o candidato não tem — só reescreve o que já existe no currículo.
- Sem crédito (só `subscription.IsActive()`, mesma decisão da spec 013).
- `GET /resumes/optimize/jobs/{jobID}` (polling) e `GET /resumes/optimized/{id}` (resultado)
  já são genéricos — já proxied no web-app, reusados sem alteração.
- **Zero mudança de backend nessa spec.**

## Requisitos

### Web-app
1. Proxy novo `POST /api/resumes/linkedin/optimize` (mesmo padrão de
   `api/resumes/optimize/route.ts`, body só `{resume_id}`).
2. `src/app/(dashboard)/linkedin/fill/page.tsx` — escolhe currículo (auto-seleciona se só
   tiver um), botão "Gerar guia", polling do job (mesmo hook de `OptimizeForm.tsx`),
   redireciona pra `/linkedin/fill/[id]` ao completar.
3. `src/app/(dashboard)/linkedin/fill/[id]/page.tsx` — busca o resultado salvo, valida
   `parsed_data.type === "linkedin"`, renderiza o guia.
4. `LinkedInFillGuide.tsx` — cards por campo (headline, sobre, experiência por cargo,
   skills como chips, idiomas, sugestões), cada um com botão "Copiar"
   (`navigator.clipboard`), score "Força do perfil sugerido" (`CircularScore`).
5. Sidebar: seção LinkedIn ganha sub-item "Guia de preenchimento" (`/linkedin/fill`).

## Fora de escopo
- Qualquer mudança no backend.
- Job-alvo/vaga específica pra direcionar o conteúdo (endpoint é geral).
- Edição inline do conteúdo gerado antes de copiar.
- Integrar/misturar com a tela do Scan Report — ações separadas.

## Critérios de aceite
- [x] Gerar um guia real (não mockado) a partir de um currículo de teste, conteúdo reflete
  o currículo de verdade
- [x] Job assíncrono processa e redireciona pro resultado corretamente
- [x] Todos os botões "Copiar" funcionam (headline, sobre, cada experiência, skills)
- [x] Reabrir `/linkedin/fill/[id]` direto pela URL mostra o mesmo guia salvo
- [x] Sidebar mostra o novo sub-item, aberto por padrão
- [x] `tsc`/`eslint` limpos
- [x] Testado ao vivo em dev
