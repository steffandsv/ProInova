"use client";

import { useState } from "react";
import { formatCPF, onlyDigits } from "@/lib/cpf";

export default function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cpf: onlyDigits(cpf), senha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json?.message || "Falha ao entrar.");
        return;
      }
      window.location.href = "/painel";
    } catch {
      setMsg("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 className="h1">Entrar</h1>
      <p className="p">Acesse seu painel para cadastrar/acompanhar propostas e entregas.</p>
      <div className="grid two">
        <div className="row">
          <div className="label">CPF</div>
          <input className="input" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" />
        </div>
        <div className="row">
          <div className="label">Senha</div>
          <input className="input" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
        <button className="btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {msg && <span className="p" style={{ margin: 0 }}>{msg}</span>}
      </div>
    </div>
  );
}
