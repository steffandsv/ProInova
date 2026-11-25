"use client";

import { EVENTO } from "@/constants/proinovaday";
import { IconApple, IconGoogle, IconWhatsapp } from "./Icons";

function utc(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function linkGoogleAgenda(): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `🦈 ${EVENTO.nome}`,
    dates: `${utc(EVENTO.inicioISO)}/${utc(EVENTO.fimISO)}`,
    details: `${EVENTO.descricaoCalendario}\n\n${typeof window !== "undefined" ? window.location.origin : ""}/proinovaday`,
    location: `${EVENTO.localNome}, ${EVENTO.enderecoCompleto}`,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function linkConvite(texto: string, ref = "amigo"): string {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/proinovaday?ref=${ref}`;
  return `https://wa.me/?text=${encodeURIComponent(`${texto}\n\n${url}`)}`;
}

/** Botões para salvar o evento no Google Agenda ou no iPhone (.ics) e convidar amigos. */
export default function Agenda({ textoConvite }: { textoConvite: string }) {
  return (
    <div className="st-agenda">
      <p className="st-agenda-title">Salve na sua agenda para não esquecer:</p>
      <div className="st-agenda-btns">
        <a className="st-agenda-btn" href={linkGoogleAgenda()} target="_blank" rel="noopener noreferrer">
          <IconGoogle size={20} /> Google Agenda
        </a>
        <a className="st-agenda-btn" href="/api/proinovaday/ics">
          <IconApple size={20} /> iPhone / Apple
        </a>
      </div>
      <a className="st-agenda-btn st-agenda-btn--wa" href={linkConvite(textoConvite)} target="_blank" rel="noopener noreferrer">
        <IconWhatsapp size={20} /> Chamar os amigos no WhatsApp
      </a>
      <p className="st-agenda-note">No Android/Outlook, o botão do iPhone também funciona: ele baixa o convite (.ics).</p>
    </div>
  );
}
