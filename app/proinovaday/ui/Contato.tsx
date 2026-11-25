"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { cpfValido, formatarCpf, formatarWhats, vibrar } from "./hooks";
import { IconCheck } from "./Icons";

export type Contato = {
  cpf: string;
  status: "vazio" | "buscando" | "ok" | "erro";
  erro: string;
  municipe: boolean;
  nome: string;
  whatsMascarado: string | null;
  usarWhatsCadastro: boolean;
  whats: string;
  jaInscrito: boolean;
  numero: number | null;
  primeiroNome: string | null;
};

export const CONTATO_INICIAL: Contato = {
  cpf: "", status: "vazio", erro: "", municipe: false, nome: "", whatsMascarado: null,
  usarWhatsCadastro: false, whats: "", jaInscrito: false, numero: null, primeiroNome: null,
};

export function contatoCompleto(c: Contato): boolean {
  const whatsOk = (c.usarWhatsCadastro && !!c.whatsMascarado) || /^\d{10,11}$/.test(c.whats.replace(/\D/g, ""));
  return c.status === "ok" && c.nome.trim().length >= 3 && whatsOk;
}

/** CPF → se for de Jaborandi, já preenche; se não, só valida e pede nome + WhatsApp. */
export default function CamposContato({
  valor,
  onChange,
  autoFocus,
}: {
  valor: Contato;
  onChange: (c: Contato) => void;
  autoFocus?: boolean;
}) {
  const cpfRef = useRef<HTMLInputElement>(null);
  const atual = useRef(valor);
  atual.current = valor;

  useEffect(() => {
    if (autoFocus) window.setTimeout(() => cpfRef.current?.focus({ preventScroll: true }), 650);
  }, [autoFocus]);

  function tremer() {
    vibrar([30, 30, 30]);
    if (cpfRef.current) gsap.fromTo(cpfRef.current, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.25)" });
  }

  async function consultar(cpf: string) {
    onChange({ ...atual.current, cpf, status: "buscando", erro: "" });
    try {
      const res = await fetch("/api/proinovaday/cpf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        onChange({ ...atual.current, status: "erro", erro: j.message || "Não foi possível consultar agora." });
        tremer();
        return;
      }
      vibrar(12);
      onChange({
        ...atual.current,
        status: "ok",
        municipe: j.municipe,
        nome: j.nome || j.nomeInscrito || atual.current.nome,
        whatsMascarado: j.whatsappMascarado,
        usarWhatsCadastro: !!j.whatsappMascarado,
        jaInscrito: j.jaInscrito,
        numero: j.numero,
        primeiroNome: j.primeiroNome,
      });
    } catch {
      onChange({ ...atual.current, status: "erro", erro: "Sem conexão. Tente de novo." });
    }
  }

  function digitarCpf(v: string) {
    const fmt = formatarCpf(v);
    const d = fmt.replace(/\D/g, "");
    const base = { ...CONTATO_INICIAL, cpf: fmt };
    if (d.length < 11) return onChange(base);
    if (!cpfValido(d)) {
      onChange({ ...base, status: "erro", erro: "Esse CPF não é válido. Confere os números?" });
      tremer();
      return;
    }
    consultar(fmt);
  }

  const c = valor;
  return (
    <div className="st-contato">
      <label className={`st-field st-field--cpf ${c.status === "ok" ? "is-ok" : ""} ${c.status === "erro" ? "is-err" : ""}`}>
        <span className="st-field-label">Seu CPF</span>
        <span className="st-field-row">
          <input
            ref={cpfRef}
            value={c.cpf}
            onChange={(e) => digitarCpf(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            aria-invalid={c.status === "erro"}
          />
          <span className="st-field-status" aria-hidden>
            {c.status === "buscando" && <span className="st-spinner" />}
            {c.status === "ok" && <IconCheck size={22} strokeWidth={2.6} />}
          </span>
        </span>
        {c.status === "erro" && <span className="st-field-err" role="alert">{c.erro}</span>}
      </label>

      {c.status === "ok" && (
        <div className="st-contato-extra">
          <div className={`st-hello ${c.municipe ? "is-local" : ""}`}>
            {c.municipe ? (
              <>
                <strong>Oi, {c.nome.split(" ")[0]}! 👋</strong>
                <span>Encontramos você no cadastro de Jaborandi e já preenchemos tudo.</span>
              </>
            ) : (
              <>
                <strong>CPF válido ✓</strong>
                <span>Vem de fora? Que bom! Só precisamos do seu nome e WhatsApp.</span>
              </>
            )}
          </div>

          <label className="st-field">
            <span className="st-field-label">Nome completo</span>
            <input
              value={c.nome}
              onChange={(e) => onChange({ ...c, nome: e.target.value })}
              autoComplete="name"
              placeholder="Como está no seu documento"
              maxLength={255}
            />
          </label>

          {c.whatsMascarado && c.usarWhatsCadastro ? (
            <div className="st-field">
              <span className="st-field-label">WhatsApp</span>
              <div className="st-whats-saved">
                <span>{c.whatsMascarado}</span>
                <small>do seu cadastro</small>
                <button type="button" onClick={() => onChange({ ...c, usarWhatsCadastro: false })}>trocar número</button>
              </div>
            </div>
          ) : (
            <label className="st-field">
              <span className="st-field-label">WhatsApp</span>
              <input
                value={c.whats}
                onChange={(e) => onChange({ ...c, whats: formatarWhats(e.target.value) })}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(16) 99999-9999"
              />
              {c.whatsMascarado && (
                <button type="button" className="st-field-link" onClick={() => onChange({ ...c, usarWhatsCadastro: true, whats: "" })}>
                  usar o número do cadastro ({c.whatsMascarado})
                </button>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );
}

export function contatoParaEnvio(c: Contato) {
  return {
    cpf: c.cpf.replace(/\D/g, ""),
    nome: c.nome.trim(),
    whatsapp: c.usarWhatsCadastro ? "" : c.whats.replace(/\D/g, ""),
    usarWhatsappCadastro: c.usarWhatsCadastro,
  };
}
