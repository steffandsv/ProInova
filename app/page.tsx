"use client";

import { useEffect, useRef, useState } from "react";

/* ─────── Intersection Observer hook for scroll-triggered animations ─────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          io.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                              LANDING PAGE                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="landing">
      <HeroSection />
      <WhatIsSection />
      <InnovationExplainerSection />
      <HowItWorksSection />
      <BenefitsSection />
      <AudienceSection />
      <FinalCTASection />
    </div>
  );
}

/* ────────────────────────────────────── HERO ──────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero">
      {/* animated floating orbs */}
      <div className="hero-orb hero-orb--1" aria-hidden />
      <div className="hero-orb hero-orb--2" aria-hidden />
      <div className="hero-orb hero-orb--3" aria-hidden />

      <div className="hero-content">
        <span className="hero-tag">🚀 Programa Municipal de Inovação</span>

        <h1 className="hero-title">
          Sua ideia pode<br />
          <span className="gradient-text">transformar o Brasil inteiro.</span>
        </h1>

        <p className="hero-subtitle">
          Cadastre seu projeto de inovação na plataforma ProInova e receba{" "}
          <strong>até R$&nbsp;1.000 por mês</strong> para torná-lo realidade.
          Seu software, invenção ou solução poderá ser adotada por{" "}
          <strong>prefeituras de todo o país</strong>.
        </p>

        <div className="hero-actions">
          <a href="/cadastro" className="cta-btn cta-btn--primary">
            <span className="cta-icon">⚡</span> Quero participar
          </a>
          <a href="/login" className="cta-btn cta-btn--ghost">
            Já tenho conta →
          </a>
        </div>

        <div className="hero-stats">
          <StatItem value="R$ 1.000" label="por mês / projeto" />
          <StatItem value="14+" label="anos para participar" />
          <StatItem value="100%" label="transparente" />
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ─────────────────────────────── O QUE É ─────────────────────────────────── */
function WhatIsSection() {
  const ref = useReveal();
  return (
    <section className="section reveal-section" ref={ref}>
      <div className="section-header">
        <span className="section-tag">💡 O que é</span>
        <h2 className="section-title">
          Um programa público que financia{" "}
          <span className="gradient-text">suas melhores ideias.</span>
        </h2>
        <p className="section-desc">
          O <strong>ProInova Jaborandi</strong> é o Programa Municipal de Fomento à Inovação
          e ao Desenvolvimento. Através dele, qualquer pessoa a partir de 14 anos pode submeter
          projetos de <strong>software, invenções ou soluções para a administração pública</strong> —
          e receber uma bolsa-auxílio mensal para desenvolvê-los.
        </p>
      </div>

      <div className="features-grid">
        <FeatureCard
          icon="🖥️"
          title="Software & Apps"
          desc="Desenvolva aplicações, websites, plataformas e ferramentas digitais que resolvam problemas reais da gestão pública."
        />
        <FeatureCard
          icon="🔬"
          title="Invenções & Soluções"
          desc="Propostas de automação, metodologias, bases de conhecimento, materiais didáticos e muito mais."
        />
        <FeatureCard
          icon="🎓"
          title="ProInova Educação"
          desc="Modalidade especial para projetos com finalidade educacional e pedagógica na rede municipal de ensino."
        />
        <FeatureCard
          icon="🌐"
          title="ProInova Geral"
          desc="Projetos de interesse público em saúde, agricultura, turismo, infraestrutura e gestão municipal."
        />
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

/* ───────────────────────── COMO FUNCIONA ──────────────────────────────────── */
function HowItWorksSection() {
  const ref = useReveal();
  const steps = [
    {
      num: "01",
      title: "Cadastre-se",
      desc: "Crie sua conta na plataforma. Informe seu CPF e o sistema identifica automaticamente seus dados do cadastro municipal.",
      icon: "📝",
    },
    {
      num: "02",
      title: "Submeta seu projeto",
      desc: "Preencha o formulário estruturado: descreva o problema, público-alvo, cronograma mensal de entregáveis, indicadores e orçamento.",
      icon: "📋",
    },
    {
      num: "03",
      title: "Avaliação técnica",
      desc: "Seu projeto passa por triagem da Secretaria de Comunicação, avaliação do Comitê CMAA e homologação pelo Prefeito.",
      icon: "🔍",
    },
    {
      num: "04",
      title: "Assinatura do Termo",
      desc: "Projeto aprovado? Assine o Termo de Outorga e comece a desenvolver. Cada entrega mensal é verificada pela coordenação.",
      icon: "✍️",
    },
    {
      num: "05",
      title: "Receba sua Bolsa",
      desc: "Entregas verificadas = pagamento liberado. Até R$ 1.000/mês por projeto enquanto durar a execução.",
      icon: "💰",
    },
  ];

  return (
    <section className="section section--dark reveal-section" ref={ref}>
      <div className="section-header">
        <span className="section-tag">⚙️ Como funciona</span>
        <h2 className="section-title">
          Do cadastro ao pagamento,{" "}
          <span className="gradient-text">tudo transparente.</span>
        </h2>
        <p className="section-desc">
          Um processo simples, justo e público. Cada etapa foi desenhada para
          garantir que <strong>projetos de verdade</strong> — com entregas
          reais — recebam o apoio que merecem.
        </p>
      </div>

      <div className="timeline">
        {steps.map((s, i) => (
          <div className="timeline-step" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
            <div className="timeline-num">{s.icon}</div>
            <div className="timeline-body">
              <span className="timeline-badge">{s.num}</span>
              <h3 className="timeline-title">{s.title}</h3>
              <p className="timeline-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────── BENEFÍCIOS ──────────────────────────────────── */
function BenefitsSection() {
  const ref = useReveal();
  const benefits = [
    {
      icon: "💎",
      title: "Até R$ 1.000/mês",
      desc: "Bolsa-auxílio mensal por projeto. O valor pode ser dividido entre membros da equipe, conforme a proposta.",
    },
    {
      icon: "🌍",
      title: "Alcance nacional",
      desc: "O Município pode licenciar, ceder ou comercializar seu projeto para prefeituras de todo o Brasil, através da Jaborandi Power S/A.",
    },
    {
      icon: "📊",
      title: "Página pública do projeto",
      desc: "Cada projeto aprovado terá uma vitrine online com evolução mensal, entregas e indicadores — sem expor dados sensíveis ou código-fonte.",
    },
    {
      icon: "🤝",
      title: "Sem vínculo empregatício",
      desc: "A bolsa é um incentivo de fomento. Você tem autonomia total sobre seu tempo e organização, respeitando o cronograma pactuado.",
    },
    {
      icon: "👥",
      title: "Individual ou em equipe",
      desc: "Pode participar sozinho ou montar uma equipe. Estudantes, universitários, profissionais autônomos e especialistas são bem-vindos.",
    },
    {
      icon: "🏛️",
      title: "Respaldo legal completo",
      desc: "O programa é regido por lei municipal, com Edital público, Termo de Outorga formal e prestação de contas simplificada.",
    },
  ];

  return (
    <section className="section reveal-section" ref={ref}>
      <div className="section-header">
        <span className="section-tag">🎯 Vantagens</span>
        <h2 className="section-title">
          Não é só dinheiro.{" "}
          <span className="gradient-text">É oportunidade real.</span>
        </h2>
        <p className="section-desc">
          Imagine seu projeto sendo usado por centenas de municípios brasileiros.
          Seu nome como autor permanece para sempre. Sua solução impacta milhões
          de pessoas.
        </p>
      </div>

      <div className="benefits-grid">
        {benefits.map((b, i) => (
          <div className="benefit-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="benefit-icon">{b.icon}</span>
            <h3 className="benefit-title">{b.title}</h3>
            <p className="benefit-desc">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────── PÚBLICO ──────────────────────────────────── */
function AudienceSection() {
  const ref = useReveal();
  return (
    <section className="section section--dark reveal-section" ref={ref}>
      <div className="section-header">
        <span className="section-tag">🎤 Quem pode participar</span>
        <h2 className="section-title">
          Se você tem uma ideia e vontade,{" "}
          <span className="gradient-text">o ProInova é para você.</span>
        </h2>
      </div>

      <div className="audience-grid">
        <AudienceCard
          emoji="🧑‍🎓"
          title="Estudantes"
          desc="A partir de 14 anos, matriculados na rede pública municipal. Menores de 18 precisam de anuência do responsável legal."
        />
        <AudienceCard
          emoji="👩‍💻"
          title="Desenvolvedores"
          desc="Programadores, designers e profissionais de TI com projetos para modernizar a gestão pública municipal."
        />
        <AudienceCard
          emoji="🧑‍🔬"
          title="Inventores"
          desc="Qualquer pessoa com uma solução criativa para os desafios da administração pública e da educação."
        />
        <AudienceCard
          emoji="👥"
          title="Equipes"
          desc="Monte um time multidisciplinar. Cada membro pode receber sua parcela da bolsa conforme o rateio da proposta."
        />
      </div>
    </section>
  );
}

function AudienceCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="audience-card">
      <span className="audience-emoji">{emoji}</span>
      <h3 className="audience-title">{title}</h3>
      <p className="audience-desc">{desc}</p>
    </div>
  );
}

/* ──────────────────────────────── CTA FINAL ──────────────────────────────── */
function FinalCTASection() {
  const ref = useReveal();
  return (
    <section className="section cta-section reveal-section" ref={ref}>
      <div className="cta-glow" aria-hidden />
      <h2 className="cta-title">
        Pronto para transformar<br />
        <span className="gradient-text">sua ideia em realidade?</span>
      </h2>
      <p className="cta-subtitle">
        O próximo grande projeto pode ser o seu. Cadastre-se agora e
        submeta sua proposta para avaliação.
      </p>
      <div className="hero-actions" style={{ justifyContent: "center" }}>
        <a href="/cadastro" className="cta-btn cta-btn--primary cta-btn--lg">
          <span className="cta-icon">⚡</span> Criar minha conta
        </a>
        <a href="/login" className="cta-btn cta-btn--ghost cta-btn--lg">
          Entrar →
        </a>
      </div>
      <a
        href="/LEI.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="lei-link"
      >
        📋 Consulte a Lei Municipal de Inovação — regras e diretrizes completas
      </a>
    </section>
  );
}

/* ───────────────────────── O QUE É INOVAÇÃO ─────────────────────────────────── */
function InnovationExplainerSection() {
  const ref = useReveal();
  const [cost, setCost] = useState(50);
  const [time, setTime] = useState(50);
  const [quality, setQuality] = useState(50);

  const isCostBetter = cost < 50;
  const isTimeBetter = time < 50;
  const isQualityBetter = quality > 50;

  const isCostWorse = cost > 50;
  const isTimeWorse = time > 50;
  const isQualityWorse = quality < 50;

  let status = "Processo Padrão";
  let statusColor = "var(--muted)";
  let message = "Ajuste os controles para entender na prática.";

  if (cost === 50 && time === 50 && quality === 50) {
    status = "Ponto de Partida";
    statusColor = "var(--muted)";
    message = "Este triângulo tracejado representa o processo atual. Puxe os controles para expandir (melhorar) ou contrair (piorar).";
  } else if ((isCostBetter || isTimeBetter || isQualityBetter) && !isCostWorse && !isTimeWorse && !isQualityWorse) {
    status = "✨ INOVAÇÃO!";
    statusColor = "var(--good)"; 
    message = "Você melhorou o processo sem sacrificar nenhuma outra ponta! Isso é inovar: expandir resultados.";
  } else if (isCostBetter && (isTimeWorse || isQualityWorse)) {
    status = "⛔ NÃO É INOVAÇÃO";
    statusColor = "var(--bad)";
    message = "Corte de gastos: reduzir custos piorando a qualidade ou aumentando o tempo de entrega é apenas precarização.";
  } else if (isTimeBetter && (isCostWorse || isQualityWorse)) {
    status = "⛔ NÃO É INOVAÇÃO";
    statusColor = "var(--bad)";
    message = "Fazer rápido, mas entregando com menos qualidade ou gastando muito mais, não resolve o problema genuinamente.";
  } else if (isQualityBetter && (isCostWorse || isTimeWorse)) {
    status = "⚠️ MELHORIA CUSTOSA";
    statusColor = "var(--warn)";
    message = "Elevar a qualidade cobrando mais caro ou demorando mais torna o serviço premium, mas nem sempre é a inovação viável.";
  } else if (isCostWorse && isTimeWorse && isQualityWorse) {
    status = "🚨 PIOROU TUDO";
    statusColor = "var(--bad)";
    message = "O processo ficou mais caro, mais lento e entregando menos.";
  } else {
    status = "🤔 DEPENDE...";
    statusColor = "#6366f1";
    message = "O foco da inovação deve ser esticar o triângulo para fora e não deixar nenhuma ponta encolher (ficar pior).";
  }

  // Mathematics for the triangle
  const rQ = 20 + quality;
  const qX = 150;
  const qY = 150 - rQ;

  const rT = 20 + (100 - time);
  const tX = 150 + rT * Math.cos((150 * Math.PI) / 180);
  const tY = 150 + rT * Math.sin((150 * Math.PI) / 180);

  const rC = 20 + (100 - cost);
  const cX = 150 + rC * Math.cos((30 * Math.PI) / 180);
  const cY = 150 + rC * Math.sin((30 * Math.PI) / 180);

  const baseVQ = 70;
  const bqX = 150, bqY = 150 - baseVQ;
  const btX = 150 + baseVQ * Math.cos((150 * Math.PI) / 180);
  const btY = 150 + baseVQ * Math.sin((150 * Math.PI) / 180);
  const bcX = 150 + baseVQ * Math.cos((30 * Math.PI) / 180);
  const bcY = 150 + baseVQ * Math.sin((30 * Math.PI) / 180);
  const basePolygon = `${bqX},${bqY} ${btX},${btY} ${bcX},${bcY}`;

  return (
    <section className="section reveal-section" ref={ref}>
      <div className="section-header">
        <span className="section-tag">🧠 O que é inovação?</span>
        <h2 className="section-title">
          Inovar é fazer <span className="gradient-text">melhor</span>.
        </h2>
        <p className="section-desc">
          A inovação não é só criar tecnologia ou aplicativos complexos. Ela se aplica a diversas áreas! 
          Você pode inovar ao propor um <strong>novo método para um curso de inglês</strong>, 
          uma forma de <strong>vídeo marketing</strong> incrível ou até um processo simplificado na escola. 
          O importante é melhorar a balança entre:
        </p>
      </div>

      <div className="innovation-widget">
        <div className="triangle-container">
          <div className="triangle-glow" style={{ background: statusColor }} />
          <svg viewBox="0 0 300 300" className="triangle-svg">
            <polygon points={basePolygon} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="5 5" />
            <line x1="150" y1="150" x2={bqX} y2={bqY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="150" y1="150" x2={btX} y2={btY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="150" y1="150" x2={bcX} y2={bcY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            
            <polygon 
              points={`${qX},${qY} ${tX},${tY} ${cX},${cY}`} 
              fill={statusColor} 
              fillOpacity="0.15" 
              stroke={statusColor} 
              strokeWidth="3"
              style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
            />

            <circle cx={qX} cy={qY} r="6" fill={statusColor} style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }} />
            <circle cx={tX} cy={tY} r="6" fill={statusColor} style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }} />
            <circle cx={cX} cy={cY} r="6" fill={statusColor} style={{ transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }} />
            
            <text x="150" y="20" fill="var(--text)" fontSize="13" textAnchor="middle" fontWeight="bold">Qualidade (+)</text>
            <text x="30" y="240" fill="var(--text)" fontSize="13" textAnchor="start" fontWeight="bold">Tempo (-)</text>
            <text x="270" y="240" fill="var(--text)" fontSize="13" textAnchor="end" fontWeight="bold">Custo (-)</text>
          </svg>
        </div>

        <div className="innovation-controls">
          <div className="status-box" style={{ borderColor: statusColor, boxShadow: `0 0 20px ${statusColor}22` }}>
            <h3 style={{ color: statusColor, margin: "0 0 6px 0", fontSize: "20px", transition: "color 0.4s" }}>{status}</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "var(--text)", lineHeight: 1.5, opacity: 0.9 }}>{message}</p>
          </div>

          <div className="sliders-container">
          <div className="slider-group">
            <label>
              ⏳ Duração (Tempo)
              <span>{time}%</span>
            </label>
            <div className="slider-hint">{time < 50 ? "🚀 Mais Rápido" : time > 50 ? "🐌 Mais Lento" : "Padrão"}</div>
            <input type="range" min="0" max="100" value={time} onChange={e => setTime(Number(e.target.value))} />
          </div>
          
          <div className="slider-group">
            <label>
              💰 Quanto Gasta (Custo)
              <span>{cost}%</span>
            </label>
            <div className="slider-hint">{cost < 50 ? "💸 Reduzido" : cost > 50 ? "💸 Mais Caro" : "Padrão"}</div>
            <input type="range" min="0" max="100" value={cost} onChange={e => setCost(Number(e.target.value))} />
          </div>
          
          <div className="slider-group">
            <label>
              🏆 O Quê (Qualidade)
              <span>{quality}%</span>
            </label>
            <div className="slider-hint">{quality > 50 ? "⭐ Melhor" : quality < 50 ? "📉 Pior" : "Padrão"}</div>
            <input type="range" min="0" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} />
          </div>
          
          <button 
            className="reset-btn" 
            onClick={() => { setCost(50); setTime(50); setQuality(50); }}
          >
            🔄 Resetar Simulação
          </button>
          </div>
        </div>
      </div>
    </section>
  );
}
