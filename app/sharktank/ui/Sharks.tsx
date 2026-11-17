"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { prefereMenosMovimento } from "./hooks";

/** Silhueta de tubarão (olhando para a direita). A cauda é um grupo separado para poder ondular. */
export function SharkSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 220 90" aria-hidden>
      <g className="st-shark-tail" style={{ transformOrigin: "46px 46px" }}>
        <path d="M50 41 C38 36 21 20 6 4 C10 18 16 32 24 46 C18 54 12 62 9 71 C22 62 35 54 50 51 Z" />
      </g>
      <path d="M216 47 C205 38 185 33 160 31 L134 30 C128 22 120 9 110 3 C114 13 115 23 112 31 C90 34 62 38 42 42 L42 50 C56 52 70 54 82 55 C84 60 86 63 84 67 C90 62 95 58 100 57 C110 57 120 57 128 57 C130 66 133 76 138 84 C140 74 144 64 150 57 C175 56 200 54 216 47 Z" />
    </svg>
  );
}

/** Cardume ambiente: tubarões cruzam o fundo de tempos em tempos, em profundidades diferentes. */
export function SharkSwarm() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || prefereMenosMovimento()) return;
    const tubaroes = Array.from(raiz.querySelectorAll<HTMLElement>(".st-swarm-shark"));
    const timers: number[] = [];
    const tweens: gsap.core.Animation[] = [];

    function nadar(el: HTMLElement, atraso: number) {
      const id = window.setTimeout(() => {
        const longe = Math.random(); // 0 = perto, 1 = longe
        const escala = gsap.utils.interpolate(1.25, 0.35, longe);
        const paraEsquerda = Math.random() > 0.5;
        const largura = 220 * escala;
        const y = gsap.utils.random(0.12, 0.82) * window.innerHeight;
        const duracao = gsap.utils.interpolate(16, 34, longe);
        gsap.set(el, {
          x: paraEsquerda ? window.innerWidth + 40 : -largura - 40,
          y,
          scaleX: paraEsquerda ? -escala : escala,
          scaleY: escala,
          opacity: 0,
          filter: `blur(${gsap.utils.interpolate(0.5, 5, longe)}px)`,
        });
        const cauda = el.querySelector(".st-shark-tail");
        const tl = gsap.timeline({ onComplete: () => nadar(el, gsap.utils.random(4000, 12000)) });
        tl.to(el, { opacity: gsap.utils.interpolate(0.55, 0.22, longe), duration: 2 }, 0)
          .to(el, { x: paraEsquerda ? -largura - 60 : window.innerWidth + 60, duration: duracao, ease: "none" }, 0)
          .to(el, { y: y + gsap.utils.random(-90, 90), duration: duracao, ease: "sine.inOut" }, 0)
          .to(el, { opacity: 0, duration: 2 }, duracao - 2);
        tweens.push(tl);
        if (cauda) tweens.push(gsap.to(cauda, { rotation: 9, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(duracao / 0.55) }));
      }, atraso);
      timers.push(id);
    }
    tubaroes.forEach((el, i) => nadar(el, 1500 + i * 6500));

    return () => {
      timers.forEach(clearTimeout);
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={ref} className="st-swarm" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="st-swarm-shark">
          <SharkSvg />
        </div>
      ))}
    </div>
  );
}
