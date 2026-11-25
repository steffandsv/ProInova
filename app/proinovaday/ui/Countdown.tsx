"use client";

import { useContagem } from "./hooks";

/** Dígito estilo odômetro: uma coluna 0–9 que rola até o número. */
function Digito({ valor }: { valor: number | null }) {
  return (
    <span className="st-odo-digit">
      <span className="st-odo-strip" style={{ transform: `translateY(${valor === null ? 0 : -valor * 10}%)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  );
}

function Unidade({ valor, rotulo, casas = 2 }: { valor: number | null; rotulo: string; casas?: number }) {
  const texto = valor === null ? null : String(valor).padStart(casas, "0");
  const n = Math.max(casas, texto?.length || 0);
  return (
    <div className="st-odo-unit">
      <div className="st-odo-num" aria-hidden>
        {Array.from({ length: n }, (_, i) => (
          <Digito key={i} valor={texto ? Number(texto[i]) : null} />
        ))}
      </div>
      <span className="st-odo-label">{rotulo}</span>
    </div>
  );
}

export default function Countdown({ alvoISO, compacto = false }: { alvoISO: string; compacto?: boolean }) {
  const c = useContagem(alvoISO);
  const rotulo = c ? `Faltam ${c.d} dias, ${c.h} horas e ${c.m} minutos` : "Contagem regressiva";
  if (c?.acabou) {
    return <div className="st-odo-live">● O tanque está aberto — é hoje!</div>;
  }
  return (
    <div className={`st-odo ${compacto ? "st-odo--compact" : ""}`} role="timer" aria-label={rotulo}>
      <Unidade valor={c?.d ?? null} rotulo="dias" />
      <span className="st-odo-sep">:</span>
      <Unidade valor={c?.h ?? null} rotulo="horas" />
      <span className="st-odo-sep">:</span>
      <Unidade valor={c?.m ?? null} rotulo="min" />
      {!compacto && (
        <>
          <span className="st-odo-sep">:</span>
          <Unidade valor={c?.s ?? null} rotulo="seg" />
        </>
      )}
    </div>
  );
}
