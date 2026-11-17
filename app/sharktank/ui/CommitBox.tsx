"use client";

import { useRef } from "react";
import confetti from "canvas-confetti";
import { gsap } from "./gsap";
import { prefereMenosMovimento, vibrar } from "./hooks";

export const CORES_FESTA = ["#22e1ff", "#ffc23d", "#5eead4", "#ffffff", "#7dd3fc"];

export function explodirConfete(el: HTMLElement | null, forte = false) {
  if (prefereMenosMovimento()) return;
  const r = el?.getBoundingClientRect();
  const origem = r
    ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.5 };
  const base = { origin: origem, colors: CORES_FESTA, zIndex: 10000, disableForReducedMotion: true };
  confetti({ ...base, particleCount: forte ? 140 : 70, spread: forte ? 100 : 70, startVelocity: forte ? 48 : 34, scalar: 0.9, ticks: 220 });
  if (forte) {
    window.setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 180);
    window.setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 300);
  }
}

/** A "caixinha de compromisso": grande, tátil, com confete, vibração e um check que se desenha. */
export default function CommitBox({
  marcado,
  onChange,
  titulo,
  detalhe,
}: {
  marcado: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  detalhe: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function alternar() {
    const novo = !marcado;
    onChange(novo);
    const el = ref.current;
    if (novo) {
      vibrar([14, 40, 22]);
      explodirConfete(el?.querySelector(".st-commit-check") as HTMLElement);
      if (el && !prefereMenosMovimento()) {
        gsap.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.8, ease: "elastic.out(1.1, 0.35)" });
        gsap.fromTo(el.querySelector(".st-commit-ring"), { scale: 0.6, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.9, ease: "power2.out" });
      }
    } else {
      vibrar(8);
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="checkbox"
      aria-checked={marcado}
      className={`st-commit ${marcado ? "is-on" : ""}`}
      onClick={alternar}
    >
      <span className="st-commit-fill" aria-hidden />
      <span className="st-commit-check" aria-hidden>
        <span className="st-commit-ring" />
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span className="st-commit-text">
        <strong>{marcado ? "Compromisso firmado!" : titulo}</strong>
        <small>{marcado ? "Combinado. Seu lugar no tanque está te esperando." : detalhe}</small>
      </span>
    </button>
  );
}
