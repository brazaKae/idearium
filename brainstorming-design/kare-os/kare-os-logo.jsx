/* ================================================================
   Idearium — Logo "i" pixel art (versão final)
   ================================================================
   Logo desenhada por @gabriele em Figma e exportada como SVG.
   Source: idearium-logo-final.svg (635x901 viewBox, 651 cells de
   20x20 num grid implícito 32x45).

   4 cores:
     - #2D78E1 azul principal     (333 cells — corpo do "1")
     - #0A0A0A preto outline      (233 cells — borda + detalhes)
     - #79AAEE azul claro xadrez  (61 cells — sombreado halftone)
     - #FAC81E amarelo            (24 cells — dot superior)

   Componentes:
     - <IdeariumLogo>     só a marca (SVG inline, configurável)
     - <IdeariumWordmark> só "idearium" em Pixelify Sans
     - <IdeariumLockup>   marca + wordmark
     - <IdeariumTagline>  "IDEAS ARE SOFTWARE..." com highlight
   ================================================================ */

// Logo aspect ratio = 635/901 ≈ 0.705
const LOGO_VB_W = 635;
const LOGO_VB_H = 901;

// ── Marca isolada ───────────────────────────────────────────────
// Usa <img> apontando pro SVG. Browser cacheia, navegador escala
// pixel-perfect via image-rendering: pixelated.
// `src` configurável caso o SVG fique em path diferente (ex: /assets/).
function IdeariumLogo({
  height = 80,
  src = './idearium-logo-final.svg',
  className = '',
  title = 'Idearium',
}) {
  const width = Math.round(height * (LOGO_VB_W / LOGO_VB_H));
  return (
    <img
      src={src}
      alt={title}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}

// ── Wordmark "idearium" ─────────────────────────────────────────
function IdeariumWordmark({
  size = 32,
  color = '#0A0A0A',
  className = '',
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Pixelify Sans', monospace",
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      idearium
    </span>
  );
}

// ── Lockup — marca + wordmark side-by-side ──────────────────────
function IdeariumLockup({
  logoHeight = 56,
  wordmarkSize = 36,
  textColor = '#0A0A0A',
  gap = 16,
  align = 'baseline',  // 'baseline' | 'center'
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: align === 'center' ? 'center' : 'flex-end',
        gap,
      }}
    >
      <IdeariumLogo height={logoHeight} />
      <IdeariumWordmark size={wordmarkSize} color={textColor} />
    </div>
  );
}

// ── Tagline (com highlight amarelo, igual sua folha) ────────────
function IdeariumTagline({
  size = 11,
  color = '#0A0A0A',
  highlightBg = '#FAC81E',
  language = 'en',  // 'en' | 'pt'
}) {
  const text = language === 'en'
    ? { plain: 'IDEAS ARE SOFTWARE.', highlight: 'RFCs ARE PROGRAMS IN EXECUTION.' }
    : { plain: 'IDEIAS SÃO SOFTWARE.', highlight: 'RFCs SÃO PROGRAMAS EM EXECUÇÃO.' };

  return (
    <p
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: size,
        color,
        letterSpacing: '0.05em',
        margin: 0,
      }}
    >
      {text.plain}{' '}
      <span style={{ background: highlightBg, padding: '0 4px' }}>
        {text.highlight}
      </span>
    </p>
  );
}

// ── Paleta canônica (extraída do SVG final) ─────────────────────
const IDEARIUM_PALETTE = {
  blue:        '#2D78E1',  // azul cobalto principal
  blueLight:   '#79AAEE',  // azul claro do halftone
  yellow:      '#FAC81E',  // amarelo do dot
  ink:         '#0A0A0A',  // preto outline
  cream:       '#FFF7E0',  // fundo paper
  creamSoft:   '#FFFBEF',  // surfaces secundárias
};
