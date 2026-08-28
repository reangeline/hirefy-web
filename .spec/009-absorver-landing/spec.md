# Spec 009: Absorver a hirefy_lading no web-app

## Objetivo
Concentrar landing + produto num domínio só (`hirefy.careers`), motivado pela spec 008: a
`hirefy_lading` e o `web-app` sendo domínios/instâncias separadas impedia o Mixpanel de ligar
"visitante clicou no CTA" com "essa mesma pessoa assinou depois" — unificar resolve o
problema de identidade cross-domain de raiz, sem precisar propagar `distinct_id` entre
origens.

## Achado que mudou o escopo
O `web-app` já tinha sua própria landing page em `src/app/page.tsx` (spec 003) — Navbar,
Hero, Problem, Features, HowItWorks, CTASection, Footer — já responsiva, já linkando direto
pra `/signup`, já com o design system dark/light do produto. Faltava só: seção de Preços,
FAQ, e as 4 páginas legais.

## Decisões confirmadas com o usuário
- Domínio principal do produto vira **`hirefy.careers`** (troca de infraestrutura, fora do
  escopo de código desta spec — ver checklist no `log.md`)
- Seção de **Testimonials não entra** — os depoimentos da `hirefy_lading` eram fabricados
  (nomes de pessoas específicas atribuídos a empresas reais como Google/Amazon/Meta, com
  citações inventadas) — prática de marketing enganosa e risco real de reputação/jurídico.
  Decisão do usuário: não incluir por enquanto, até haver depoimentos reais de usuários.

## Escopo
- 4 páginas legais portadas literalmente (texto jurídico não reescrito):
  `/privacy`, `/terms`, `/cookies`, `/refund`
- `LegalLayout.tsx` novo (sem framer-motion, com os tokens do design system — diferente do
  original da `hirefy_lading`, que era só claro e não respeitava tema)
- Seção de Preços nova, com os **preços reais** (Free + Premium US$19,99/mês, spec 007) —
  corrige o achado da spec 008 (a landing antiga mostrava $9.99/mês e $79.99/ano, que nunca
  existiram)
- Seção de FAQ nova, traduzida pra PT-BR (mesmo padrão já usado na spec 003 pras outras
  seções de marketing)
- Rodapé atualizado: links de Privacidade/Termos que apontavam pra fora
  (`https://hirefy.careers/...`) agora são rotas internas; Cookies e Reembolso adicionados
  (não estavam linkados antes)

## Fora de escopo
- Corte de DNS/domínio, origens OAuth, decisão sobre o repositório/deploy da
  `hirefy_lading` — checklist de infraestrutura entregue no `log.md`, usuário executa
- Cookies de marketing (achado antigo da spec 008, continua fora de escopo)
- Analytics: nenhuma mudança de código — o `web-app` já tem GA4+Mixpanel (spec 008);
  unificar domínio resolve o problema de identidade automaticamente

## Critérios de aceite
- [x] `/privacy`, `/terms`, `/cookies`, `/refund` renderizam com o conteúdo legal correto,
  tema claro e escuro
- [x] Tabelas do markdown renderizam como tabela de verdade (achado: nem a `hirefy_lading`
  tinha isso — faltava `remark-gfm`, corrigido aqui)
- [x] Seção de Preços mostra Free + Premium US$19,99/mês (não os valores antigos)
- [x] FAQ renderiza e o acordeão funciona (`<details>`/`<summary>` nativo, sem JS extra)
- [x] Rodapé linka pras 4 páginas legais internas
- [x] `tsc`/`lint`/`build` limpos
