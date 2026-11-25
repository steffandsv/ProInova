"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, ErrorState, PageHeader, SearchInput, StatCard, normalize } from "@/app/components/ui";
import { CAPACIDADE_VISITANTES, EVENTO, VAGAS_PITCH_EXTRAS } from "@/constants/proinovaday";
import { reduzirImagem } from "@/app/proinovaday/ui/imagem";

type Visitante = { id: number; cpf: string; nome: string; whatsapp: string | null; municipe: boolean; listaEspera: boolean; origem: string | null; createdAt: string };
type Startup = {
  id: string; status: "PENDENTE" | "APROVADA" | "OCULTA"; nome: string; pitch: string; descricao: string; categoria: string; estagio: string | null;
  cidade: string | null; link: string | null; fotoUrl: string | null; responsavelNome: string | null; responsavelCpf: string | null; responsavelWhatsapp: string | null; createdAt: string;
};
type Vip = { id: string; nome: string; cargo: string; cidade: string | null; ordem: number; ativo: boolean; fotoUrl: string | null };
type Proinova = { propostaId: string; oculta: boolean; nome: string; categoria: string; pitch: string; fotoUrl: string | null; progresso: { validados: number; total: number } | null };
type Dados = { visitantes: Visitante[]; startups: Startup[]; vips: Vip[]; proinova: Proinova[] };

const ABAS = [
  { v: "visitantes", l: "Visitantes" },
  { v: "startups", l: "Startups inscritas" },
  { v: "proinova", l: "ProInova no tanque" },
  { v: "vips", l: "Convidados VIP" },
] as const;

const STATUS_LABEL = { PENDENTE: "Aguardando", APROVADA: "No site", OCULTA: "Oculta" };
const STATUS_COR = { PENDENTE: "var(--warn, #f59e0b)", APROVADA: "var(--good, #22c55e)", OCULTA: "var(--muted)" };

const fmtCpf = (c: string | null) => (c || "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
const fmtTel = (t: string | null) => (t ? t.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3") : "—");
const fmtData = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

async function acao(campos: Record<string, string | Blob>): Promise<string | null> {
  const fd = new FormData();
  Object.entries(campos).forEach(([k, v]) => (v instanceof Blob ? fd.set(k, v, "foto.jpg") : fd.set(k, v)));
  const res = await fetch("/api/admin/proinovaday", { method: "POST", body: fd });
  const j = await res.json().catch(() => ({}));
  return res.ok ? null : j.message || "Não foi possível salvar.";
}

function BotaoFoto({ onFoto, rotulo = "Trocar foto" }: { onFoto: (b: Blob) => void; rotulo?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button className="btn secondary" type="button" onClick={() => ref.current?.click()}>{rotulo}</button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) onFoto(await reduzirImagem(f, 900));
      }} />
    </>
  );
}

function Miniatura({ url, nome }: { url: string | null; nome: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={nome} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12, flex: "0 0 auto" }} />
  ) : (
    <div style={{ width: 64, height: 64, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,255,255,.06)", fontSize: 11, color: "var(--muted)", flex: "0 0 auto" }}>sem foto</div>
  );
}

function VipLinha({ v, onSalvo }: { v: Vip | null; onSalvo: (msg: string | null) => void }) {
  const [f, setF] = useState({ nome: v?.nome || "", cargo: v?.cargo || "", cidade: v?.cidade || "", ordem: String(v?.ordem ?? 99), ativo: v?.ativo ?? true });
  const [foto, setFoto] = useState<Blob | null>(null);
  const [salvando, setSalvando] = useState(false);
  const urlLocal = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);
  useEffect(() => () => { if (urlLocal) URL.revokeObjectURL(urlLocal); }, [urlLocal]);
  const previa = urlLocal || v?.fotoUrl || null;

  async function salvar() {
    setSalvando(true);
    const erro = await acao({ acao: "vip-salvar", id: v?.id || "", ...f, ordem: f.ordem, ativo: String(f.ativo), ...(foto ? { foto } : {}) });
    setSalvando(false);
    if (!erro && !v) {
      setF({ nome: "", cargo: "", cidade: "", ordem: "99", ativo: true });
      setFoto(null);
    }
    onSalvo(erro);
  }

  return (
    <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: 14 }}>
      <Miniatura url={previa} nome={f.nome} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, flex: "1 1 420px" }}>
        <input className="input" placeholder="Nome (ex.: Silvio Vaz)" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <input className="input" placeholder="Cargo (ex.: Prefeito)" value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} />
        <input className="input" placeholder="Cidade/Instituição" value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} />
        <input className="input" placeholder="Ordem" inputMode="numeric" value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value.replace(/\D/g, "") })} title="Ordem no carrossel" />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> No site
        </label>
        <BotaoFoto onFoto={setFoto} rotulo={previa ? "Trocar foto" : "Enviar foto"} />
        <button className="btn" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : v ? "Salvar" : "Adicionar"}</button>
        {v && (
          <button className="btn secondary" onClick={async () => { if (confirm(`Remover ${v.nome} da lista de convidados?`)) onSalvo(await acao({ acao: "vip-excluir", id: v.id })); }}>
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminProInovaDayPage() {
  const [aba, setAba] = useState<(typeof ABAS)[number]["v"]>("visitantes");
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const res = await fetch("/api/admin/proinovaday", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setDados(j);
      else setErro(j.message || "Não foi possível carregar.");
    } catch {
      setErro("Falha de rede ao carregar.");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function executar(p: Promise<string | null>, ok: string) {
    const e = await p;
    setAviso(e ? `⚠️ ${e}` : `✅ ${ok}`);
    await carregar();
    window.setTimeout(() => setAviso(""), 3500);
  }

  const v = dados?.visitantes || [];
  const pendentes = dados?.startups.filter((s) => s.status === "PENDENTE").length || 0;
  const filtrados = v.filter((x) => normalize(x.nome).includes(normalize(busca)) || x.cpf.includes(busca.replace(/\D/g, "") || "#"));

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader
          title="ProInova Day Jaborandi"
          subtitle={`${EVENTO.dataExtenso}, às ${EVENTO.hora}, no ${EVENTO.localNome}.`}
          actions={
            <>
              <a className="btn secondary" href="/proinovaday" target="_blank" rel="noopener noreferrer">Ver página do evento ↗</a>
              <a className="btn" href="/api/admin/proinovaday/csv">Exportar visitantes (Excel)</a>
            </>
          }
        />

        {erro && <ErrorState message={erro} onRetry={carregar} />}
        {aviso && <div className="badge" style={{ marginBottom: 12, padding: "10px 14px" }}>{aviso}</div>}

        {dados && (
          <>
            <div className="stats-grid" style={{ marginBottom: 14 }}>
              <StatCard value={`${v.length} / ${CAPACIDADE_VISITANTES}`} label="Visitantes inscritos" />
              <StatCard value={v.filter((x) => x.municipe).length} label="De Jaborandi (cadastro municipal)" />
              <StatCard value={v.filter((x) => x.listaEspera).length} label="Na lista de espera" />
              <StatCard value={pendentes} label={`Startups aguardando aprovação (vagas: ${VAGAS_PITCH_EXTRAS})`} color={pendentes ? "#f59e0b" : undefined} />
            </div>

            <div className="filter-chips" style={{ marginBottom: 14 }}>
              {ABAS.map((a) => (
                <button key={a.v} className={`btn chip ${aba === a.v ? "is-active" : ""}`} onClick={() => setAba(a.v)}>
                  {a.l}
                  {a.v === "startups" && pendentes > 0 ? ` (${pendentes})` : ""}
                </button>
              ))}
            </div>

            {aba === "visitantes" && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome ou CPF..." />
                </div>
                {filtrados.length === 0 ? (
                  <EmptyState>{v.length === 0 ? "Ninguém se inscreveu ainda." : "Nenhum visitante com essa busca."}</EmptyState>
                ) : (
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr><th>Ingresso</th><th>Nome</th><th>CPF</th><th>WhatsApp</th><th>Origem</th><th>Inscrição</th></tr>
                      </thead>
                      <tbody>
                        {filtrados.map((x) => (
                          <tr key={x.id}>
                            <td style={{ fontFamily: "monospace" }}>#{String(x.id).padStart(4, "0")}</td>
                            <td>
                              <strong>{x.nome}</strong>
                              <div className="sub" style={{ fontSize: 12 }}>
                                {x.municipe ? "De Jaborandi" : "De fora"}{x.listaEspera ? " · lista de espera" : ""}
                              </div>
                            </td>
                            <td style={{ fontFamily: "monospace", fontSize: 13 }}>{fmtCpf(x.cpf)}</td>
                            <td>{x.whatsapp ? <a href={`https://wa.me/55${x.whatsapp}`} target="_blank" rel="noopener noreferrer">{fmtTel(x.whatsapp)}</a> : "—"}</td>
                            <td className="sub">{x.origem || "—"}</td>
                            <td className="sub" style={{ fontSize: 13 }}>{fmtData(x.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {aba === "startups" && (
              <div className="grid" style={{ gap: 10 }}>
                <p className="sub" style={{ margin: 0 }}>Startups cadastradas pelo site. Só aparecem em &quot;Conheça as Startups&quot; depois de aprovadas aqui.</p>
                {dados.startups.length === 0 && <EmptyState>Nenhuma startup se inscreveu ainda.</EmptyState>}
                {dados.startups.map((s) => (
                  <div key={s.id} className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", padding: 16 }}>
                    <Miniatura url={s.fotoUrl} nome={s.nome} />
                    <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 17 }}>{s.nome}</strong>
                        <span className="badge" style={{ color: STATUS_COR[s.status] }}>{STATUS_LABEL[s.status]}</span>
                        <span className="badge">{s.categoria}</span>
                        {s.estagio && <span className="badge">{s.estagio}</span>}
                      </div>
                      <p style={{ margin: "6px 0", fontWeight: 600 }}>{s.pitch}</p>
                      <p className="sub" style={{ margin: "0 0 8px", whiteSpace: "pre-line" }}>{s.descricao}</p>
                      <div className="sub" style={{ fontSize: 13 }}>
                        {s.responsavelNome} · CPF {fmtCpf(s.responsavelCpf)} ·{" "}
                        {s.responsavelWhatsapp && <a href={`https://wa.me/55${s.responsavelWhatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp {fmtTel(s.responsavelWhatsapp)}</a>}
                        {s.cidade ? ` · ${s.cidade}` : ""}
                        {s.link ? <> · <a href={s.link} target="_blank" rel="noopener noreferrer nofollow">{s.link}</a></> : null} · {fmtData(s.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {s.status !== "APROVADA" && <button className="btn" onClick={() => executar(acao({ acao: "startup-status", id: s.id, status: "APROVADA" }), `${s.nome} aprovada e já está no site.`)}>Aprovar</button>}
                      {s.status !== "OCULTA" && <button className="btn secondary" onClick={() => executar(acao({ acao: "startup-status", id: s.id, status: "OCULTA" }), `${s.nome} ocultada.`)}>Ocultar</button>}
                      <button className="btn secondary" onClick={() => confirm(`Excluir definitivamente "${s.nome}"?`) && executar(acao({ acao: "startup-excluir", id: s.id }), "Startup excluída.")}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === "proinova" && (
              <div className="grid" style={{ gap: 10 }}>
                <p className="sub" style={{ margin: 0 }}>
                  Entram automaticamente os projetos homologados com pelo menos uma entrega validada. Aqui você pode colocar uma foto (do time ou do produto) e esconder algum projeto da vitrine.
                </p>
                {dados.proinova.map((p) => (
                  <div key={p.propostaId} className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: 14, opacity: p.oculta ? 0.55 : 1 }}>
                    <Miniatura url={p.fotoUrl} nome={p.nome} />
                    <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                      <strong>{p.nome}</strong>{" "}
                      <span className="badge">{p.categoria}</span>{" "}
                      {p.progresso && <span className="badge">{p.progresso.validados}/{p.progresso.total} entregas</span>}{" "}
                      {p.oculta && <span className="badge">Oculto</span>}
                      <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>{p.pitch}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <BotaoFoto rotulo={p.fotoUrl ? "Trocar foto" : "Enviar foto"} onFoto={(foto) => executar(acao({ acao: "proinova-foto", propostaId: p.propostaId, foto }), `Foto de ${p.nome} atualizada.`)} />
                      {p.fotoUrl && <button className="btn secondary" onClick={() => executar(acao({ acao: "proinova-foto", propostaId: p.propostaId, remover: "true" }), "Foto removida.")}>Usar arte automática</button>}
                      <button className="btn secondary" onClick={() => executar(acao({ acao: "proinova-visivel", propostaId: p.propostaId, visivel: String(p.oculta) }), p.oculta ? `${p.nome} voltou ao site.` : `${p.nome} escondido do site.`)}>
                        {p.oculta ? "Mostrar no site" : "Esconder do site"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aba === "vips" && (
              <div className="grid" style={{ gap: 10 }}>
                <p className="sub" style={{ margin: 0 }}>
                  Os &quot;tubarões&quot; do carrossel. Use fotos de rosto (retrato); a ordem define a posição no carrossel. Depois da lista, o site mostra um card &quot;Mais tubarões — revelação em breve&quot;.
                </p>
                {dados.vips.map((x) => (
                  <VipLinha key={`${x.id}-${x.fotoUrl}`} v={x} onSalvo={(e) => executar(Promise.resolve(e), "Convidado salvo.")} />
                ))}
                <strong style={{ marginTop: 8 }}>Adicionar convidado</strong>
                <VipLinha v={null} onSalvo={(e) => executar(Promise.resolve(e), "Convidado adicionado.")} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
