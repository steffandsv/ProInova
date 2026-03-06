"use client";

import { useEffect, useState } from "react";

type UserInfo = { nome: string; role: string } | null;

export default function AppHeader() {
  const [user, setUser] = useState<UserInfo>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setUser(res.user);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  const isAdmin = user && ["ADMIN", "TRIAGEM", "EDUCACAO", "CMAA", "PREFEITO"].includes(user.role);

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-dot" />
        <div>
          <div className="brand-title">{process.env.NEXT_PUBLIC_APP_NAME || "ProInova"}</div>
          <div className="brand-sub">Plataforma de projetos • transparência • entregas mensais</div>
        </div>
      </div>
      <nav className="nav">
        <a href="/">Início</a>
        <a href="/transparencia">Transparência</a>
        <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" title="Consulte a Lei Municipal de Inovação">📋 Lei</a>
        {checked && !user && (
          <>
            <a href="/cadastro">Cadastro</a>
            <a href="/login">Entrar</a>
          </>
        )}
        {user && (
          <>
            <a href="/painel">Painel</a>
            <a href="/propostas/nova">Nova Proposta</a>
            {isAdmin && <a href="/admin/propostas" style={{ color: "var(--accent)" }}>⚙ Admin</a>}
            <a href="/api/auth/logout">Sair</a>
          </>
        )}
      </nav>
    </header>
  );
}
