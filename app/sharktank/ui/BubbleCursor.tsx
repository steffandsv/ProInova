"use client";

import { useEffect, useRef } from "react";
import { ponteiroFino, prefereMenosMovimento } from "./hooks";

type Bolha = { x: number; y: number; r: number; vy: number; fase: number; vida: number; max: number };

/** Bolhas que sobem do cursor (só em computador). Canvas 2D leve, sem dependências. */
export default function BubbleCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !ponteiroFino() || prefereMenosMovimento()) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bolhas: Bolha[] = [];
    let ultimoX = 0, ultimoY = 0, raf = 0;

    const tamanho = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    tamanho();
    window.addEventListener("resize", tamanho);

    const criar = (x: number, y: number, n: number, forca = 1) => {
      for (let i = 0; i < n && bolhas.length < 90; i++) {
        bolhas.push({
          x: x + (Math.random() - 0.5) * 10 * forca,
          y: y + (Math.random() - 0.5) * 6,
          r: (1.2 + Math.random() * 3.6) * forca,
          vy: 0.5 + Math.random() * 1.1,
          fase: Math.random() * Math.PI * 2,
          vida: 0,
          max: 50 + Math.random() * 60,
        });
      }
    };
    const onMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - ultimoX, e.clientY - ultimoY);
      if (dist > 26) {
        criar(e.clientX, e.clientY, 1);
        ultimoX = e.clientX;
        ultimoY = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => criar(e.clientX, e.clientY, 12, 1.3);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = bolhas.length - 1; i >= 0; i--) {
        const b = bolhas[i];
        b.vida++;
        b.y -= b.vy;
        b.x += Math.sin(b.fase + b.vida * 0.08) * 0.45;
        const a = Math.max(0, 1 - b.vida / b.max);
        if (a <= 0) {
          bolhas.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(170, 240, 255, ${0.55 * a})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * a})`;
        ctx.fill();
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", tamanho);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} className="st-bubbles" aria-hidden />;
}
