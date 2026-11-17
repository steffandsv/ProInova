"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { ponteiroFino } from "./hooks";

/** Botão magnético: é "puxado" pelo cursor quando ele chega perto. */
export default function Magnetic({
  children,
  className = "",
  forca = 0.35,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { forca?: number }) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ponteiroFino()) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * forca);
      yTo((e.clientY - (r.top + r.height / 2)) * forca);
      el.style.setProperty("--gx", `${e.clientX - r.left}px`);
      el.style.setProperty("--gy", `${e.clientY - r.top}px`);
    };
    const sair = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, [forca]);

  return (
    <button ref={ref} className={`st-btn ${className}`} {...rest}>
      <span className="st-btn-glow" aria-hidden />
      <span className="st-btn-inner">{children}</span>
    </button>
  );
}
