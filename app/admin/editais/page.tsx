"use client";

import { useEffect, useState } from "react";
import type { EditalStatus, Modalidade } from "@prisma/client";

type Edital = {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: Modalidade;
  status: EditalStatus;
  abreEm: string;
  fechaEm: string;
};

export default function EditaisListPage() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/editais")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setEditais(res.data);
        else setMsg(res.message);
        setLoading(false);
      })
      .catch(() => {
        setMsg("Erro de rede.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="card"><p className="p">Carregando...</p></div>;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="h1">Editais</h1>
            <p className="p" style={{ margin: 0 }}>Gestão dos editais de fomento à inovação.</p>
          </div>
          <a href="/admin/editais/novo" className="btn">Novo Edital</a>
        </div>
      </div>

      {msg && <div className="card"><p className="p" style={{ color: "var(--bad)", margin: 0 }}>{msg}</p></div>}

      <div className="grid two">
        {editais.map((edital) => (
          <div key={edital.id} className="card">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div className="badge">
                <strong>{edital.status}</strong>
              </div>
              <div className="badge">
                <strong>{edital.modalidade}</strong>
              </div>
            </div>
            <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>{edital.titulo}</h2>
            <p className="p" style={{ fontSize: 13, marginBottom: 12 }}>
              Abre: {new Date(edital.abreEm).toLocaleDateString()} • Fecha: {new Date(edital.fechaEm).toLocaleDateString()}
            </p>
            <a href={`/admin/editais/${edital.id}`} className="btn secondary" style={{ padding: "8px 12px", fontSize: 13 }}>
              Editar
            </a>
          </div>
        ))}

        {editais.length === 0 && !msg && (
          <p className="p">Nenhum edital cadastrado.</p>
        )}
      </div>
    </div>
  );
}
