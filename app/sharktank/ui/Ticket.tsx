"use client";

import { useEffect, useRef } from "react";
import { EVENTO } from "@/constants/sharktank";
import { SharkSvg } from "./Sharks";
import { ponteiroFino } from "./hooks";

/** Ingresso holográfico: inclina com o cursor e o brilho "arco-íris" acompanha o ângulo. */
export default function Ticket({ numero, nome, listaEspera }: { numero: number; nome: string; listaEspera: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ponteiroFino()) return;
    el.classList.add("is-interactive");
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
    };
    const sair = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, []);

  const n = String(numero).padStart(4, "0");
  // "código de barras" decorativo derivado do número do ingresso
  const barras = Array.from({ length: 42 }, (_, i) => ((numero * 7919 + i * 104729) % 9) + 1);

  return (
    <div className="st-ticket-wrap">
      <div ref={ref} className={`st-ticket ${listaEspera ? "is-wait" : ""}`}>
        <div className="st-ticket-holo" aria-hidden />
        <div className="st-ticket-main">
          <div className="st-ticket-top">
            <span className="st-ticket-brand">SHARK TANK<br /><b>JABORANDI</b></span>
            <SharkSvg className="st-ticket-shark" />
          </div>
          <div className="st-ticket-name">
            <small>{listaEspera ? "Lista de espera" : "Convidado(a)"}</small>
            <strong>{nome}</strong>
          </div>
          <div className="st-ticket-grid">
            <div><small>Data</small><b>28.11.2026</b></div>
            <div><small>Hora</small><b>{EVENTO.hora}</b></div>
            <div><small>Local</small><b>{EVENTO.local}</b></div>
          </div>
        </div>
        <div className="st-ticket-stub">
          <small>{listaEspera ? "Espera" : "Ingresso"}</small>
          <b>Nº {n}</b>
          <div className="st-ticket-bars" aria-hidden>
            {barras.map((w, i) => (
              <i key={i} style={{ flexGrow: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
