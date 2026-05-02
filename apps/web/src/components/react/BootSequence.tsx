/* ================================================================
   BootSequence.tsx — orquestra a sequência narrativa do boot
   ================================================================
   GRID STACKING de dois "modos" no mesmo espaço:

   MODO 1 (loading)        MODO 2 (welcome)
   [progress bar]          [welcome text]
   [caption]               [button →]

   Ambos vivem na mesma cell de grid, controlados por opacity + blur.
   Quando complete=true, modo 1 fade-out + modo 2 fade-in com cascade
   curto (80ms) entre welcome e button.

   Pós-Emil-review:
   - Cascade welcome→button: 600ms → 80ms
   - Welcome delay: 200ms → 0ms (entra junto com bar fade-out)
   - Filter blur(2px) no transition pra mascarar crossfade
   - Caret 1s → 600ms (mais próximo de system caret real)
   - Caption opacity 0.6 → 0.85 (WCAG AA contrast)
   ================================================================ */

import { useState } from 'react';
import ProgressBar from './ProgressBar';

interface BootSequenceProps {
  duration?: number;
  startDelay?: number;
}

export default function BootSequence({
  duration = 1500,
  startDelay = 400,
}: BootSequenceProps) {
  const [complete, setComplete] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 110,
        minWidth: 408,  // acomoda welcome text width (bar é menor agora)
      }}
    >
      {/* === MODO 1: LOADING (bar + caption) === */}
      <div
        style={{
          gridArea: '1 / 1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: complete ? 0 : 1,
          // Filter blur durante transição mascara crossfade entre modos
          filter: complete ? 'blur(2px)' : 'blur(0)',
          transition:
            'opacity 400ms cubic-bezier(0.23, 1, 0.32, 1), ' +
            'filter 400ms cubic-bezier(0.23, 1, 0.32, 1)',
          pointerEvents: complete ? 'none' : 'auto',
        }}
        aria-hidden={complete}
      >
        <ProgressBar
          duration={duration}
          delay={startDelay}
          onComplete={() => setComplete(true)}
        />

        <p
          style={{
            // PP NeueBit (mesma família do welcome) pra cohesion tipográfica
            fontFamily: "'PP NeueBit', monospace",
            // 16px (vs 12px de mono) — pixel fonts precisam mais headroom pra ler
            fontSize: 16,
            color: 'rgba(255, 247, 224, 0.85)',
            // Tracking menor — pixel fonts já têm spacing visual interno
            letterSpacing: '0.02em',
            margin: 0,
            lineHeight: 1,
          }}
        >
          inicializando idearium...
        </p>
      </div>

      {/* === MODO 2: WELCOME (texto + botão) === */}
      <div
        style={{
          gridArea: '1 / 1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          opacity: complete ? 1 : 0,
          transform: complete ? 'translateY(0)' : 'translateY(8px)',
          // Blur entrando do oposto: começa borrado, fica nítido
          filter: complete ? 'blur(0)' : 'blur(2px)',
          // Sem delay — entra simultâneo com fade-out do modo 1 (overlap = passagem)
          transition:
            'opacity 400ms cubic-bezier(0.23, 1, 0.32, 1), ' +
            'transform 400ms cubic-bezier(0.23, 1, 0.32, 1), ' +
            'filter 400ms cubic-bezier(0.23, 1, 0.32, 1)',
          pointerEvents: complete ? 'auto' : 'none',
        }}
        aria-live="polite"
        aria-hidden={!complete}
      >
        <p
          style={{
            fontFamily: "'PP NeueBit', monospace",
            fontSize: 32,
            lineHeight: 1,
            color: '#FFF7E0',
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          bem-vindo ao idearium
        </p>

        {/* Cascade: button entra 80ms depois do welcome (era 600ms — Emil rule
            "stagger delays 30-80ms between items") */}
        <a
          href="/atrio"
          className="boot-cta"
          style={{
            opacity: complete ? 1 : 0,
            transform: complete ? 'translateY(0)' : 'translateY(8px)',
            transition:
              'opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) 80ms, ' +
              'transform 400ms cubic-bezier(0.23, 1, 0.32, 1) 80ms, ' +
              'background-color 160ms ease-out, color 160ms ease-out',
          }}
        >
          entrar no átrio →
        </a>
      </div>
    </div>
  );
}
