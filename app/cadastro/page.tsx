"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/cpf";
import AuthShell from "@/app/components/AuthShell";
import { ErrorState, PasswordInput, Spinner } from "@/app/components/ui";

export default function CadastroPage() {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const cpfDigits = useMemo(() => onlyDigits(cpf), [cpf]);

  async function validarCpf() {
    setErro(null);
    if (!isValidCPF(cpfDigits)) {
      setErro("CPF inválido. Revise os dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/municipes/lookup?cpf=${cpfDigits}`);
      const json = await res.json();
      if (!json.ok) {
        setErro(json.message || "CPF não consta no cadastro municipal.");
        return;
      }
      setNome(json.data.nome);
      setEtapa(2);
    } catch {
      setErro("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function criarConta() {
    setErro(null);
    if (senha.length < 8) {
      setErro("Senha fraca. Use pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirm) {
      setErro("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cpf: cpfDigits, email, senha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json?.message || "Erro ao cadastrar.");
        return;
      }
      window.location.href = "/painel";
    } catch {
      setErro("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function trocarCpf() {
    setEtapa(1);
    setNome("");
    setErro(null);
  }

  return (
    <AuthShell asideTitle="Crie sua conta e tire sua ideia do papel.">
      <form
        className="auth-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (etapa === 1) validarCpf();
          else criarConta();
        }}
      >
        <div>
          <h1 className="h1 auth-title">Criar conta</h1>
          <p className="p auth-subtitle">
            {etapa === 1
              ? "Comece pelo seu CPF. Ele precisa constar no cadastro municipal de Jaborandi."
              : "Agora defina como você vai entrar na plataforma."}
          </p>
        </div>

        <ol className="auth-steps" aria-label="Etapas do cadastro">
          <li className={etapa === 1 ? "is-current" : "is-done"}>
            <span>{etapa === 1 ? "1" : "✓"}</span> Validar CPF
          </li>
          <li className={etapa === 2 ? "is-current" : undefined}>
            <span>2</span> Criar conta
          </li>
        </ol>

        {etapa === 1 ? (
          <div className="row">
            <label className="label" htmlFor="cadastro-cpf">CPF</label>
            <input
              id="cadastro-cpf"
              className="input"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="username"
              autoFocus
            />
          </div>
        ) : (
          <>
            <div className="auth-identity">
              <div>
                <div className="auth-identity-label">CPF validado</div>
                <strong>{nome}</strong>
                <div className="auth-identity-sub">{formatCPF(cpfDigits)}</div>
              </div>
              <button type="button" className="btn secondary chip" onClick={trocarCpf}>
                Trocar CPF
              </button>
            </div>

            <div className="row">
              <label className="label" htmlFor="cadastro-email">E-mail</label>
              <input
                id="cadastro-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
              />
              <span className="auth-hint">Para recuperar a senha e receber avisos sobre a sua proposta.</span>
            </div>

            <div className="row">
              <label className="label" htmlFor="cadastro-senha">Senha</label>
              <PasswordInput id="cadastro-senha" value={senha} onChange={setSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
            </div>

            <div className="row">
              <label className="label" htmlFor="cadastro-confirmar">Confirmar senha</label>
              <PasswordInput id="cadastro-confirmar" value={confirm} onChange={setConfirm} placeholder="Repita a senha" autoComplete="new-password" />
            </div>
          </>
        )}

        {erro && <ErrorState message={erro} />}

        <button type="submit" className="btn auth-submit" disabled={loading}>
          {loading ? (
            <><Spinner /> {etapa === 1 ? "Validando..." : "Criando conta..."}</>
          ) : etapa === 1 ? (
            "Continuar"
          ) : (
            "Criar conta"
          )}
        </button>

        {etapa === 2 && (
          <p className="auth-hint" style={{ textAlign: "center" }}>
            Ao criar a conta, você concorda com as regras de confidencialidade e propriedade intelectual definidas no Programa.
          </p>
        )}

        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </form>
    </AuthShell>
  );
}
