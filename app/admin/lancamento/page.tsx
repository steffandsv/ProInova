"use client";

import { useEffect, useState } from "react";

type Inscricao = {
  id: string;
  cpf: string;
  nome: string;
  idade: number | null;
  createdAt: string;
};

export default function AdminLancamentoPage() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInscricoes();
  }, []);

  async function fetchInscricoes() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lancamento");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      setInscricoes(json.data || []);
      setTotal(json.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function formatCpfDisplay(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h1 className="h1">🚀 Inscrições no Lançamento</h1>
          <div className="badge" style={{ fontSize: 14, padding: "8px 16px" }}>
            <strong>{total}</strong> inscritos
          </div>
        </div>

        <p className="p">
          Lista de pessoas que confirmaram presença no lançamento do ProInova — Sábado, 21/03/2026 às 9h no C.TECH.
        </p>

        {loading ? (
          <p className="p">Carregando inscrições...</p>
        ) : inscricoes.length === 0 ? (
          <p className="p">Nenhuma inscrição registrada ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px" }}>#</th>
                  <th style={{ padding: "10px" }}>Nome</th>
                  <th style={{ padding: "10px" }}>CPF</th>
                  <th style={{ padding: "10px" }}>Idade</th>
                  <th style={{ padding: "10px" }}>Data da Inscrição</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((insc, idx) => (
                  <tr key={insc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", color: "var(--muted)", fontSize: 13 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <strong>{insc.nome}</strong>
                    </td>
                    <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 13 }}>
                      {formatCpfDisplay(insc.cpf)}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {insc.idade != null ? `${insc.idade} anos` : "—"}
                    </td>
                    <td style={{ padding: "10px", fontSize: 13, color: "var(--muted)" }}>
                      {formatDate(insc.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
