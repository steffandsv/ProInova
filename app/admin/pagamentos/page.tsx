"use client";

import { useEffect, useState } from "react";

export default function AdminPagamentosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pagamentos")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p className="p">Carregando dados de pagamento...</p></div>;
  if (!data) return <div className="card"><p className="p">Erro ao carregar dados.</p></div>;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="h1">Gestão de Pagamentos</h1>
          <a href="/api/admin/pagamentos?format=csv" className="btn secondary" download>
            📥 Exportar CSV (Lote Financeiro)
          </a>
        </div>
      </div>

      <div className="grid two" style={{ gap: 14 }}>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--accent)" }}>{data.totalMarcos}</div>
          <div className="p" style={{ margin: 0 }}>Marcos Validados (Aptos)</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--good)" }}>
            R$ {data.valorTotal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="p" style={{ margin: 0 }}>Valor Total Elegível</div>
        </div>
      </div>

      {data.data?.length === 0 ? (
        <div className="card"><p className="p">Nenhum marco validado pendente de pagamento.</p></div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Proposta</th>
                <th style={{ padding: 10, textAlign: "center" }}>Mês</th>
                <th style={{ padding: 10, textAlign: "left" }}>Entregável</th>
                <th style={{ padding: 10, textAlign: "center" }}>Modalidade</th>
                <th style={{ padding: 10, textAlign: "right" }}>Valor Mensal (R$)</th>
                <th style={{ padding: 10, textAlign: "center" }}>Validado Em</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item: any) => (
                <tr key={item.marcoId} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 10 }}>
                    <strong>{item.propostaTitulo}</strong><br />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.proponente} ({item.cpfProponente})</span>
                  </td>
                  <td style={{ padding: 10, textAlign: "center" }}>{item.mes}</td>
                  <td style={{ padding: 10 }}>{item.entregavel}</td>
                  <td style={{ padding: 10, textAlign: "center" }}><span className="badge">{item.modalidade}</span></td>
                  <td style={{ padding: 10, textAlign: "right", fontWeight: "bold" }}>
                    {item.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 10, textAlign: "center", fontSize: 12 }}>
                    {item.validadoEm ? new Date(item.validadoEm).toLocaleDateString("pt-BR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                <td colSpan={4} style={{ padding: 14, textAlign: "right", fontWeight: "bold" }}>Total:</td>
                <td style={{ padding: 14, textAlign: "right", fontWeight: "bold", fontSize: 15, color: "var(--good)" }}>
                  R$ {data.valorTotal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Detalhamento do rateio por membro */}
          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold", fontSize: 14, padding: 10 }}>
              📋 Ver Detalhamento do Rateio por Membro
            </summary>
            <table className="table" style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 10 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: 8, textAlign: "left" }}>Proposta</th>
                  <th style={{ padding: 8, textAlign: "center" }}>Mês</th>
                  <th style={{ padding: 8, textAlign: "left" }}>Membro</th>
                  <th style={{ padding: 8, textAlign: "left" }}>CPF</th>
                  <th style={{ padding: 8, textAlign: "center" }}>% Rateio</th>
                  <th style={{ padding: 8, textAlign: "right" }}>Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {data.data.flatMap((item: any) =>
                  item.rateio.map((r: any, idx: number) => (
                    <tr key={`${item.marcoId}-${idx}`} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: 8 }}>{item.propostaTitulo}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>{item.mes}</td>
                      <td style={{ padding: 8 }}>{r.nome}</td>
                      <td style={{ padding: 8 }}>{r.cpf}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>{r.percentual}%</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{r.valor.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </div>
  );
}
