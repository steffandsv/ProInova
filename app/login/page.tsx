"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCPF, onlyDigits } from "@/lib/cpf";
import AuthShell from "@/app/components/AuthShell";
import { ErrorState, PasswordInput, Spinner } from "@/app/components/ui";

export default function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setMsg(null);
    if (onlyDigits(cpf).length !== 11 || !senha) {
      setMsg("Informe o CPF completo e a senha.");
      return;
    }
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
    <AuthShell asideTitle="Inovação pública feita por quem vive em Jaborandi.">
      <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="auth-form" noValidate>
        <div>
          <h1 className="h1 auth-title">Entrar</h1>
          <p className="p auth-subtitle">Acesse seu painel para cadastrar e acompanhar propostas e entregas.</p>
        </div>

        <div className="row">
          <label className="label" htmlFor="login-cpf">CPF</label>
          <input
            id="login-cpf"
            className="input"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="row">
          <label className="label" htmlFor="login-senha">Senha</label>
          <PasswordInput id="login-senha" value={senha} onChange={setSenha} placeholder="Sua senha" />
        </div>

        {msg && <ErrorState message={msg} />}

        <button type="submit" className="btn auth-submit" disabled={loading}>
          {loading ? <><Spinner /> Entrando...</> : "Entrar"}
        </button>

        <p className="auth-footer">
          Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
        </p>
      </form>
    </AuthShell>
  );
}
