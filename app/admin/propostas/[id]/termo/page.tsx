"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TermoOutorgaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/propostas/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Erro ao carregar");
        setLoading(false);
      })
      .catch(() => setError("Falha de rede"));
  }, [params.id]);

  if (loading) return <div className="card"><p className="p">Carregando...</p></div>;
  if (error || !data) return <div className="card"><p className="p" style={{ color: "var(--bad)" }}>{error}</p></div>;

  async function confirmarAssinatura() {
    if (!confirm("Tem certeza que deseja marcar o Termo como Assinado? A proposta entrará em execução imediatamente.")) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/propostas/${params.id}/termo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlDocumento: null }), // MVP: mock upload
      });
      if (!res.ok) {
        alert("Erro ao confirmar assinatura");
        setIsSubmitting(false);
      } else {
        router.push(`/admin/propostas/${params.id}`);
      }
    } catch {
      alert("Falha de rede");
      setIsSubmitting(false);
    }
  }

  // Se já passou de HOMOLOGADA (e do termo emitido), só mostra o termo mas bloqueia a assinatura de novo
  const canSign = data.status === "HOMOLOGADA";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", background: "#fff", color: "#000", padding: "40px", borderRadius: 8, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
      {/* Botões Não-Imprimíveis para navegação interna */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }} className="no-print">
        <Link href={`/admin/propostas/${params.id}`} className="btn secondary" style={{ color: "var(--text)", borderColor: "var(--border)" }}>Voltar</Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn secondary" onClick={() => window.print()} style={{ color: "var(--text)", borderColor: "var(--border)" }}>🖨️ Imprimir PDF</button>
          
          {canSign && (
            <button className="btn" onClick={confirmarAssinatura} disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "✅ Marcar como Assinado e Iniciar Execução"}
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .printable-termo, .printable-termo * {
            visibility: visible;
          }
          .printable-termo {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm !important;
            font-size: 14pt !important;
            color: #000 !important;
            background: #fff !important;
            box-shadow: none !important;
          }
          .printable-termo p { margin-bottom: 12px; line-height: 1.5; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="printable-termo" style={{ fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", fontSize: 20, marginBottom: 20, textTransform: "uppercase" }}>
          PREFEITURA MUNICIPAL DE JABORANDI<br/>
          PROGRAMA MUNICIPAL DE INOVAÇÃO (PROINOVA)
        </h1>
        <h2 style={{ textAlign: "center", fontSize: 18, marginBottom: 40 }}>TERMO DE OUTORGA E COMPROMISSO</h2>

        <p>
          Pelo presente instrumento, a <strong>PREFEITURA MUNICIPAL DE JABORANDI</strong>, doravante denominada OUTORGANTE, 
          sob as regras do Programa Municipal de Inovação (ProInova), formaliza a concessão do apoio financeiro referente 
          ao Edital <strong>{data.edital.titulo}</strong> ({data.edital.modalidade}).
        </p>

        <p>
          O presente termo é firmado com o Proponente <strong>{data.proponente.nome}</strong>, inscrito no CPF sob o 
          nº <strong>{data.proponente.cpf}</strong>, e-mail {data.proponente.email}, doravante denominado(a) OUTORGADO(A), 
          que se compromete a executar o projeto intitulado:
        </p>

        <p style={{ margin: "20px 0", padding: "15px", background: "#f5f5f5", borderLeft: "4px solid #333", fontWeight: "bold" }}>
          Projeto: {data.titulo} <br/>
          Duração: {data.duracaoMeses} meses <br/>
          Protocolo Identificador: {data.id}
        </p>

        <h3 style={{ marginTop: 30, fontSize: 16, borderBottom: "1px solid #ccc", paddingBottom: 5 }}>1. DA EQUIPE E DO RATEIO DA BOLSA</h3>
        <p>O apoio financeiro, em formato de bolsa mensal, será repassado para a equipe de acordo com a tabela abaixo:</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: 8, textAlign: "left" }}>Nome</th>
              <th style={{ border: "1px solid #000", padding: 8, textAlign: "left" }}>CPF</th>
              <th style={{ border: "1px solid #000", padding: 8, textAlign: "center" }}>% Rateio</th>
            </tr>
          </thead>
          <tbody>
            {data.equipe.map((eq: any, i: number) => (
              <tr key={i}>
                <td style={{ border: "1px solid #000", padding: 8 }}>{eq.nome} {eq.ehMenor ? "(Menor)" : ""}</td>
                <td style={{ border: "1px solid #000", padding: 8 }}>{eq.cpf}</td>
                <td style={{ border: "1px solid #000", padding: 8, textAlign: "center" }}>{eq.percentualRateio}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.equipe.some((eq: any) => eq.ehMenor) && (
          <p style={{ fontSize: 13, fontStyle: "italic" }}>
            * Note-se que, para os membros menores de idade, a assinatura legal recai sobre seus respectivos Responsáveis conforme previamente listado na proposta e Termo de Anuência.
          </p>
        )}

        <h3 style={{ marginTop: 30, fontSize: 16, borderBottom: "1px solid #ccc", paddingBottom: 5 }}>2. DOS MARCOS MENSAIS (CRONOGRAMA)</h3>
        <p>O repasse dos pagamentos está estritamente condicionado à entrega e validação dos seguintes marcos mensais (Art. 13 §3):</p>
        <ul style={{ paddingLeft: 20 }}>
          {data.marcos.map((m: any) => (
            <li key={m.id} style={{ marginBottom: 10 }}>
               <strong>Mês {m.mes}:</strong> {m.entregavel} <br/>
               <span style={{ fontSize: 14 }}><em>Evidência exigida para o pagamento:</em> {m.evidenciaEsperada}</span>
            </li>
          ))}
        </ul>

        <h3 style={{ marginTop: 30, fontSize: 16, borderBottom: "1px solid #ccc", paddingBottom: 5 }}>3. PROPRIEDADE INTELECTUAL E SIGILO</h3>
        <p>
          Nos termos do Anexo II do ProInova, a propriedade intelectual dos códigos-fonte e materiais desenvolvidos durante a execução do 
          presente projeto pertencem exclusivamente ao MUNICÍPIO DE JABORANDI. O OUTORGADO compromete-se a manter total sigilo sobre os dados 
          pessoais eventualmente acessados durante as validações.
        </p>

        <p style={{ marginTop: 50, textAlign: "center" }}>
          Jaborandi/SP, ____ de ___________________ de 2026.
        </p>

        <div style={{ marginTop: 80, display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "45%", textAlign: "center", borderTop: "1px solid #000", paddingTop: 10 }}>
            <p><strong>REPRESENTANTE CMAA / PREFEITO</strong></p>
            <p>Prefeitura Municipal de Jaborandi</p>
          </div>
          <div style={{ width: "45%", textAlign: "center", borderTop: "1px solid #000", paddingTop: 10 }}>
             <p><strong>{data.proponente.nome.toUpperCase()}</strong></p>
             <p>Proponente / Outorgado Principal</p>
          </div>
        </div>

        {/* Assinaturas dos membros de equipe que não são proponentes puros etc */}
        {data.equipe.length > 1 && (
          <div style={{ marginTop: 60, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px" }} className="page-break">
            {data.equipe.slice(1).map((eq: any, i: number) => (
              <div key={i} style={{ width: "45%", textAlign: "center", borderTop: "1px solid #000", paddingTop: 10, marginBottom: 40 }}>
                <p><strong>{eq.ehMenor ? eq.responsavelLegal?.toUpperCase() : eq.nome.toUpperCase()}</strong></p>
                <p>{eq.ehMenor ? `Responsável Legal por ${eq.nome}` : "Membro da Equipe (Rateio da Bolsa)"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
