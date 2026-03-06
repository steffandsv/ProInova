"use client";

import { useEffect, useRef } from "react";

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
