import PDFDocument from "pdfkit";
import path from "path";
import { INSTITUCIONAL_CONFIG } from "@/constants/institucional";

interface MemberData {
  nome: string;
  cpf: string;
  percentual: number;
  valor: number;
}

interface ReceiptData {
  projetoNome: string;
  mes: number;
  nota: number;
  valorMensalTotal: number;
  validadoEm: Date | null;
  createdAt: Date;
  participantes: MemberData[];
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Generates a monthly receipt PDF.
 * If the proposal has multiple participants in its team, it generates a multi-page PDF
 * with one individual receipt page for each participant.
 */
export async function generateReceiptPdf(data: ReceiptData, absoluteLeiUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Recibo Mensal - Mês ${data.mes} - ${data.projetoNome}`,
          Author: INSTITUCIONAL_CONFIG.nome,
          Subject: "Programa ProInova Jaborandi",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // If no team members exist (fallback), treat proponente as sole participant
      const members = data.participantes.length > 0
        ? data.participantes
        : [
            {
              nome: "Proponente Responsável",
              cpf: "—",
              percentual: 100,
              valor: data.valorMensalTotal,
            },
          ];

      members.forEach((member, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // ─── 1. HEADER (Brasão + Dados Institucionais) ───
        
        // Renderizar o Brasão Oficial da Prefeitura Municipal de Jaborandi
        const brasaoPath = path.join(process.cwd(), "public", "brasao.png");
        try {
          doc.image(brasaoPath, doc.page.width / 2 - 25, 45, { width: 50 });
        } catch (imgError) {
          console.error("[ReceiptPDF] Error loading brasao image:", imgError);
          // Fallback visual se a imagem não for encontrada
          doc.font("Helvetica-Bold")
             .fontSize(10)
             .fillColor("#7c5cff")
             .text("[ BRASÃO OFICIAL ]", 50, 60, { align: "center" });
        }

        // Textos Institucionais
        doc.font("Helvetica-Bold")
           .fontSize(13)
           .fillColor("#1a1a1a")
           .text(INSTITUCIONAL_CONFIG.nome, 50, 115, { align: "center" });

        doc.font("Helvetica")
           .fontSize(8)
           .fillColor("#666666")
           .text(`CNPJ: ${INSTITUCIONAL_CONFIG.cnpj}  |  Endereço: ${INSTITUCIONAL_CONFIG.endereco}`, 50, 132, { align: "center" })
           .text(`Telefone: ${INSTITUCIONAL_CONFIG.telefone}  |  E-mail: contato@jaborandi.sp.gov.br`, 50, 144, { align: "center" });

        // Linha divisória horizontal
        doc.moveTo(50, 160)
           .lineTo(doc.page.width - 50, 160)
           .lineWidth(1)
           .strokeOpacity(0.15)
           .stroke("#7c5cff");

        // ─── 2. TÍTULO DO DOCUMENTO ───
        doc.font("Helvetica-Bold")
           .fontSize(14)
           .fillColor("#7c5cff")
           .text("RECIBO MENSAL DE PAGAMENTO E PRESTAÇÃO DE CONTAS", 50, 185, { align: "center" });

        doc.font("Helvetica")
           .fontSize(9)
           .fillColor("#666666")
           .text("PROGRAMA DE FOMENTO À INOVAÇÃO PÚBLICA — PROINOVA JABORANDI", 50, 203, { align: "center" });

        // ─── 3. TABELA VERTICAL DE DADOS ───
        const tableYStart = 230;
        const rowHeight = 26;
        
        // Mês Referência por extenso
        const dateRef = data.validadoEm || data.createdAt || new Date();
        const mesNome = MONTHS_PT[dateRef.getMonth()];
        const ano = dateRef.getFullYear();
        const mesReferencia = `${mesNome}/${ano} (Mês ${data.mes})`;

        const rows = [
          { label: "Nome do Projeto", value: data.projetoNome },
          { label: "Participante Beneficiário", value: `${member.nome} (CPF: ${member.cpf})` },
          { label: "Mês Referência", value: mesReferencia },
          { label: "Avaliação da Entrega", value: `Nota: ${data.nota.toFixed(1)} (Multiplicador: ${(data.nota / 10).toFixed(2)})` },
          { 
            label: "Valor Calculado", 
            value: `R$ ${member.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${member.percentual}% de R$ ${data.valorMensalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` 
          },
        ];

        rows.forEach((row, rIndex) => {
          const currentY = tableYStart + rIndex * rowHeight;

          // Zebra striping de fundo
          if (rIndex % 2 === 0) {
            doc.rect(50, currentY - 4, doc.page.width - 100, rowHeight)
               .fillOpacity(0.02)
               .fill("#7c5cff");
          }

          // Label
          doc.font("Helvetica-Bold")
             .fontSize(9)
             .fillOpacity(1)
             .fillColor("#444444")
             .text(row.label, 65, currentY + 4, { width: 150 });

          // Valor
          doc.font("Helvetica")
             .fontSize(9)
             .fillColor("#111111")
             .text(row.value, 215, currentY + 4, { width: 330 });

          // Linha divisória da linha
          doc.moveTo(50, currentY + rowHeight - 4)
             .lineTo(doc.page.width - 50, currentY + rowHeight - 4)
             .lineWidth(0.5)
             .strokeOpacity(0.1)
             .stroke("#7c5cff");
        });

        // ─── 4. SEÇÃO OFICIAL (TEXTO DE SOLICITAÇÃO) ───
        const textY = tableYStart + rows.length * rowHeight + 35;
        const valorFormatado = member.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        doc.rect(50, textY - 15, doc.page.width - 100, 75)
           .fillOpacity(0.01)
           .fill("#7c5cff");
        doc.rect(50, textY - 15, doc.page.width - 100, 75)
           .lineWidth(0.5)
           .strokeOpacity(0.12)
           .stroke("#7c5cff");

        doc.font("Helvetica")
           .fontSize(9.5)
           .fillOpacity(1)
           .fillColor("#2d3748")
           .text("Solicito ao setor de contabilidade que seja empenhado o valor de ", 65, textY, { continued: true, lineGap: 6 });
        
        doc.font("Helvetica-Bold")
           .text(`R$ ${valorFormatado}`, { continued: true });
        
        doc.font("Helvetica")
           .text(" para pagamento referente ao participante ", { continued: true });

        doc.font("Helvetica-Bold")
           .text(member.nome, { continued: true });

        doc.font("Helvetica")
           .text(", conforme disposições da ", { continued: true });

        doc.font("Helvetica-Bold")
           .fillColor("#7c5cff")
           .text("Lei Municipal nº 2.741/2026 - Programa ProInova", { link: absoluteLeiUrl, underline: true, continued: true });

        doc.font("Helvetica")
           .fillColor("#2d3748")
           .text(".");

        // ─── 5. ÁREA DE ASSINATURA ───
        const signatureY = doc.page.height - 130;

        doc.moveTo(doc.page.width / 2 - 130, signatureY)
           .lineTo(doc.page.width / 2 + 130, signatureY)
           .lineWidth(0.75)
           .strokeOpacity(0.3)
           .stroke("#000000");

        doc.font("Helvetica-Bold")
           .fontSize(9.5)
           .fillColor("#2d3748")
           .text("Steffan Diorgy Silva Vernillo", 50, signatureY + 8, { align: "center" });

        doc.font("Helvetica")
           .fontSize(8.5)
           .fillColor("#4a5568")
           .text("Secretário de Comunicação e Governo Digital", 50, signatureY + 20, { align: "center" })
           .fontSize(8)
           .fillColor("#718096")
           .text("Programa ProInova Jaborandi-SP", 50, signatureY + 32, { align: "center" });
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
