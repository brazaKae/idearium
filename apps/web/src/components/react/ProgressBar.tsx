/* ================================================================
   ProgressBar.tsx — React island animado pra boot do Idearium
   ================================================================
   Roda no client porque precisa de useState + useEffect pra animar
   progress de 0→100% via rAF (requestAnimationFrame).

   Easing: ease-out cubic — começa rápido, desacelera no fim
   (sensação natural de "carregando os últimos detalhes").

   Props:
   - duration: tempo total em ms (default 1500ms — encurtado pós-Emil-review)
   - delay: ms antes de começar (default 0)
   - onComplete: callback quando atinge 100%
   ================================================================ */

import { useState, useEffect } from 'react';

interface ProgressBarProps {
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export default function ProgressBar({
  duration = 1500,
  delay = 0,
  onComplete,
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId: number;
    let timeoutId: number;

    const startAnimation = () => {
      const start = performance.now();

      const animate = (now: number) => {
        const elapsed = now - start;
        const ratio = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - ratio, 3); // ease-out cubic
        setProgress(eased * 100);

        if (ratio < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      frameId = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      timeoutId = window.setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [duration, delay, onComplete]);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Carregando Idearium"
      style={{
        position: 'relative',
        // Bar block-style — ratio ~9:1 (era 18:1)
        width: 240,
        height: 26,
        border: '3px solid #FFF7E0',
        boxShadow: '4px 4px 0 #0A0A0A',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progress}%`,
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #FFF7E0 0px, #FFF7E0 5px,
            transparent 5px, transparent 10px
          )`,
          backgroundSize: '14.14px 14.14px',
          animation: 'stripes-flow 1.6s linear infinite',
          // transition: width REMOVIDO — rAF já interpola; transition adicionava
          // 80ms de lag visual entre state React e DOM (effect Emil-review)
        }}
      />
    </div>
  );
}
