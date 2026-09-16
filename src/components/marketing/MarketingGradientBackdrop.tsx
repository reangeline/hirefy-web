/** Pano de fundo contínuo atrás de Hero+Problem+Features — só no tema escuro. Escurece no
 * topo (Liquid Abyss, mesmo tom do `--background`) e vai clareando conforme desce, como se o
 * usuário estivesse subindo em direção à superfície da água ao rolar a página. Puramente CSS
 * (gradiente estático numa camada do tamanho do conteúdo) em vez de recalcular cor via JS no
 * scroll — mais barato e funciona em qualquer navegador. Os tons ficam sempre mais escuros que
 * `--card` (Liquid Kelp, #003734), então os cards continuam lendo como "elevados" a qualquer
 * altura da rolagem. */
export function MarketingGradientBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden dark:block"
      style={{
        background:
          "linear-gradient(180deg, #012624 0%, #01302b 30%, #013a33 60%, #01463d 100%)",
      }}
    />
  );
}
