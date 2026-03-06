"use client";

import { useMemo, useState } from "react";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/cpf";

type LookupResult =
  | { ok: true; data: { nome: string; telefone?: string | null; data_nasc?: string | null; rg?: string | null } }
  | { ok: false; message: string };

export default function CadastroPage() {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const cpfDigits = useMemo(() => onlyDigits(cpf), [cpf]);
  const cpfValid = useMemo(() => isValidCPF(cpfDigits), [cpfDigits]);

  async function handleLookup() {
    setLookup(null);
    if (!cpfValid) {
      setLookup({ ok: false, message: "CPF inválido. Revise os dígitos." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/municipes/lookup?cpf=${cpfDigits}`);
      const json = await res.json();
      setLookup(json);
    } catch {
      setLookup({ ok: false, message: "Falha de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!lookup?.ok) {
      setLookup({ ok: false, message: "Antes de cadastrar, valide seu CPF no cadastro municipal." });
      return;
    }
    if (senha.length < 8) {
      setLookup({ ok: false, message: "Senha fraca. Use pelo menos 8 caracteres." });
      return;
    }
    if (senha !== confirm) {
      setLookup({ ok: false, message: "As senhas não conferem." });
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
        setLookup({ ok: false, message: json?.message || "Erro ao cadastrar." });
        return;
      }
      window.location.href = "/painel";
    } catch {
      setLookup({ ok: false, message: "Falha de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">Cadastro</h1>
        <p className="p">
          Digite seu CPF. Se ele constar no cadastro municipal, vamos preencher automaticamente seus dados básicos.
          Isso reduz fraude e acelera a triagem.
        </p>

        <div className="grid two">
          <div className="row">
            <div className="label">CPF</div>
            <input
              className="input"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            <button className="btn secondary" onClick={handleLookup} disabled={loading}>
              {loading ? "Validando..." : "Validar CPF e puxar dados"}
            </button>

            {lookup && (
              <div className="card" style={{ padding: 14 }}>
                {lookup.ok ? (
                  <div className="grid" style={{ gap: 8 }}>
                    <div className="badge">
                      <strong>Identificado</strong> dados encontrados
                    </div>
                    <div><span className="label">Nome:</span> {lookup.data.nome}</div>
                    <div><span className="label">Telefone:</span> {lookup.data.telefone || "—"}</div>
                    <div><span className="label">Nascimento:</span> {lookup.data.data_nasc || "—"}</div>
                    <div><span className="label">RG:</span> {lookup.data.rg || "—"}</div>
                  </div>
                ) : (
                  <div className="grid" style={{ gap: 10 }}>
                    <div className="badge" style={{ borderColor: "rgba(239,68,68,0.45)" }}>
                      <strong>Não encontrado</strong> ou inválido
                    </div>
                    <div className="p" style={{ margin: 0 }}>{lookup.message}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="row">
            <div className="label">E-mail (para recuperar senha e receber notificações)</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            <div className="label">Senha</div>
            <input className="input" value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="mínimo 8 caracteres" />
            <div className="label">Confirmar senha</div>
            <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" />
            <button className="btn" onClick={handleRegister} disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
            <p className="p" style={{ margin: 0, fontSize: 12 }}>
              Ao criar conta, você concorda com regras de confidencialidade e propriedade intelectual definidas no Programa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
