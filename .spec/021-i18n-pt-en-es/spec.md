# Spec 021 — Internacionalização (pt/en/es)

## Objetivo
Suporte a 3 idiomas no site inteiro (marketing + área logada): português (padrão/atual),
inglês e espanhol. Traduções en/es geradas por IA nesta rodada, revisão humana fica pra
depois — não bloqueia a implementação técnica.

## Requisitos
- Biblioteca `next-intl`, roteamento `localePrefix: "as-needed"` (PT sem prefixo, preserva
  URLs já indexadas; EN/ES com prefixo `/en/...`/`/es/...`).
- `localeDetection: false` — sem redirecionamento automático por idioma do navegador; troca
  só via seletor explícito, persistida em cookie.
- Todo `src/app/**` (exceto `api/**`) movido pra `src/app/[locale]/**`.
- `src/proxy.ts` compõe a checagem de auth existente com o roteamento de idioma do
  next-intl.
- Mensagens organizadas por domínio (`common`, `marketing`, `auth`, `dashboard`, `resume`,
  `pipeline`, `linkedin`), um arquivo JSON por idioma por domínio — evita conflito de
  escrita ao paralelizar o trabalho de extração.
- Seletor de idioma visível no `MarketingNavbar` e no `Topbar` da área logada.
- `STAGE_LABELS`/`INTERVIEW_KIND_LABELS` (`src/types/pipeline.ts`) viram chaves de tradução;
  IDs de máquina não mudam.

## Fora de escopo
- Tradução de e-mails transacionais (backend_hirefy/SES).
- Tradução de mensagens de erro que vêm cruas do backend (texto literal do Go).
- Metadata SEO por rota além de título/descrição básicos do layout raiz.
- Revisão humana/nativa da qualidade das traduções en/es (fica pra depois, por decisão do
  usuário).

## Critérios de aceite
- [ ] `tsc`/`eslint`/`build` limpos.
- [ ] `/`, `/en`, `/es` renderizam a Home no idioma certo.
- [ ] Seletor de idioma troca o idioma preservando a rota atual.
- [ ] Fluxo autenticado (dashboard/currículos/pipeline/LinkedIn) testado nos 3 idiomas com
      conta de teste real.
- [ ] URLs sem prefixo continuam servindo PT (nenhuma quebra de SEO/link existente).
- [ ] `/api/**` nunca recebe prefixo de idioma.
