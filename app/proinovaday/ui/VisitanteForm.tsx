"use client";

import { useRef, useState } from "react";
import { EVENTO } from "@/constants/proinovaday";
import CamposContato, { CONTATO_INICIAL, contatoCompleto, contatoParaEnvio, type Contato } from "./Contato";
import CommitBox, { explodirConfete } from "./CommitBox";
import Ticket from "./Ticket";
import Agenda from "./Agenda";
import { IconArrow, IconTicket } from "./Icons";
import { vibrar } from "./hooks";

type Resultado = { numero: number; nome: string; primeiroNome: string; listaEspera: boolean; jaInscrito: boolean };

export default function VisitanteForm({ vagasRestantes, onInscrito }: { vagasRestantes: number; onInscrito: () => void }) {
  const [contato, setContato] = useState<Contato>(CONTATO_INICIAL);
  const [compromisso, setCompromisso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState<Resultado | null>(null);
  const [website, setWebsite] = useState("");
  const sucessoRef = useRef<HTMLDivElement>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!contatoCompleto(contato) || !compromisso || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const origem = new URLSearchParams(window.location.search).get("ref") || undefined;
      const res = await fetch("/api/proinovaday/visitante", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...contatoParaEnvio(contato), compromisso, origem, website }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setErro(j.message || "Não foi possível confirmar agora.");
        vibrar([30, 30, 30]);
        return;
      }
      setOk(j);
      onInscrito();
      vibrar([20, 60, 20, 60, 40]);
      window.setTimeout(() => explodirConfete(sucessoRef.current, true), 250);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (ok) {
    return (
      <div className="st-form st-form--done" ref={sucessoRef}>
        <span className="st-eyebrow" data-sheet-in>{ok.jaInscrito ? "Você já estava no tanque" : ok.listaEspera ? "Lista de espera" : "Lugar garantido"}</span>
        <h2 className="st-form-title" data-sheet-in>
          {ok.listaEspera ? <>Quase lá, {ok.primeiroNome}!</> : <>Nos vemos no tanque, <em>{ok.primeiroNome}</em>!</>}
        </h2>
        <p className="st-form-sub" data-sheet-in>
          {ok.listaEspera
            ? "O auditório lotou, mas você está na lista de espera. Se abrir lugar, a organização chama pelo WhatsApp."
            : `${EVENTO.dataExtenso}, às ${EVENTO.hora}, no ${EVENTO.localNome}. Chegue uns minutinhos antes!`}
        </p>
        <Ticket numero={ok.numero} nome={ok.nome} listaEspera={ok.listaEspera} />
        <Agenda textoConvite={`Vou no ProInova Day Jaborandi 🦈 dia 28/11, às 9h, no C.TECH! Prefeitos da região, Sebrae e as startups de Jaborandi ao vivo. É grátis, garanta seu lugar:`} />
      </div>
    );
  }

  const pronto = contatoCompleto(contato) && compromisso;
  const jaInscrito = contato.status === "ok" && contato.jaInscrito;

  return (
    <form className="st-form" onSubmit={enviar} noValidate>
      <span className="st-eyebrow" data-sheet-in><IconTicket size={14} /> Visitante · gratuito</span>
      <h2 className="st-form-title" data-sheet-in>Garanta seu lugar <em>no tanque.</em></h2>
      <p className="st-form-sub" data-sheet-in>
        Só o CPF. Se você é de Jaborandi, a gente preenche o resto.
        {vagasRestantes > 0 && vagasRestantes <= 60 && <strong> Restam {vagasRestantes} lugares.</strong>}
      </p>

      <div data-sheet-in>
        <CamposContato valor={contato} onChange={setContato} autoFocus />
      </div>

      <input className="st-hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden name="website" />

      {jaInscrito ? (
        <div className="st-already">
          <p>Você já garantiu seu lugar, <strong>{contato.primeiroNome}</strong>! 🎉</p>
          <button
            type="button"
            className="st-submit"
            onClick={() => setOk({ numero: contato.numero!, nome: contato.nome, primeiroNome: contato.primeiroNome || "", listaEspera: false, jaInscrito: true })}
          >
            Ver meu ingresso <IconArrow size={18} />
          </button>
        </div>
      ) : (
        contato.status === "ok" && (
          <div className="st-form-tail">
            <CommitBox
              marcado={compromisso}
              onChange={setCompromisso}
              titulo="Eu me comprometo a estar presente"
              detalhe={`${EVENTO.dataExtenso.replace(" de 2026", "")}, às ${EVENTO.hora}, no ${EVENTO.local}.`}
            />
            {erro && <p className="st-form-err" role="alert">{erro}</p>}
            <button className={`st-submit ${pronto ? "is-ready" : ""}`} disabled={!pronto || enviando}>
              {enviando ? <span className="st-spinner" /> : <>Confirmar minha presença <IconArrow size={18} /></>}
            </button>
            {!pronto && <p className="st-form-hint">{contatoCompleto(contato) ? "Marque o compromisso para liberar o botão." : "Confira seu nome e WhatsApp."}</p>}
          </div>
        )
      )}
      <p className="st-form-lgpd">Seus dados são usados só para organizar o evento, pela Prefeitura de Jaborandi.</p>
    </form>
  );
}
