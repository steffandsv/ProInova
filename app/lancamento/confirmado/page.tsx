"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                PÁGINA DE CONFIRMAÇÃO — LANÇAMENTO PROINOVA                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const EVENT = {
  title: "Lançamento ProInova — Programa Municipal de Inovação",
  date: "20260321",          // YYYYMMDD
  startTime: "120000Z",     // 09:00 BRT = 12:00 UTC
  endTime: "150000Z",       // 12:00 BRT = 15:00 UTC
  location: "C.TECH — Centro de Tecnologia, Jaborandi - SP",
  description:
    "Lançamento oficial do programa ProInova com apoio do SEBRAE (Startup Day). Prévia exclusiva das propostas, explicações sobre o funcionamento do programa e coffee break.",
};

function buildGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.date}T${EVENT.startTime}/${EVENT.date}T${EVENT.endTime}`,
    location: EVENT.location,
    details: EVENT.description,
  });
  return `https://calendar.google.com/calendar/r/eventnew?${params.toString()}`;
}

function downloadICS() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProInova//Lancamento//PT",
    "BEGIN:VEVENT",
    `DTSTART:${EVENT.date}T${EVENT.startTime}`,
    `DTEND:${EVENT.date}T${EVENT.endTime}`,
    `SUMMARY:${EVENT.title}`,
    `LOCATION:${EVENT.location}`,
    `DESCRIPTION:${EVENT.description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lancamento-proinova.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ConfirmadoPage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div className="landing">
      <section className="confirmed-section">
        {/* Background orbs */}
        <div className="hero-orb hero-orb--1" aria-hidden />
        <div className="hero-orb hero-orb--2" aria-hidden />

        <div className={`confirmed-content ${show ? "confirmed-content--visible" : ""}`}>
          {/* Big animated checkmark */}
          <div className="confirmed-check-wrap">
            <svg viewBox="0 0 100 100" className="confirmed-check-svg">
              <circle cx="50" cy="50" r="45" className="confirmed-check-circle" />
              <path d="M30 52 L44 66 L72 36" className="confirmed-check-path" />
            </svg>
            {/* Radial pulse rings */}
            <div className="confirmed-ring confirmed-ring--1" />
            <div className="confirmed-ring confirmed-ring--2" />
            <div className="confirmed-ring confirmed-ring--3" />
          </div>

          <h1 className="confirmed-title">
            Presença <span className="gradient-text">confirmada!</span>
          </h1>

          <p className="confirmed-desc">
            Você está na lista! Estamos preparando um evento incrível e mal podemos
            esperar para ter você lá. Adicione o evento ao seu calendário para não
            esquecer:
          </p>

          <div className="confirmed-calendar-btns">
            <a
              href={buildGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="confirmed-cal-btn confirmed-cal-btn--google"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Google Calendar
            </a>

            <button
              onClick={downloadICS}
              className="confirmed-cal-btn confirmed-cal-btn--ical"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 14v4m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              iCalendar (.ics)
            </button>
          </div>

          <div className="confirmed-event-details">
            <div className="confirmed-detail">
              <span>📅</span> <strong>Sábado, 21 de Março de 2026</strong>
            </div>
            <div className="confirmed-detail">
              <span>🕘</span> <strong>9h da manhã</strong>
            </div>
            <div className="confirmed-detail">
              <span>📍</span> <strong>C.TECH</strong> — Centro de Tecnologia
            </div>
            <div className="confirmed-detail">
              <span>☕</span> Coffee break incluído
            </div>
          </div>

          <p className="confirmed-cta-text">
            Nos vemos lá! 🚀
          </p>

          <a href="/" className="cta-btn cta-btn--ghost" style={{ marginTop: 16 }}>
            ← Voltar ao site
          </a>
        </div>
      </section>
    </div>
  );
}
