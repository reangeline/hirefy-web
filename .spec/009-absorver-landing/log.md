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

## Checklist de infraestrutura (entregue ao usuário, não executado)

Fora do que código pode resolver — requer acesso a contas externas que não tenho:

1. **Vercel**: adicionar `hirefy.careers` como domínio do projeto `web-app` (hoje é do
   projeto `hirefy_lading` — precisa remover de um antes de adicionar no outro)
2. **DNS**: normalmente nenhuma mudança de registro é necessária se o domínio já aponta pro
   Vercel, só a reassociação domínio→projeto dentro do próprio Vercel
3. **Google Cloud Console**: adicionar `https://hirefy.careers` em "Authorized JavaScript
   origins" do OAuth Client ID já usado pro login social (spec 001)
4. `NEXT_PUBLIC_GA_MEASUREMENT_ID`/`NEXT_PUBLIC_MIXPANEL_TOKEN` do `web-app` (spec 008) não
   precisam mudar — são os mesmos independente do domínio
5. **Só depois de validar o corte ao vivo**: decidir o que fazer com o deploy/repositório da
   `hirefy_lading` (arquivar, deletar, ou manter sem tráfego) — pedir confirmação separada
   nessa hora, é uma ação difícil de reverter
