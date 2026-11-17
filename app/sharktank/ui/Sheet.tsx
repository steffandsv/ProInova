"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { IconClose } from "./Icons";
import { prefereMenosMovimento, useIsoLayoutEffect } from "./hooks";
import { travarScroll } from "./scroll";

/** Painel de tela cheia que "abre" num círculo a partir do ponto clicado. */
export default function Sheet({
  origem,
  onFechar,
  rotulo,
  children,
}: {
  origem: { x: number; y: number };
  onFechar: () => void;
  rotulo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fechando = useRef(false);

  const raio = () => Math.hypot(Math.max(origem.x, window.innerWidth - origem.x), Math.max(origem.y, window.innerHeight - origem.y)) + 40;

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefereMenosMovimento()) return;
    // context + revert: devolve os elementos ao estado original se o efeito for desmontado no meio
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => gsap.set(el, { clearProps: "clipPath" }) });
      tl.fromTo(el, { clipPath: `circle(0px at ${origem.x}px ${origem.y}px)` }, { clipPath: `circle(${raio()}px at ${origem.x}px ${origem.y}px)`, duration: 0.95, ease: "expo.inOut" });
      tl.from(el.querySelectorAll("[data-sheet-in]"), { y: 30, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out" }, 0.45);
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fechar = useCallback(() => {
    const el = ref.current;
    if (!el || fechando.current) return;
    fechando.current = true;
    if (prefereMenosMovimento()) return onFechar();
    gsap.fromTo(
      el,
      { clipPath: `circle(${raio()}px at ${origem.x}px ${origem.y}px)` },
      { clipPath: `circle(0px at ${origem.x}px ${origem.y}px)`, duration: 0.7, ease: "expo.inOut", onComplete: onFechar },
    );
  }, [onFechar, origem.x, origem.y]);

  useEffect(() => {
    travarScroll(true);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => {
      travarScroll(false);
      window.removeEventListener("keydown", esc);
    };
  }, [fechar]);

  return (
    <div ref={ref} className="st-sheet" role="dialog" aria-modal="true" aria-label={rotulo} data-lenis-prevent>
      <button className="st-sheet-close" onClick={fechar} aria-label="Fechar">
        <IconClose />
      </button>
      <div className="st-sheet-inner">{children}</div>
    </div>
  );
}
