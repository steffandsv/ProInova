import { EVENTO } from "@/constants/sharktank";

function utc(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Convite de calendário (.ics). No iPhone abre direto o "Adicionar ao Calendário". */
export async function GET(req: Request) {
  const base = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prefeitura de Jaborandi//SharkTank Jaborandi//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:sharktank-jaborandi-2026@proinova",
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(EVENTO.inicioISO)}`,
    `DTEND:${utc(EVENTO.fimISO)}`,
    `SUMMARY:${esc(`🦈 ${EVENTO.nome}`)}`,
    `LOCATION:${esc(`${EVENTO.localNome}, ${EVENTO.enderecoCompleto}`)}`,
    `DESCRIPTION:${esc(`${EVENTO.descricaoCalendario}\n\n${base}/sharktank`)}`,
    `URL:${base}/sharktank`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("Amanhã tem SharkTank Jaborandi, 9h no C.TECH!")}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("Daqui a 2 horas: SharkTank Jaborandi no C.TECH")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sharktank-jaborandi.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
