/** Pano de fundo contínuo atrás de Hero+Problem+Features — só no tema escuro. Escurece no
 * topo (grafite neutro, mesmo tom do `--background`) e vai clareando conforme desce, como se
 * o usuário estivesse subindo em direção à superfície ao rolar a página. Puramente CSS
 * (gradiente estático numa camada do tamanho do conteúdo) em vez de recalcular cor via JS no
 * scroll — mais barato e funciona em qualquer navegador. Os tons ficam sempre mais escuros que
 * `--card` (#1f2327), então os cards continuam lendo como "elevados" a qualquer altura da
 * rolagem. Paleta neutra (sem matiz verde) — revisão pedida depois que a versão com fundo
 * verde-água em toda superfície ficou "verde demais" no site inteiro. */
export function MarketingGradientBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden dark:block"
      style={{
        background:
          "linear-gradient(180deg, #14171a 0%, #171a1d 30%, #191c1f 60%, #1c1f22 100%)",
      }}
    />
  );
}
