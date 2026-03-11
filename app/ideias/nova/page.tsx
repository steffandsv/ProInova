"use client";

import { useState, useCallback } from "react";

function onlyDigits(v: string) {
  return v.replaceAll(/\D+/g, "");
}

function formatCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function NovaIdeiaPage() {
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState<string | null>(null);
  const [lookupMsg, setLookupMsg] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /* ── CPF auto-lookup ─────────────────────────────────────────── */
  const lookupCPF = useCallback(async (raw: string) => {
    const digits = onlyDigits(raw);
    if (digits.length !== 11) return;
    setLookupLoading(true);
    setLookupMsg("");
    setNome(null);
    try {
      const r = await fetch(`/api/municipes/lookup?cpf=${digits}`);
      const res = await r.json();
      if (res.ok) {
        setNome(res.data.nome);
      } else {
        setLookupMsg(res.message || "CPF não encontrado.");
      }
    } catch {
      setLookupMsg("Erro ao consultar CPF.");
    } finally {
      setLookupLoading(false);
    }
  }, []);

  /* ── Submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const r = await fetch("/api/ideias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: onlyDigits(cpf), titulo, descricao }),
      });
      const res = await r.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.message || "Erro ao enviar ideia.");
      }
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSending(false);
    }
  };

  /* ── Success state ───────────────────────────────────────────── */
  if (success) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
        <div
          className="card"
          style={{
            padding: 48,
            animation: "modal-slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>💡</div>
          <h2 className="h1" style={{ fontSize: 28 }}>
            Ideia enviada!
          </h2>
          <p className="p" style={{ marginBottom: 28 }}>
            Sua ideia já está no <strong>Banco de Ideias</strong> e pode ser
            vista por todos os estudantes e participantes do ProInova.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/ideias" className="btn" style={{ textDecoration: "none" }}>
              💡 Ver Banco de Ideias
            </a>
            <button
              className="btn secondary"
              onClick={() => {
                setSuccess(false);
                setCpf("");
                setNome(null);
                setTitulo("");
                setDescricao("");
              }}
            >
              Enviar outra ideia
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1 className="h1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 36 }}>💡</span> Enviar Ideia
      </h1>
      <p className="p">
        Tem uma ideia que pode melhorar a cidade? Digite seu CPF, dê um título e descreva.
        Simples assim!
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ display: "grid", gap: 18 }}>
        {/* CPF */}
        <div className="row">
          <label className="label" htmlFor="ideia-cpf">CPF</label>
          <input
            id="ideia-cpf"
            className="input"
            placeholder="000.000.000-00"
            value={formatCPF(cpf)}
            onChange={(e) => {
              const raw = onlyDigits(e.target.value);
              setCpf(raw);
              setNome(null);
              setLookupMsg("");
              if (raw.length === 11) lookupCPF(raw);
            }}
            maxLength={14}
            required
          />
          {lookupLoading && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Consultando…
            </span>
          )}
          {nome && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 12,
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                fontSize: 14,
                color: "#4ade80",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              ✅ <strong>{nome}</strong>
            </div>
          )}
          {lookupMsg && (
            <span style={{ fontSize: 13, color: "var(--bad)" }}>{lookupMsg}</span>
          )}
        </div>

        {/* Title */}
        <div className="row">
          <label className="label" htmlFor="ideia-titulo">Título da Ideia</label>
          <input
            id="ideia-titulo"
            className="input"
            placeholder="Ex: App de caronas para estudantes"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={255}
            required
          />
        </div>

        {/* Description */}
        <div className="row">
          <label className="label" htmlFor="ideia-desc">Descrição</label>
          <textarea
            id="ideia-desc"
            className="textarea"
            placeholder="Descreva sua ideia com detalhes: qual o problema, como resolver, quem se beneficia…"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            required
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: 14,
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        <button className="btn" disabled={sending || !nome || !titulo || !descricao} type="submit">
          {sending ? "Enviando…" : "🚀 Enviar Ideia"}
        </button>
      </form>
    </div>
  );
}
