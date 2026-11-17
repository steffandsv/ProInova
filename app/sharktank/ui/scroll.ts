"use client";

import type Lenis from "lenis";

/** Referência única ao scroll suave para travar/destravar quando um modal abre. */
let lenis: Lenis | null = null;
let travas = 0;

export function registrarLenis(l: Lenis | null) {
  lenis = l;
}

export function travarScroll(travar: boolean) {
  travas = Math.max(0, travas + (travar ? 1 : -1));
  const ativo = travas > 0;
  if (ativo) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle("st-locked", ativo);
}

export function rolarPara(alvo: string | HTMLElement, offset = 0) {
  const el = typeof alvo === "string" ? document.querySelector<HTMLElement>(alvo) : alvo;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
}
