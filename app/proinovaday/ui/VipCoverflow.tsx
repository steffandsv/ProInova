"use client";

import { useEffect, useRef, useState } from "react";
import type { VipCard } from "@/lib/proinovaday-types";
import { Draggable, gsap } from "./gsap";
import { IconArrow, IconArrowLeft, IconCheck } from "./Icons";
import { iniciais } from "./CoverArt";
import { prefereMenosMovimento } from "./hooks";

const MISTERIO = { id: "misterio", nome: "Mais tubarões", cargo: "Novos nomes confirmados a cada dia", cidade: null, fotoUrl: null };

/**
 * Coverflow 3D arrastável (Draggable + Inertia): o card da frente encara o público,
 * os demais giram e afundam no tanque. Gira sozinho quando ninguém está mexendo.
 */
export default function VipCoverflow({ vips }: { vips: VipCard[] }) {
  const itens = [...vips, MISTERIO];
  const palcoRef = useRef<HTMLDivElement>(null);
  const irParaRef = useRef<(i: number) => void>(() => {});
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const palco = palcoRef.current;
    if (!palco) return;
    const cards = Array.from(palco.querySelectorAll<HTMLElement>(".st-vip"));
    const n = cards.length;
    const proxy = document.createElement("div");
    const estado = { p: 0 };
    let esp = 0;
    let ultimoAtivo = -1;
    let interagindo = false;
    let visivel = false;

    const espacamento = () => Math.min(330, Math.max(190, window.innerWidth * 0.3));

    const render = () => {
      cards.forEach((el, i) => {
        const o = i - estado.p;
        const a = Math.abs(o);
        const rot = gsap.utils.clamp(-58, 58, -o * 40);
        const esc = 1 - Math.min(a, 3) * 0.07;
        el.style.transform = `translate(-50%, -50%) translate3d(${o * esp}px, 0, ${-a * 170}px) rotateY(${rot}deg) scale(${esc})`;
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.opacity = String(a > 3.2 ? 0 : 1 - Math.max(0, a - 1) * 0.3);
        el.style.setProperty("--dim", String(Math.min(1, a * 0.7)));
      });
      const atual = Math.round(estado.p);
      if (atual !== ultimoAtivo) {
        ultimoAtivo = atual;
        setAtivo(atual);
      }
    };

    const drag = Draggable.create(proxy, {
      type: "x",
      trigger: palco,
      inertia: true,
      edgeResistance: 0.8,
      dragResistance: 0.1,
      snap: (v: number) => Math.round(v / esp) * esp,
      onPress() {
        interagindo = true;
      },
      onRelease() {
        window.setTimeout(() => (interagindo = false), 6000);
      },
      onDrag() {
        estado.p = -this.x / esp;
        render();
      },
      onThrowUpdate() {
        estado.p = -this.x / esp;
        render();
      },
    })[0];

    const medir = () => {
      esp = espacamento();
      drag.applyBounds({ minX: -(n - 1) * esp, maxX: 0 });
      gsap.set(proxy, { x: -estado.p * esp });
      drag.update();
      render();
    };
    medir();
    window.addEventListener("resize", medir);

    irParaRef.current = (i: number) => {
      const alvo = gsap.utils.clamp(0, n - 1, i);
      gsap.to(proxy, {
        x: -alvo * esp,
        duration: prefereMenosMovimento() ? 0 : 1.1,
        ease: "expo.out",
        onUpdate() {
          drag.update();
          estado.p = -(gsap.getProperty(proxy, "x") as number) / esp;
          render();
        },
      });
    };

    const io = new IntersectionObserver(([e]) => (visivel = e.isIntersecting), { threshold: 0.3 });
    io.observe(palco);
    const auto = window.setInterval(() => {
      if (interagindo || !visivel || prefereMenosMovimento()) return;
      irParaRef.current((Math.round(estado.p) + 1) % n);
    }, 4200);

    return () => {
      window.removeEventListener("resize", medir);
      window.clearInterval(auto);
      io.disconnect();
      drag.kill();
    };
  }, [itens.length]);

  return (
    <div className="st-vipflow">
      <div className="st-stage-lights" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div ref={palcoRef} className="st-vipflow-stage" role="listbox" aria-label="Convidados VIP" tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") irParaRef.current(ativo + 1);
          if (e.key === "ArrowLeft") irParaRef.current(ativo - 1);
        }}>
        {itens.map((v, i) => {
          const misterio = v.id === "misterio";
          return (
            <article
              key={v.id}
              className={`st-vip ${misterio ? "st-vip--mystery" : ""} ${i === ativo ? "is-front" : ""}`}
              role="option"
              aria-selected={i === ativo}
              onClick={() => irParaRef.current(i)}
            >
              <div className="st-vip-photo">
                {v.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.fotoUrl} alt={v.nome} draggable={false} />
                ) : misterio ? (
                  <svg viewBox="0 0 200 240" className="st-vip-silhouette" aria-hidden>
                    <circle cx="100" cy="88" r="44" />
                    <path d="M18 240c4-62 40-96 82-96s78 34 82 96z" />
                    <text x="100" y="104" textAnchor="middle">?</text>
                  </svg>
                ) : (
                  <span className="st-vip-mono">{iniciais(v.nome)}</span>
                )}
                <span className="st-vip-scan" aria-hidden />
              </div>
              <div className="st-vip-info">
                {misterio ? (
                  <span className="st-vip-badge st-vip-badge--soon">Revelação em breve</span>
                ) : (
                  <span className="st-vip-badge"><IconCheck size={12} strokeWidth={3} /> Presença confirmada</span>
                )}
                <h3>{v.nome}</h3>
                <p>{v.cargo}{v.cidade ? <><br /><strong>{v.cidade}</strong></> : null}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className="st-vipflow-nav">
        <button type="button" onClick={() => irParaRef.current(ativo - 1)} aria-label="Anterior" disabled={ativo === 0}>
          <IconArrowLeft />
        </button>
        <div className="st-vipflow-dots">
          {itens.map((v, i) => (
            <button key={v.id} type="button" className={i === ativo ? "is-on" : ""} onClick={() => irParaRef.current(i)} aria-label={v.nome} />
          ))}
        </div>
        <button type="button" onClick={() => irParaRef.current(ativo + 1)} aria-label="Próximo" disabled={ativo === itens.length - 1}>
          <IconArrow />
        </button>
      </div>
    </div>
  );
}
