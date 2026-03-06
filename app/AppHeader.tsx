"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <Link href="/" className="brand" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none" }}>
        <span className="brand-dot" />
        <div>
          <div className="brand-title">{process.env.NEXT_PUBLIC_APP_NAME || "ProInova"}</div>
          <div className="brand-sub">Programa Municipal de Fomento à Inovação</div>
        </div>
      </Link>
      <nav className="nav">
        <Link href="/">Início</Link>
        <Link href="/transparencia">Transparência</Link>
        <a href="/LEI.pdf" target="_blank" rel="noopener noreferrer" title="Consulte a Lei Municipal de Inovação">📋 Lei</a>
        {checked && !user && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <Link href="/cadastro" style={{ color: "var(--muted)" }}>Cadastro</Link>
            <Link href="/login" className="badge" style={{ padding: "8px 16px", color: "var(--text)", fontWeight: 600 }}>Entrar ➔</Link>
          </div>
        )}
        {user && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <Link href="/painel">Meu Painel</Link>
            {isAdmin && <Link href="/admin/propostas" style={{ color: "var(--accent)" }}>⚙ Admin</Link>}
            <Link href="/propostas/nova" className="badge" style={{ padding: "8px 16px", background: "rgba(124, 92, 255, 0.15)", borderColor: "var(--accent)", color: "var(--text)", fontWeight: 600 }}>+ Nova Proposta</Link>
            <a href="/api/auth/logout" style={{ marginLeft: 8, color: "var(--muted)" }}>Sair</a>
          </div>
        )}
      </nav>
    </header>
  );
}
