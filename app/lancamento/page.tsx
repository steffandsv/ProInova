"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/cpf";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*            PÁGINA DE INSCRIÇÃO — LANÇAMENTO PROINOVA                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const EVENT_DATE = new Date("2026-03-21T09:00:00-03:00");

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: diff <= 0 };
}

function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function LancamentoPage() {
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [committed, setCommitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalInscritos, setTotalInscritos] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const cpfDigits = useMemo(() => onlyDigits(cpf), [cpf]);
  const cpfValid = useMemo(() => isValidCPF(cpfDigits), [cpfDigits]);
  const countdown = useCountdown(EVENT_DATE);

  const checkRef = useRef<HTMLDivElement>(null);

  // Fetch total on mount
  useEffect(() => {
    fetch("/api/lancamento")
      .then((r) => r.json())
      .then((j) => j.ok && setTotalInscritos(j.total + 60))
      .catch(() => {});
  }, []);

  // Auto-lookup when CPF becomes valid
  useEffect(() => {
    if (cpfDigits.length === 11 && cpfValid && !lookupDone) {
      handleLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfDigits, cpfValid]);

  async function handleLookup() {
    setLookupError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/municipes/lookup?cpf=${cpfDigits}`);
      const json = await res.json();
      if (json.ok) {
        setNome(json.data.nome);
        const age = calculateAge(json.data.data_nasc);
        if (age !== null) setIdade(String(age));
        setLookupDone(true);
      } else {
        setLookupError(json.message || "CPF não encontrado no cadastro municipal.");
      }
    } catch {
      setLookupError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleCommit() {
    const next = !committed;
    setCommitted(next);
    if (next) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }

  async function handleSubmit() {
    if (!committed) {
      setSubmitError("Marque o compromisso para continuar.");
      return;
    }
    if (!nome.trim()) {
      setSubmitError("Nome é obrigatório.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/lancamento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cpf: cpfDigits, nome, idade: idade ? Number(idade) : null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.message || "Erro ao inscrever.");
        return;
      }
      // Success — redirect to confirmation
      window.location.href = "/lancamento/confirmado";
    } catch {
      setSubmitError("Falha de rede. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="landing">
      <section className="launch-hero">
        {/* Animated orbs */}
        <div className="hero-orb hero-orb--1" aria-hidden />
        <div className="hero-orb hero-orb--2" aria-hidden />
        <div className="hero-orb hero-orb--3" aria-hidden />

        <div className="launch-hero-content">
          <div className="launch-badges">
            <span className="launch-badge launch-badge--sebrae">🤝 Apoio SEBRAE — Startup Day</span>
            <span className="launch-badge launch-badge--exclusive">🔒 Vagas Limitadas</span>
          </div>

          <h1 className="launch-title">
            O futuro da inovação em Jaborandi
            <br />
            <span className="gradient-text">começa aqui.</span>
          </h1>

          <p className="launch-subtitle">
            Dia <strong>21 de março de 2026</strong>, às <strong>9h</strong>, no{" "}
            <strong>C.TECH</strong> — será revelado o programa que vai transformar ideias
            em projetos reais financiados pela Prefeitura. Uma prévia exclusiva das
            propostas, explicações detalhadas do funcionamento e um coffee break especial
            preparado para você.
          </p>

          {/* Countdown */}
          {!countdown.expired && (
            <div className="launch-countdown">
              <CountdownUnit value={countdown.d} label="dias" />
              <span className="countdown-sep">:</span>
              <CountdownUnit value={countdown.h} label="horas" />
              <span className="countdown-sep">:</span>
              <CountdownUnit value={countdown.m} label="min" />
              <span className="countdown-sep">:</span>
              <CountdownUnit value={countdown.s} label="seg" />
            </div>
          )}

          {totalInscritos > 0 && (
            <div className="launch-social-proof">
              🔥 <strong>{totalInscritos}</strong> {totalInscritos === 1 ? "pessoa já confirmou presença" : "pessoas já confirmaram presença"}
            </div>
          )}
        </div>
      </section>

      {/* ─── FORM SECTION ─── */}
      <section className="launch-form-section">
        <div className="launch-form-wrapper">
          <div className="launch-form-header">
            <h2 className="launch-form-title">Garanta sua vaga agora</h2>
            <p className="launch-form-desc">
              Preencha com seu CPF e confirme sua presença. Leva menos de 30 segundos.
            </p>
          </div>

          {/* CPF Field */}
          <div className="launch-field">
            <label className="launch-label">Seu CPF</label>
            <div className="launch-cpf-row">
              <input
                className="launch-input"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCPF(e.target.value));
                  setLookupDone(false);
                  setLookupError("");
                }}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
              />
              {loading && <div className="launch-spinner" />}
              {lookupDone && <span className="launch-cpf-ok">✓</span>}
            </div>
            {lookupError && <div className="launch-error">{lookupError}</div>}
          </div>

          {/* Expanded fields after lookup */}
          {lookupDone && (
            <div className="launch-expanded">
              <div className="launch-field">
                <label className="launch-label">Nome Completo</label>
                <input
                  className="launch-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="launch-field">
                <label className="launch-label">Idade</label>
                <input
                  className="launch-input launch-input--small"
                  value={idade}
                  onChange={(e) => setIdade(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                />
              </div>

              {/* DOPAMINERGIC CHECKBOX */}
              <div
                ref={checkRef}
                className={`launch-commit ${committed ? "launch-commit--active" : ""}`}
                onClick={handleCommit}
                role="checkbox"
                aria-checked={committed}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") handleCommit(); }}
              >
                <div className="launch-commit-check">
                  {committed && (
                    <svg viewBox="0 0 24 24" className="launch-commit-svg">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="launch-commit-text">
                  Me comprometo a participar do lançamento do programa
                </span>

                {/* Confetti particles */}
                {showConfetti && (
                  <div className="launch-confetti-container" aria-hidden>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="launch-confetti-particle"
                        style={{
                          "--x": `${Math.random() * 200 - 100}px`,
                          "--y": `${Math.random() * -200 - 50}px`,
                          "--r": `${Math.random() * 720 - 360}deg`,
                          "--delay": `${Math.random() * 0.3}s`,
                          "--color": ["#22c55e", "#7c5cff", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"][i % 6],
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>

              {submitError && <div className="launch-error">{submitError}</div>}

              <button
                className="launch-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || !committed}
              >
                {submitting ? "Inscrevendo..." : "🚀 Confirmar minha presença"}
              </button>

              <p className="launch-disclaimer">
                Ao confirmar, você se compromete a comparecer ao evento de lançamento do ProInova.
                Sua vaga é pessoal e intransferível.
              </p>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className="launch-info-cards">
          <div className="launch-info-card">
            <span className="launch-info-icon">📅</span>
            <div>
              <strong>Sábado, 21 de Março</strong>
              <span>às 9h da manhã</span>
            </div>
          </div>
          <div className="launch-info-card">
            <span className="launch-info-icon">📍</span>
            <div>
              <strong>C.TECH</strong>
              <span>Centro de Tecnologia</span>
            </div>
          </div>
          <div className="launch-info-card">
            <span className="launch-info-icon">☕</span>
            <div>
              <strong>Coffee Break</strong>
              <span>Incluído no evento</span>
            </div>
          </div>
          <div className="launch-info-card">
            <span className="launch-info-icon">🚀</span>
            <div>
              <strong>Prévia Exclusiva</strong>
              <span>Conheça as ideias antes de todo mundo</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="countdown-unit">
      <span className="countdown-value">{String(value).padStart(2, "0")}</span>
      <span className="countdown-label">{label}</span>
    </div>
  );
}
