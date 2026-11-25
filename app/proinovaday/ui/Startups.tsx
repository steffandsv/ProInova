"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProInovaDayStats, StartupCard } from "@/lib/proinovaday-types";
import { PRAZO_EMPRESAS_TEXTO } from "@/constants/proinovaday";
import { Flip, gsap, ScrollTrigger } from "./gsap";
import CoverArt from "./CoverArt";
import { IconArrow, IconCategoria, IconClose, IconRocket } from "./Icons";
import { ponteiroFino, prefereMenosMovimento, useIsoLayoutEffect } from "./hooks";
import { travarScroll } from "./scroll";

function Progresso({ p }: { p: NonNullable<StartupCard["progresso"]> }) {
  const pct = Math.round((p.validados / Math.max(1, p.total)) * 100);
  const completo = p.validados >= p.total;
  return (
    <div className={`st-prog ${completo ? "is-done" : ""}`}>
      <div className="st-prog-bar"><span style={{ width: `${pct}%` }} /></div>
      <span className="st-prog-label">
        {completo ? "Projeto concluído — todas as entregas validadas" : `${p.validados} de ${p.total} entregas mensais validadas`}
      </span>
    </div>
  );
}

function Cartao({ s, onAbrir }: { s: StartupCard; onAbrir: (s: StartupCard, el: HTMLElement) => void }) {
  const ref = useRef<HTMLElement>(null);

  // Inclinação 3D + brilho que segue o cursor
  useEffect(() => {
    const el = ref.current;
    if (!el || !ponteiroFino()) return;
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
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

  return (
    <article
      ref={ref}
      className="st-card"
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${s.nome}`}
      onClick={() => onAbrir(s, ref.current!)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onAbrir(s, ref.current!))}
    >
      <span className="st-card-glow" aria-hidden />
      <div className="st-card-cover">
        <CoverArt s={s} flipId={`cover-${s.id}`} />
        <span className="st-card-cat"><IconCategoria categoria={s.categoria} size={14} /> {s.categoria}</span>
        <span className={`st-card-origin ${s.origem === "PROINOVA" ? "is-proinova" : "is-new"}`}>
          {s.origem === "PROINOVA" ? "ProInova" : "Nova no tanque"}
        </span>
      </div>
      <div className="st-card-body">
        <h3 className="st-card-title">{s.nome}</h3>
        <p className="st-card-pitch">{s.pitch}</p>
        <div className="st-card-foot">
          {s.progresso ? <Progresso p={s.progresso} /> : s.estagio ? <span className="st-card-stage">Estágio: {s.estagio}</span> : null}
          <span className="st-card-people">{s.fundadores.slice(0, 2).join(" · ") || s.cidade}</span>
        </div>
        <span className="st-card-more">Conhecer <IconArrow size={16} /></span>
      </div>
    </article>
  );
}

function Modal({ s, onFechar }: { s: StartupCard; onFechar: () => void }) {
  const fecharRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    travarScroll(true);
    fecharRef.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => {
      travarScroll(false);
      window.removeEventListener("keydown", esc);
    };
  }, [onFechar]);

  return (
    <div className="st-modal" role="dialog" aria-modal="true" aria-label={s.nome} onClick={onFechar}>
      <div className="st-modal-panel" onClick={(e) => e.stopPropagation()} data-lenis-prevent>
        <button ref={fecharRef} className="st-modal-close" onClick={onFechar} aria-label="Fechar">
          <IconClose />
        </button>
        <div className="st-modal-cover">
          <CoverArt s={s} flipId={`cover-${s.id}`} />
        </div>
        <div className="st-modal-body">
          <div className="st-modal-tags" data-stagger>
            <span className="st-tag"><IconCategoria categoria={s.categoria} size={14} /> {s.categoria}</span>
            <span className={`st-tag ${s.origem === "PROINOVA" ? "st-tag--gold" : "st-tag--cyan"}`}>
              {s.origem === "PROINOVA" ? "Startup do ProInova Jaborandi" : "Inscrita para o pitch"}
            </span>
            {s.estagio && <span className="st-tag">{s.estagio}</span>}
          </div>
          <h2 className="st-modal-title" data-stagger>{s.nome}</h2>
          <p className="st-modal-pitch" data-stagger>{s.pitch}</p>
          {s.progresso && <div data-stagger><Progresso p={s.progresso} /></div>}
          {s.problema && (
            <section data-stagger>
              <h4>O problema</h4>
              <p>{s.problema}</p>
            </section>
          )}
          <section data-stagger>
            <h4>{s.origem === "PROINOVA" ? "A solução" : "A ideia"}</h4>
            {s.descricao.split(/\n{2,}/).map((par, i) => (
              <p key={i}>{par}</p>
            ))}
          </section>
          <div className="st-modal-people" data-stagger>
            <div>
              <span>{s.fundadores.length > 1 ? "Quem faz" : "Quem faz"}</span>
              <strong>{s.fundadores.join(", ") || "—"}</strong>
            </div>
            <div>
              <span>De onde</span>
              <strong>{s.cidade}</strong>
            </div>
          </div>
          <div className="st-modal-actions" data-stagger>
            {s.paginaPublica && (
              <a className="st-link" href={s.paginaPublica} target="_blank" rel="noopener noreferrer">
                Acompanhar as entregas no ProInova <IconArrow size={16} />
              </a>
            )}
            {s.link && (
              <a className="st-link" href={s.link} target="_blank" rel="noopener noreferrer nofollow">
                Visitar o site <IconArrow size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Startups({
  startups,
  stats,
  onInscrever,
}: {
  startups: StartupCard[];
  stats: ProInovaDayStats;
  onInscrever: () => void;
}) {
  const secaoRef = useRef<HTMLDivElement>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const contadorRef = useRef<HTMLSpanElement>(null);
  const [sel, setSel] = useState<StartupCard | null>(null);
  const flipRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  // Desktop: a seção "gruda" e a rolagem vertical vira um passeio horizontal pelo tanque.
  useEffect(() => {
    const secao = secaoRef.current;
    const trilho = trilhoRef.current;
    if (!secao || !trilho) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      secao.classList.add("is-pinned");
      const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth + 48);
      const tween = gsap.to(trilho, {
        x: () => -distancia(),
        ease: "none",
        scrollTrigger: {
          trigger: secao,
          start: "top top",
          end: () => `+=${distancia()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            const total = trilho.children.length;
            const atual = Math.min(total, Math.floor(st.progress * (total - 1)) + 1);
            if (contadorRef.current) contadorRef.current.textContent = String(atual).padStart(2, "0");
            secao.style.setProperty("--trilho", String(st.progress));
          },
        },
      });
      // Cards entram com leve rotação, como se emergissem do escuro
      gsap.utils.toArray<HTMLElement>(trilho.children).forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: -18, opacity: 0.25, z: -120 },
          {
            rotateY: 0, opacity: 1, z: 0, ease: "power2.out",
            scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 55%", scrub: true },
          },
        );
      });
      return () => secao.classList.remove("is-pinned");
    });
    return () => mm.revert();
  }, [startups.length]);

  function abrir(s: StartupCard, el: HTMLElement) {
    const capa = el.querySelector<HTMLElement>("[data-flip-id]");
    flipRef.current = capa && !prefereMenosMovimento() ? Flip.getState(capa) : null;
    setSel(s);
  }

  // A capa do card "voa" até virar a capa do modal (GSAP Flip)
  useIsoLayoutEffect(() => {
    if (!sel) return;
    const modal = document.querySelector<HTMLElement>(".st-modal");
    if (!modal) return;
    const capa = modal.querySelector<HTMLElement>("[data-flip-id]");
    const estado = flipRef.current;
    flipRef.current = null;
    if (prefereMenosMovimento()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(modal, { backgroundColor: "rgba(1,4,9,0)", backdropFilter: "blur(0px)" }, { backgroundColor: "rgba(1,4,9,0.78)", backdropFilter: "blur(14px)", duration: 0.5 }, 0);
      tl.fromTo(modal.querySelector(".st-modal-panel"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 0.05);
      if (estado && capa) tl.add(Flip.from(estado, { targets: capa, duration: 0.8, ease: "expo.inOut", scale: true }), 0);
      tl.from(modal.querySelectorAll("[data-stagger]"), { opacity: 0, y: 24, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 0.3);
    }, modal);
    return () => ctx.revert();
  }, [sel]);

  const fechar = useCallback(() => {
    const modal = document.querySelector<HTMLElement>(".st-modal");
    if (!modal) return setSel(null);
    gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => setSel(null) });
  }, []);

  useEffect(() => {
    // depois que o modal fecha, as medidas do pin podem ter mudado
    if (!sel) ScrollTrigger.refresh();
  }, [sel]);

  const total = startups.length + 1;

  return (
    <section id="startups" className="st-startups" data-depth="Abismo das startups" ref={secaoRef}>
      <div className="st-startups-head">
        <div>
          <span className="st-eyebrow">No tanque</span>
          <h2 className="st-h2">
            <span data-split>{startups.length} startups</span>{" "}
            <em data-split>prontas para o mergulho.</em>
          </h2>
        </div>
        <p className="st-lead">
          Projetos do <strong>ProInova Jaborandi</strong> já aprovados e com entregas validadas mês a mês pela coordenação —
          e novas empresas da região que toparam o desafio.
        </p>
        <div className="st-startups-counter" aria-hidden>
          <span ref={contadorRef}>01</span> / {String(total).padStart(2, "0")}
          <span className="st-startups-meter"><i /></span>
        </div>
      </div>

      <div className="st-track-wrap">
        <div className="st-track" ref={trilhoRef}>
          {startups.map((s) => (
            <Cartao key={s.id} s={s} onAbrir={abrir} />
          ))}
          <article className="st-card st-card--cta" onClick={onInscrever} role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onInscrever())}>
            <div className="st-card-cta-inner">
              <span className="st-card-cta-icon"><IconRocket size={34} /></span>
              <h3>Sua startup aqui.</h3>
              <p>
                {stats.inscricoesEmpresasAbertas
                  ? stats.vagasPitchRestantes > 0
                    ? <>Restam <strong>{stats.vagasPitchRestantes} vagas</strong> para pitch. Inscrições até {PRAZO_EMPRESAS_TEXTO}.</>
                    : <>Vagas de pitch preenchidas — entre na <strong>lista de espera</strong>.</>
                  : <>Inscrições de startups encerradas.</>}
              </p>
              {stats.inscricoesEmpresasAbertas && (
                <span className="st-card-more">Quero entrar no tanque <IconArrow size={16} /></span>
              )}
            </div>
          </article>
        </div>
      </div>

      {/* portal: a seção fica "presa" com transform durante o scroll horizontal, então o modal vive fora dela */}
      {sel && createPortal(<Modal s={sel} onFechar={fechar} />, document.querySelector(".st-root") || document.body)}
    </section>
  );
}
