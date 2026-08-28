# Log — Spec 009: Absorver a hirefy_lading no web-app

**Data:** 2026-08-28

## O que foi implementado

- `src/components/marketing/LegalLayout.tsx` (novo) — wrapper das páginas legais, tokens do
  design system (`bg-background`, `border-border`, `text-muted-foreground`), estilização do
  markdown via classes utilitárias no wrapper (sem plugin de tipografia do Tailwind).
- `src/app/{privacy,terms,cookies,refund}/page.tsx` (novos) — conteúdo legal portado
  **literalmente** de `hirefy_lading/app/{privacy,terms,cookies,refund}/page.tsx`, texto
  jurídico não alterado. Metadata `robots: noindex, nofollow` adicionada nas 4 (só a
  `refund` original tinha isso — replicado nas outras 3 por consistência).
- `src/components/marketing/Pricing.tsx` (novo) — Free + Premium US$19,99/mês (preços reais,
  spec 007), com `pricing_viewed` (IntersectionObserver) e `pricing_cta_clicked` (com
  propriedade `plan`) via `@/lib/analytics` (spec 008) — direto no tema de reforçar o funil
  que motivou esta spec.
- `src/components/marketing/FAQ.tsx` (novo) — conteúdo traduzido pra PT-BR, acordeão nativo
  via `<details>`/`<summary>` (zero JS, acessível por padrão — mais simples que o
  `AnimatePresence` do framer-motion usado no original).
- `src/app/page.tsx` — inclui `<Pricing />` e `<FAQ />` no fluxo (Hero → Problem → Features →
  HowItWorks → Pricing → FAQ → CTASection).
- `src/components/marketing/MarketingFooter.tsx` — links de Privacidade/Termos trocados de
  URL externa pra rota interna; Cookies e Reembolso adicionados.
- `remark-gfm` (nova dependência) — corrige um bug real encontrado ao testar: tabelas
  markdown (usadas em `/cookies`) não renderizavam como tabela, apareciam como texto cru com
  `|`. Confirmado que a `hirefy_lading` original tinha o mesmo bug (nunca teve `remark-gfm`
  instalado) — corrigido na migração em vez de carregado junto.
- `react-markdown` (nova dependência, mesma versão da `hirefy_lading`).

## Não incluído (decisão do usuário)

**Testimonials**: a seção original tinha depoimentos fabricados — nomes de pessoas
específicas ("Sarah Chen", "Michael Torres" etc.) atribuídos a empresas reais (Google,
Amazon, Meta, Adobe, Salesforce, McKinsey) com citações inventadas. Isso é depoimento falso
associado a marca real — prática de marketing enganosa (a FTC nos EUA proíbe isso
explicitamente desde 2024) e risco real de reputação. Sinalizado ao usuário antes de portar;
decisão: não incluir por enquanto, até haver depoimentos reais de usuários do produto.

## Testado ao vivo
`/`, `/privacy`, `/terms`, `/cookies` — tema claro e escuro nas páginas legais (a
`hirefy_lading` original era só clara). Seção de Preços mostra os valores corretos. FAQ:
acordeão abre/fecha corretamente. Tabela de cookies renderiza como tabela de verdade depois
da correção do `remark-gfm`. Rodapé com os 4 links legais confirmados via árvore de
acessibilidade.

## Checklist de infraestrutura — fechado em 2026-08-28

1. ✅ **Vercel**: novo projeto `hirefy-web` criado (linkado ao repo `reangeline/hirefy-web`),
   env vars de produção configuradas (`API_BASE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
   `NEXT_PUBLIC_MIXPANEL_TOKEN`), deploy de produção feito e validado.
2. ✅ **Corte de domínio**: `hirefy.careers` e `www.hirefy.careers` removidos do projeto
   `hirefy-lading` e adicionados ao `hirefy-web`. `vercel domains verify` confirmou
   `configured-correctly` sem nenhuma mudança de DNS necessária.
3. ⏳ **Google Cloud Console** (`https://hirefy.careers` em Authorized JavaScript origins) —
   ainda não feito; baixa prioridade porque login social ainda não está habilitado
   (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` vazio).
4. ✅ `NEXT_PUBLIC_GA_MEASUREMENT_ID`/`NEXT_PUBLIC_MIXPANEL_TOKEN` confirmados sem mudança.
5. ✅ **Destino do `hirefy_lading`**: decisão do usuário foi desativar. Projeto `hirefy-lading`
   **removido da Vercel** (`vercel project rm`) — a URL fallback `hirefy-lading.vercel.app`
   (que continuava servindo o site antigo mesmo sem o domínio customizado) agora retorna 404.
   O repositório GitHub `hirefy_lading` não foi tocado, só o deploy saiu do ar.

## Ambiente de dev do `web-app` (trabalho relacionado, mesma sessão)

Fora do escopo original desta spec, mas na mesma linha de infraestrutura: criada branch
`develop` com gitflow (CI próprio, branch protection) e preview estável na Vercel
(`hirefy-web-git-develop-...vercel.app`) apontando pro backend de dev, com GA4/Mixpanel
**desativados** nesse ambiente (removidos do escopo Preview na Vercel) pra não poluir as
métricas reais de produção. Detalhes de CI/CD ficam fora do padrão de specs numeradas deste
board — é infraestrutura transversal, não uma feature de produto.
