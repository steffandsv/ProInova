"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/app/components/Modal";
import { EmptyState, ErrorState, Spinner } from "@/app/components/ui";
import { LinesSkeleton } from "@/app/components/Skeletons";

type Entrega = {
  propostaId: string;
  titulo: string;
  status: string;
  proponente: string;
  integrantes: number;
  marco: { id: string; mes: number; nota: number; validadoEm: string | null };
  valor: number;
  baixado: { em: string; por: string | null; vezes: number } | null;
};

const reais = (valor: number) => valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

export default function ModalRecibos({ onClose }: { onClose: () => void }) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState(false);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (manterSelecao = false) => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/recibos");
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setErro(json.message || "Não foi possível carregar as entregas.");
      } else {
        setEntregas(json.data);
        // Na primeira carga, já vêm marcadas as entregas cujo recibo ainda não foi baixado
        if (!manterSelecao) setSelecionados(new Set(json.data.filter((e: Entrega) => !e.baixado).map((e: Entrega) => e.marco.id)));
      }
    } catch {
      setErro("Falha de rede ao carregar as entregas.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const novas = useMemo(() => entregas.filter((e) => !e.baixado), [entregas]);
  const totalSelecionado = useMemo(
    () => entregas.filter((e) => selecionados.has(e.marco.id)).reduce((acc, e) => acc + e.valor, 0),
    [entregas, selecionados]
  );
  const rebaixando = entregas.filter((e) => e.baixado && selecionados.has(e.marco.id)).length;

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function baixar() {
    if (selecionados.size === 0) return;
    setBaixando(true);
    setErro("");
    setAviso("");
    try {
      const res = await fetch("/api/admin/recibos/lote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marcoIds: [...selecionados] }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.message || "Não foi possível gerar os recibos.");
        return;
      }
      const blob = await res.blob();
      const nome = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] || "recibos.zip";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const quantidade = selecionados.size;
      setAviso(`${quantidade} ${quantidade === 1 ? "recibo baixado" : "recibos baixados"} em ${nome}.`);
      setSelecionados(new Set());
      await carregar(true);
    } catch {
      setErro("Falha de rede ao gerar os recibos.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <Modal
      title="Recibos das últimas entregas"
      subtitle="Última entrega validada de cada projeto homologado. As que ainda não tiveram recibo baixado já vêm marcadas; as já baixadas podem ser baixadas de novo."
      onClose={onClose}
      width={760}
      footer={
        <>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {selecionados.size === 0
              ? "Nenhuma entrega selecionada"
              : `${selecionados.size} selecionada(s) · R$ ${reais(totalSelecionado)}${rebaixando ? ` · ${rebaixando} já baixada(s)` : ""}`}
          </span>
          <button type="button" className="btn" onClick={baixar} disabled={baixando || selecionados.size === 0}>
            {baixando ? <><Spinner /> Gerando ZIP...</> : `📥 Baixar ${selecionados.size || ""} ${selecionados.size === 1 ? "recibo" : "recibos"} (ZIP)`}
          </button>
        </>
      }
    >
      {aviso && <div className="aviso-info" style={{ marginBottom: 14, borderColor: "rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.08)" }}>✅ {aviso}</div>}
      {erro && <ErrorState message={erro} onRetry={entregas.length === 0 ? () => carregar() : undefined} />}

      {loading && entregas.length === 0 ? (
        <LinesSkeleton blocks={3} />
      ) : entregas.length === 0 && !erro ? (
        <EmptyState>Nenhum projeto homologado tem entrega validada ainda.</EmptyState>
      ) : (
        <>
          <div className="filter-chips" style={{ marginBottom: 12 }}>
            <button type="button" className="btn secondary chip" onClick={() => setSelecionados(new Set(novas.map((e) => e.marco.id)))}>
              Só as não baixadas ({novas.length})
            </button>
            <button type="button" className="btn secondary chip" onClick={() => setSelecionados(new Set(entregas.map((e) => e.marco.id)))}>
              Todas ({entregas.length})
            </button>
            <button type="button" className="btn secondary chip" onClick={() => setSelecionados(new Set())}>
              Limpar
            </button>
          </div>

          <div className="recibo-lista">
            {entregas.map((e) => {
              const marcado = selecionados.has(e.marco.id);
              return (
                <label key={e.marco.id} className={`recibo-item${marcado ? " is-selected" : ""}${e.baixado ? " is-baixado" : ""}`}>
                  <input type="checkbox" checked={marcado} onChange={() => alternar(e.marco.id)} />
                  <div style={{ minWidth: 0 }}>
                    <div className="recibo-item-titulo">{e.titulo}</div>
                    <div className="recibo-item-meta">
                      {e.proponente} · Mês {e.marco.mes} · validado em {data(e.marco.validadoEm)} · {e.integrantes} {e.integrantes === 1 ? "integrante" : "integrantes"}
                    </div>
                  </div>
                  <div className="recibo-item-fim">
                    <strong style={{ fontSize: 14 }}>R$ {reais(e.valor)}</strong>
                    {e.baixado ? (
                      <span className="badge recibo-baixado" title={e.baixado.por ? `Último download por ${e.baixado.por}` : undefined}>
                        ✓ Baixado em {data(e.baixado.em)}{e.baixado.vezes > 1 ? ` (${e.baixado.vezes}x)` : ""}
                      </span>
                    ) : (
                      <span className="badge recibo-novo">Novo</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
