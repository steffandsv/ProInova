"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { roleLabelMap } from "@/constants/status";
import { formatCPF } from "@/lib/cpf";
import { useUrlState } from "@/app/hooks/useUrlState";
import { EmptyState, ErrorState, FilterChips, FilterGroup, Filters, PageHeader, SearchInput, Spinner, normalize } from "@/app/components/ui";
import { ListPageSkeleton, TableSkeleton, type SkeletonColumn } from "@/app/components/Skeletons";
import Modal from "@/app/components/Modal";

type Usuario = {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  role: string;
  createdAt: string;
  mustChangePassword: boolean;
};

const perfilOptions = [
  { value: "ALL", label: "✨ Todos" },
  { value: "PROPONENTE", label: "🙋 Proponentes" },
  { value: "INTERNO", label: "🏛️ Equipe interna" },
];

const columns: SkeletonColumn[] = [
  { label: "Nome", width: "34%", cell: "two" },
  { label: "Perfil", width: "14%", cell: "short" },
  { label: "Situação", width: "18%", cell: "badge" },
  { label: "Criado em", width: "14%", cell: "short" },
  { label: "Ações", width: "20%", align: "right", cell: "button" },
];

export default function AdminUsuariosPage() {
  return (
    <Suspense fallback={<ListPageSkeleton columns={columns} chips={3} />}>
      <AdminUsuariosInner />
    </Suspense>
  );
}

function AdminUsuariosInner() {
  const [perfil, setPerfil] = useUrlState("perfil", "ALL");
  const [busca, setBusca] = useUrlState("q");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [redefinindo, setRedefinindo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ nome: string; senha: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/usuarios");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) setUsuarios(json.data);
      else setErro(json.message || "Não foi possível carregar os usuários.");
    } catch {
      setErro("Falha de rede ao carregar os usuários.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function redefinir(u: Usuario) {
    if (!confirm(`Gerar uma senha provisória para ${u.nome}?\n\nA senha atual deixa de funcionar e a pessoa precisará criar uma nova no próximo login.`)) return;
    setRedefinindo(u.id);
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}/redefinir-senha`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.message || "Não foi possível redefinir a senha.");
        return;
      }
      setCopiado(false);
      setResultado({ nome: json.nome, senha: json.senhaProvisoria });
      setUsuarios((lista) => lista.map((x) => (x.id === u.id ? { ...x, mustChangePassword: true } : x)));
    } catch {
      alert("Falha de rede ao redefinir a senha.");
    } finally {
      setRedefinindo(null);
    }
  }

  async function copiar() {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.senha);
      setCopiado(true);
    } catch {
      alert("Não foi possível copiar. Selecione a senha e copie manualmente.");
    }
  }

  const termo = normalize(busca);
  const termoCpf = busca.replace(/\D+/g, "");
  const filtrados = usuarios.filter((u) => {
    if (perfil === "PROPONENTE" && u.role !== "PROPONENTE") return false;
    if (perfil === "INTERNO" && u.role === "PROPONENTE") return false;
    if (!termo) return true;
    return normalize(u.nome).includes(termo) || (termoCpf.length > 0 && u.cpf.includes(termoCpf));
  });

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <PageHeader title="Usuários" subtitle="Contas da plataforma. Redefina a senha de quem não consegue entrar: a pessoa recebe uma senha provisória e cria a própria no próximo login." />

        <Filters>
          <FilterGroup label="Filtrar por Perfil">
            <FilterChips options={perfilOptions} value={perfil} onChange={(v) => setPerfil(v)} />
          </FilterGroup>
          <FilterGroup label="Buscar por Nome ou CPF">
            <SearchInput value={busca} onChange={(v) => setBusca(v, { replace: true })} placeholder="Digite o nome ou o CPF..." />
          </FilterGroup>
        </Filters>

        {erro && <ErrorState message={erro} onRetry={carregar} />}

        {loading ? (
          <TableSkeleton columns={columns} />
        ) : erro ? null : filtrados.length === 0 ? (
          <EmptyState>Nenhum usuário encontrado com esses filtros.</EmptyState>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perfil</th>
                  <th>Situação</th>
                  <th>Criado em</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nome}</strong><br />
                      <span className="sub">{formatCPF(u.cpf)}{u.email ? ` · ${u.email}` : ""}</span>
                    </td>
                    <td><span className="badge">{roleLabelMap[u.role] || u.role}</span></td>
                    <td>
                      {u.mustChangePassword ? (
                        <span className="badge" style={{ borderColor: "rgba(245,158,11,0.5)", color: "var(--warn)" }}>Senha provisória</span>
                      ) : (
                        <span className="sub">Senha própria</span>
                      )}
                    </td>
                    <td className="sub" style={{ fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="num">
                      <button type="button" className="btn secondary chip" onClick={() => redefinir(u)} disabled={redefinindo !== null}>
                        {redefinindo === u.id ? <><Spinner /> Gerando...</> : "Redefinir senha"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resultado && (
        <Modal
          title="Senha provisória gerada"
          subtitle={`Para ${resultado.nome}`}
          onClose={() => setResultado(null)}
          width={520}
          footer={
            <>
              <span className="sub" style={{ fontSize: 12, color: "var(--muted)" }}>Esta senha não será mostrada de novo.</span>
              <button type="button" className="btn" onClick={() => setResultado(null)}>Concluir</button>
            </>
          }
        >
          <p className="p" style={{ margin: 0 }}>Passe esta senha para a pessoa. No primeiro login, ela precisará criar a própria senha antes de continuar.</p>
          <div className="senha-provisoria">
            <span>{resultado.senha}</span>
            <button type="button" className="btn secondary chip" onClick={copiar}>
              {copiado ? "Copiada ✓" : "Copiar"}
            </button>
          </div>
          <div className="aviso-info">Envie por um canal privado (pessoalmente ou mensagem direta). A senha antiga já não funciona.</div>
        </Modal>
      )}
    </div>
  );
}
