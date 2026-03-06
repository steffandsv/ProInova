"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjetoPublico = {
  id: string;
  titulo: string;
  resumo: string;
  modalidade: string;
  status: string;
  linhaTematica: string;
  duracaoMeses: number;
  proponente: string;
  edital: string;
  totalMarcos: number;
  marcosValidados: number;
  progresso: number;
  createdAt: string;
};

export default function TransparenciaPage() {
  const [projetos, setProjetos] = useState<ProjetoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"ALL" | "EM_EXECUCAO" | "CONCLUIDA">("ALL");

  useEffect(() => {
    fetch("/api/transparencia")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setProjetos(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filtro === "ALL" ? projetos : projetos.filter((p) => p.status === filtro);
  const totalExecucao = projetos.filter((p) => p.status === "EM_EXECUCAO").length;
  const totalConcluidos = projetos.filter((p) => p.status === "CONCLUIDA").length;

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Header */}
      <div className="card" style={{ textAlign: "center", padding: 30 }}>
        <h1 className="h1" style={{ fontSize: 24 }}>📊 Portal de Transparência – ProInova Jaborandi</h1>
        <p className="p" style={{ marginTop: 10, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Acompanhe em tempo real os projetos apoiados pelo Programa Municipal de Fomento à Inovação.
          Conforme Art. 19 e 20 da Lei Municipal.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid two" style={{ gap: 14 }}>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 36, fontWeight: "bold", color: "var(--accent)" }}>{projetos.length}</div>
          <div className="p" style={{ margin: 0 }}>Total de Projetos Públicos</div>
        </div>
        <div className="grid two" style={{ gap: 14 }}>
          <div className="card" style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--good)" }}>{totalExecucao}</div>
            <div className="p" style={{ margin: 0 }}>Em Execução</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "var(--accent)" }}>{totalConcluidos}</div>
            <div className="p" style={{ margin: 0 }}>Concluídos</div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row">
          <div className="label">Filtrar por Status</div>
          <select className="select" value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
            <option value="ALL">Todos os Projetos</option>
            <option value="EM_EXECUCAO">⚙️ Em Execução</option>
            <option value="CONCLUIDA">🏁 Concluídos</option>
          </select>
        </div>
      </div>

      {/* Lista de Projetos */}
      {loading ? (
        <div className="card"><p className="p">Carregando projetos...</p></div>
      ) : filtered.length === 0 ? (
        <div className="card"><p className="p">Nenhum projeto público encontrado.</p></div>
      ) : (
        filtered.map((p) => (
          <div className="card" key={p.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 className="h2" style={{ fontSize: 17 }}>{p.titulo}</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="badge">{p.modalidade}</span>
                  <span className="badge">{p.linhaTematica}</span>
                  <span className="badge">{p.status === "EM_EXECUCAO" ? "⚙️ Em Execução" : "🏁 Concluído"}</span>
                </div>
              </div>
              <Link href={`/projeto/${p.id}`} className="btn secondary">
                Ver Página do Projeto
              </Link>
            </div>

            <p className="p" style={{ marginTop: 10, fontSize: 13 }}>{p.resumo}</p>

            <div style={{ marginTop: 14, display: "flex", gap: 20, fontSize: 13, color: "var(--muted)", flexWrap: "wrap" }}>
              <span>👤 {p.proponente}</span>
              <span>📋 {p.edital}</span>
              <span>📅 {p.duracaoMeses} meses</span>
              <span>🗂️ Início: {new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>

            {/* Barra de progresso */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>Progresso: {p.marcosValidados}/{p.totalMarcos} marcos</span>
                <span style={{ fontWeight: "bold" }}>{p.progresso}%</span>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 6, overflow: "hidden", height: 8 }}>
                <div style={{
                  width: `${p.progresso}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent), var(--good))",
                  borderRadius: 6,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          </div>
        ))
      )}

      {/* Footer */}
      <div className="card" style={{ textAlign: "center", padding: 20, fontSize: 12, color: "var(--muted)" }}>
        <p>Programa Municipal de Fomento à Inovação – ProInova Jaborandi</p>
        <p>Dados públicos conforme Art. 19 e 20. Dados de menores são redatados (LGPD).</p>
      </div>
    </div>
  );
}
