# Log — Spec 021: Internacionalização (pt/en/es)

**Data:** 2026-09-19

## O que foi implementado

**Infraestrutura (Fase 0):**
- `next-intl` instalado e plugado via `next.config.ts` (`createNextIntlPlugin`).
- Todo `src/app/**` (exceto `api/**`) movido pra `src/app/[locale]/**` via `git mv`.
- `src/i18n/routing.ts` (locales `pt`/`en`/`es`, `defaultLocale: "pt"`,
  `localePrefix: "as-needed"`, `localeDetection: false`), `src/i18n/navigation.ts`
  (`Link`/`useRouter`/`usePathname` tipados e locale-aware), `src/i18n/request.ts` (mescla 7
  namespaces por domínio num objeto de mensagens por locale, com mapeamento explícito
  namespace→chave em vez de auto-capitalize — ver "Erros e correções" abaixo).
- `src/proxy.ts` reescrito pra compor a checagem de auth existente
  (`PROTECTED_PREFIXES`) com `createMiddleware(routing)` do next-intl — auth roda primeiro,
  comparando o pathname sem o prefixo de idioma. `/linkedin` foi adicionado a
  `PROTECTED_PREFIXES` (gap pré-existente, não relacionado a i18n, corrigido de brinde).
- `src/app/[locale]/layout.tsx` (era o layout raiz): `<html lang={locale}>` dinâmico,
  `NextIntlClientProvider`, `generateMetadata` por locale.
- `LocaleSwitcher.tsx` novo, plugado no `MarketingNavbar` e no `Topbar` da área logada.
- Mensagens organizadas por domínio: `src/messages/{pt,en,es}/{common,marketing,auth,
  dashboard,resume,pipeline,linkedin}.json` — 21 arquivos.

**Extração de string (Fase 1, 6 lotes paralelos + integração):**
- ~532 chaves de tradução extraídas no total, cobrindo praticamente todo texto visível ao
  usuário: Home/marketing (87 chaves), auth (56), dashboard/sidebar/topbar (38 + navbar),
  currículos (122), pipeline (155), LinkedIn (70), mais as 4 páginas legais (privacy/terms/
  cookies/refund, ~38k caracteres de prosa).
- `STAGE_LABELS`/`INTERVIEW_KIND_LABELS` (antes `Record` estático em `types/pipeline.ts`)
  viraram hooks (`useStageLabels`/`useInterviewKindLabels`, novo arquivo
  `src/lib/hooks/usePipelineLabels.ts`) — IDs de máquina (`wishlist`, `applied` etc.)
  continuam os mesmos, só os rótulos exibidos ficaram translation-driven.
- Todo import de `Link`/`useRouter` de `next/link`/`next/navigation` usado pra navegação
  interna migrado pra `@/i18n/navigation` (preserva o idioma atual ao clicar) — `useSearchParams`/
  `useParams` ficaram intactos em `next/navigation`.
- Componentes puramente visuais sem texto (Reveal, ParallaxCard, ParticleField,
  ConvergeOnScroll, MarketingGradientBackdrop, CircularScore) não foram tocados.

## Decisões tomadas durante a execução que não estavam explícitas no pedido original

- **Reusar o mesmo pool de créditos vs. contador dedicado** e **score pré-cadastro nesta
  rodada** — decisões da spec 020, não desta. N/A aqui.
- **Site inteiro numa rodada só** (não faseado) e **traduções por IA, revisão humana
  depois** — confirmado com o usuário antes de começar (ver seção de contexto do spec.md).
- **Páginas legais traduzidas pro português** — achado no meio da execução: as 4 páginas
  legais já estavam em inglês no site, mesmo com tudo em volta em português (bug
  pré-existente, não introduzido por esta spec). Um dos lotes (marketing) achou isso sozinho
  e tomou a decisão conservadora de NÃO traduzir automaticamente (manteve pt=en, só traduziu
  o espanhol de verdade), justamente pra não alterar conteúdo legal sem confirmação. Levei
  isso ao usuário, que confirmou que queria a tradução pro português — feita depois, numa
  passada dedicada.

## Divergência entre o planejado e o executado

- **Bug real encontrado e corrigido por mim antes de fechar**: `src/i18n/request.ts` usava
  auto-capitalize (`namespace.charAt(0).toUpperCase() + namespace.slice(1)`) pra gerar a
  chave de namespace a partir do nome do arquivo — isso transforma `"linkedin"` em
  `"Linkedin"` (só a primeira letra maiúscula), mas eu tinha instruído todos os lotes a usar
  `useTranslations("LinkedIn")` (com "I" maiúsculo também, seguindo a grafia oficial da
  marca). Isso teria quebrado toda a seção de LinkedIn em runtime (`MISSING_MESSAGE` em
  produção) sem nenhum erro de build/tsc/eslint acusando o problema — só um script de
  verificação estática (comparando cada chamada `t("...")` contra o JSON de origem) pegou.
  Corrigido trocando pra um mapeamento explícito namespace→chave em vez de auto-capitalize.
  Rodei esse script de novo depois da correção: 0 problemas em 148 arquivos.
- **`MarketingNavbar.tsx` ficou sem tradução** — eu disse a todos os lotes pra não tocar
  nesse arquivo (porque já tinha mexido nele na Fase 0, adicionando o `LocaleSwitcher`), mas
  esqueci de traduzir o próprio texto dele (Recursos/Como funciona/Entrar/Criar conta
  grátis) nem na Fase 0 nem atribuindo isso a nenhum lote — gap meu, achado só na verificação
  ao vivo (a barra de navegação continuava em português mesmo no site em inglês). Corrigido
  eu mesmo depois, com uma chave `navbar` nova em `marketing.json`.
- **`JobAtsMatchTab.tsx` não estava na lista de nenhum lote** — mesmo problema: um
  componente pipeline real (usado dentro da aba ATS Match de uma vaga) ficou de fora do
  escopo de todos os 6 lotes por um erro meu de escopo. Achado pelo próprio lote B ao notar
  que o arquivo importava `next/link` sem migração. Corrigido por mim.
- **`CreditLimitReachedCard.tsx` exportava uma lista de features em português puro** só pra
  não quebrar `/pontuacao` (que a importava direto) — o lote que mexeu no primeiro arquivo
  não sabia que o segundo (de outro lote) dependia dele. Resolvido substituindo o array
  PT-only por um array de chaves estáveis (`PREMIUM_LOCKED_FEATURE_KEYS`, exportado), que os
  dois arquivos agora usam pra buscar o texto traduzido — sem duplicar a lista.
- Nenhuma outra divergência de escopo — os 6 lotes (mais a tradução legal) seguiram
  exatamente o plano aprovado.

## Testado ao vivo

- `go`/backend não foi tocado nesta spec (só `web-app`).
- `npx tsc --noEmit`, `npx eslint src --quiet`, `npm run build` — limpos, zero erros, no
  repositório inteiro, depois de todas as correções de integração.
- Script de verificação estática (chave-por-chave, todo `t("...")`/`t.rich("...")`/
  `getTranslations(...)` contra os 21 arquivos JSON): 0 problemas em 148 arquivos, e
  paridade de estrutura de chave confirmada entre pt/en/es nos 7 namespaces.
- `next dev` real: `/`, `/en`, `/es` (Home) — headline, stats, card de ATS, seção de preços,
  rodapé (com `{year}` interpolado certo) todos corretos nos 3 idiomas; `/en/login`
  totalmente traduzido; `/en/pontuacao` (fluxo de score pré-cadastro) totalmente traduzido;
  seletor de idioma trocando corretamente preservando a rota.
- `next start` (build de produção): título da página `/terms` confirmado nos 3 idiomas —
  "Termos de Serviço" (pt), "Terms of Service" (en), "Términos de Servicio" (es).
- **Não testado ao vivo**: fluxo autenticado completo (dashboard/currículos/pipeline/
  LinkedIn) nos 3 idiomas — não havia sessão de teste disponível nesta sessão. Recomendo
  conferir manualmente antes de considerar a spec 100% fechada.
