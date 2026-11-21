"use client";

import { useEffect, useState } from "react";
import AuthShell from "@/app/components/AuthShell";
import { ErrorState, PasswordInput, Spinner } from "@/app/components/ui";

export default function TrocarSenhaPage() {
  const [provisoria, setProvisoria] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setProvisoria(Boolean(res.user.mustChangePassword));
      })
      .catch(() => {});
  }, []);

  async function trocar() {
    setErro(null);
    if (!senhaAtual) {
      setErro(provisoria ? "Informe a senha provisória que você recebeu." : "Informe a senha atual.");
      return;
    }
    if (novaSenha.length < 8) {
      setErro("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas novas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(json?.message || "Não foi possível trocar a senha.");
        return;
      }
      window.location.href = "/painel";
    } catch {
      setErro("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell asideTitle="Sua conta, protegida por uma senha só sua.">
      <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); trocar(); }}>
        <div>
          <h1 className="h1 auth-title">{provisoria ? "Crie sua senha" : "Trocar senha"}</h1>
          <p className="p auth-subtitle">
            {provisoria
              ? "Você entrou com uma senha provisória. Crie a sua para continuar usando a plataforma."
              : "Informe a senha atual e escolha uma nova."}
          </p>
        </div>

        <div className="row">
          <label className="label" htmlFor="senha-atual">{provisoria ? "Senha provisória" : "Senha atual"}</label>
          <PasswordInput id="senha-atual" value={senhaAtual} onChange={setSenhaAtual} placeholder={provisoria ? "A senha que você recebeu" : "Sua senha atual"} />
        </div>

        <div className="row">
          <label className="label" htmlFor="senha-nova">Nova senha</label>
          <PasswordInput id="senha-nova" value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
        </div>

        <div className="row">
          <label className="label" htmlFor="senha-confirmar">Confirmar nova senha</label>
          <PasswordInput id="senha-confirmar" value={confirmar} onChange={setConfirmar} placeholder="Repita a nova senha" autoComplete="new-password" />
        </div>

        {erro && <ErrorState message={erro} />}

        <button type="submit" className="btn auth-submit" disabled={loading}>
          {loading ? <><Spinner /> Salvando...</> : provisoria ? "Criar senha e continuar" : "Salvar nova senha"}
        </button>

        {!provisoria && (
          <p className="auth-footer">
            <a href="/painel">Voltar ao painel</a>
          </p>
        )}
      </form>
    </AuthShell>
  );
}
