"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import type { ProInovaDayData } from "@/lib/proinovaday-types";
import { EVENTO, PRAZO_EMPRESAS_TEXTO } from "@/constants/proinovaday";
import { gsap, ScrollTrigger, SplitText } from "./gsap";
import { prefereMenosMovimento, useIsoLayoutEffect } from "./hooks";
import { registrarLenis, rolarPara } from "./scroll";
import OceanCanvas from "./OceanCanvas";
import { SharkSvg, SharkSwarm } from "./Sharks";
import BubbleCursor from "./BubbleCursor";
import Countdown from "./Countdown";
import Magnetic from "./Magnetic";
import VipCoverflow from "./VipCoverflow";
import Startups from "./Startups";
import Sheet from "./Sheet";
import VisitanteForm from "./VisitanteForm";
import EmpresaForm from "./EmpresaForm";
import {
  IconArrow, IconCalendar, IconCategoria, IconClock, IconEye, IconGift, IconHandshake, IconPin, IconRocket, IconSpark, IconTicket, IconUsers,
} from "./Icons";

type Form = { tipo: "visitante" | "empresa"; x: number; y: number } | null;

const PROFUNDIDADE_MAX = 280;

const MARQUEE_A = ["28 de novembro", "9h da manhã", "C.TECH Jaborandi", "Entrada gratuita", "Lugares limitados"];
const MARQUEE_B = ["Prefeitos da região", "Sebrae", "Startups ao vivo", "Pitches", "Conexões", "Inovação de Jaborandi"];

const FAQ = [
  ["Quanto custa para assistir?", "Nada. A entrada é gratuita — só pedimos que você confirme presença para guardarmos seu lugar no auditório."],
  ["Preciso ser de Jaborandi?", "Não. Quem é de Jaborandi tem o cadastro preenchido na hora pelo CPF; quem vem de fora informa só nome e WhatsApp."],
  ["Minha empresa não é do ProInova. Posso apresentar?", `Pode! Inscreva sua startup até ${PRAZO_EMPRESAS_TEXTO}. As vagas de pitch são limitadas e a organização confirma pelo WhatsApp.`],
  ["E se os lugares acabarem?", "Você entra na lista de espera e é avisado pelo WhatsApp se abrir vaga. Por isso, quanto antes, melhor."],
  ["Posso levar alguém?", "Cada pessoa faz a própria inscrição — leva 15 segundos. Depois de se inscrever, use o botão de convidar amigos pelo WhatsApp."],
];

export default function Landing({ data }: { data: ProInovaDayData }) {
  const raizRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState(data.stats);
  const [form, setForm] = useState<Form>(null);

  const abrir = useCallback((tipo: "visitante" | "empresa") => (e?: React.MouseEvent) => {
    setForm({ tipo, x: e?.clientX ?? window.innerWidth / 2, y: e?.clientY ?? window.innerHeight / 2 });
  }, []);
  const fecharForm = useCallback(() => setForm(null), []);
  const aoInscrever = useCallback(() => setStats((s) => ({ ...s, visitantes: s.visitantes + 1, vagasRestantes: Math.max(0, s.vagasRestantes - 1) })), []);

  /* ───────────── Scroll suave + todas as animações de rolagem ───────────── */
  useIsoLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("st-ready");
    const reduzido = prefereMenosMovimento();

    let lenis: Lenis | null = null;
    const tick = (t: number) => lenis?.raf(t * 1000);
    if (!reduzido) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
      registrarLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      // Medidor de profundidade: escreve direto no DOM (sem re-renderizar a página a cada quadro)
      const num = document.querySelector<HTMLElement>(".st-depth-num b");
      const barra = document.querySelector<HTMLElement>(".st-depth-scale i");
      const rotulo = document.querySelector<HTMLElement>(".st-depth-label");
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (st) => {
          if (num) num.textContent = `-${String(Math.round(st.progress * PROFUNDIDADE_MAX)).padStart(3, "0")}`;
          if (barra) barra.style.transform = `scaleY(${st.progress})`;
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (st) => {
            if (st.isActive && rotulo) rotulo.textContent = sec.dataset.depth || "";
          },
        });
      });
      // Topo ganha fundo de vidro depois que a pessoa começa a rolar
      ScrollTrigger.create({ start: 80, end: "max", toggleClass: { targets: ".st-topbar", className: "is-scrolled" } });
      // Barra fixa de CTA no celular: aparece depois do hero, some na área de inscrição
      ScrollTrigger.create({
        trigger: ".st-hero",
        start: "bottom 20%",
        endTrigger: "#inscricao",
        end: "top 80%",
        toggleClass: { targets: ".st-dock", className: "is-on" },
      });

      if (reduzido) return;

      /* HERO — o título emerge da água */
      const titulo = SplitText.create(".st-hero-word", { type: "chars", charsClass: "st-char" });
      const agua = document.querySelector<SVGFEDisplacementMapElement>("#st-water feDisplacementMap");
      const turb = document.querySelector<SVGFETurbulenceElement>("#st-water feTurbulence");
      const ehSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const tituloEl = document.querySelector<HTMLElement>(".st-hero-title");
      if (!ehSafari && tituloEl) tituloEl.classList.add("st-wobble");

      const intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 });
      intro
        .from(".st-topbar", { y: -30, opacity: 0, duration: 1 }, 0)
        .from(titulo.chars, { yPercent: 120, rotateX: -85, opacity: 0, filter: "blur(14px)", duration: 1.5, stagger: 0.045 }, 0.1);
      if (agua && !ehSafari) {
        const d = { s: 90 };
        intro.to(d, { s: 0, duration: 2.4, ease: "power3.out", onUpdate: () => agua.setAttribute("scale", String(d.s)), onComplete: () => tituloEl?.classList.remove("st-wobble") }, 0.1);
      }
      intro
        .to(".st-hero-city [data-scramble]", { duration: 1.8, scrambleText: { text: "JABORANDI", chars: "01<>/▓░#", revealDelay: 0.35, speed: 0.5 } }, 0.6)
        .from(".st-hero-city .st-line", { scaleX: 0, duration: 1.4, stagger: 0.1 }, 0.7)
        .from("[data-hero]", { y: 34, opacity: 0, duration: 1.1, stagger: 0.09 }, 0.75)
        .from(".st-scrollcue", { opacity: 0, y: -10, duration: 1 }, 1.6);

      // Passar o mouse no título: ondulação de água
      if (agua && turb && !ehSafari && tituloEl) {
        const onda = () => {
          tituloEl.classList.add("st-wobble");
          const d = { s: 0 };
          gsap.timeline({ onComplete: () => tituloEl.classList.remove("st-wobble") })
            .to(d, { s: 28, duration: 0.35, ease: "power2.out", onUpdate: () => agua.setAttribute("scale", String(d.s)) })
            .to(d, { s: 0, duration: 1.2, ease: "power2.out", onUpdate: () => agua.setAttribute("scale", String(d.s)) });
        };
        tituloEl.addEventListener("pointerenter", onda);
      }

      // Hero afunda ao rolar
      gsap.to(".st-hero-inner", {
        yPercent: 18, scale: 0.94, opacity: 0, filter: "blur(6px)", ease: "none",
        scrollTrigger: { trigger: ".st-hero", start: "top top", end: "bottom top", scrub: true },
      });

      /* MARQUEES com aceleração pela velocidade do scroll */
      const loops = gsap.utils.toArray<HTMLElement>(".st-marquee-inner").map((el, i) =>
        gsap.fromTo(el, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 38, ease: "none", repeat: -1 }),
      );
      ScrollTrigger.create({
        trigger: ".st-marquee",
        start: "top bottom",
        end: "bottom top",
        onUpdate: (st) => {
          const v = gsap.utils.clamp(-6, 6, st.getVelocity() / 260);
          loops.forEach((l) => gsap.to(l, { timeScale: 1 + Math.abs(v), duration: 0.25, overwrite: true }));
          gsap.to(".st-marquee", { skewY: v * 0.35, duration: 0.4, overwrite: true });
        },
      });

      /* Títulos de seção: revelação por linhas com máscara */
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "st-split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%" } }),
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      /* MANIFESTO: as palavras acendem conforme a rolagem */
      const manifesto = SplitText.create(".st-manifesto-text", { type: "words", wordsClass: "st-word" });
      gsap.fromTo(manifesto.words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.08, ease: "none",
        scrollTrigger: { trigger: ".st-manifesto-text", start: "top 78%", end: "bottom 45%", scrub: true },
      });

      /* Números que contam */
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const alvo = Number(el.dataset.count || 0);
        const o = { v: 0 };
        gsap.to(o, {
          v: alvo, duration: 2.2, ease: "power3.out",
          onUpdate: () => (el.textContent = String(Math.round(o.v))),
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      /* Tubarão gigante atravessa a seção dos VIPs */
      gsap.fromTo(".st-bigshark", { xPercent: 0, x: () => window.innerWidth * 1.1, y: 60 }, {
        x: () => -window.innerWidth * 1.6, y: -40, ease: "none",
        scrollTrigger: { trigger: ".st-vips", start: "top bottom", end: "bottom top", scrub: 1.2 },
      });
      gsap.to(".st-bigshark .st-shark-tail", { rotation: 7, duration: 0.7, yoyo: true, repeat: -1, ease: "sine.inOut" });

      /* DINÂMICA: a corrente se desenha e as etapas acendem */
      gsap.from(".st-flow-path", {
        drawSVG: "0%", ease: "none",
        scrollTrigger: { trigger: ".st-flow", start: "top 70%", end: "bottom 60%", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>(".st-flow-step").forEach((el) => {
        gsap.from(el, {
          y: 60, opacity: 0, rotateX: 25, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        });
      });

      /* Bento: entrada em cascata */
      gsap.from(".st-bento-card", {
        y: 70, opacity: 0, rotateX: 12, duration: 1.1, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: ".st-bento", start: "top 80%" },
      });

      /* Portas da inscrição */
      gsap.from(".st-door", {
        y: 80, opacity: 0, rotateY: (i) => (i ? -14 : 14), duration: 1.2, stagger: 0.12, ease: "expo.out",
        scrollTrigger: { trigger: ".st-doors", start: "top 80%" },
      });

      /* Local: foto com parallax */
      gsap.fromTo(".st-local-photo img", { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: ".st-local", start: "top bottom", end: "bottom top", scrub: true },
      });

      /* Final: letras em onda */
      const fim = SplitText.create(".st-final-title", { type: "chars,words", charsClass: "st-char" });
      gsap.from(fim.chars, {
        yPercent: 100, opacity: 0, rotate: 8, duration: 1, ease: "back.out(2)", stagger: { each: 0.025, from: "start" },
        scrollTrigger: { trigger: ".st-final", start: "top 70%" },
      });
    }, raizRef);

    // Medidas mudam quando as fontes carregam
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      registrarLenis(null);
      html.classList.remove("st-ready");
    };
  }, []);

  /* Holofote nos cards do bento (borda que acende onde o cursor está) */
  useEffect(() => {
    const grade = document.querySelector<HTMLElement>(".st-bento");
    if (!grade) return;
    const mover = (e: PointerEvent) => {
      grade.querySelectorAll<HTMLElement>(".st-bento-card, .st-door").forEach((c) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--sx", `${e.clientX - r.left}px`);
        c.style.setProperty("--sy", `${e.clientY - r.top}px`);
      });
    };
    const portas = document.querySelector<HTMLElement>(".st-doors");
    grade.addEventListener("pointermove", mover);
    portas?.addEventListener("pointermove", mover as EventListener);
    return () => {
      grade.removeEventListener("pointermove", mover);
      portas?.removeEventListener("pointermove", mover as EventListener);
    };
  }, []);

  const vipsReais = data.vips.length;
  const provaSocial = stats.mostrarInscritos
    ? <><b>{stats.visitantes}</b> pessoas já garantiram lugar · restam <b>{stats.vagasRestantes}</b></>
    : <>Auditório com <b>{stats.capacidade}</b> lugares · inscrição em 15 segundos</>;

  return (
    <div className="st-root" ref={raizRef}>
      <OceanCanvas />
      <SharkSwarm />
      <BubbleCursor />

      {/* filtro SVG de "água" usado no título */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="st-water" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Medidor de profundidade */}
      <div className="st-depth" aria-hidden>
        <span className="st-depth-label">Superfície</span>
        <div className="st-depth-scale">
          <i style={{ transform: "scaleY(0)" }} />
        </div>
        <span className="st-depth-num"><b>-000</b><small>m</small></span>
      </div>

      <header className="st-topbar">
        <a href="/" className="st-brand" aria-label="ProInova Jaborandi">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brasao.png" alt="" width={34} height={34} />
          <span>Prefeitura de Jaborandi<small>ProInova · Programa Municipal de Inovação</small></span>
        </a>
        <nav className="st-nav">
          <button onClick={() => rolarPara("#tubaroes")}>Tubarões</button>
          <button onClick={() => rolarPara("#startups")}>Startups</button>
          <button onClick={() => rolarPara("#local")}>Local</button>
          <button className="st-nav-cta" onClick={() => rolarPara("#inscricao", -40)}>Inscreva-se</button>
        </nav>
      </header>

      <main className="st-main">
        {/* ═════════════ HERO ═════════════ */}
        <section className="st-hero" data-depth="Superfície">
          <div className="st-hero-inner">
            <div className="st-pill" data-hero>
              <span className="st-pulse" /> Inscrições abertas<span className="st-pill-extra"> · Entrada gratuita</span>
            </div>
            <h1 className="st-hero-title" aria-label="ProInova Day Jaborandi">
              <span className="st-hero-word" aria-hidden>PROINOVA</span>
              <span className="st-hero-word st-hero-word--outline" aria-hidden>DAY</span>
            </h1>
            <div className="st-hero-city" aria-hidden>
              <span className="st-line" />
              <span data-scramble>JABORANDI</span>
              <span className="st-line" />
            </div>
            <p className="st-hero-sub" data-hero>
              As ideias que nasceram aqui vão encarar, <strong>ao vivo</strong>, prefeitos da região e o Sebrae.
              Você vai querer estar na plateia quando o futuro da cidade subir ao palco.
            </p>
            <div className="st-hero-meta" data-hero>
              <span><IconCalendar size={17} /> Sáb, 28 de novembro</span>
              <span><IconClock size={17} /> {EVENTO.hora} da manhã</span>
              <span><IconPin size={17} /> C.TECH · Jaborandi</span>
            </div>
            <div data-hero>
              <Countdown alvoISO={EVENTO.inicioISO} />
            </div>
            <div className="st-hero-ctas" data-hero>
              <Magnetic className="st-btn--gold" onClick={abrir("visitante")}>
                <IconTicket size={20} /> Quero assistir — é grátis
              </Magnetic>
              <Magnetic className="st-btn--ghost" onClick={abrir("empresa")} forca={0.25}>
                <IconRocket size={20} /> Quero apresentar minha startup
              </Magnetic>
            </div>
            <p className="st-hero-proof" data-hero>
              <span className="st-pulse st-pulse--red" /> <span>{provaSocial}</span>
            </p>
          </div>
          <button className="st-scrollcue" onClick={() => rolarPara(".st-manifesto")} aria-label="Rolar para baixo">
            <span>mergulhe</span>
            <i />
          </button>
        </section>

        {/* ═════════════ MARQUEE ═════════════ */}
        <div className="st-marquee" aria-hidden>
          {[MARQUEE_A, MARQUEE_B].map((linha, i) => (
            <div key={i} className={`st-marquee-row ${i ? "st-marquee-row--b" : ""}`}>
              <div className="st-marquee-inner">
                {[0, 1].map((k) => (
                  <span key={k} className="st-marquee-chunk">
                    {linha.map((t) => (
                      <span key={t}>{t}<SharkSvg className="st-marquee-fin" /></span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ═════════════ O SONHO ═════════════ */}
        <section className="st-section st-manifesto" data-depth="Zona de luz">
          <span className="st-eyebrow" data-reveal>O sonho</span>
          <p className="st-manifesto-text">
            Toda grande empresa começou como uma ideia que alguém teve coragem de mostrar. Em Jaborandi, essas ideias
            viraram projetos, os projetos viraram entregas e as entregas viraram soluções de verdade. No dia 28, elas
            sobem ao palco — e o que nascer ali pode chegar às cidades da região inteira.
          </p>
          <div className="st-stats">
            <div className="st-stat" data-reveal>
              <b data-count={stats.startups}>{stats.startups}</b>
              <span>startups no tanque</span>
            </div>
            <div className="st-stat" data-reveal>
              <b data-count={stats.entregasValidadas}>{stats.entregasValidadas}</b>
              <span>entregas mensais já validadas</span>
            </div>
            <div className="st-stat" data-reveal>
              <b><span data-count={vipsReais}>{vipsReais}</span>+</b>
              <span>prefeitos e lideranças confirmados</span>
            </div>
            <div className="st-stat" data-reveal>
              <b>1</b>
              <span>manhã que pode mudar a cidade</span>
            </div>
          </div>
        </section>

        {/* ═════════════ TUBARÕES ═════════════ */}
        <section id="tubaroes" className="st-section st-vips" data-depth="Zona dos tubarões">
          <SharkSvg className="st-bigshark" />
          <div className="st-section-head">
            <span className="st-eyebrow" data-reveal>Quem estará no tanque</span>
            <h2 className="st-h2"><span data-split>Frente a frente</span> <em data-split>com quem decide.</em></h2>
            <p className="st-lead" data-reveal>
              Prefeitos da região e lideranças do Sebrae confirmados para ouvir, questionar e — quem sabe — levar as ideias de
              Jaborandi para as suas cidades.
            </p>
          </div>
          <div data-reveal>
            <VipCoverflow vips={data.vips} />
          </div>
        </section>

        {/* ═════════════ DINÂMICA ═════════════ */}
        <section className="st-section st-flow" data-depth="Corrente">
          <div className="st-section-head">
            <span className="st-eyebrow" data-reveal>A dinâmica</span>
            <h2 className="st-h2"><span data-split>Como funciona</span> <em data-split>o tanque.</em></h2>
          </div>
          <div className="st-flow-wrap">
            <svg className="st-flow-svg" viewBox="0 0 1200 520" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="st-flow-grad" x1="0" x2="1">
                  <stop offset="0" stopColor="#22e1ff" />
                  <stop offset="1" stopColor="#ffc23d" />
                </linearGradient>
              </defs>
              <path className="st-flow-path" d="M20 120 C 220 20, 330 260, 520 190 S 760 40, 900 230 S 1120 480, 1180 400" />
            </svg>
            <ol className="st-flow-steps">
              {[
                ["O tanque abre", "Recepção no C.TECH e abertura com as autoridades presentes."],
                ["Pitches ao vivo", "Cada startup sobe ao palco para mostrar o que construiu — e por que importa."],
                ["Perguntas dos tubarões", "Prefeitos e lideranças questionam, provocam e avaliam cada ideia."],
                ["Conexões", "Soluções que funcionam em Jaborandi podem ganhar o caminho para outras cidades."],
              ].map(([t, d], i) => (
                <li key={t} className="st-flow-step">
                  <span className="st-flow-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═════════════ STARTUPS ═════════════ */}
        <Startups startups={data.startups} stats={stats} onInscrever={() => abrir("empresa")()} />

        {/* ═════════════ POR QUE IR ═════════════ */}
        <section className="st-section st-why" data-depth="Zona de conexões">
          <div className="st-section-head">
            <span className="st-eyebrow" data-reveal>Por que você precisa estar lá</span>
            <h2 className="st-h2"><span data-split>Uma manhã.</span> <em data-split>Anos de vantagem.</em></h2>
          </div>
          <div className="st-bento">
            <article className="st-bento-card st-bento-card--big">
              <IconEye size={30} />
              <div className="st-bento-marquee" aria-hidden>
                {[0, 1].map((linha) => (
                  <div key={linha}>
                    {[0, 1].flatMap((k) =>
                      data.startups
                        .filter((_, i) => i % 2 === linha)
                        .map((s) => (
                          <span key={`${k}-${s.id}`}><IconCategoria categoria={s.categoria} size={15} /> {s.nome}</span>
                        )),
                    )}
                  </div>
                ))}
              </div>
              <h3>Veja o futuro antes de todo mundo</h3>
              <p>Inteligência artificial na sala de aula, game de reciclagem, delivery sem taxa, turismo digital: tudo criado aqui, apresentado por quem fez.</p>
            </article>
            <article className="st-bento-card">
              <IconUsers size={28} />
              <h3>Na mesma sala que os prefeitos</h3>
              <p>Uma manhã inteira com quem decide os rumos da região.</p>
            </article>
            <article className="st-bento-card">
              <IconHandshake size={28} />
              <h3>Conexões que valem ouro</h3>
              <p>Empreendedores, estudantes, professores, comerciantes e o Sebrae no mesmo lugar.</p>
            </article>
            <article className="st-bento-card">
              <IconSpark size={28} />
              <h3>O próximo pode ser você</h3>
              <p>Se um estudante de Jaborandi criou um app que a prefeitura usa, a sua ideia também pode sair do papel.</p>
            </article>
            <article className="st-bento-card st-bento-card--gold">
              <IconGift size={28} />
              <h3>Entrada gratuita</h3>
              <p>Mas os lugares são limitados ao auditório do C.TECH. Quem confirma primeiro, garante.</p>
            </article>
          </div>
        </section>

        {/* ═════════════ INSCRIÇÃO ═════════════ */}
        <section id="inscricao" className="st-section st-signup" data-depth="Ponto de mergulho">
          <div className="st-section-head st-section-head--center">
            <span className="st-eyebrow" data-reveal>Inscrição</span>
            <h2 className="st-h2"><span data-split>Escolha seu lado</span> <em data-split>do tanque.</em></h2>
          </div>
          <div className="st-doors">
            <button className="st-door" onClick={abrir("visitante")}>
              <span className="st-door-spot" aria-hidden />
              <span className="st-door-icon"><IconTicket size={34} /></span>
              <span className="st-door-kicker">Visitante</span>
              <span className="st-door-title">Quero assistir</span>
              <span className="st-door-text">Só o CPF. Se você é de Jaborandi, a gente preenche o resto. Depois é só salvar na agenda.</span>
              <span className="st-door-chips"><i>15 segundos</i><i>Gratuito</i><i>{stats.vagasRestantes > 0 ? `${stats.capacidade} lugares` : "Lista de espera"}</i></span>
              <span className="st-door-cta">Garantir meu lugar <IconArrow size={18} /></span>
            </button>
            <button className="st-door st-door--shark" onClick={abrir("empresa")}>
              <span className="st-door-spot" aria-hidden />
              <span className="st-door-icon"><IconRocket size={34} /></span>
              <span className="st-door-kicker">Startup ou empresa</span>
              <span className="st-door-title">Quero entrar no tanque</span>
              <span className="st-door-text">Cadastre sua startup com foto, frase de impacto e a ideia. A organização confirma sua vaga de pitch.</span>
              <span className="st-door-chips">
                {stats.inscricoesEmpresasAbertas ? (
                  <><i className="is-hot">{stats.vagasPitchRestantes > 0 ? `Restam ${stats.vagasPitchRestantes} vagas` : "Lista de espera"}</i><i>Até {PRAZO_EMPRESAS_TEXTO}</i></>
                ) : (
                  <i>Inscrições encerradas</i>
                )}
              </span>
              <span className="st-door-cta">Inscrever minha startup <IconArrow size={18} /></span>
            </button>
          </div>
        </section>

        {/* ═════════════ LOCAL ═════════════ */}
        <section id="local" className="st-section st-local" data-depth="Ponto de encontro">
          <div className="st-local-photo" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/proinovaday/ctech.jpg" alt="Auditório do C.TECH, em Jaborandi" loading="lazy" />
            <span className="st-local-badge">Auditório do C.TECH</span>
          </div>
          <div className="st-local-info">
            <span className="st-eyebrow" data-reveal>O ponto de encontro</span>
            <h2 className="st-h2"><span data-split>C.TECH</span> <em data-split>Jaborandi.</em></h2>
            <ul className="st-local-list" data-reveal>
              <li><IconCalendar size={20} /><div><b>{EVENTO.dataExtenso}</b><span>Chegue com 15 minutos de antecedência</span></div></li>
              <li><IconClock size={20} /><div><b>Às {EVENTO.hora} da manhã</b><span>Credenciamento na entrada</span></div></li>
              <li><IconPin size={20} /><div><b>{EVENTO.endereco}</b><span>{EVENTO.cidade} · {EVENTO.cep}</span></div></li>
            </ul>
            <div className="st-local-btns" data-reveal>
              <a className="st-chipbtn" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENTO.enderecoCompleto)}`} target="_blank" rel="noopener noreferrer">
                <IconPin size={16} /> Abrir no Google Maps
              </a>
              <a className="st-chipbtn" href={`https://waze.com/ul?q=${encodeURIComponent(EVENTO.enderecoCompleto)}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                <IconArrow size={16} /> Ir com o Waze
              </a>
            </div>
            <div className="st-map" data-reveal>
              <iframe
                title="Mapa do C.TECH"
                src={`https://www.google.com/maps?q=${encodeURIComponent(EVENTO.enderecoCompleto)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* ═════════════ FAQ ═════════════ */}
        <section className="st-section st-faq" data-depth="Águas profundas">
          <div className="st-section-head">
            <span className="st-eyebrow" data-reveal>Dúvidas rápidas</span>
            <h2 className="st-h2"><span data-split>Antes de</span> <em data-split>mergulhar.</em></h2>
          </div>
          <div className="st-faq-list">
            {FAQ.map(([q, r]) => (
              <details key={q} className="st-faq-item" data-reveal>
                <summary>{q}<i aria-hidden /></summary>
                <p>{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ═════════════ FINAL ═════════════ */}
        <section className="st-section st-final" data-depth="Fundo do tanque">
          <div className="st-final-glow" aria-hidden />
          <span className="st-eyebrow">Última chamada</span>
          <h2 className="st-final-title">O tanque está enchendo.</h2>
          <p className="st-lead">Os lugares são limitados ao auditório do C.TECH. Quando lotar, só lista de espera.</p>
          <Countdown alvoISO={EVENTO.inicioISO} />
          <div className="st-hero-ctas">
            <Magnetic className="st-btn--gold st-btn--xl" onClick={abrir("visitante")}>
              <IconTicket size={22} /> Garantir meu lugar agora
            </Magnetic>
          </div>
          <p className="st-hero-proof"><span className="st-pulse st-pulse--red" /> <span>{provaSocial}</span></p>
        </section>
      </main>

      <footer className="st-footer">
        <div className="st-footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brasao.png" alt="" width={40} height={40} />
          <div>
            <b>ProInova Day Jaborandi</b>
            <span>Realização: Prefeitura Municipal de Jaborandi · ProInova Jaborandi · C.TECH</span>
          </div>
        </div>
        <div className="st-footer-links">
          <a href="/">Conheça o ProInova</a>
          <a href="/transparencia">Transparência</a>
          <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer">Lei do ProInova</a>
        </div>
      </footer>

      {/* CTA fixa no celular */}
      <div className="st-dock">
        <div className="st-dock-info">
          <b>28/11 · 9h · C.TECH</b>
          <span>Entrada gratuita</span>
        </div>
        <button className="st-dock-btn" onClick={abrir("visitante")}>Garantir vaga <IconArrow size={16} /></button>
      </div>

      {form && (
        <Sheet origem={form} onFechar={fecharForm} rotulo={form.tipo === "visitante" ? "Inscrição de visitante" : "Inscrição de startup"}>
          {form.tipo === "visitante" ? (
            <VisitanteForm vagasRestantes={stats.vagasRestantes} onInscrito={aoInscrever} />
          ) : (
            <EmpresaForm abertas={stats.inscricoesEmpresasAbertas} vagasRestantes={stats.vagasPitchRestantes} />
          )}
        </Sheet>
      )}
    </div>
  );
}
